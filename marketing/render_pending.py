"""Re-render reels waiting in out_old/ (old Edge voice) with the Gemini voice, oldest first, into out/.

  uv run -q --with faster-whisper --with numpy --with pillow python marketing/render_pending.py [max=9]

Runs from post_reels.cmd at 15:05, just after the Gemini free-tier quota resets (10 TTS requests a day; one per reel,
plus one for the shared end-card line the first time). Each new reel keeps the old file's mtime, so post_reels.py
posts them in the same order. On a quota or TTS error it stops; the rest wait for the next day.
"""
import os
import shutil
import sys
from pathlib import Path

import make_reel

HERE = Path(__file__).resolve().parent
OLD, OUT, DONE = HERE / "out_old", HERE / "out", HERE / "out_old" / "replaced"


def main(limit=10):
    todo = sorted(OLD.glob("*.mp4"), key=lambda p: p.stat().st_mtime)
    print(f"{len(todo)} reel(s) waiting for the new voice")
    DONE.mkdir(exist_ok=True)
    for old in todo[:limit]:
        spec = HERE / "specs" / f"{old.stem}.json"
        if not spec.exists():
            print(f"  no spec for {old.stem}, skipped")
            continue
        try:
            make_reel.render(spec)
        except RuntimeError as e:   # quota used up or bad TTS audio: try again tomorrow
            print(f"  stopped at {old.stem}: {e}")
            break
        mtime = old.stat().st_mtime
        os.utime(OUT / f"{old.stem}.mp4", (mtime, mtime))
        for f in OLD.glob(f"{old.stem}*"):
            shutil.move(str(f), DONE / f.name)
        print(f"  re-rendered {old.stem}")


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 10)
