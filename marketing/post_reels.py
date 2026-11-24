"""Schedule rendered reels (marketing/out/*.mp4 + .txt caption) to the titikasalkopi Instagram via Buffer.

  uv run -q --with cloudinary python marketing/post_reels.py            # schedule new reels, clean up sent ones
  uv run -q --with cloudinary python marketing/post_reels.py --dry-run

Slots: five reels a day, 08:00, 11:00, 14:00, 17:00, 20:00 WIB (the first one ~20 minutes from now if nothing is
queued), never within 3 hours of another reel. Runs once a day at 15:05 from the Windows task "Mas Bas social 1505".
Buffer needs a public URL, so each video is put on Cloudinary and removed once Buffer reports it sent.
State: marketing/posted.json. Needs `buffer init` and CLOUDINARY_URL in .env.
"""
import json
import os
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT, STATE = HERE / "out", HERE / "posted.json"
# ponytail: shares the Cloudinary key with the Mas Bas uploader; give this repo its own .env if they ever split
ENV = [HERE.parent / ".env", Path.home() / "Documents" / "supreme-eureka" / ".env"]
WIB = timezone(timedelta(hours=7))
ACCOUNT, HOURS, GAP = "titikasalkopi", (8, 11, 14, 17, 20), timedelta(hours=3)   # 5 reels a day
QUEUE_MAX = 10   # Buffer Free: scheduled posts per channel; the daily task tops up
BUFFER = "buffer.cmd" if os.name == "nt" else "buffer"


def buffer(*args, payload=None):
    cmd = [BUFFER, *args, "--output", "json", "--quiet"] + (["--input", "-"] if payload is not None else [])
    # payload goes through stdin: buffer.cmd runs under cmd.exe, which would split argv on "&" in a caption
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", input=json.dumps(payload) if payload is not None else None)
    if r.returncode != 0:
        raise RuntimeError(f"buffer {' '.join(args)}: exit {r.returncode}: {r.stderr.strip()[:300]}")
    return json.loads(r.stdout) if r.stdout.strip() else None


def slots(now, taken):
    """Free reel slots: ~20 min from now when nothing is pending, then 12:00 and 19:00 WIB daily,
    skipping any slot within GAP of a reel already scheduled."""
    now = now.astimezone(WIB)
    used = [datetime.fromisoformat(t) for t in taken]
    ok = lambda t: all(abs(t - u) >= GAP for u in used)
    if not any(u > now for u in used):
        first = (now + timedelta(minutes=20)).replace(second=0, microsecond=0)
        used.append(first)
        yield first
    d = now.replace(hour=0, minute=0, second=0, microsecond=0)
    while True:
        for h in HOURS:
            t = d.replace(hour=h)
            if t > now + timedelta(minutes=20) and ok(t):
                used.append(t)
                yield t
        d += timedelta(days=1)


def main(dry=False):
    for env in ENV:
        if env.exists():
            for line in env.read_text(encoding="utf-8").splitlines():
                k, _, v = line.partition("=")
                if k.strip() and not k.startswith("#"):
                    os.environ.setdefault(k.strip(), v.strip())
    state = json.loads(STATE.read_text(encoding="utf-8")) if STATE.exists() else {}
    ch = [c for c in buffer("channels", "list") if c["service"] == "instagram" and c["name"] == ACCOUNT]
    if len(ch) != 1:
        raise RuntimeError(f"expected 1 Instagram channel named {ACCOUNT} in Buffer, found {len(ch)}")
    ch = ch[0]
    import cloudinary.uploader
    now = datetime.now(timezone.utc)

    for slug, p in state.items():   # clean up Cloudinary copies of reels that are out
        if p.get("post_id") and not p.get("sent") and datetime.fromisoformat(p["due"]) < now:
            st = buffer("posts", "get", "--id", p["post_id"], "--fields", "id,status").get("status")
            if st == "sent" and not dry:
                cloudinary.uploader.destroy(p["cloud_id"], resource_type="video", invalidate=True)
                p["sent"] = True
            elif st == "error":
                print(f"ERROR in Buffer for {slug}: check publish.buffer.com")

    org = buffer("config", "get", "organizationId")["value"]
    queued = len(buffer("posts", "list", payload={"organizationId": org, "filter": {"status": ["scheduled"], "channelIds": [ch["id"]]}})["items"])
    todo = [m for m in sorted(OUT.glob("*.mp4"), key=lambda m: m.stat().st_mtime)
            if m.stem not in state and m.with_suffix(".txt").exists()][:max(QUEUE_MAX - queued, 0)]
    free = slots(now, [p["due"] for p in state.values()])
    print(f"{ch['name']} ({ch['service']}): {len(todo)} reel(s) to schedule")
    for m in todo:
        due = next(free).isoformat()
        print(f"  {due[:16]}  {m.stem}")
        if dry:
            continue
        up = cloudinary.uploader.upload(str(m), resource_type="video", public_id=f"titikasalkopi/{m.stem}", overwrite=True)
        state[m.stem] = {"due": due, "cloud_id": up["public_id"], "post_id": None}
        STATE.write_text(json.dumps(state, indent=1), encoding="utf-8")   # before the non-idempotent create
        res = buffer("posts", "create", payload={
            "channelId": ch["id"], "schedulingType": "automatic", "mode": "customScheduled", "dueAt": due,
            "text": m.with_suffix(".txt").read_text(encoding="utf-8").strip()[:2200],
            "assets": [{"video": {"url": up["secure_url"]}}],
            "metadata": {"instagram": {"type": "reel", "shouldShareToFeed": True, "isAiGenerated": False}}})
        post = (res or {}).get("post") or {}
        if not post.get("id"):
            print(f"  Buffer did not confirm ({json.dumps(res)[:300]}); stopping. Check publish.buffer.com before rerunning.")
            break
        state[m.stem]["post_id"] = post["id"]
        STATE.write_text(json.dumps(state, indent=1), encoding="utf-8")
    if not dry:
        STATE.write_text(json.dumps(state, indent=1), encoding="utf-8")


def _check():
    W = lambda d, h, m=0: datetime(2026, 11, d, h, m, tzinfo=WIB)
    g = slots(W(20, 15, 5), [])
    assert [next(g) for _ in range(4)] == [W(20, 15, 25), W(20, 20), W(21, 8), W(21, 11)]
    # something queued at 17:00 today: 20:00 is free (3 h apart), 14:00 tomorrow taken
    g = slots(W(20, 15, 5), [W(20, 17).isoformat(), W(21, 14).isoformat()])
    assert [next(g) for _ in range(4)] == [W(20, 20), W(21, 8), W(21, 11), W(21, 17)]


if __name__ == "__main__":
    _check()
    main(dry="--dry-run" in sys.argv)
