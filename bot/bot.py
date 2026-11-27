"""Telegram bot @titikasalkopi_bot (until 25 Nov @mas_bas_bot, now the internal admin bot): answers questions about Titik Asal Kopi with Vertex AI Search (app "tanya-kopi" in
project titikasalkopi-bot, documents from bot/vertex_docs/, set up by bot/vertex_setup.py). Vertex AI Search is the
service the GenAI App Builder trial credit covers.

  python bot/bot.py          # long polling; Ctrl+C to stop
  python bot/bot.py --test "Bedanya Abmisibil sama Sabin apa?"   # one answer, no Telegram

Auth: TG_TOKEN_FILE (default supreme-eureka/.masbas_env, token from @BotFather, never committed) and the gcloud login
(`gcloud auth print-access-token`), or on the GCE VM (bot/bot-kopi.service) the VM's service account.
Ordering: the "Pesan kopi" button, /pesan, or a message with pesan/beli/order opens a button menu (order.py, contract
docs/15-kontrak-pesanan-untuk-bot-telegram.md). Where checkout.ready() (the VM), checkout runs in the bot: phone,
address, JNE rate, fixed-amount QRIS, payment screenshot, then an admin confirms in @mas_bas_bot and replies with the
tracking number (checkout.py). Elsewhere checkout gives an order code and a WhatsApp button with the order text.
"""
import contextlib
import io
import json
import re
import os
import secrets
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
import tempfile
from collections import defaultdict, deque
from datetime import datetime
from pathlib import Path

import checkout
import order
import qris
import ship
import stats

PROJECT, ENGINE = "titikasalkopi-bot", "tanya-kopi"
ANSWER = (f"https://discoveryengine.googleapis.com/v1/projects/{PROJECT}/locations/global/collections/"
          f"default_collection/engines/{ENGINE}/servingConfigs/default_search:answer")
GCLOUD = str(Path.home() / "AppData/Local/Google/Cloud SDK/google-cloud-sdk/bin/gcloud.cmd")
METADATA_TOKEN = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token"
TG_TOKEN_FILE = Path(os.environ.get("TG_TOKEN_FILE", r"C:\Users\ASUSV16\Documents\supreme-eureka\.masbas_env"))
WA = "WhatsApp 0851-2155-9488"
START = ("Halo! Aku asisten Titik Asal Kopi. Tanya aja soal kopi kami: origin, rasa, harga, atau cara seduh. "
         f"Mau pesan? Tekan tombol Pesan kopi di bawah, atau langsung ke {WA} / Shopee Titikasalkopi ya.")
PREAMBLE = ("Kamu asisten chat Titik Asal Kopi. Jawab dalam bahasa Indonesia santai dan ramah seperti barista, "
            "singkat (1-4 kalimat) kecuali diminta detail, teks biasa tanpa tabel. Hanya pakai fakta dari dokumen; "
            "kalau datanya tidak ada, bilang jujur belum ada infonya dan sarankan tanya lewat WhatsApp. "
            "Tasting notes adalah catatan rasa, bukan jaminan. Tanpa klaim kesehatan atau medis. "
            "Jangan membuat harga, promo, ongkir atau janji stok sendiri. Sebut harga hanya untuk produk dan "
            "ukuran yang ditanya, jangan menyalin daftar harga lengkap. Kalau pelanggan mau pesan houseblend atau "
            "single origin (single origin sistemnya pre-order), minta tekan tombol Pesan kopi di bawah pesan ini atau "
            "ketik /pesan. Rasio khusus dan pertanyaan stok diarahkan ke WhatsApp 0851-2155-9488 "
            "(https://wa.me/6285121559488).")
# A message made only of greeting words gets a canned friendly reply: no Vertex call, so it costs no credit.
GREET_WORDS = {"halo", "helo", "hello", "hai", "hay", "hi", "hey", "hei", "pagi", "siang", "sore", "malam", "selamat",
               "met", "permisi", "asalamualaikum", "asalamu", "alaikum", "asalamualaikom", "salam", "min", "kak", "ka",
               "bang", "mas", "mba", "mbak", "gan", "admin", "bot", "semua", "p", "test", "tes"}   # repeated letters collapsed
SALAM = ("Waalaikumsalam! Aku asisten Titik Asal Kopi. Mau tanya soal kopi kami? Origin, rasa, harga, atau cara "
         f"seduh, tanya aja. Mau pesan? Tekan tombol Pesan kopi di bawah, atau langsung ke {WA} ya.")
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
        stats.count("vertex_error")
        return ERROR, session
    a, sess = d.get("answer", {}), (d.get("session") or {}).get("name", session)
    if a.get("answerSkippedReasons") or a.get("state") != "SUCCEEDED" or not a.get("answerText"):
        stats.count("vertex_skipped")
        return OFF_TOPIC, sess
    return a["answerText"].strip(), sess


# --- Ordering by button (order.py holds the contract logic). Free: no Vertex call. ---
ORDER_WORDS = re.compile(r"\b(pesan|pesen|order|beli|checkout)\b", re.I)   # "pesanan" does not match
ORDERS_PER_USER, ORDERS_PER_DAY = 3, 20   # checkouts; the order book allows 50 rows a day shared with the web
MAX_QTY = 20
# Tasting notes only where products.ts has them (never made up); beans without notes show none.
NOTES = {"bold": "choco, almond, caramel", "bright": "raisin, orange, lemon zest",
         "abmisibil": "beri hitam, anggur merah, cokelat hitam", "sabin": "gula aren, jeruk manis, floral",
         "pondok-baru": "buah kering, cokelat, rempah manis"}
PO_NOTE = "stoknya disiapin setelah pesanan masuk, admin kabarin kapan kopinya siap dikirim."
ORDER_BTN = {"inline_keyboard": [[{"text": "🛒 Pesan kopi", "callback_data": "o"}]]}
WA_BTN = {"text": "💬 Chat admin WhatsApp", "url": order.WA_LINK}
NO_CATALOG = f"Maaf, daftar harga lagi nggak bisa dibuka. Pesan langsung lewat {WA} ya."
_carts = {}                    # chat -> {"items": {variant id: qty}, "note": str, "await": None | "note" | "last4"}
_orders = defaultdict(deque)   # user -> checkout timestamps (last 24 h)
_orders_day = deque()
_api = {"url": None, "admin": None, "file": None}


def tg(method, body):
    return post(f"{_api['url']}/{method}", body, timeout=30)


def tg_admin(method, body):
    return post(f"{_api['admin']}/{method}", body, timeout=30)


def say(chat, text, kb=None, edit=None):
    """Send `text`, or replace the message `edit` (a menu step) when Telegram still allows it."""
    body = {"chat_id": chat, "text": text[:4000], **({"reply_markup": kb} if kb else {})}
    if edit:
        try:
            return tg("editMessageText", {**body, "message_id": edit})
        except urllib.error.HTTPError as e:
            if "not modified" in e.read().decode(errors="replace"):
                return None
    return tg("sendMessage", body)


def may_order(user, now):
    for q in (_orders[user], _orders_day):
        while q and q[0] <= now - 86400:
            q.popleft()
    if len(_orders[user]) >= ORDERS_PER_USER or len(_orders_day) >= ORDERS_PER_DAY:
        return False
    _orders[user].append(now)
    _orders_day.append(now)
    return True


def cart(chat):
    return _carts.setdefault(chat, {"items": {}, "note": "", "await": None})


def menu(chat, edit=None):
    cat = order.catalog()
    if not cat:
        return say(chat, NO_CATALOG, {"inline_keyboard": [[WA_BTN]]}, edit)
    lines = {}
    for vid in order.on_sale(cat):
        lines.setdefault(order.VARIANTS[vid][1], order.VARIANTS[vid][0])
    rows = [[{"text": name, "callback_data": f"p:{slug}"}] for slug, name in lines.items() if slug not in order.BEANS]
    po = [{"text": f"{name} (PO)", "callback_data": f"p:{slug}"} for slug, name in lines.items() if slug in order.BEANS]
    rows += [po[i:i + 2] for i in range(0, len(po), 2)]
    if cart(chat)["items"]:
        rows.append([{"text": "🧺 Lihat keranjang", "callback_data": "c"}])
    rows.append([{"text": "💬 Rasio khusus / tanya dulu: chat admin", "url": order.WA_LINK}])
    text = ("Mau pesan kopi apa?" + (f"\n(PO) = pre-order: {PO_NOTE}" if po else "")
            if lines else "Lagi belum ada yang bisa dipesan lewat bot.")
    say(chat, text, {"inline_keyboard": rows}, edit)


def sizes(chat, slug, edit=None):
    cat = order.catalog()
    if not cat:
        return say(chat, NO_CATALOG, {"inline_keyboard": [[WA_BTN]]}, edit)
    rows, name = [], slug
    for vid in order.on_sale(cat):
        product, line, label, _, key, strike = order.VARIANTS[vid]
        if line == slug:
            name, price = product, order.idr(cat["harga"][key])
            if strike and cat["harga"][strike] > cat["harga"][key]:
                price += f" (promo, normal {order.idr(cat['harga'][strike])})"
            rows.append([{"text": f"{label.replace('Kemasan ', '').replace(order.PO, '')} · {price}",
                          "callback_data": f"a:{vid}"}])
    if not rows:
        return menu(chat, edit)
    rows.append([{"text": "⬅️ Kembali", "callback_data": "o:b"}])
    if slug in order.BEANS:
        head = f"{name} · single origin {order.BEANS[slug][2]}\nPre-order: {PO_NOTE}"
    else:
        head = name
    if slug in NOTES:
        head += f"\nCatatan rasa: {NOTES[slug]}"
    say(chat, f"{head}\n\nPilih ukuran:", {"inline_keyboard": rows}, edit)


def cart_view(chat, edit=None, info=""):
    c, cat = cart(chat), order.catalog()
    if not cat:
        return say(chat, NO_CATALOG, {"inline_keyboard": [[WA_BTN]]}, edit)
    c["items"] = {v: q for v, q in c["items"].items() if v in order.on_sale(cat)}   # sold out since it was added
    if not c["items"]:
        return say(chat, f"{info}\n\nKeranjang kamu kosong.".strip(), ORDER_BTN, edit)
    lines = order.lines_of(c["items"], cat)
    body = "\n".join(f"• {p} {lab.replace('Kemasan ', '')}: {qty} x {order.idr(u)} = {order.idr(t)}"
                     for p, lab, qty, u, t in lines)
    text = ((f"{info}\n\n" if info else "") + f"🧺 Keranjang\n\n{body}\n\n"
            f"Subtotal: {order.idr(sum(ln[4] for ln in lines))}\n"
            + ("(Belum termasuk ongkir; dihitung waktu checkout.)" if in_bot(chat) else
               "(Belum termasuk ongkir. Total akhir dikonfirmasi admin di WhatsApp.)")
            + (f"\nCatatan: {c['note']}" if c["note"] else ""))
    rows = [[{"text": "➖", "callback_data": f"m:{v}"},
             {"text": f"{order.VARIANTS[v][0].replace('Houseblend ', '')} "
                      f"{order.VARIANTS[v][2].replace('Kemasan ', '').replace(order.PO, ' PO')} ×{q}",
              "callback_data": "c"},
             {"text": "➕", "callback_data": f"a:{v}"}] for v, q in c["items"].items()]
    rows += [[{"text": "➕ Tambah kopi lain", "callback_data": "o:b"}, {"text": "📝 Catatan", "callback_data": "n"}],
             [{"text": "✅ Checkout", "callback_data": "k"}], [{"text": "🗑 Kosongkan", "callback_data": "x"}]]
    say(chat, text, {"inline_keyboard": rows}, edit)


def finish(chat, user, last4):
    """Checkout: a new order code, one record to the order book, then the WhatsApp button with the order text."""
    c, cat = cart(chat), order.catalog()
    c["await"] = None
    items = {v: q for v, q in c["items"].items() if cat and v in order.on_sale(cat)}
    if not items:
        return cart_view(chat)
    if not may_order(user, time.time()):
        stats.count("checkout_capped")
        return say(chat, f"Pesanan lewat bot hari ini udah banyak. Lanjut pesan langsung lewat {WA} ya.",
                   {"inline_keyboard": [[WA_BTN]]})
    code, lines = order.new_code(), order.lines_of(items, cat)
    stats.count("checkout")
    text = order.message(code, lines, c["note"])
    order.record(code, last4, order.record_items(lines))
    _carts.pop(chat, None)   # a second tap can't mint a second code
    lacak = (f"Lacak statusnya di {order.LACAK} pakai kode ini dan 4 digit terakhir nomor WhatsApp kamu." if last4 else
             f"Kamu nggak isi 4 digit nomor WhatsApp, jadi pelacakan di {order.LACAK} aktif setelah admin mencatatnya.")
    say(chat, f"Kode order kamu: {code}\n\nTekan tombol di bawah buat kirim pesanan ke WhatsApp admin, lalu kirim "
              f"pesannya. Ongkir, total akhir dan pembayaran dibereskan di sana. {lacak}\n\n— Isi pesan —\n{text}",
        {"inline_keyboard": [[{"text": "📲 Kirim pesanan ke WhatsApp", "url": order.wa_url(text)}]]})


# --- Checkout inside the bot (checkout.py): phone, address, JNE rate, QRIS, screenshot, admin in @mas_bas_bot. ---
PHONE_KB = {"keyboard": [[{"text": "📱 Bagikan nomor HP", "request_contact": True}]], "one_time_keyboard": True,
            "resize_keyboard": True}
NO_KB = {"remove_keyboard": True}
JNE_TRACK = "https://www.jne.co.id/tracking-package"
CHECKING = "Lagi dicek admin ya, biasanya kurang dari 1 jam di jam kerja."
CHECKOUT_FOR_ALL = False   # False: only admins get the in-bot checkout (test phase); buyers keep the WhatsApp one
# ponytail: one lock for both bots' handlers; a slow OCR call holds up the other bot for a second or two.
LOCK = threading.Lock()


def send_photo(api, chat, image, caption, kb=None):
    """sendPhoto with an uploaded image (multipart by hand: urllib has no form encoder)."""
    b = "kopi" + secrets.token_hex(12)
    fields = {"chat_id": str(chat), "caption": caption[:1000], **({"reply_markup": json.dumps(kb)} if kb else {})}
    data = b"".join(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
                    for k, v in fields.items())
    data += (f'--{b}\r\nContent-Disposition: form-data; name="photo"; filename="foto.png"\r\n'
             "Content-Type: application/octet-stream\r\n\r\n").encode() + image + f"\r\n--{b}--\r\n".encode()
    req = urllib.request.Request(f"{api}/sendPhoto", data=data,
                                 headers={"Content-Type": f"multipart/form-data; boundary={b}"})
    return json.load(urllib.request.urlopen(req, timeout=60))


def fetch_photo(m):
    """Bytes of the largest size of a photo message under 4 MB (Cloud Vision's inline limit is 10 MB)."""
    best = max((p for p in m["photo"] if p.get("file_size", 0) <= 4_000_000), key=lambda p: p.get("file_size", 0))
    path = tg("getFile", {"file_id": best["file_id"]})["result"]["file_path"]
    return urllib.request.urlopen(f"{_api['file']}/{path}", timeout=30).read()


def to_admins(text, kb=None, image=None):
    """Send to every admin through @mas_bas_bot; returns the message ids (for 'reply with the tracking number')."""
    ids = []
    for a in checkout.admins():
        try:
            r = (send_photo(_api["admin"], a, image, text, kb) if image else
                 tg_admin("sendMessage", {"chat_id": a, "text": text[:4000], **({"reply_markup": kb} if kb else {})}))
            ids.append(r["result"]["message_id"])
        except OSError as e:
            print("admin send failed:", type(e).__name__, flush=True)
    return ids


def in_bot(user):
    return checkout.ready() and (CHECKOUT_FOR_ALL or user in checkout.admins())


def snapshot(c, items):
    """What the quote depends on; a change after the quote means quoting again."""
    return ["pickup" if c.get("mode") == "pickup" else c["dest"][0], sorted(items.items())]


def ask_phone(chat):
    cart(chat)["await"] = "phone"
    stats.count("checkout_start")
    say(chat, "Biar admin bisa hubungi kamu, tekan tombol Bagikan nomor HP di bawah, atau ketik nomor WhatsApp kamu. "
              "Ketik /batal kalau nggak jadi.", PHONE_KB)


def ask_area(chat, first=False):
    cart(chat)["await"] = "area"
    say(chat, "Ketik kecamatan, kelurahan atau kode pos tujuan, misal: Tebet atau 12810.", NO_KB if first else None)


def got_area(chat, text):
    try:
        found = ship.search(text)
    except (OSError, ValueError) as e:
        print("ship search failed:", type(e).__name__, flush=True)
        return ship_down(chat)
    if not found:
        return say(chat, "Nggak ketemu. Coba ketik nama kecamatan lain atau kode posnya.")
    cart(chat)["areas"] = dict(found)
    say(chat, "Pilih yang cocok (atau ketik lagi kalau nggak ada):",
        {"inline_keyboard": [[{"text": ship.short(lab), "callback_data": f"d:{i}"}] for i, lab in found]})


def ship_down(chat):
    stats.count("ship_failed")
    say(chat, "Maaf, ongkir lagi nggak bisa dihitung. Lanjut lewat WhatsApp aja ya, admin yang hitung ongkirnya.",
        {"inline_keyboard": [[{"text": "Lanjut lewat WhatsApp", "callback_data": "kk"}]]})


def quote(chat):
    """The JNE rate for the cart and the summary with the pay button."""
    c, cat = cart(chat), order.catalog()
    items = {v: q for v, q in c["items"].items() if cat and v in order.on_sale(cat)}
    if not items:
        return cart_view(chat)
    pickup = c.get("mode") == "pickup"
    try:
        rate = (0, "") if pickup else ship.cost(c["dest"][0], checkout.grams(items))
    except (OSError, ValueError) as e:
        print("ship cost failed:", type(e).__name__, flush=True)
        rate = None
    if not rate:
        return ship_down(chat)
    stats.count("checkout_pickup" if pickup else "ship_quote")
    c["ship"], c["unique"], c["quoted"] = rate[0], checkout.unique(), snapshot(c, items)
    lines = order.lines_of(items, cat)
    o = {"lines": lines, "ship": rate[0], "unique": c["unique"], "addr": c.get("addr", ""), "pickup": pickup,
         "area": "" if pickup else c["dest"][1], "phone": c["phone"], "note": c["note"],
         "total": sum(ln[4] for ln in lines) + rate[0] + c["unique"]}
    after = ("Habis bayar, admin hubungi kamu lewat WhatsApp buat atur waktu dan tempat ambil." if pickup else
             f"Estimasi sampai: {rate[1] or '-'}")
    say(chat, f"{checkout.summary(o, True)}\n{after}\n\nKode unik bikin pembayaranmu gampang dicocokkan admin.",
        {"inline_keyboard": [[{"text": "💳 Bayar pakai QRIS", "callback_data": "q"}],
                             ([] if pickup else [{"text": "✏️ Ubah alamat", "callback_data": "ka"}]) +
                             [{"text": "⬅️ Keranjang", "callback_data": "c"}]]})


def pay(chat, user):
    """A new order code, the fixed-amount QRIS to the buyer, one record to the order book, a heads-up to the admins."""
    c, cat = cart(chat), order.catalog()
    items = {v: q for v, q in c["items"].items() if cat and v in order.on_sale(cat)}
    need = ("phone", "ship") if c.get("mode") == "pickup" else ("phone", "dest", "addr", "ship")
    if not items or not all(k in c for k in need):
        return cart_view(chat)
    if c.get("quoted") != snapshot(c, items):   # cart or area changed after the summary: never the old shipping
        return quote(chat)
    if not may_order(user, time.time()):
        stats.count("checkout_capped")
        return say(chat, f"Pesanan lewat bot hari ini udah banyak. Lanjut pesan langsung lewat {WA} ya.",
                   {"inline_keyboard": [[WA_BTN]]})
    checkout.prune()
    if any(o["status"] == "unpaid" and o["unique"] == c["unique"] for o in checkout._orders.values()):
        c["unique"] = checkout.unique()   # taken meanwhile by another unpaid order
    o = checkout.new_order(order.new_code(), chat, user, order.lines_of(items, cat), c, c["ship"], c["unique"])
    try:   # the QR first: if it never reaches the buyer, nothing is kept and the cart stays
        payload = qris.with_amount(checkout.QRIS_FILE.read_text(encoding="utf-8").strip(), o["total"])
        send_photo(_api["url"], chat, qris.png(payload),
                   f"{checkout.summary(o)}\n\nScan QR ini pakai e-wallet atau m-banking. Nominal "
                   f"{order.idr(o['total'])} sudah terisi, atas nama {checkout.MERCHANT}.")
    except (OSError, ValueError) as e:
        del checkout._orders[o["code"]]
        print("qr send failed:", type(e).__name__, flush=True)
        return say(chat, "Maaf, QR pembayarannya gagal dikirim. Tekan Bayar pakai QRIS sekali lagi ya.")
    checkout.save()
    _carts.pop(chat, None)   # a second tap can't mint a second code
    stats.count("checkout")
    stats.count("qr_sent")
    order.record(o["code"], o["phone"][-4:], checkout.book_items(o))
    say(chat, f"Sudah bayar? Kirim screenshot bukti bayarnya di sini ya. Status pesanan bisa dilacak di {order.LACAK} "
              f"pakai kode {o['code']} dan 4 digit terakhir nomor HP kamu.")
    to_admins(f"🆕 Pesanan baru, belum dibayar\n\n{checkout.summary(o, True)}")


def on_photo(m, chat):
    """A payment screenshot for this chat's unpaid order: read it, tell the buyer, send it to the admins to confirm."""
    o = checkout.open_order(chat)
    if not o:
        return   # a photo outside a payment is ignored, like any other non-text message
    if o["proofs"] >= checkout.MAX_PROOFS:
        return say(chat, f"Bukti bayarnya udah kami terima. {CHECKING}")
    o["proofs"] += 1
    checkout.save()
    image = text = None
    try:
        image = fetch_photo(m)
        text = checkout.vision_text(image, token(), PROJECT)
    except (OSError, KeyError, ValueError, subprocess.CalledProcessError) as e:
        print("proof read failed:", type(e).__name__, flush=True)
    amount_ok, merchant_ok = checkout.check_proof(text, o["total"])
    if text is None:
        stats.count("proof_unread")
        hint = "Foto gagal dibaca otomatis, cek manual."
        say(chat, f"Fotonya udah kami terima. {CHECKING}")
    elif amount_ok and merchant_ok:
        stats.count("proof_ok")
        hint = "Terbaca cocok: nominal dan nama merchant ada di foto."
        say(chat, f"Terbaca: {order.idr(o['total'])} ke {checkout.MERCHANT}. Cocok. {CHECKING}")
    else:
        stats.count("proof_mismatch")
        hint = (f"Terbaca TIDAK cocok: nominal {'ada' if amount_ok else 'tidak ada'}, "
                f"nama merchant {'ada' if merchant_ok else 'tidak ada'}.")
        say(chat, f"Di foto ini belum kebaca {order.idr(o['total'])} ke {checkout.MERCHANT}. Kalau sudah bayar, "
                  f"tunggu admin cek ya, atau kirim screenshot yang lebih jelas.")
    kb = {"inline_keyboard": [[{"text": "✅ Sudah masuk", "callback_data": f"pay:{o['code']}"},
                               {"text": "❌ Belum masuk", "callback_data": f"nopay:{o['code']}"}]]}
    to_admins(f"Bayar masuk? Cek di QRIS Interactive.\n{hint}\n\n{checkout.summary(o, True)}", kb, image)


def tell(o, text, note, kb=None):
    """Message the buyer of `o`; if Telegram refuses (bot blocked, network), tell the admin instead. True if sent.
    An order typed in from WhatsApp has no chat: the admin gets the text to send there."""
    if o["chat"] is None:
        note(f"Pesanan WhatsApp {o['code']}. Kirim ke pembeli (HP {o['phone']}):\n\n{text}"
             + (f"\nLacak di {JNE_TRACK}" if kb else ""))
        return False
    try:
        say(o["chat"], text, kb)
        return True
    except OSError as e:
        print("buyer notice failed:", type(e).__name__, flush=True)
        note(f"Pesan ke pembeli {o['code']} gagal terkirim (HP {o['phone']}). Kabari lewat WhatsApp ya.")
        return False


# --- Orders taken on WhatsApp: the admin pastes the filled template into @mas_bas_bot, the bot prices it, makes the
# QRIS and records it, like an order placed in the bot. Houseblend only. ---
_drafts = {}   # admin id -> the order being typed in (not saved: a restart drops it, the admin pastes again)
_amount_wait = set()   # admins asked for the amount of a payment QR
ADMIN_KB = {"keyboard": [[{"text": "📝 Pesanan WhatsApp"}, {"text": "💳 Buat QR bayar"}],
                         [{"text": "📋 Pesanan belum selesai"}]], "resize_keyboard": True, "is_persistent": True}
HELP = ("Bot admin Titik Asal Kopi. Pesanan baru dan bukti bayar muncul di sini.\n"
        "📝 Pesanan WhatsApp: template buat pembeli; paste balasannya ke sini\n"
        "💳 Buat QR bayar: QRIS dengan nominal bebas, misal buat yang datang langsung\n"
        "📋 Pesanan belum selesai: yang belum dibayar, dikirim atau diambil")


def rupiah(text):
    """'85000', 'Rp85.000', '85rb', '85k', '1,5jt' -> 85000 / 1500000; None if it isn't an amount."""
    t = text.lower().replace("rp", "").replace(" ", "")
    m = re.fullmatch(r"(\d+(?:[.,]\d+)?)(rb|k|ribu|jt|juta)?", t)
    if not m:
        return None
    if m.group(2):
        n = float(m.group(1).replace(",", ".")) * (1_000_000 if m.group(2) in ("jt", "juta") else 1000)
    else:
        n = float(re.sub(r"[.,]", "", m.group(1)))
    return int(n) if n == int(n) and 1 <= n <= 10_000_000 else None


def manual_qr(who, amount, note):
    """A QRIS for any amount, e.g. someone buying at the door. Not an order: nothing is kept or recorded."""
    payload = qris.with_amount(checkout.QRIS_FILE.read_text(encoding="utf-8").strip(), amount)
    send_photo(_api["admin"], who, qris.png(payload),
               f"QRIS {checkout.MERCHANT} · {order.idr(amount)}\nTunjukkan ke pembeli atau teruskan. Cek uangnya "
               "masuk di QRIS Interactive.")
    stats.count("manual_qr")


def wa_entry(who, text, note):
    f = checkout.parse_template(text)
    missing = [label for k, label in (("name", "Nama"), ("phone", "No HP"), ("addr", "Alamat lengkap"),
                                      ("area", "Kecamatan / kode pos"), ("items", "Pesanan")) if k not in f]
    if missing:
        return note("Belum lengkap: " + ", ".join(missing) + ". Lengkapi lalu paste ulang.")
    if not (p := checkout.phone(f["phone"])):
        return note(f"No HP \"{f['phone']}\" nggak kebaca sebagai nomor HP Indonesia. Benerin lalu paste ulang.")
    items, bad = checkout.parse_items(f["items"])
    if bad or not items:
        return note("Pesanan yang nggak kebaca: " + ("; ".join(bad) or f["items"]) + "\nTulis kayak: BOLD 200gr x2, "
                    "BRIGHT 100gr x1, Solok x1 (houseblend 100gr/200gr/1kg; single origin 200gr pre-order; maks 20).")
    cat = order.catalog()
    if not cat:
        return note("Daftar harga lagi nggak bisa dibuka. Coba lagi sebentar.")
    if sold := [v for v in items if v not in order.on_sale(cat)]:
        return note("Stok habis: " + ", ".join(sold))
    postal = re.search(r"\b\d{5}\b", f["area"])
    try:
        found = ship.search(postal.group() if postal else f["area"])
    except (OSError, ValueError) as e:
        print("ship search failed:", type(e).__name__, flush=True)
        return note("Cek ongkir lagi gangguan. Coba lagi sebentar.")
    if not found:
        return note(f"Kecamatan / kode pos \"{f['area']}\" nggak ketemu. Benerin lalu paste ulang.")
    stats.count("wa_entry")
    _drafts[who] = {"phone": p, "addr": order.sanitize_note(f"{f['name']}, {f['addr']}"),
                    "note": order.sanitize_note(f.get("note", "")), "items": items, "areas": dict(found)}
    if len(found) == 1:
        return wa_quote(who, found[0][0], note)
    tg_admin("sendMessage", {"chat_id": who, "text": "Pilih tujuan:", "reply_markup": {"inline_keyboard": [
        [{"text": ship.short(lab), "callback_data": f"ad:{i}"}] for i, lab in found]}})


def wa_quote(who, dest, note):
    d, cat = _drafts.get(who), order.catalog()
    if not d or dest not in d["areas"] or not cat:
        return note("Draftnya udah nggak ada. Paste ulang template-nya.")
    d["dest"] = (dest, d["areas"][dest])
    try:
        rate = ship.cost(dest, checkout.grams(d["items"]))
    except (OSError, ValueError) as e:
        print("ship cost failed:", type(e).__name__, flush=True)
        rate = None
    if not rate:
        return note("Ongkir JNE ke situ nggak bisa dihitung sekarang. Coba lagi sebentar.")
    d["ship"], d["unique"] = rate[0], checkout.unique()
    lines = order.lines_of(d["items"], cat)
    o = {"lines": lines, "ship": rate[0], "unique": d["unique"], "addr": d["addr"], "area": d["dest"][1],
         "phone": d["phone"], "note": d["note"], "total": sum(ln[4] for ln in lines) + rate[0] + d["unique"]}
    tg_admin("sendMessage", {"chat_id": who, "text": f"{checkout.summary(o, True)}\nEstimasi sampai: {rate[1] or '-'}\n\n"
                             "Kalau ada yang salah, paste ulang template yang udah dibenerin.",
                             "reply_markup": {"inline_keyboard": [[{"text": "💳 Buat QRIS", "callback_data": "aq"},
                                                                   {"text": "Batal", "callback_data": "ax"}]]}})


def wa_make(who, note):
    d, cat = _drafts.pop(who, None), order.catalog()
    if not d or "ship" not in d or not cat:
        return note("Draftnya udah nggak ada. Paste ulang template-nya.")
    if sold := [v for v in d["items"] if v not in order.on_sale(cat)]:
        return note("Stok habis: " + ", ".join(sold))
    if any(o["status"] == "unpaid" and o["unique"] == d["unique"] for o in checkout._orders.values()):
        d["unique"] = checkout.unique()   # taken meanwhile by another unpaid order
    o = checkout.new_order(order.new_code(), None, who, order.lines_of(d["items"], cat), d, d["ship"], d["unique"])
    kb = {"inline_keyboard": [[{"text": "✅ Sudah masuk", "callback_data": f"pay:{o['code']}"},
                               {"text": "❌ Belum masuk", "callback_data": f"nopay:{o['code']}"}]]}
    try:   # the QR first: if it never arrives, nothing is kept and the draft stays
        payload = qris.with_amount(checkout.QRIS_FILE.read_text(encoding="utf-8").strip(), o["total"])
        send_photo(_api["admin"], who, qris.png(payload), f"{checkout.summary(o, True)}\n\nTeruskan QR ini ke pembeli. "
                   "Kalau uangnya sudah masuk di QRIS Interactive, tekan Sudah masuk.", kb)
    except (OSError, ValueError) as e:
        del checkout._orders[o["code"]]
        _drafts[who] = d
        print("qr send failed (admin):", type(e).__name__, flush=True)
        return note("QR gagal dikirim. Tekan Buat QRIS sekali lagi.")
    checkout.save()
    stats.count("wa_qr")
    order.record(o["code"], o["phone"][-4:], checkout.book_items(o))
    note(f"Teks buat pembeli:\n\nTotal pesanan {o['code']}: {order.idr(o['total'])} (sudah termasuk ongkir JNE "
         f"{order.idr(o['ship'])}). Silakan scan QR ini, nominalnya sudah terisi. Status pesanan bisa dilacak di "
         f"{order.LACAK} pakai kode {o['code']} dan 4 digit terakhir nomor HP kakak.")


def on_admin(u):
    """@mas_bas_bot: only admins (~/.tg_admins). Buttons confirm payment; a reply to 'lunas' carries the resi."""
    q = u.get("callback_query")
    m = (q or {}).get("message") or u.get("message") or {}
    who = ((q or m).get("from") or {}).get("id")
    if (m.get("chat") or {}).get("type") != "private":
        return
    if who not in checkout.admins():
        if not q and (m.get("text") or "").startswith("/start"):   # how a new admin gets added: id to the owner
            tg_admin("sendMessage", {"chat_id": who, "text": f"Bot internal Titik Asal Kopi. Id Telegram kamu: {who}\n"
                                     "Kirim id ini ke pemilik toko buat didaftarkan jadi admin."})
        return

    def note(text):
        tg_admin("sendMessage", {"chat_id": who, "text": text})

    if q:
        try:
            tg_admin("answerCallbackQuery", {"callback_query_id": q["id"]})
        except OSError:
            pass
        cmd, _, code = (q.get("data") or "").partition(":")
        if cmd == "ad":
            return wa_quote(who, int(code) if code.isdigit() else None, note)
        if cmd == "aq":
            return wa_make(who, note)
        if cmd == "ax":
            _drafts.pop(who, None)
            return note("Oke, draftnya dibatalin.")
        o = checkout._orders.get(code)
        if not o:
            return note(f"{code}: pesanannya nggak ada (belum dibayar lebih dari 3 hari, jadi sudah dihapus).")
        if cmd == "pay" and o["status"] == "unpaid" and o.get("pickup"):
            o["status"], o["paid_at"] = "paid", time.time()
            stats.count("admin_paid")
            to_admins(f"✅ {o['code']} lunas, ambil sendiri / janjian. Hubungi pembeli di WhatsApp {o['phone']} buat "
                      f"atur waktu dan tempat. Tekan Sudah diambil setelah kopinya diserahkan.\n\n"
                      f"{checkout.summary(o, True)}",
                      {"inline_keyboard": [[{"text": "🤝 Sudah diambil", "callback_data": f"done:{o['code']}"}]]})
            checkout.save()
            tell(o, f"Pembayaran {o['code']} diterima. Admin bakal hubungi kamu lewat WhatsApp buat atur waktu dan "
                    "tempat ambil ya.", note)
        elif cmd == "pay" and o["status"] == "unpaid":
            o["status"], o["paid_at"] = "paid", time.time()
            stats.count("admin_paid")
            o["ask"] += to_admins(f"✅ {o['code']} lunas, siap dikemas.\nBalas (reply) pesan ini dengan nomor resi JNE "
                                  f"setelah paket dikirim.\n\n{checkout.summary(o, True)}")
            checkout.save()
            tell(o, f"Pembayaran {o['code']} diterima. Pesanan lagi dikemas, nomor resi JNE dikirim di sini.", note)
        elif cmd == "done" and o["status"] == "paid" and o.get("pickup"):
            o.update(status="shipped", shipped_at=time.time())
            stats.count("pickup_done")
            checkout.save()
            if tell(o, f"Pesanan {o['code']} sudah diserahkan. Makasih ya, selamat ngopi!", note):
                note(f"{o['code']} selesai.")
        elif cmd == "nopay" and o["status"] == "unpaid":
            stats.count("admin_unpaid")
            if tell(o, f"Pembayaran {o['code']} belum kami terima. Kalau sudah bayar, kirim ulang screenshot-nya "
                       f"atau chat {WA} ya.", note):
                note(f"Oke, pembeli {o['code']} dikabari pembayarannya belum masuk.")
        else:
            note(f"{o['code']} statusnya sudah {o['status']}.")
        return checkout.save()
    text = (m.get("text") or "").strip()
    o = checkout.by_ask((m.get("reply_to_message") or {}).get("message_id"))
    if o:
        resi = re.sub(r"[\s-]", "", text).upper()
        if not re.fullmatch(r"[A-Z0-9]{8,20}", resi):
            return note("Nomor resinya kayaknya salah (8-20 huruf/angka). Balas lagi pesan tadi.")
        o.update(status="shipped", resi=resi, shipped_at=time.time())
        checkout.save()
        stats.count("resi_sent")
        if tell(o, f"Pesanan {o['code']} sudah dikirim pakai JNE Reguler. Nomor resi: {resi}", note,
                {"inline_keyboard": [[{"text": "🚚 Lacak di JNE", "url": JNE_TRACK}]]}):
            note(f"Resi {resi} terkirim ke pembeli {o['code']}. Jangan lupa isi status dan resi di buku order.")
        return
    if text.startswith("/batal") and (who in _amount_wait or who in _drafts):
        _amount_wait.discard(who)
        _drafts.pop(who, None)
        return note("Oke, dibatalin.")
    if who in _amount_wait and not text.startswith("/") and not text.startswith(("📝", "📋", "💳")):
        if not (amount := rupiah(text)):
            return note("Nominalnya nggak kebaca. Ketik angka, misal 85000 atau 85rb. /batal kalau nggak jadi.")
        _amount_wait.discard(who)
        return manual_qr(who, amount, note)
    _amount_wait.discard(who)
    if text.startswith("💳") or text.startswith("/qr"):
        _amount_wait.add(who)
        return note("Nominalnya berapa? Ketik angka, misal 85000 atau 85rb. /batal kalau nggak jadi.")
    if "pesanan:" in text.lower():   # a filled WhatsApp template, with or without /baru in front
        return wa_entry(who, text, note)
    if text.startswith("📝") or text.startswith("/baru"):
        note(checkout.TEMPLATE)
        return note("Copy template di atas ke pembeli di WhatsApp. Habis diisi, paste balasannya ke sini.")
    if text.startswith("📋") or text.startswith("/pesanan"):
        rows = [f"{x['code']} · {x['status']} · {order.idr(x['total'])}" + (" · ambil sendiri" if x.get("pickup") else "")
                + (" · WhatsApp" if x["chat"] is None else "") for x in checkout._orders.values() if x["status"] != "shipped"]
        return note("\n".join(rows) or "Nggak ada pesanan yang belum dikirim.")
    tg_admin("sendMessage", {"chat_id": who, "text": HELP, "reply_markup": ADMIN_KB})


def on_callback(q):
    m = q.get("message") or {}
    chat = (m.get("chat") or {}).get("id")
    try:
        tg("answerCallbackQuery", {"callback_query_id": q["id"]})
    except OSError:
        pass
    if chat is None or m["chat"].get("type") != "private":
        return
    user, mid = (q.get("from") or {}).get("id", chat), m.get("message_id")
    cmd, _, arg = (q.get("data") or "").partition(":")
    stats.count("tap")
    stats.seen(user)
    if q.get("data") == "o":
        stats.count("menu")
    c = cart(chat)
    c["await"] = None
    if cmd == "o":
        menu(chat, mid)
    elif cmd == "p":
        sizes(chat, arg, mid)
    elif cmd in ("a", "m") and arg in order.VARIANTS:
        c["items"][arg] = min(MAX_QTY, c["items"].get(arg, 0) + (1 if cmd == "a" else -1))
        if c["items"][arg] <= 0:
            del c["items"][arg]
        cart_view(chat, mid)
    elif cmd == "c":
        cart_view(chat, mid)
    elif cmd == "x":
        c["items"].clear()
        cart_view(chat, mid)
    elif cmd == "n":
        c["await"] = "note"
        say(chat, "Tulis catatan buat pesanan ini (misal: giling untuk V60, kirim ke Bandung), maks 200 karakter. "
                  "Ketik /batal kalau nggak jadi.")
    elif cmd == "k" and c["items"] and in_bot(user):
        say(chat, "Mau gimana?", {"inline_keyboard": [
            [{"text": "🤝 Bayar langsung (ambil sendiri / janjian)", "callback_data": "kp"}],
            [{"text": "🚚 Kirim dan bayar (JNE)", "callback_data": "ks"}],
            [{"text": "⬅️ Keranjang", "callback_data": "c"}]]}, mid)
    elif cmd in ("kp", "ks") and c["items"] and in_bot(user):
        c["mode"] = "pickup" if cmd == "kp" else "ship"
        if not c.get("phone"):
            ask_phone(chat)
        else:
            quote(chat) if cmd == "kp" else ask_area(chat)
    elif cmd == "ka" and c["items"]:
        ask_area(chat)
    elif cmd == "d" and arg.isdigit() and int(arg) in c.get("areas", {}):
        c["dest"], c["await"] = (int(arg), c["areas"][int(arg)]), "addr"
        say(chat, "Tulis nama penerima dan alamat lengkap (jalan, nomor rumah, RT/RW, patokan), maks 200 huruf.")
    elif cmd == "q":
        pay(chat, user)
    elif cmd == "k":
        if not c["items"]:
            return cart_view(chat, mid)
        c["await"] = "last4"
        say(chat, "Ketik 4 digit terakhir nomor WhatsApp kamu, buat lacak pesanan nanti. Atau tekan Lewati.",
            {"inline_keyboard": [[{"text": "Lewati", "callback_data": "kk"}],
                                 [{"text": "⬅️ Kembali ke keranjang", "callback_data": "c"}]]})
    elif cmd == "kk":
        finish(chat, user, c.get("phone", "")[-4:])


def on_message(m, sessions):
    text, chat = m.get("text"), (m.get("chat") or {}).get("id")
    if chat is None or m["chat"].get("type") != "private":
        return   # private chats only: in groups the bot stays silent
    stats.seen((m.get("from") or {}).get("id", chat))
    if m.get("photo"):
        stats.count("photo")
        return on_photo(m, chat)
    if m.get("contact"):   # the "Bagikan nomor HP" button; anywhere else a contact is ignored (never sent to Vertex)
        c = _carts.get(chat)
        text = (m["contact"].get("phone_number") or "") if c and c["await"] == "phone" else ""
    if not text:
        return
    stats.count("msg")
    user, c = (m.get("from") or {}).get("id", chat), _carts.get(chat)
    waiting = c and c["await"] and not text.startswith("/")
    if text.startswith("/batal"):
        if c and c["await"] == "phone":
            say(chat, "Oke.", NO_KB)
        if c:
            c["await"] = None
        return cart_view(chat, info="Oke, dibatalin.")
    if waiting and c["await"] == "phone":
        if not (p := checkout.phone(text)):
            return say(chat, "Nomornya kurang pas. Tekan tombol Bagikan nomor HP, atau ketik misal 081234567890.",
                       PHONE_KB)
        c["phone"] = p
        if c.get("mode") == "pickup":
            say(chat, "Nomor tersimpan.", NO_KB)
            return quote(chat)
        return ask_area(chat, first=True)
    if waiting and c["await"] == "area":
        return got_area(chat, text)
    if waiting and c["await"] == "addr":
        c["addr"] = order.sanitize_note(text)
        if len(c["addr"]) < 10:
            return say(chat, "Alamatnya kependekan. Tulis nama penerima, jalan, nomor rumah dan patokan ya.")
        c["await"] = None
        return quote(chat)
    if waiting and c["await"] == "note":
        c["note"], c["await"] = order.sanitize_note(text), None
        return cart_view(chat, info="Catatan disimpan.")
    if waiting and c["await"] == "last4":
        if re.fullmatch(r"\d{4}", text.strip()):
            return finish(chat, user, text.strip())
        return say(chat, "Harus 4 angka ya, misal 1234. Atau tekan Lewati.",
                   {"inline_keyboard": [[{"text": "Lewati", "callback_data": "kk"}]]})
    if c:
        c["await"] = None
    if text.startswith("/start"):
        stats.count("start")
        return say(chat, START, ORDER_BTN)
    if text.startswith("/keranjang"):
        return cart_view(chat)
    if text.startswith("/pesan") or ORDER_WORDS.search(text):   # "mau pesan dong": the menu, free
        stats.count("menu")
        return menu(chat)
    if greet := greeting(text):   # free: answered here, never sent to Vertex
        stats.count("greet")
        return say(chat, greet, ORDER_BTN)
    if (ok := allowed(user, time.time())) is not True:
        stats.count("cap_busy" if ok == BUSY else "cap_closed")
        return say(chat, ok)
    stats.count("vertex")
    reply, sessions[chat] = answer(text[:MAX_INPUT], sessions.get(chat))
    say(chat, reply, ORDER_BTN)


def run():
    stats.FILE = Path.home() / "bot_stats.jsonl"   # only the live bot counts; _check() and --test never write
    token_ = TG_TOKEN_FILE.read_text(encoding="utf-8").strip()
    _api["url"], _api["file"] = f"https://api.telegram.org/bot{token_}", f"https://api.telegram.org/file/bot{token_}"
    me = json.load(urllib.request.urlopen(f"{_api['url']}/getMe", timeout=30))["result"]["username"]
    print(f"running as @{me} (Vertex AI Search)", flush=True)
    if checkout.ready():
        checkout.load()
        _api["admin"] = f"https://api.telegram.org/bot{checkout.ADMIN_TOKEN_FILE.read_text(encoding='utf-8').strip()}"
        threading.Thread(target=poll, args=(_api["admin"], on_admin, "admin"), daemon=True).start()
        print(f"checkout in bot: on, {len(checkout.admins())} admin(s), {len(checkout._orders)} open order(s)", flush=True)
    sessions = {}

    def on_update(u):
        m = u.get("message") or {}
        if m.get("date") and time.time() - m["date"] > 5:
            print(f"late: message {time.time() - m['date']:.0f} s old", flush=True)
        if "callback_query" in u:
            on_callback(u["callback_query"])
        elif m:
            on_message(m, sessions)
    poll(_api["url"], on_update, "shop")


def poll(url, handle, name):
    offset = 0
    while True:
        try:
            # Short long-poll: on this network an idle connection dies silently, and a 50 s poll then held new
            # messages for up to ~80 s (24 Nov). 10 s keeps the worst case near 15 s; ~6 cheap requests a minute.
            ups = json.load(urllib.request.urlopen(f"{url}/getUpdates?timeout=10&offset={offset}", timeout=15))["result"]
        except urllib.error.HTTPError as e:
            if e.code == 409 and name == "shop":   # another program polls this bot -> revoke the token in @BotFather
                sys.exit("409 Conflict: another process is reading this bot. Revoke the token in @BotFather.")
            print(f"telegram error ({name}):", e.code, flush=True); time.sleep(10 if e.code != 409 else 60); continue
        except OSError as e:   # URLError, TimeoutError, ConnectionResetError: a wifi drop must not kill the bot
            print(f"network ({name}):", type(e).__name__, e, flush=True); time.sleep(2); continue
        for u in ups:
            offset = u["update_id"] + 1
            try:   # one bad update (a stale button, a send that fails) must not stop the bot
                with LOCK:
                    handle(u)
            except Exception as e:
                print(f"update failed ({name}):", type(e).__name__, str(e)[:200], flush=True)
                stats.count("update_failed")


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
    assert ORDER_WORDS.search("mau pesan dong") and ORDER_WORDS.search("Beli BOLD") and not ORDER_WORDS.search("pesanan")
    order._check()
    ship._check()
    checkout._check()
    qris._check()
    _order_flow_check()
    _checkout_flow_check()


def _order_flow_check():
    """A whole order through fake Telegram calls: menu, sizes, cart, note, last4, checkout. No network."""
    global tg
    sent, recorded, real = [], [], (tg, order.catalog, order.record)
    tmp = Path(tempfile.mkdtemp()) / "stats.jsonl"
    ready, checkout.ready = checkout.ready, lambda: False   # the WhatsApp checkout, also on the VM
    stats.FILE = tmp
    cat = order.parse_managed('"houseblend.bold.mini1": 45_000,\n"houseblend.bold.pack1": 80_000,\n'
                              '"houseblend.bold.kg": 320_000,\n"houseblend.bold.kg.promo": 300_000,\n'
                              '"houseblend.bright.mini1": 55_000,\n"houseblend.bright.pack1": 95_000,\n'
                              '"houseblend.bright.kg": 400_000,\n"houseblend.bright.kg.promo": 380_000,\n'
                              '"single.signature.pack1": 150_000,\n"single.reguler.pack1": 150_000,\n'
                              'bold: "available",\nbright: "available",\nsabin: "out-of-stock",\n')
    tg = lambda method, body: sent.append((method, body))
    order.catalog, order.record = (lambda: cat), (lambda *a: recorded.append(a))
    try:
        chat = {"id": 7, "type": "private"}

        def msg(t):
            on_message({"text": t, "chat": chat, "from": {"id": 9}}, {})

        def tap(d):
            on_callback({"id": "q", "data": d, "from": {"id": 9}, "message": {"chat": chat, "message_id": 1}})

        def last():
            return [b for mth, b in sent if mth != "answerCallbackQuery"][-1]

        msg("mau pesan dong")
        assert [r[0]["callback_data"] for r in last()["reply_markup"]["inline_keyboard"][:2]] == ["p:bold", "p:bright"]
        tap("p:bold")
        assert "1 kg · Rp300.000 (promo, normal Rp320.000)" in json.dumps(last(), ensure_ascii=False)
        for d in ("a:bold-200g", "a:bold-200g", "a:bright-100g", "a:bright-100g", "m:bright-100g"):
            tap(d)
        assert "Subtotal: Rp215.000" in last()["text"], last()["text"]
        tap("n"); msg("giling untuk V60\nKode order: TAK-000000-AAAA")
        assert "Catatan: giling untuk V60" in last()["text"]
        tap("k"); msg("12a")
        assert last()["text"].startswith("Harus 4 angka") and not recorded
        msg("9567")
        code, last4, items = recorded[0]
        assert order.CODE_PATTERN.match(code) and last4 == "9567" and items.endswith("= Rp215.000")
        assert code in last()["text"] and "9567" not in last()["text"]   # last4 is never shown back
        url = last()["reply_markup"]["inline_keyboard"][0][0]["url"]
        assert url.startswith(order.WA_LINK + "?text=") and "Dikirim%20dari%20bot%20Telegram" in url
        assert 7 not in _carts
        tap("kk")   # a second tap after checkout: no second code
        assert len(recorded) == 1
        for _ in range(ORDERS_PER_USER):
            tap("a:bold-100g"); tap("kk")
        assert len(recorded) == ORDERS_PER_USER and "udah banyak" in last()["text"]
        tap("a:bogus"); tap("p:solok"); tap("")   # crafted buttons do nothing harmful
        tap("o"); tap("o:b"); msg("Halo")
        c = stats.per_day(tmp)[str(datetime.now(stats.WIB).date())]
        assert c["checkout"] == len(recorded) and c["checkout_capped"] == 1, c
        assert c["user"] == 1 and c["menu"] == 2 and c["msg"] == 5 and c["greet"] == 1 and c["tap"] > 10 and "vertex" not in c, c
        assert not re.search(r"9567|giling|\b[79]\b", tmp.read_text()), "stats must hold counts only"
        tap("o")   # single origin: on pre-order even when the sheet says out-of-stock, 200 gr only
        kb = [b for r in last()["reply_markup"]["inline_keyboard"] for b in r]
        assert {"text": "Sabin (PO)", "callback_data": "p:sabin"} in kb and "pre-order" in last()["text"]
        tap("p:sabin")
        assert "Pre-order" in last()["text"] and "gula aren" in last()["text"]
        assert [b["text"] for r in last()["reply_markup"]["inline_keyboard"] for b in r][0] == "200 gr · Rp150.000"
        tap("a:sabin-200g")
        assert "Sabin 200 gr (pre-order): 1 pack x Rp150.000" in last()["text"], last()["text"]
    finally:
        stats.FILE, checkout.ready = None, ready
        tg, (order.catalog, order.record) = real[0], real[1:]
        _carts.clear(); _orders.clear(); _orders_day.clear()


def _checkout_flow_check():
    """A whole in-bot checkout through fakes: phone, area, address, JNE rate, QRIS, screenshot, admin, resi."""
    global tg, tg_admin, send_photo, fetch_photo, token
    g = globals()
    names = ("tg", "tg_admin", "send_photo", "fetch_photo", "token")
    real = {n: g[n] for n in names}
    real_mod = (order.catalog, order.record, ship.search, ship.cost, checkout.ready, checkout.admins,
                checkout.vision_text, checkout.ORDERS_FILE, checkout.QRIS_FILE, qris.png)
    sent, photos, admin, recorded = [], [], [], []
    d = Path(tempfile.mkdtemp())
    body = "000201010211" + "2612" + "00ID.EXAMPLE" + "52045812530336058" + "02ID5904TEST6007JAKARTA" + "6304"
    (d / "qris").write_text(body + qris.crc(body), encoding="utf-8")
    stats.FILE = d / "stats.jsonl"
    cat = order.parse_managed("".join(f'"houseblend.{k}": {v},' + chr(10) for k, v in (
        ("bold.mini1", 45000), ("bold.pack1", 80000), ("bold.kg", 320000), ("bold.kg.promo", 300000),
        ("bright.mini1", 55000), ("bright.pack1", 95000), ("bright.kg", 400000), ("bright.kg.promo", 380000)))
        + '"single.signature.pack1": 150_000,\n"single.reguler.pack1": 150_000,\n')
    tebet = (17588, "TEBET BARAT, TEBET, JAKARTA SELATAN, DKI JAKARTA, 12810")
    tg = lambda method, b: sent.append((method, b)) or {"result": {"message_id": len(sent)}}
    tg_admin = lambda method, b: admin.append(b) or {"result": {"message_id": 1000 + len(admin)}}
    send_photo = lambda api, chat, image, caption, kb=None: photos.append((api, chat, image, caption, kb)) or {
        "result": {"message_id": 2000 + len(photos)}}
    fetch_photo, token = (lambda m: b"jpg"), (lambda: "t")
    order.catalog, order.record = (lambda: cat), (lambda *a: recorded.append(a))
    ship.search = lambda t: [tebet] if "tebet" in t.lower() or "12810" in t else []
    ship.cost = lambda dest, grams: (10000, "1 hari")
    checkout.ready, checkout.admins = (lambda: True), (lambda: {1})
    checkout.ORDERS_FILE, checkout.QRIS_FILE, qris.png = d / "orders.json", d / "qris", (lambda p: p.encode())
    _api.update(url="SHOP", admin="ADMIN")
    global CHECKOUT_FOR_ALL
    assert not in_bot(9) or CHECKOUT_FOR_ALL   # test phase: a buyer who is not an admin keeps the WhatsApp checkout
    CHECKOUT_FOR_ALL = True
    try:
        chat = {"id": 7, "type": "private"}

        def msg(t=None, **extra):
            on_message({"chat": chat, "from": {"id": 9}, **({"text": t} if t else {}), **extra}, {})

        def tap(data, who=9, where=chat, fn=None):
            q = {"id": "q", "data": data, "from": {"id": who}, "message": {"chat": where, "message_id": 1}}
            (fn or on_callback)(q) if not fn else fn({"callback_query": q})

        def last():
            return [b for mth, b in sent if mth != "answerCallbackQuery"][-1]

        tap("a:bold-200g"); tap("a:bold-200g"); tap("k"); tap("ks")
        assert last()["reply_markup"] == PHONE_KB
        msg("12345")
        assert last()["text"].startswith("Nomornya kurang pas")
        msg(contact={"phone_number": "+62 812-3456-7890", "user_id": 9})
        assert last()["reply_markup"] == NO_KB and "kecamatan" in last()["text"]
        msg("bogor"); assert last()["text"].startswith("Nggak ketemu")
        msg("tebet"); assert last()["reply_markup"]["inline_keyboard"][0][0]["callback_data"] == "d:17588"
        tap("d:99"); tap("d:17588")
        assert "alamat lengkap" in last()["text"]
        msg("Rina, Jl. Tebet Raya No. 12, pagar hijau")
        t = last()["text"]
        assert "Ongkir JNE Reguler: Rp10.000" in t and "HP: 081234567890" in t and "Ringkasan pesanan" in t, t
        tap("a:bold-1kg"); tap("q")   # cart changed after the summary: quoted again, no order
        assert not checkout._orders and "Ringkasan pesanan" in last()["text"]
        good, send_photo = send_photo, lambda *a, **k: (_ for _ in ()).throw(OSError("reset"))
        with contextlib.redirect_stdout(io.StringIO()):   # keep the simulated failure out of the journal at startup
            tap("q")
        assert not checkout._orders and "gagal dikirim" in last()["text"] and _carts[7]["items"] and not recorded
        send_photo = good
        tap("m:bold-1kg"); tap("q"); tap("q")   # quoted again for the smaller cart, then paid
        (o,) = checkout._orders.values()
        assert o["total"] == 160000 + 10000 + o["unique"] and 1 <= o["unique"] <= 99
        qr = qris.tags(photos[-1][2].decode())
        assert photos[-1][:2] == ("SHOP", 7) and qr["54"] == str(o["total"]) and qr["01"] == "11"
        code, last4, items = recorded[0]
        assert code == o["code"] and last4 == "7890" and "Tebet" not in items and "0812" not in items
        assert admin[-1]["chat_id"] == 1 and "Pesanan baru" in admin[-1]["text"] and "Jl. Tebet Raya" in admin[-1]["text"]
        assert 7 not in _carts and json.loads(checkout.ORDERS_FILE.read_text(encoding="utf-8"))[code]["status"] == "unpaid"
        tap("q"); assert len(checkout._orders) == 1   # a second tap mints nothing
        checkout.vision_text = lambda img, tok, proj: "Berhasil | TITIK ASAL KOPI | Rp " + order.idr(o["total"])[2:]
        msg(photo=[{"file_id": "f", "file_size": 1000}])
        assert "Cocok" in last()["text"] and photos[-1][0] == "ADMIN" and photos[-1][4]["inline_keyboard"][0][0][
            "callback_data"] == f"pay:{code}" and "cocok" in photos[-1][3]
        tap(f"pay:{code}", who=5, fn=on_admin)   # not an admin: nothing happens
        assert o["status"] == "unpaid"
        on_admin({"message": {"chat": {"id": 5, "type": "private"}, "from": {"id": 5}, "text": "/start"}})
        assert admin[-1] == {"chat_id": 5, "text": admin[-1]["text"]} and "Id Telegram kamu: 5" in admin[-1]["text"]
        on_admin({"message": {"chat": {"id": 5, "type": "private"}, "from": {"id": 5}, "text": "/pesanan"}})
        assert admin[-1]["chat_id"] == 5 and "/pesanan" not in admin[-1]["text"]   # nothing else for a non-admin
        tap(f"pay:{code}", who=1, where={"id": 1, "type": "private"}, fn=on_admin)
        assert o["status"] == "paid" and "diterima" in last()["text"] and o["ask"]
        on_admin({"message": {"chat": {"id": 1, "type": "private"}, "from": {"id": 1}, "text": "abc",
                              "reply_to_message": {"message_id": o["ask"][0]}}})
        assert o["status"] == "paid" and "salah" in admin[-1]["text"]
        on_admin({"message": {"chat": {"id": 1, "type": "private"}, "from": {"id": 1}, "text": "0123 4567 8901",
                              "reply_to_message": {"message_id": o["ask"][0]}}})
        assert o["status"] == "shipped" and o["resi"] == "012345678901" and "012345678901" in last()["text"]
        assert last()["reply_markup"]["inline_keyboard"][0][0]["url"] == JNE_TRACK
        n = len(sent)
        msg(contact={"phone_number": "+62 812-3456-7890", "user_id": 9})   # outside the phone step: ignored
        assert len(sent) == n and not _seen
        msg(photo=[{"file_id": "f", "file_size": 1000}])   # no unpaid order any more: ignored
        assert "012345678901" in last()["text"]
        def admin_says(t, reply_to=None):
            on_admin({"message": {"chat": {"id": 1, "type": "private"}, "from": {"id": 1}, "text": t,
                                  **({"reply_to_message": {"message_id": reply_to}} if reply_to else {})}})

        def admin_taps(data):
            tap(data, who=1, where={"id": 1, "type": "private"}, fn=on_admin)

        admin_says("/baru")
        assert admin[-2]["text"] == checkout.TEMPLATE
        filled = (checkout.TEMPLATE.replace("Nama:", "Nama: Dita").replace("No HP:", "No HP: 0813 2222 4455")
                  .replace("Alamat lengkap:", "Alamat lengkap: Jl. Riau 21").replace("Catatan:", "Catatan: giling V60")
                  .replace("Kecamatan / kode pos:", "Kecamatan / kode pos: Tebet 12810")
                  .replace("Pesanan: (contoh: BOLD 200gr x2, BRIGHT 100gr x1, Solok 200gr x1)", "Pesanan: BOLD 200gr x2, gayo 1"))
        admin_says(filled)
        assert "nggak kebaca: gayo 1" in admin[-1]["text"] and 1 not in _drafts
        admin_says(filled.replace("Nama: Dita", "Nama:"))
        assert admin[-1]["text"].startswith("Belum lengkap: Nama")
        admin_says(filled.replace(", gayo 1", ""))   # one destination found: priced straight away
        assert "Ongkir JNE Reguler: Rp10.000" in admin[-1]["text"] and "Dita, Jl. Riau 21" in admin[-1]["text"]
        admin_taps("aq")
        wa = max(checkout._orders.values(), key=lambda x: x["created"])
        assert wa["chat"] is None and wa["total"] == 160000 + 10000 + wa["unique"] and wa["note"] == "giling V60"
        assert photos[-1][:2] == ("ADMIN", 1) and qris.tags(photos[-1][2].decode())["54"] == str(wa["total"])
        assert recorded[-1][0] == wa["code"] and recorded[-1][1] == "4455" and "Riau" not in recorded[-1][2]
        assert wa["code"] in admin[-1]["text"] and "Teks buat pembeli" in admin[-1]["text"] and 1 not in _drafts
        admin_taps("aq")   # a second tap mints nothing
        assert "Draftnya udah nggak ada" in admin[-1]["text"]
        n = len(sent)
        admin_taps(f"pay:{wa['code']}")
        assert wa["status"] == "paid" and len(sent) == n and "Kirim ke pembeli (HP 081322224455)" in admin[-1]["text"]
        admin_says("TEST12345678", reply_to=wa["ask"][0])
        assert wa["status"] == "shipped" and "TEST12345678" in admin[-1]["text"] and len(sent) == n
        # pay in person: no address, no shipping, handed over instead of a resi
        pick = {"id": 8, "type": "private"}

        def buyer(t=None, **extra):
            on_message({"chat": pick, "from": {"id": 8}, **({"text": t} if t else {}), **extra}, {})

        def buyer_taps(data):
            on_callback({"id": "q", "data": data, "from": {"id": 8}, "message": {"chat": pick, "message_id": 1}})

        buyer_taps("a:bright-100g"); buyer_taps("k")
        assert [r[0]["callback_data"] for r in last()["reply_markup"]["inline_keyboard"]] == ["kp", "ks", "c"]
        buyer_taps("kp")
        assert last()["reply_markup"] == PHONE_KB
        buyer(contact={"phone_number": "0857 1111 2222"})
        t = last()["text"]
        assert "Ambil sendiri / janjian" in t and "Ongkir" not in t and "Kirim ke" not in t, t
        assert [b["callback_data"] for b in last()["reply_markup"]["inline_keyboard"][1]] == ["c"]
        buyer_taps("q")
        (pk,) = [x for x in checkout._orders.values() if x["chat"] == 8]
        assert pk["pickup"] and pk["chat"] == 8 and pk["total"] == 55000 + pk["unique"] and pk["ship"] == 0
        assert "ambil sendiri" in recorded[-1][2] and recorded[-1][1] == "2222"
        admin_taps(f"pay:{pk['code']}")
        assert pk["status"] == "paid" and not pk["ask"] and "atur waktu dan tempat ambil" in last()["text"]
        assert admin[-1]["reply_markup"]["inline_keyboard"][0][0]["callback_data"] == f"done:{pk['code']}"
        admin_taps(f"done:{pk['code']}")
        assert pk["status"] == "shipped" and "diserahkan" in last()["text"]
        # the admin keyboard and a payment QR for any amount
        admin_says("hai")
        assert admin[-1]["reply_markup"] == ADMIN_KB
        n = len(photos)
        admin_says("💳 Buat QR bayar"); admin_says("dua puluh")
        assert "nggak kebaca" in admin[-1]["text"] and len(photos) == n
        admin_says("85rb")
        assert photos[-1][:2] == ("ADMIN", 1) and qris.tags(photos[-1][2].decode())["54"] == "85000"
        admin_says("85000")   # no longer waiting for an amount: just the help
        assert len(photos) == n + 1 and admin[-1]["text"] == HELP
        assert [rupiah(x) for x in ("Rp85.000", "85.000", "1,5jt", "85k", "0", "abc")] == [85000, 85000, 1500000, 85000,
                                                                                            None, None]
        tap(f"pay:{pk['code']}", who=5, fn=on_admin)   # a non-admin still gets nothing
        on_admin({"message": {"chat": {"id": 5, "type": "private"}, "from": {"id": 5}, "text": "💳 Buat QR bayar"}})
        assert 5 not in _amount_wait and all(b.get("chat_id") != 5 or "Id Telegram" in b.get("text", "") for b in admin)
        kept = stats.FILE.read_text(encoding="utf-8")
        assert not re.search(r"Tebet|0812|7890|Rina", kept) and '"resi_sent"' in kept, "stats must hold counts only"
    finally:
        g.update(real)
        (order.catalog, order.record, ship.search, ship.cost, checkout.ready, checkout.admins, checkout.vision_text,
         checkout.ORDERS_FILE, checkout.QRIS_FILE, qris.png) = real_mod
        stats.FILE, CHECKOUT_FOR_ALL = None, False
        _api.update(url=None, admin=None)
        _carts.clear(); _orders.clear(); _orders_day.clear(); checkout._orders.clear(); _drafts.clear()
        _amount_wait.clear()


if __name__ == "__main__":
    _check()
    if sys.argv[1:2] == ["--test"]:
        print(answer(" ".join(sys.argv[2:]))[0])
    else:
        run()
