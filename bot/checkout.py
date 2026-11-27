"""Checkout inside the bot (plan of 26 Nov 2026): address, JNE regular rate (ship.py), fixed-amount QRIS (qris.py) with a
1-99 rupiah unique code, payment screenshot read by Cloud Vision, confirmation by an admin in the internal bot
@mas_bas_bot, then the tracking number. Pure helpers and the order store live here; the Telegram flow is in bot.py.

Personal data (name, address, phone) stays in ORDERS_FILE on the VM (chmod 600) and in the admin chat. It never goes to
the order book (its tracking endpoint is public), the journal or the stats. Unpaid orders are dropped after 3 days,
shipped ones 30 days after shipping. The order book keeps only code, last4 and the items line, as before.

  python bot/checkout.py    # self-check, no network
"""
import base64
import json
import os
import re
import secrets
import time
import urllib.request
from pathlib import Path

import order
import ship

HOME = Path.home()
ORDERS_FILE = Path(os.environ.get("ORDERS_FILE", HOME / "orders.json"))
QRIS_FILE, ADMINS_FILE, ADMIN_TOKEN_FILE = HOME / ".qris", HOME / ".tg_admins", HOME / ".tg_admin_env"
VISION = "https://vision.googleapis.com/v1/images:annotate"
MERCHANT = "TITIK ASAL KOPI"
# Packed grams per unit, owner's estimates (26 Nov): replace with weighed values.
WEIGHT = {"gram-100": 150, "pack": 300, "kg": 1200}
KEEP_UNPAID, KEEP_SHIPPED = 3 * 86400, 30 * 86400
MAX_PROOFS = 3          # screenshots read per order, so nobody can burn the OCR quota
_orders = {}            # code -> order dict (see new_order)


def ready():
    """True on the VM once every piece is in place; elsewhere the bot keeps the old WhatsApp checkout."""
    return all(p.exists() for p in (QRIS_FILE, ADMINS_FILE, ADMIN_TOKEN_FILE)) and ship.configured()


def admins():
    return {int(x) for x in ADMINS_FILE.read_text(encoding="utf-8").split() if x.isdigit()}


def load():
    _orders.clear()
    if ORDERS_FILE.exists():
        _orders.update(json.loads(ORDERS_FILE.read_text(encoding="utf-8")))
    prune()


def save():
    tmp = ORDERS_FILE.with_suffix(".tmp")
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(_orders, f, ensure_ascii=False)
    os.replace(tmp, ORDERS_FILE)


def prune(now=None):
    now = now or time.time()
    for code, o in list(_orders.items()):
        if (o["status"] == "unpaid" and now - o["created"] > KEEP_UNPAID or
                o["status"] == "shipped" and now - o.get("shipped_at", now) > KEEP_SHIPPED or
                o["status"] == "paid" and now - o.get("paid_at", now) > KEEP_SHIPPED):   # never shipped: drop too
            del _orders[code]


def phone(text):
    """'+62 812-3456-7890' / '0812 3456 7890' -> '081234567890', or None if it isn't an Indonesian mobile number."""
    d = re.sub(r"\D", "", text or "")
    d = "0" + d[2:] if d.startswith("62") else d
    return d if re.fullmatch(r"08\d{8,12}", d) else None


def grams(items):
    return sum(WEIGHT[order.VARIANTS[v][3]] * q for v, q in items.items())


def unique():
    """1-99 rupiah not used by another unpaid order, so the admin can tell two payments of the same cart apart."""
    taken = {o["unique"] for o in _orders.values() if o["status"] == "unpaid"}
    free = [n for n in range(1, 100) if n not in taken]
    return secrets.choice(free) if free else secrets.randbelow(99) + 1


PICKUP = "Ambil sendiri / janjian"


def new_order(code, chat, user, lines, c, ship_cost, uniq, now=None):
    """`c` holds phone, note and, unless c["mode"] is "pickup" (paid and collected in person), addr and dest."""
    subtotal, pickup = sum(ln[4] for ln in lines), c.get("mode") == "pickup"
    o = {"code": code, "chat": chat, "user": user, "created": now or time.time(), "status": "unpaid",
         "lines": [list(ln) for ln in lines], "subtotal": subtotal, "ship": 0 if pickup else ship_cost,
         "unique": uniq, "total": subtotal + (0 if pickup else ship_cost) + uniq, "phone": c["phone"],
         "addr": PICKUP if pickup else c["addr"], "area": "" if pickup else c["dest"][1], "pickup": pickup,
         "note": c.get("note", ""), "proofs": 0, "ask": [], "resi": ""}
    _orders[code] = o
    return o


def open_order(chat):
    """The newest unpaid order of this chat, or None."""
    mine = [o for o in _orders.values() if o["chat"] == chat and o["status"] == "unpaid"]
    return max(mine, key=lambda o: o["created"]) if mine else None


def by_ask(message_id):
    """The order whose 'reply with the tracking number' message is `message_id`."""
    return next((o for o in _orders.values() if message_id in o["ask"]), None)


def book_items(o):
    """The order book's items line: products, shipping and the amount to pay; nothing personal."""
    how = "ambil sendiri" if o.get("pickup") else f"ongkir JNE {order.idr(o['ship'])}"
    return f"{order.record_items(o['lines'])}; {how}; bayar {order.idr(o['total'])}"[:200]


def summary(o, with_contact=False):
    body = "\n".join(f"• {p} {lab.replace('Kemasan ', '')}: {qty} = {order.idr(t)}" for p, lab, qty, _, t in o["lines"])
    head = f"Kode order {o['code']}" if o.get("code") else "Ringkasan pesanan"
    how = f"{PICKUP} (tanpa ongkir)" if o.get("pickup") else f"Ongkir JNE Reguler: {order.idr(o['ship'])}"
    text = (f"{head}\n{body}\n{how}\n"
            f"Kode unik: {order.idr(o['unique'])}\nTotal bayar: {order.idr(o['total'])}")
    if with_contact and o.get("pickup"):
        text += f"\n\n{PICKUP}\nHP: {o['phone']}"
    elif with_contact:
        text += f"\n\nKirim ke: {o['addr']}\n{ship.short(o['area'])}\nHP: {o['phone']}"
        text += f"\nCatatan: {o['note']}" if o["note"] else ""
    return text


def amounts(text):
    """Every rupiah amount in OCR text: 'Rp170.037', 'IDR 170,037.00', '170037' -> 170037."""
    out = set()
    for m in re.finditer(r"\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2}(?!\d))?|\d{4,9}", text or ""):
        s = re.sub(r"[.,]\d{2}$", "", m.group()) if re.search(r"[.,]\d{3}[.,]\d{2}$", m.group()) else m.group()
        out.add(int(re.sub(r"\D", "", s)))
    return out


def check_proof(text, total):
    """(amount found, merchant name found) in the screenshot text. A hint for the admin, never proof of payment."""
    flat = " ".join((text or "").upper().split())
    return total in amounts(text), MERCHANT in flat


# --- Orders taken on WhatsApp and typed into @mas_bas_bot by an admin (houseblend only, like the bot). ---
TEMPLATE = ("Halo kak, biar pesanannya cepat diproses, isi template ini ya:\n\nNama:\nNo HP:\nAlamat lengkap:\n"
            "Kecamatan / kode pos:\nPesanan: (contoh: BOLD 200gr x2, BRIGHT 100gr x1)\nCatatan:")
FIELDS = {"nama": "name", "no hp": "phone", "hp": "phone", "nomor hp": "phone", "no wa": "phone", "alamat lengkap": "addr",
          "alamat": "addr", "kecamatan / kode pos": "area", "kecamatan/kode pos": "area", "kecamatan": "area",
          "kode pos": "area", "pesanan": "items", "catatan": "note"}
SIZES = ((r"1\s*kg|1000\s*gr?", "1kg"), (r"200\s*(?:gr?|gram)?", "200g"), (r"100\s*(?:gr?|gram)?", "100g"))


def parse_items(text):
    """'BOLD 200gr x2, bright 1kg 1' -> ({variant id: qty}, [chunks not understood])."""
    items, bad = {}, []
    for chunk in filter(None, (c.strip() for c in re.split(r"[,;\n]+|\s+dan\s+", text or ""))):
        low = chunk.lower()
        line = next((x for x in ("bold", "bright") if x in low), None)
        size = next(((pat, s) for pat, s in SIZES if re.search(pat, low)), None)
        if not line or not size:
            bad.append(chunk)
            continue
        rest = re.sub(size[0], " ", low, count=1)
        qty = re.search(r"(\d+)", rest)
        n = int(qty.group(1)) if qty else 1
        if not 1 <= n <= 20:
            bad.append(chunk)
            continue
        vid = f"{line}-{size[1]}"
        items[vid] = items.get(vid, 0) + n
    return items, bad


def parse_template(text):
    """The filled WhatsApp template -> {name, phone, addr, area, items, note}; missing fields are absent."""
    out = {}
    for ln in (text or "").splitlines():
        key, sep, val = ln.partition(":")
        k = FIELDS.get(" ".join(key.lower().replace("*", "").split()))
        if sep and k and val.strip():
            out[k] = val.strip()
    return out


def vision_text(image, token, project):
    body = {"requests": [{"image": {"content": base64.b64encode(image).decode()}, "features": [{"type": "TEXT_DETECTION"}]}]}
    req = urllib.request.Request(VISION, data=json.dumps(body).encode(), headers={
        "Content-Type": "application/json", "Authorization": f"Bearer {token}", "X-Goog-User-Project": project})
    r = json.load(urllib.request.urlopen(req, timeout=30))["responses"][0]
    return (r.get("fullTextAnnotation") or {}).get("text", "")


def _check():
    assert phone("+62 812-3456-7890") == phone("0812 3456 7890") == "081234567890" and phone("12345") is None
    assert phone("021 555 1234") is None
    assert amounts("Total Rp170.037\nIDR 170,037.00 biaya 0") >= {170037} and 17003700 not in amounts("IDR 170,037.00")
    assert check_proof("Pembayaran berhasil\nTITIK  ASAL KOPI\nRp 170.037", 170037) == (True, True)
    assert check_proof("Rp 170.000 ke WARUNG", 170037) == (False, False)
    assert grams({"bold-200g": 2, "bright-1kg": 1}) == 1800
    _orders.clear()
    c = {"phone": "081234567890", "addr": "Rina, Jl. Tebet Raya 12", "dest": (17588, "TEBET BARAT, TEBET, JAKARTA SELATAN, DKI JAKARTA, 12810")}
    lines = [("Houseblend BOLD", "Kemasan 200 gr", "2 pack", 80000, 160000)]
    o = new_order("TAK-261126-AAAA", 7, 9, lines, c, 10000, 37, now=1000)
    assert o["total"] == 170037 and open_order(7) is o and open_order(8) is None
    assert "081234567890" not in book_items(o) and "Tebet" not in book_items(o) and book_items(o).endswith("bayar Rp170.037")
    assert "HP: 081234567890" in summary(o, True) and "HP" not in summary(o)
    p = new_order("TAK-261126-BBBB", 7, 9, lines, {**c, "mode": "pickup"}, 10000, 5, now=1000)
    assert p["total"] == 160005 and p["ship"] == 0 and p["pickup"] and "Tebet" not in summary(p, True)
    assert "ambil sendiri; bayar Rp160.005" in book_items(p) and "tanpa ongkir" in summary(p)
    del _orders["TAK-261126-BBBB"]
    assert all(1 <= unique() <= 99 and unique() != 37 for _ in range(200))   # 37 is held by the unpaid order
    prune(now=1000 + KEEP_UNPAID + 1)
    assert not _orders
    assert parse_items("BOLD 200gr x2, bright 100 gr 1; Bold 1kg") == ({"bold-200g": 2, "bright-100g": 1, "bold-1kg": 1}, [])
    assert parse_items("2x bold 200 gram dan BRIGHT 1 kg x3") == ({"bold-200g": 2, "bright-1kg": 3}, [])
    assert parse_items("bold 200gr x2\nbold 200gr") == ({"bold-200g": 3}, [])
    assert parse_items("Sabin 200gr x1, bold x2, bright 100gr x50") == ({}, ["Sabin 200gr x1", "bold x2", "bright 100gr x50"])
    t = parse_template(TEMPLATE.replace("Nama:", "Nama: Dita").replace("No HP:", "*No HP*: 0813 2222 4455")
                       .replace("Pesanan: (contoh: BOLD 200gr x2, BRIGHT 100gr x1)", "Pesanan: BOLD 200gr x2")
                       .replace("Kecamatan / kode pos:", "Kecamatan / kode pos: 40115"))
    assert t == {"name": "Dita", "phone": "0813 2222 4455", "area": "40115", "items": "BOLD 200gr x2"}, t


if __name__ == "__main__":
    _check()
    print("checkout check ok")
