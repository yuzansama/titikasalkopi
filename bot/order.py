"""Ordering for the Telegram bot, following docs/15-kontrak-pesanan-untuk-bot-telegram.md: the same catalog, order
code, WhatsApp message and order book as the web, so an order from the bot looks like one from the web and can be
tracked at /lacak. The web code wins where it differs from the doc (web/src/lib/whatsapp/message.ts, sanitize.ts,
web/src/lib/tracking.ts, web/src/lib/format.ts). No payment here: the buyer sends the message on WhatsApp.

  python bot/order.py    # self-check, no network
"""
import json
import re
import secrets
import threading
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

import stats

# Apps Script web app of the order book; the same public URL as NEXT_PUBLIC_TRACKING_ENDPOINT in pages.yml.
ENDPOINT = ("https://script.google.com/macros/s/AKfycbwat_rXKbsLHMdF1Dlj7odKBBz23tp0BL2AQqrzUTrWynPrq04eY3njBrHl4HHbD9vKmQ"
            "/exec")
# Fallback while the deployed Apps Script has no ?katalog=1 yet (24 Nov it answered {"found":false}): the file the web
# builds from, written by sync-katalog from the same owner sheet. Prices are never written in the bot.
CATALOG_FILE = "https://raw.githubusercontent.com/yuzansama/titikasalkopi/main/web/src/data/managed.generated.ts"
WA_LINK = "https://wa.me/6285121559488"
LACAK = "https://titikasalkopi.vercel.app/lacak"
CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
CODE_PATTERN = re.compile(rf"^TAK-\d{{6}}-[{CODE_ALPHABET}]{{4}}$")
WIB = timezone(timedelta(hours=7))   # the VM runs in UTC
WA_MAX_ENCODED_LENGTH = 1500
URI_SAFE = "-_.!~*'()"   # what encodeURIComponent leaves alone
MAX_NOTE, MAX_ITEMS = 200, 200
OPENING = "Halo Titik Asal Kopi, saya ingin memesan:"
SHIPPING = "(Belum termasuk ongkos kirim. Total akhir dikonfirmasi lewat chat.)"
SOURCE = "Dikirim dari bot Telegram"

# What the bot sells by button: the variants of contract section 2. Names and sizes only; prices come from the catalog.
# id: (product, stock slug, variant label, unit, price key, strike-through key or None)
VARIANTS = {
    "bold-100g": ("Houseblend BOLD", "bold", "Kemasan 100 gr", "gram-100", "houseblend.bold.mini1", None),
    "bold-200g": ("Houseblend BOLD", "bold", "Kemasan 200 gr", "pack", "houseblend.bold.pack1", None),
    "bold-1kg": ("Houseblend BOLD", "bold", "Kemasan 1 kg", "kg", "houseblend.bold.kg.promo", "houseblend.bold.kg"),
    "bright-100g": ("Houseblend BRIGHT", "bright", "Kemasan 100 gr", "gram-100", "houseblend.bright.mini1", None),
    "bright-200g": ("Houseblend BRIGHT", "bright", "Kemasan 200 gr", "pack", "houseblend.bright.pack1", None),
    "bright-1kg": ("Houseblend BRIGHT", "bright", "Kemasan 1 kg", "kg", "houseblend.bright.kg.promo",
                   "houseblend.bright.kg"),
}
UNITS = {"gram-100": "{} x 100 gr", "pack": "{} pack", "kg": "{} kemasan 1 kg"}
_catalog = {"value": None, "at": 0.0}


def idr(n):
    return "Rp" + f"{n:,}".replace(",", ".")


def valid_catalog(harga, stok):
    """{"harga", "stok"} if every price the buttons need is a positive whole number and no promo is above its
    normal price; else None. A missing catalog is never read as empty or as Rp0 (contract section 2)."""
    if not isinstance(harga, dict) or not isinstance(stok, dict):
        return None
    for _, _, _, _, key, strike in VARIANTS.values():
        for k in filter(None, (key, strike)):
            if not isinstance(harga.get(k), int) or harga[k] <= 0:
                return None
        if strike and harga[key] > harga[strike]:
            return None
    return {"harga": harga, "stok": stok}


def parse_managed(ts):
    """Prices and stock out of managed.generated.ts (`"houseblend.bold.kg": 320_000,`, `bold: "available",`)."""
    harga = {k: int(v.replace("_", "")) for k, v in re.findall(r'"([\w.-]+)":\s*([\d_]+)\s*,', ts)}
    stok = dict(re.findall(r'"?([\w-]+)"?:\s*"(available|out-of-stock)"', ts))
    return valid_catalog(harga, stok)


def catalog():
    """The live catalog (cached 10 min; a failure is retried after 1 min), or None if neither source answers."""
    if time.time() - _catalog["at"] < 600:
        return _catalog["value"]
    cat = None
    try:
        d = json.load(urllib.request.urlopen(f"{ENDPOINT}?katalog=1", timeout=15))
        cat = valid_catalog(d.get("harga"), d.get("stok"))
    except (OSError, ValueError):
        pass
    if cat is None:
        try:
            cat = parse_managed(urllib.request.urlopen(CATALOG_FILE, timeout=15).read().decode("utf-8"))
        except (OSError, ValueError):
            pass
    _catalog.update(value=cat, at=time.time() if cat else time.time() - 540)
    return cat


def on_sale(cat):
    """Variant ids the buttons may offer: only lines whose stock is "available" (missing slug = available, as on web)."""
    return [v for v, (_, slug, *_) in VARIANTS.items() if cat["stok"].get(slug, "available") == "available"]


def new_code(now=None):
    """TAK-YYMMDD-XXXX: today in WIB plus 4 cryptographically random characters. One per checkout."""
    day = (now or datetime.now(WIB)).astimezone(WIB).strftime("%y%m%d")
    return f"TAK-{day}-{''.join(secrets.choice(CODE_ALPHABET) for _ in range(4))}"


def sanitize_note(raw):
    """As web sanitize.ts: no control characters, no lines that fake the code or source marker, one line, ≤200."""
    raw = "".join(c for c in raw if c in "\t\n\r" or 32 <= ord(c) != 127)
    lines = [ln for ln in raw.replace("\r\n", "\n").replace("\r", "\n").split("\n")
             if not re.match(r"^\s*(kode\s*order\s*:|dikirim\s+dari)", ln, re.I)]
    return re.sub(r"\s{2,}", " ", " ".join(lines)).strip()[:MAX_NOTE]


def lines_of(cart, cat):
    """[(product, variant label, qty text, unit price, line total)] in variant order."""
    out = []
    for vid, qty in cart.items():
        product, _, label, unit, key, _ = VARIANTS[vid]
        out.append((product, label, UNITS[unit].format(qty), cat["harga"][key], cat["harga"][key] * qty))
    return out


def message(code, lines, note):
    """The WhatsApp order text of web message.ts, shortened on the same ladder when the encoded text is too long."""
    subtotal = sum(ln[4] for ln in lines)

    def full(i, ln):
        return (f"{i}. {ln[0]} ({ln[0]})\n   Varian: {ln[1]}\n   Jumlah: {ln[2]} x {idr(ln[3])}\n"
                f"   Subtotal: {idr(ln[4])}")

    def compact(i, ln):
        return f"{i}. {ln[0]} — {ln[1]} — {ln[2]} x {idr(ln[3])} = {idr(ln[4])}"

    n = len(lines)
    for render, max_lines, note_limit in ((full, n, 200), (compact, n, 200), (compact, n, 80), (compact, 8, 80),
                                          (compact, 4, 60)):
        shown = lines[:max_lines]
        blocks = [OPENING, f"Kode order: {code}",
                  ("\n\n" if render is full else "\n").join(render(i + 1, ln) for i, ln in enumerate(shown))]
        if n > len(shown):
            blocks.append(f"(+{n - len(shown)} item lainnya — rinciannya saya kirim menyusul.)")
        blocks.append(f"Subtotal pesanan: {idr(subtotal)}\n{SHIPPING}")
        if note.strip()[:note_limit]:
            blocks.append(f"Catatan: {note.strip()[:note_limit]}")
        blocks.append(SOURCE)
        text = "\n\n".join(b for b in blocks if b)
        if len(urllib.parse.quote(text, safe=URI_SAFE)) <= WA_MAX_ENCODED_LENGTH:
            break
    return text


def wa_url(text):
    return f"{WA_LINK}?text={urllib.parse.quote(text, safe=URI_SAFE)}"


def record_items(lines):
    """The order book's `items`: product lines only (never the note or anything personal), sheet-safe, ≤200."""
    items = "; ".join(f"{ln[0]} {ln[1]} x{ln[2]}" for ln in lines) + f" = {idr(sum(ln[4] for ln in lines))}"
    return re.sub(r"^[=+\-@]+", "", re.sub(r"\s+", " ", items).strip())[:MAX_ITEMS]


def record(code, last4, items):
    """POST the order to the order book once, in the background; the result is ignored, so a dead endpoint never
    holds up the order (contract section 5). `source` puts the row in the order book's "telegram"
    source with its own daily cap (ops/order-tracker.gs)."""
    if not CODE_PATTERN.match(code):
        return
    body = json.dumps({"code": code, "last4": last4 if re.fullmatch(r"\d{4}", last4 or "") else "",
                       "items": items, "source": "telegram"}).encode()

    def send():
        try:
            req = urllib.request.Request(ENDPOINT, data=body, headers={"Content-Type": "text/plain;charset=UTF-8"})
            reply = urllib.request.urlopen(req, timeout=30).read(100).decode(errors="replace")
            print("order book:", code, reply, flush=True)
            stats.count("orderbook_ok" if '"ok":true' in reply.replace(" ", "") else "orderbook_rejected")
        except OSError as e:
            print("order book failed:", code, type(e).__name__, flush=True)
            stats.count("orderbook_failed")

    threading.Thread(target=send, daemon=True).start()


def _check():
    ts = ('  harga: {\n    "houseblend.bold.mini1": 45_000,\n    "houseblend.bold.pack1": 80_000,\n'
          '    "houseblend.bold.kg": 320_000,\n    "houseblend.bold.kg.promo": 300_000,\n'
          '    "houseblend.bright.mini1": 55_000,\n    "houseblend.bright.pack1": 95_000,\n'
          '    "houseblend.bright.kg": 400_000,\n    "houseblend.bright.kg.promo": 380_000,\n  },\n'
          '  stok: {\n    sabin: "out-of-stock",\n    "pondok-baru": "out-of-stock",\n    bold: "available",\n'
          '    bright: "available",\n  },\n')
    cat = parse_managed(ts)
    assert cat["harga"]["houseblend.bold.kg.promo"] == 300_000 and cat["stok"]["pondok-baru"] == "out-of-stock"
    assert on_sale(cat) == list(VARIANTS)
    assert on_sale({"harga": cat["harga"], "stok": {"bold": "out-of-stock"}}) == [v for v in VARIANTS if "bright" in v]
    assert parse_managed(ts.replace("300_000", "330_000")) is None           # promo above normal price
    assert parse_managed(ts.replace("    bold: \"available\",\n", "")) is not None
    assert valid_catalog(None, {}) is None and valid_catalog({**cat["harga"], "houseblend.bold.pack1": 0}, {}) is None
    assert idr(1_250_000) == "Rp1.250.000" and idr(45_000) == "Rp45.000"
    code = new_code(datetime(2026, 11, 24, 18, 30, tzinfo=timezone.utc))   # 01:30 WIB next day
    assert CODE_PATTERN.match(code) and code.startswith("TAK-261125-"), code
    assert sanitize_note("giling\nuntuk V60\nKode order: TAK-1\x07  ") == "giling untuk V60"
    assert len(sanitize_note("x" * 300)) == 200
    # The contract's own example, byte for byte (section 4, with the bot's source line).
    lines = lines_of({"bold-200g": 2, "bright-100g": 1}, cat)
    assert message("TAK-261124-K7Q2", lines, "giling untuk V60") == (
        "Halo Titik Asal Kopi, saya ingin memesan:\n\nKode order: TAK-261124-K7Q2\n\n"
        "1. Houseblend BOLD (Houseblend BOLD)\n   Varian: Kemasan 200 gr\n   Jumlah: 2 pack x Rp80.000\n"
        "   Subtotal: Rp160.000\n\n2. Houseblend BRIGHT (Houseblend BRIGHT)\n   Varian: Kemasan 100 gr\n"
        "   Jumlah: 1 x 100 gr x Rp55.000\n   Subtotal: Rp55.000\n\nSubtotal pesanan: Rp215.000\n"
        "(Belum termasuk ongkos kirim. Total akhir dikonfirmasi lewat chat.)\n\nCatatan: giling untuk V60\n\n"
        "Dikirim dari bot Telegram")
    assert "Catatan" not in message("TAK-261124-K7Q2", lines, "  ")
    assert record_items(lines) == ("Houseblend BOLD Kemasan 200 gr x2 pack; "
                                   "Houseblend BRIGHT Kemasan 100 gr x1 x 100 gr = Rp215.000")
    big = lines_of({v: 20 for v in VARIANTS}, cat)
    assert len(urllib.parse.quote(message(code, big, "y" * 200), safe=URI_SAFE)) <= WA_MAX_ENCODED_LENGTH
    assert "kemasan 1 kg" in message(code, lines_of({"bold-1kg": 1}, cat), "")
    assert wa_url("a b&c").endswith("?text=a%20b%26c")


if __name__ == "__main__":
    _check()
    print("order check ok")
