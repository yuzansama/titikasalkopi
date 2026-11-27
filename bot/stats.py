"""Usage counts of the Telegram bot: one line per event in ~/bot_stats.jsonl on the VM, e.g.
{"jam": "2026-11-24 21", "e": "vertex"}. Counts only: never message text, chat or user ids, names or phone digits,
and only the WIB hour, so a line can't be matched back to one Telegram message.

  python3 bot/stats.py        # on the VM: today, the last 7 days and per day (WIB)
  python3 bot/stats.py 30     # per day for the last 30 days

bot.run() sets FILE; until then count() does nothing, so _check() and --test never write fake counts.
"""
import json
import sys
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

WIB = timezone(timedelta(hours=7))   # the VM runs in UTC; "today" means the WIB day
FILE = None
_today = {"day": None, "users": set()}   # in memory only: ids never reach the file
LABELS = {   # event: what it means, in the order the summary prints them
    "user": "orang yang chat (unik per hari)",
    "msg": "pesan teks masuk (chat pribadi)",
    "tap": "tombol ditekan",
    "start": "/start",
    "greet": "salam dijawab gratis",
    "vertex": "jawaban Vertex AI (berbayar)",
    "vertex_skipped": "  di antaranya ditolak Vertex (off-topic, tetap bayar)",
    "vertex_error": "  di antaranya error Vertex",
    "cap_busy": "ditolak batas per user (15/jam, 40/hari)",
    "cap_closed": "ditolak batas total 400/hari",
    "menu": "menu pesan dibuka",
    "checkout": "checkout (kode order dibuat)",
    "checkout_capped": "checkout ditolak batas pesanan",
    "orderbook_ok": "tercatat di buku order",
    "orderbook_rejected": "ditolak buku order",
    "orderbook_failed": "gagal kirim ke buku order",
    "update_failed": "update error di bot",
    "checkout_start": "checkout lengkap dimulai (minta nomor HP)",
    "ship_quote": "ongkir JNE dihitung",
    "ship_failed": "ongkir gagal dihitung (dialihkan ke WhatsApp)",
    "qr_sent": "QRIS dikirim",
    "photo": "foto masuk",
    "proof_ok": "bukti bayar terbaca cocok",
    "proof_mismatch": "bukti bayar terbaca tidak cocok",
    "proof_unread": "bukti bayar gagal dibaca",
    "admin_paid": "admin: pembayaran masuk",
    "admin_unpaid": "admin: pembayaran belum masuk",
    "resi_sent": "resi dikirim ke pembeli",
    "wa_entry": "admin: pesanan WhatsApp di-paste",
    "wa_qr": "admin: QRIS pesanan WhatsApp dibuat",
    "checkout_pickup": "checkout ambil sendiri / janjian dipilih",
    "pickup_done": "pesanan ambil sendiri diserahkan",
    "manual_qr": "admin: QR bayar manual dibuat",
}


def count(event):
    """Append one event line. Never raises: a full disk must not stop the bot from replying."""
    if FILE is None:
        return
    line = json.dumps({"jam": datetime.now(WIB).strftime("%Y-%m-%d %H"), "e": event}) + "\n"
    try:   # ponytail: one small O_APPEND write per event is atomic enough across the order-book thread
        with open(FILE, "a", encoding="utf-8") as f:
            f.write(line)
    except OSError:
        pass


def seen(user):
    """Count "user" the first time `user` shows up in a WIB day. The id itself is only held in memory.
    ponytail: a restart forgets today's set, so someone already counted today is counted again after it."""
    day = datetime.now(WIB).date()
    if _today["day"] != day:
        _today.update(day=day, users=set())
    if user not in _today["users"]:
        _today["users"].add(user)
        count("user")


def per_day(path):
    days, path = {}, Path(path)
    for ln in (path.read_text(encoding="utf-8").splitlines() if path.exists() else []):
        try:
            d = json.loads(ln)
            days.setdefault(d["jam"][:10], Counter())[d["e"]] += 1
        except (ValueError, KeyError, TypeError):
            continue   # a half-written line after a crash
    return days


def table(title, c):
    rows = [f"  {c[e]:>5}  {label}" for e, label in LABELS.items() if c[e]]
    rows += [f"  {n:>5}  {e}" for e, n in c.items() if e not in LABELS]
    return f"{title}\n" + ("\n".join(rows) if rows else "  (belum ada)")


def summary(path, n_days=7, today=None):
    days, today = per_day(path), today or datetime.now(WIB).date()
    last = [str(today - timedelta(days=i)) for i in range(n_days)]
    out = [table(f"Hari ini ({today}, WIB)", days.get(str(today), Counter())),
           table(f"{n_days} hari terakhir", sum((days.get(d, Counter()) for d in last), Counter())),
           f"Sejak mulai dihitung ({min(days) if days else '-'}): " + ", ".join(
               f"{e} {n}" for e, n in sum(days.values(), Counter()).most_common()),
           "Per hari:"]
    out[1] = out[1].replace("orang yang chat (unik per hari)", "orang yang chat (dijumlah dari tiap hari)")
    out += [f"  {d}  orang {days[d]['user']:>3}  pesan {days[d]['msg']:>4}  vertex {days[d]['vertex']:>4}  salam {days[d]['greet']:>3}  "
            f"menu {days[d]['menu']:>3}  checkout {days[d]['checkout']:>3}" for d in last if d in days]
    return "\n".join(out)


if __name__ == "__main__":
    print(summary(Path.home() / "bot_stats.jsonl", int(sys.argv[1]) if sys.argv[1:] else 7))
