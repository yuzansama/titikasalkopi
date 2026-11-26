@echo off
rem Telegram bot @mas_bas_bot. Started at Windows logon by task "Titik Asal Kopi bot". Log: bot\bot.log
cd /d "%~dp0.."
set PYTHONIOENCODING=utf-8
echo ===== bot %date% %time% >> bot\bot.log
uv run -q --no-project --python 3.11 python -u bot\bot.py >> bot\bot.log 2>&1
