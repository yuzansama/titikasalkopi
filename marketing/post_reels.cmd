@echo off
rem Titik Asal Kopi: jadwalkan reel baru di marketing\out ke IG titikasalkopi lewat Buffer (5 per hari).
cd /d "%~dp0.."
set PYTHONIOENCODING=utf-8
set PYTHONUNBUFFERED=1
echo ===== reels %date% %time% >> marketing\post_reels.log
rem re-render reels in out_old with the Gemini voice first (free quota resets 15:00 WIB)
uv run -q --with faster-whisper --with numpy --with pillow python marketing\render_pending.py 10 >> marketing\post_reels.log 2>&1
uv run -q --with cloudinary python marketing\post_reels.py >> marketing\post_reels.log 2>&1
