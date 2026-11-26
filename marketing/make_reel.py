"""Render a full-frame 9:16 Reel/TikTok for Titik Asal Kopi from CC BY YouTube footage.

  python marketing/make_reel.py marketing/specs/signature.json [more specs...]

Spec: {"slug", "shots": [{"src": "<videoId>", "t": 40, "len": 6, "x": 0.5,
                         "big": "DIPETIK MERAH", "sub": "...", "say": "voice line"}],
       "end": {"big", "sub", "say"}, "caption": "..."}
  src  = file marketing/src/<videoId>.mp4 (downloaded with yt-dlp, CC BY checked)
  t/len = usable part of the source shot; it is slowed down if the voice line needs more time
  x    = horizontal crop centre (0-1) when cutting 16:9 to 9:16
  zoom/y = optional tighter crop (fraction of the height) and its vertical position (0 top, 1 bottom)
  say  = optional; a shot without it runs "min" (or "len") seconds with no voice
Spec-level "src_audio": 0.3 mixes the source's own sound at that volume under the voice (only for our own
footage, e.g. roasting machine noise; never for YouTube sources, whose music could be claimed).
Output: marketing/out/<slug>.mp4 (1080x1920, 30 fps, voice-over only, no source audio),
        <slug>.txt (caption + CC BY credits), <slug>_preview.jpg.
Text sits in the safe zone: top 220 px and bottom 420 px are kept clear for TikTok/IG UI.
"""
import base64
import difflib
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import wave
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
SRC, BRAND = HERE / "src", HERE / "brand"
# out/ is what the daily 15:05 task posts; render new work into a review folder first: REEL_OUT=marketing/out_review
OUT = Path(os.environ["REEL_OUT"]).resolve() if os.environ.get("REEL_OUT") else HERE / "out"
W, H, FPS = 1080, 1920, 30
CREAM, GREEN, RUST, OLIVE = (249, 244, 238), (14, 37, 31), (163, 66, 21), (71, 74, 45)
TTS_MODEL, VOICE = "gemini-3.8-flash-tts", "Kore"   # key: GEMINI_API_KEY or the file in GEMINI_KEY_FILE
# No style note: every style prefix tried (Indonesian, "Say ...:", English director note) was sometimes read aloud
# (22 Nov). The casual tone comes from the conversational script instead.
STYLE = ""
# Free tier allows 10 TTS requests a day per model, so a reel's shot lines go out as ONE request ("narration") that
# is then cut at the pauses between lines; the end-card line is shared by all reels and cached once.
TAGLINE = "Pilih rasa, temukan asalnya, nikmati setiap momen."
CTA = "WA 0851-2155-9488  ·  IG & Shopee @titikasalkopi"
GRADE = "eq=contrast=1.05:saturation=1.08,colorbalance=rs=0.04:bs=-0.05:rm=0.03:bm=-0.03,vignette=PI/5"


def font(size, style="Bold Condensed"):
    f = ImageFont.truetype("C:/Windows/Fonts/bahnschrift.ttf", size)
    f.set_variation_by_name(style)
    return f


SERIF = lambda size: ImageFont.truetype("C:/Windows/Fonts/georgiai.ttf", size)


def centered(d, y, text, f, fill, spacing=10, track=0, edge=0):
    for line in text.split("\n"):
        w = d.textlength(line, font=f) + track * max(len(line) - 1, 0)
        x = (W - w) / 2
        if track:
            for ch in line:
                d.text((x, y), ch, font=f, fill=fill)
                x += d.textlength(ch, font=f) + track
        else:
            d.text((x, y), line, font=f, fill=fill, stroke_width=edge, stroke_fill=GREEN)
        y += f.size + spacing
    return y


def overlay(big, sub):
    """Transparent 1080x1920 layer: green fade at the top, cream logo, headline, rust rule, serif sub."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fade = Image.new("L", (1, 900))
    fade.putdata([int(200 * (1 - i / 900) ** 1.6) for i in range(900)])
    im.paste(Image.new("RGBA", (W, 900), GREEN + (255,)), (0, 0), fade.resize((W, 900)))
    logo = Image.open(BRAND / "logo_cream.png")
    logo = logo.resize((380, round(380 * logo.height / logo.width)), Image.LANCZOS)
    im.alpha_composite(logo, ((W - logo.width) // 2, 230))
    d = ImageDraw.Draw(im)
    y = centered(d, 420, big, font(118), CREAM, spacing=4, edge=3)   # thin green edge: readable over bright sky too
    d.rectangle(((W - 120) // 2, y + 18, (W + 120) // 2, y + 26), fill=RUST)
    if sub:
        centered(d, y + 52, sub, SERIF(50), CREAM, edge=3)
    return im


def end_card(big, sub):
    im = Image.new("RGBA", (W, H), CREAM + (255,))
    logo = Image.open(BRAND / "logo_dark.png")
    logo = logo.resize((720, round(720 * logo.height / logo.width)), Image.LANCZOS)
    im.alpha_composite(logo, ((W - logo.width) // 2, 330))
    d = ImageDraw.Draw(im)
    y = centered(d, 720, big, font(112), RUST, spacing=4)
    d.rectangle(((W - 120) // 2, y + 22, (W + 120) // 2, y + 30), fill=GREEN)
    y = centered(d, y + 60, sub, SERIF(48), GREEN, spacing=14)
    centered(d, y + 50, CTA, font(40, "SemiBold Condensed"), OLIVE)
    centered(d, 1440, TAGLINE.upper(), font(30, "SemiBold"), (127, 67, 33), track=3)
    return im


def run(*a):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *map(str, a)], check=True)


def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                                capture_output=True, text=True).stdout)


def gemini_key():
    if os.environ.get("GEMINI_API_KEY"):
        return os.environ["GEMINI_API_KEY"]
    return Path(os.environ.get("GEMINI_KEY_FILE", r"C:\Users\ASUSV16\Documents\supreme-eureka\.ai_env")).read_text(encoding="utf-8").strip()


def tts(text, out):
    """Gemini TTS (voice Kore, chosen by the user 22 Nov 2026). Cached by text, so re-renders cost no quota.
    On a quota error (429) it waits and retries; it never falls back to another voice, so a reel never mixes voices."""
    cache = HERE / "tts_cache" / (hashlib.sha1(f"{TTS_MODEL}|{VOICE}|{STYLE}|{text}".encode()).hexdigest() + ".wav")
    if not cache.exists():
        body = {"contents": [{"parts": [{"text": STYLE + text}]}],
                "generationConfig": {"responseModalities": ["AUDIO"],
                                     "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}}}}
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{TTS_MODEL}:generateContent"
        for attempt in range(5):
            req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                         headers={"x-goog-api-key": gemini_key(), "Content-Type": "application/json"})
            try:
                part = json.load(urllib.request.urlopen(req, timeout=180))["candidates"][0]["content"]["parts"][0]["inlineData"]
                break
            except urllib.error.HTTPError as e:
                daily = "PerDay" in e.read().decode(errors="replace")   # daily quota: waiting won't help today
                if e.code not in (429, 500, 503) or attempt == 4 or daily:
                    raise RuntimeError(f"Gemini TTS HTTP {e.code}{' (daily quota used up)' if daily else ''} for: {text}") from None
                time.sleep(60 * (attempt + 1))
        data = base64.b64decode(part["data"])
        cache.parent.mkdir(exist_ok=True)
        if "wav" in part.get("mimeType", ""):
            cache.write_bytes(data)
        else:   # raw 16-bit mono PCM, e.g. "audio/L16;rate=24000"
            with wave.open(str(cache), "wb") as w:
                w.setnchannels(1); w.setsampwidth(2)
                w.setframerate(int(part["mimeType"].split("rate=")[-1].split(";")[0]))
                w.writeframes(data)
        if dur(cache) > len(text) / 9 + 4:   # ~14 chars/s spoken; far longer means the style note was read aloud
            cache.unlink()
            raise RuntimeError(f"Gemini TTS audio too long ({text!r}): style note probably read aloud")
    shutil.copyfile(cache, out)
    return dur(out)


def letters(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


def align_targets(words, lines):
    """Where each line ends in the audio: `words` = [(text, start, end)] from Whisper. A line boundary sits at the
    word whose running share of letters is closest to that line's share of the script; returns the gap after it."""
    total = sum(len(letters(w[0])) for w in words) or 1
    cum, fracs = 0, []
    for w in words:
        cum += len(letters(w[0]))
        fracs.append(cum / total)
    script = sum(len(letters(l)) for l in lines)
    out, c = [], 0
    for l in lines[:-1]:
        c += len(letters(l))
        j = min(range(len(words) - 1), key=lambda k: abs(fracs[k] - c / script))
        out.append((words[j][2] + words[j + 1][1]) / 2)
    return out


def pick_cuts(total, targets, mids, snap=0.3):
    """Cut points: each target moves to the nearest pause midpoint within `snap` s (0.8 s jumped past "Nah,")."""
    cuts = [0.0]
    for t in targets:
        near = [m for m in mids if abs(m - t) <= snap and m > cuts[-1] + 0.3]
        cuts.append(min(near, key=lambda m: abs(m - t)) if near else t)
    return cuts + [total]


def narration(lines, tmp, trim=True):
    """One TTS request for all shot lines, cut into one wav per line (Whisper word times on CPU + pauses).
    trim=False keeps each piece's own pauses, so the pieces played back to back are the original take, unbroken."""
    import numpy as np
    from faster_whisper import WhisperModel   # CPU only: the laptop GPU is shared and small
    full = tmp / "narration.wav"
    total = tts("\n".join(lines), full)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(full), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                         capture_output=True).stdout
    segs, _ = WhisperModel("small", device="cpu", compute_type="int8").transcribe(
        np.frombuffer(raw, np.float32), language="id", word_timestamps=True)
    words = [(w.word, w.start, w.end) for s in segs for w in s.words]
    heard, script = letters("".join(w[0] for w in words)), letters("".join(lines))
    if difflib.SequenceMatcher(None, heard, script, autojunk=False).ratio() < 0.75 or len(heard) > 1.3 * len(script):
        raise RuntimeError(f"narration doesn't match the script (extra or missing speech): {heard[:120]}")
    log =subprocess.run(["ffmpeg", "-i", str(full), "-af", "silencedetect=noise=-35dB:d=0.12", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    starts = [float(x.split("silence_start: ")[1].split()[0]) for x in log.splitlines() if "silence_start: " in x]
    ends = [float(x.split("silence_end: ")[1].split()[0]) for x in log.splitlines() if "silence_end: " in x]
    cuts = pick_cuts(total, align_targets(words, lines), [(a + b) / 2 for a, b in zip(starts, ends)])
    parts = []
    for i in range(len(lines)):
        p = tmp / f"line{i:02d}.wav"
        trim_af = ["-af", "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"]
        run("-ss", f"{cuts[i]:.3f}", "-to", f"{cuts[i + 1]:.3f}", "-i", full, *(trim_af if trim else []), p)
        parts.append((p, dur(p)))
    return parts


def render(spec_path):
    spec = json.loads(Path(spec_path).read_text(encoding="utf-8"))
    OUT.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        segs, auds = [], []
        # The narration plays as one unbroken take and each shot lasts exactly its piece of it (24 Nov: trimmed lines
        # with 0.5 s gaps sounded choppy). "continuous": false brings back the old trimmed lines with gaps.
        cont = spec.get("continuous", True)
        lines = iter(narration([s["say"] for s in spec["shots"] if s.get("say")], tmp, trim=not cont) if any(s.get("say") for s in spec["shots"]) else [])
        # Seamless (every shot voiced, no source audio): the narration goes in as ONE untouched track and the shot cuts
        # follow its running time, rounded to frames as a whole. Per-shot pieces were each padded or cut to whole
        # frames, a ~16 ms jump at every cut, which sounded jittery once Instagram re-encoded it (24 Nov).
        # Source sound ("src_audio", own footage) is cut per shot on its own track and mixed under the whole take.
        seamless = cont and all(s.get("say") for s in spec["shots"])
        voiced, frames, rooms = 0.0, 0, []
        for i, s in enumerate(spec["shots"] + [dict(spec["end"], end=True)]):
            mp3, wav, seg, png = (tmp / f"{i:02d}.{e}" for e in ("tts.wav", "wav", "mp4", "png"))   # mp3 = the TTS line
            if s.get("say"):
                if s.get("end"):
                    secs = tts(s["say"], mp3)
                else:
                    part, secs = next(lines)
                    shutil.copyfile(part, mp3)
                need = secs if cont and not s.get("end") else max(s.get("min", 2.0), secs + 0.35)
            else:   # no voice line: the shot runs its own length (or "min")
                need = s.get("min", s.get("len", 2.0))
            if seamless and not s.get("end"):
                voiced += secs
                n = round(voiced * FPS) - frames   # cuts land on the narration's own clock; no error piles up
            else:
                n = round(need * FPS)
            frames += n
            amb = spec.get("src_audio", 0) if not s.get("end") else 0   # own footage: keep the room sound under the voice
            voice_in = ["-i", mp3] if s.get("say") else ["-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo"]
            if seamless and not s.get("end"):
                if amb:   # this shot's room sound, slowed like its picture, exactly n frames long
                    room = tmp / f"{i:02d}.room.wav"
                    slow_a = max(1.0, need / s["len"])
                    run("-ss", s["t"], "-t", s["len"], "-i", SRC / f"{s['src']}.mp4", "-af",
                        f"aresample=44100,atempo={1 / slow_a:.4f},volume={amb},apad=whole_dur={n / FPS},atrim=0:{n / FPS}",
                        "-ac", 2, room)
                    rooms.append(room)
                if s is spec["shots"][-1]:   # the whole narration, once, padded to the voiced shots' frame count
                    run("-i", tmp / "narration.wav", "-af", f"apad=whole_dur={frames / FPS},atrim=0:{frames / FPS}",
                        "-ar", 44100, "-ac", 2, wav)
                    if rooms:
                        (tmp / "room.txt").write_text("".join(f"file '{p.as_posix()}'\n" for p in rooms))
                        run("-f", "concat", "-safe", 0, "-i", tmp / "room.txt", tmp / "room.wav")
                        mixed = tmp / f"{i:02d}.mix.wav"
                        run("-i", wav, "-i", tmp / "room.wav", "-filter_complex",
                            f"amix=inputs=2:normalize=0:duration=first", "-ar", 44100, "-ac", 2, mixed)
                        wav = mixed
                    auds.append(wav)
            elif amb:
                slow_a = max(1.0, need / s["len"])
                run("-ss", s["t"], "-t", s["len"], "-i", SRC / f"{s['src']}.mp4", *voice_in, "-filter_complex",
                    f"[0:a]aresample=44100,atempo={1 / slow_a:.4f},volume={amb},apad[r];[1:a]aresample=44100,adelay=150|150,apad[v];"
                    f"[r][v]amix=inputs=2:normalize=0,atrim=0:{n / FPS}", "-ac", 2, wav)
            else:
                lead = 0 if cont and not s.get("end") else 150
                run(*voice_in, "-af", f"adelay={lead}|{lead},apad=whole_dur={n / FPS},atrim=0:{n / FPS}", "-ar", 44100, "-ac", 2, wav)
            if not (seamless and not s.get("end")):
                auds.append(wav)
            if s.get("end"):
                end_card(s["big"], s["sub"]).convert("RGB").save(png)
                run("-loop", 1, "-i", png, "-vf",
                    f"scale=2160:3840,zoompan=z='1+0.03*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s={W}x{H}:fps={FPS},"
                    f"fade=in:st=0:d=0.4,format=yuv420p", "-frames:v", n, "-c:v", "libx264", "-preset", "veryfast", "-crf", 18, seg)
            else:
                overlay(s["big"], s.get("sub", "")).save(png)
                slow = max(1.0, need / s["len"])
                x, z, y = s.get("x", 0.5), s.get("zoom", 1), s.get("y", 0.5)   # zoom < 1 crops tighter, e.g. above burned-in subtitles
                crop = f"crop=ih*{z}*9/16:ih*{z}:(iw-ih*{z}*9/16)*{x}:(ih-ih*{z})*{y}"
                run("-ss", s["t"], "-t", s["len"], "-i", SRC / f"{s['src']}.mp4", "-loop", 1, "-framerate", FPS, "-i", png,
                    "-filter_complex",
                    f"[0:v]setpts={slow:.3f}*(PTS-STARTPTS),fps={FPS},{crop},scale={W}:{H},{GRADE},setsar=1[v];"
                    f"[1:v]format=rgba,fade=in:st=0.15:d=0.35:alpha=1[t];[v][t]overlay=0:0:shortest=1,format=yuv420p",
                    "-an", "-frames:v", n, "-r", FPS, "-c:v", "libx264", "-preset", "veryfast", "-crf", 18, seg)
            segs.append(seg)
            if i == 0:
                run("-ss", min(1.0, need / 2), "-i", seg, "-frames:v", 1, OUT / f"{spec['slug']}_preview.jpg")
        (tmp / "v.txt").write_text("".join(f"file '{p.as_posix()}'\n" for p in segs))
        (tmp / "a.txt").write_text("".join(f"file '{p.as_posix()}'\n" for p in auds))
        run("-f", "concat", "-safe", 0, "-i", tmp / "a.txt", tmp / "voice.wav")
        total = sum(dur(p) for p in segs)
        mp4 = OUT / f"{spec['slug']}.mp4"
        run("-f", "concat", "-safe", 0, "-i", tmp / "v.txt", "-i", tmp / "voice.wav",
            "-filter_complex", "[1:a]loudnorm=I=-14:TP=-1.5[a]", "-map", "0:v", "-map", "[a]", "-t", f"{total:.3f}",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-ar", 48000,   # loudnorm outputs 192 kHz; IG wants 48
            "-movflags", "+faststart", mp4)
    used = dict.fromkeys(s["src"] for s in spec["shots"] if not s["src"].startswith("own_"))   # own_* = our own footage
    credits = []
    for vid in used:
        info = json.loads((SRC / f"{vid}.info.json").read_text(encoding="utf-8"))
        assert "Creative Commons" in (info.get("license") or ""), f"{vid} is not CC BY"
        credits.append(f'- "{info["title"]}" oleh {info["channel"]} (CC BY): https://www.youtube.com/watch?v={vid}')
    tail = ("\n\nCuplikan video (ilustrasi suasana, bukan kebun mitra kami), dipotong dan diberi teks:\n"
            + "\n".join(credits) + "\n") if credits else "\n"
    (OUT / f"{spec['slug']}.txt").write_text(spec["caption"] + tail, encoding="utf-8")
    print(f"{mp4}  {total:.1f}s")


def _check():
    # targets snap to a pause within 0.3 s; a target with no pause nearby stays as is
    assert pick_cuts(8.0, [2.0, 4.0, 6.0], [2.2, 4.6, 6.9]) == [0.0, 2.2, 4.0, 6.0, 8.0]
    words = [("Halo", 0.0, 0.5), ("semua.", 0.6, 1.0), ("Kopi", 1.4, 1.8), ("enak.", 1.9, 2.3)]
    assert align_targets(words, ["Halo semua.", "Kopi enak."]) == [1.2]


if __name__ == "__main__":
    _check()
    for p in sys.argv[1:]:
        render(p)
