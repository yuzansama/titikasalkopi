"""Telegram bot "mas_bas_bot": answers questions about Titik Asal Kopi with Vertex AI Search (app "tanya-kopi" in
project titikasalkopi-bot, documents from bot/vertex_docs/, set up by bot/vertex_setup.py). Vertex AI Search is the
service the GenAI App Builder trial credit covers.

  python bot/bot.py          # long polling; Ctrl+C to stop
  python bot/bot.py --test "Bedanya Abmisibil sama Sabin apa?"   # one answer, no Telegram

Auth: TG_TOKEN_FILE (default supreme-eureka/.masbas_env, token from @BotFather, never committed) and the gcloud login
(`gcloud auth print-access-token`), or on the GCE VM (bot/bot-kopi.service) the VM's service account. Orders never go through the bot: it points to WhatsApp / Shopee.
"""
import json
import re
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict, deque
from pathlib import Path

PROJECT, ENGINE = "titikasalkopi-bot", "tanya-kopi"
ANSWER = (f"https://discoveryengine.googleapis.com/v1/projects/{PROJECT}/locations/global/collections/"
          f"default_collection/engines/{ENGINE}/servingConfigs/default_search:answer")
GCLOUD = str(Path.home() / "AppData/Local/Google/Cloud SDK/google-cloud-sdk/bin/gcloud.cmd")
METADATA_TOKEN = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token"
TG_TOKEN_FILE = Path(os.environ.get("TG_TOKEN_FILE", r"C:\Users\ASUSV16\Documents\supreme-eureka\.masbas_env"))
WA = "WhatsApp 0851-2155-9488"
START = ("Halo! Aku asisten Titik Asal Kopi. Tanya aja soal kopi kami: origin, rasa, harga, atau cara seduh. "
         f"Buat pesan, langsung ke {WA} atau Shopee Titikasalkopi ya.")
PREAMBLE = ("Kamu asisten chat Titik Asal Kopi. Jawab dalam bahasa Indonesia santai dan ramah seperti barista, "
            "singkat (1-4 kalimat) kecuali diminta detail, teks biasa tanpa tabel. Hanya pakai fakta dari dokumen; "
            "kalau datanya tidak ada, bilang jujur belum ada infonya dan sarankan tanya lewat WhatsApp. "
            "Tasting notes adalah catatan rasa, bukan jaminan. Tanpa klaim kesehatan atau medis. "
            "Jangan membuat harga, promo, ongkir atau janji stok sendiri. Sebut harga hanya untuk produk dan "
            "ukuran yang ditanya, jangan menyalin daftar harga lengkap. Pemesanan selalu diarahkan ke "
            "WhatsApp 0851-2155-9488 (https://wa.me/6285121559488) atau Shopee Titikasalkopi.")
# A message made only of greeting words gets a canned friendly reply: no Vertex call, so it costs no credit.
GREET_WORDS = {"halo", "helo", "hello", "hai", "hay", "hi", "hey", "hei", "pagi", "siang", "sore", "malam", "selamat",
               "met", "permisi", "asalamualaikum", "asalamu", "alaikum", "asalamualaikom", "salam", "min", "kak", "ka",
               "bang", "mas", "mba", "mbak", "gan", "admin", "bot", "semua", "p", "test", "tes"}   # repeated letters collapsed
SALAM = ("Waalaikumsalam! Aku asisten Titik Asal Kopi. Mau tanya soal kopi kami? Origin, rasa, harga, atau cara "
         f"seduh, tanya aja. Buat pesan, langsung ke {WA} atau Shopee Titikasalkopi ya.")
OFF_TOPIC = f"Maaf, aku khusus jawab soal kopi Titik Asal Kopi: origin, rasa, harga, dan cara seduh. Ada yang mau ditanyain soal itu?"
ERROR = f"Maaf, lagi ada gangguan. Coba lagi sebentar, atau langsung chat {WA} ya."
# Spending caps, so a spammer can't burn the credit: every answer is a paid Vertex AI Search call.
MAX_INPUT = 500                        # characters per message; longer is cut
PER_USER = ((3600, 15), (86400, 40))   # (window seconds, max answers) per Telegram user
GLOBAL_PER_DAY = 400                   # all users together
BUSY = f"Pertanyaannya sudah banyak nih. Lanjut nanti lagi ya, atau langsung chat {WA}."
CLOSED = f"Lagi ramai banget hari ini. Coba lagi besok ya, atau langsung chat {WA}."
_seen = defaultdict(deque)             # user id -> answer timestamps (last 24 h)
_day = deque()                         # all answer timestamps (last 24 h)
_token = {"value": None, "at": 0.0}


def allowed(user, now):
    """True (and counted) if this user may get another answer now; else the refusal text."""
    for q in (_seen[user], _day):
        while q and q[0] <= now - 86400:
            q.popleft()
    if len(_day) >= GLOBAL_PER_DAY:
        return CLOSED
    for window, cap in PER_USER:
        if sum(1 for t in _seen[user] if t > now - window) >= cap:
            return BUSY
    _seen[user].append(now)
    _day.append(now)
    return True


def greeting(text):
    """The canned reply if `text` is only a greeting ("Halo", "selamat pagi kak!", "Assalamu'alaikum"), else None."""
    words = [re.sub(r"(.)\1+", r"\1", w) for w in re.findall(r"[a-z]+", text.lower().replace("'", ""))]
    if not words or len(words) > 5 or not all(w in GREET_WORDS for w in words):
        return None
    return SALAM if any(w.startswith(("asalam", "salam")) for w in words) else START


def token():
    if time.time() - _token["at"] > 45 * 60:   # access tokens last 60 min
        if Path(GCLOUD).exists():   # laptop: the gcloud login
            _token["value"] = subprocess.run([GCLOUD, "auth", "print-access-token"], capture_output=True, text=True,
                                             check=True).stdout.strip()
        else:   # GCE VM: the VM's service account, from the metadata server
            req = urllib.request.Request(METADATA_TOKEN, headers={"Metadata-Flavor": "Google"})
            _token["value"] = json.load(urllib.request.urlopen(req, timeout=10))["access_token"]
        _token["at"] = time.time()
    return _token["value"]


def post(url, body, headers=None, timeout=120):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json", **(headers or {})})
    return json.load(urllib.request.urlopen(req, timeout=timeout))


def answer(text, session=None):
    """Returns (reply, session name). The session keeps the conversation context on Vertex's side."""
    # The prefix ties bare product names ("Abmisibil ready gak?") to the shop: without it Vertex rated them
    # out-of-domain and skipped the answer (24 Nov). Off-topic questions are still refused by the preamble.
    body = {"query": {"text": f"kopi Titik Asal Kopi: {text}"},
            "session": session or f"projects/{PROJECT}/locations/global/collections/default_collection/engines/{ENGINE}/sessions/-",
            "answerGenerationSpec": {"promptSpec": {"preamble": PREAMBLE}, "includeCitations": False,
                                     "answerLanguageCode": "id", "ignoreAdversarialQuery": True,
                                     "ignoreNonAnswerSeekingQuery": True, "modelSpec": {"modelVersion": "stable"}}}
    try:
        d = post(ANSWER, body, {"Authorization": f"Bearer {token()}", "X-Goog-User-Project": PROJECT})
    except (OSError, subprocess.CalledProcessError) as e:
        print("vertex error:", type(e).__name__, str(e)[:200])
        return ERROR, session
    a, sess = d.get("answer", {}), (d.get("session") or {}).get("name", session)
    if a.get("answerSkippedReasons") or a.get("state") != "SUCCEEDED" or not a.get("answerText"):
        return OFF_TOPIC, sess
    return a["answerText"].strip(), sess


def run():
    tg = f"https://api.telegram.org/bot{TG_TOKEN_FILE.read_text(encoding='utf-8').strip()}"
    print(f"running as @{json.load(urllib.request.urlopen(f'{tg}/getMe', timeout=30))['result']['username']} (Vertex AI Search)", flush=True)
    sessions, offset = {}, 0
    while True:
        try:
            # Short long-poll: on this network an idle connection dies silently, and a 50 s poll then held new
            # messages for up to ~80 s (24 Nov). 10 s keeps the worst case near 15 s; ~6 cheap requests a minute.
            ups = json.load(urllib.request.urlopen(f"{tg}/getUpdates?timeout=10&offset={offset}", timeout=15))["result"]
        except urllib.error.HTTPError as e:
            if e.code == 409:   # another program polls this bot (old OpenClaw?) -> revoke the token in @BotFather
                sys.exit("409 Conflict: another process is reading this bot. Revoke the token in @BotFather.")
            print("telegram error:", e.code); time.sleep(10); continue
        except OSError as e:   # URLError, TimeoutError, ConnectionResetError: a wifi drop must not kill the bot
            print("network:", type(e).__name__, e, flush=True); time.sleep(2); continue
        for u in ups:
            offset = u["update_id"] + 1
            m = u.get("message") or {}
            if m.get("date") and time.time() - m["date"] > 5:
                print(f"late: message {time.time() - m['date']:.0f} s old", flush=True)
            text, chat = m.get("text"), (m.get("chat") or {}).get("id")
            if not text or chat is None or m["chat"].get("type") != "private":
                continue   # private chats only: in groups the bot stays silent
            if text.startswith("/start"):
                reply = START
            elif greet := greeting(text):   # free: answered here, never sent to Vertex
                reply = greet
            elif (ok := allowed((m.get("from") or {}).get("id", chat), time.time())) is not True:
                reply = ok
            else:
                reply, sessions[chat] = answer(text[:MAX_INPUT], sessions.get(chat))
            try:
                post(f"{tg}/sendMessage", {"chat_id": chat, "text": reply[:4000]}, timeout=30)
            except OSError as e:
                print("send failed:", type(e).__name__, e, flush=True)


def _check():
    for t in ("Halo", "haloo min!", "Selamat pagi kak", "hai 👋", "P", "Hallo"):
        assert greeting(t) == START, t
    assert greeting("Assalamu'alaikum") == greeting("assalamualaikum kak") == SALAM
    for t in ("Halo, harga Sabin berapa?", "kopi apa yang paling asam?", "", "pagi kopi"):
        assert greeting(t) is None, t
    _seen.clear(); _day.clear()
    assert all(allowed("a", 1000 + i) is True for i in range(15))
    assert allowed("a", 1100) == BUSY                   # 16th in the same hour
    assert allowed("b", 1100) is True                   # other users unaffected
    assert allowed("a", 1000 + 3601) is True            # next hour
    assert allowed("a", 1000 + 86400 + 10) is True      # old ones expire after a day
    _seen.clear(); _day.clear()


if __name__ == "__main__":
    _check()
    if sys.argv[1:2] == ["--test"]:
        print(answer(" ".join(sys.argv[2:]))[0])
    else:
        run()
