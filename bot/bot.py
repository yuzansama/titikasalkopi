"""Telegram bot "mas_bas_bot": answers questions about Titik Asal Kopi with Vertex AI Search (app "tanya-kopi" in
project titikasalkopi-bot, documents from bot/vertex_docs/, set up by bot/vertex_setup.py). Vertex AI Search is the
service the GenAI App Builder trial credit covers.

  python bot/bot.py          # long polling; Ctrl+C to stop
  python bot/bot.py --test "Bedanya Abmisibil sama Sabin apa?"   # one answer, no Telegram

Auth: TG_TOKEN_FILE (default supreme-eureka/.masbas_env, token from @BotFather, never committed) and the gcloud login
(`gcloud auth print-access-token`), or on the GCE VM (bot/bot-kopi.service) the VM's service account.
Ordering: the "Pesan kopi" button, /pesan, or a message with pesan/beli/order opens a button menu (order.py, contract
docs/15-kontrak-pesanan-untuk-bot-telegram.md). Checkout gives an order code and a WhatsApp button with the order text;
payment and shipping stay on WhatsApp.
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

import order

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
            "ukuran yang ditanya, jangan menyalin daftar harga lengkap. Kalau pelanggan mau pesan houseblend, minta "
            "tekan tombol Pesan kopi di bawah pesan ini atau ketik /pesan. Single origin, rasio khusus dan "
            "pertanyaan stok diarahkan ke WhatsApp 0851-2155-9488 (https://wa.me/6285121559488).")
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
        return ERROR, session
    a, sess = d.get("answer", {}), (d.get("session") or {}).get("name", session)
    if a.get("answerSkippedReasons") or a.get("state") != "SUCCEEDED" or not a.get("answerText"):
        return OFF_TOPIC, sess
    return a["answerText"].strip(), sess


# --- Ordering by button (order.py holds the contract logic). Free: no Vertex call. ---
ORDER_WORDS = re.compile(r"\b(pesan|pesen|order|beli|checkout)\b", re.I)   # "pesanan" does not match
ORDERS_PER_USER, ORDERS_PER_DAY = 3, 20   # checkouts; the order book allows 50 rows a day shared with the web
MAX_QTY = 20
NOTES = {"bold": "choco, almond, caramel", "bright": "raisin, orange, lemon zest"}
ORDER_BTN = {"inline_keyboard": [[{"text": "🛒 Pesan kopi", "callback_data": "o"}]]}
WA_BTN = {"text": "💬 Chat admin WhatsApp", "url": order.WA_LINK}
NO_CATALOG = f"Maaf, daftar harga lagi nggak bisa dibuka. Pesan langsung lewat {WA} ya."
_carts = {}                    # chat -> {"items": {variant id: qty}, "note": str, "await": None | "note" | "last4"}
_orders = defaultdict(deque)   # user -> checkout timestamps (last 24 h)
_orders_day = deque()
_api = {"url": None}


def tg(method, body):
    return post(f"{_api['url']}/{method}", body, timeout=30)


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
    rows = [[{"text": name, "callback_data": f"p:{slug}"}] for slug, name in lines.items()]
    if cart(chat)["items"]:
        rows.append([{"text": "🧺 Lihat keranjang", "callback_data": "c"}])
    rows.append([{"text": "💬 Single origin / rasio khusus: chat admin", "url": order.WA_LINK}])
    text = "Mau pesan kopi apa? Yang ready sekarang:" if lines else "Lagi belum ada yang bisa dipesan lewat bot."
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
            rows.append([{"text": f"{label.replace('Kemasan ', '')} · {price}", "callback_data": f"a:{vid}"}])
    if not rows:
        return menu(chat, edit)
    rows.append([{"text": "⬅️ Kembali", "callback_data": "o"}])
    say(chat, f"{name}\nCatatan rasa: {NOTES.get(slug, '-')}\n\nPilih ukuran:", {"inline_keyboard": rows}, edit)


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
            "(Belum termasuk ongkir. Total akhir dikonfirmasi admin di WhatsApp.)"
            + (f"\nCatatan: {c['note']}" if c["note"] else ""))
    rows = [[{"text": "➖", "callback_data": f"m:{v}"},
             {"text": f"{order.VARIANTS[v][0].split()[-1]} {order.VARIANTS[v][2].replace('Kemasan ', '')} ×{q}",
              "callback_data": "c"},
             {"text": "➕", "callback_data": f"a:{v}"}] for v, q in c["items"].items()]
    rows += [[{"text": "➕ Tambah kopi lain", "callback_data": "o"}, {"text": "📝 Catatan", "callback_data": "n"}],
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
        return say(chat, f"Pesanan lewat bot hari ini udah banyak. Lanjut pesan langsung lewat {WA} ya.",
                   {"inline_keyboard": [[WA_BTN]]})
    code, lines = order.new_code(), order.lines_of(items, cat)
    text = order.message(code, lines, c["note"])
    order.record(code, last4, order.record_items(lines))
    _carts.pop(chat, None)   # a second tap can't mint a second code
    lacak = (f"Lacak statusnya di {order.LACAK} pakai kode ini dan 4 digit terakhir nomor WhatsApp kamu." if last4 else
             f"Kamu nggak isi 4 digit nomor WhatsApp, jadi pelacakan di {order.LACAK} aktif setelah admin mencatatnya.")
    say(chat, f"Kode order kamu: {code}\n\nTekan tombol di bawah buat kirim pesanan ke WhatsApp admin, lalu kirim "
              f"pesannya. Ongkir, total akhir dan pembayaran dibereskan di sana. {lacak}\n\n— Isi pesan —\n{text}",
        {"inline_keyboard": [[{"text": "📲 Kirim pesanan ke WhatsApp", "url": order.wa_url(text)}]]})


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
    elif cmd == "k":
        if not c["items"]:
            return cart_view(chat, mid)
        c["await"] = "last4"
        say(chat, "Ketik 4 digit terakhir nomor WhatsApp kamu, buat lacak pesanan nanti. Atau tekan Lewati.",
            {"inline_keyboard": [[{"text": "Lewati", "callback_data": "kk"}],
                                 [{"text": "⬅️ Kembali ke keranjang", "callback_data": "c"}]]})
    elif cmd == "kk":
        finish(chat, user, "")


def on_message(m, sessions):
    text, chat = m.get("text"), (m.get("chat") or {}).get("id")
    if not text or chat is None or m["chat"].get("type") != "private":
        return   # private chats only: in groups the bot stays silent
    user, c = (m.get("from") or {}).get("id", chat), _carts.get(chat)
    waiting = c and c["await"] and not text.startswith("/")
    if text.startswith("/batal"):
        if c:
            c["await"] = None
        return cart_view(chat, info="Oke, dibatalin.")
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
        return say(chat, START, ORDER_BTN)
    if text.startswith("/keranjang"):
        return cart_view(chat)
    if text.startswith("/pesan") or ORDER_WORDS.search(text):   # "mau pesan dong": the menu, free
        return menu(chat)
    if greet := greeting(text):   # free: answered here, never sent to Vertex
        return say(chat, greet, ORDER_BTN)
    if (ok := allowed(user, time.time())) is not True:
        return say(chat, ok)
    reply, sessions[chat] = answer(text[:MAX_INPUT], sessions.get(chat))
    say(chat, reply, ORDER_BTN)


def run():
    _api["url"] = f"https://api.telegram.org/bot{TG_TOKEN_FILE.read_text(encoding='utf-8').strip()}"
    me = json.load(urllib.request.urlopen(f"{_api['url']}/getMe", timeout=30))["result"]["username"]
    print(f"running as @{me} (Vertex AI Search)", flush=True)
    sessions, offset = {}, 0
    while True:
        try:
            # Short long-poll: on this network an idle connection dies silently, and a 50 s poll then held new
            # messages for up to ~80 s (24 Nov). 10 s keeps the worst case near 15 s; ~6 cheap requests a minute.
            ups = json.load(urllib.request.urlopen(f"{_api['url']}/getUpdates?timeout=10&offset={offset}",
                                                   timeout=15))["result"]
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
            try:   # one bad update (a stale button, a send that fails) must not stop the bot
                if "callback_query" in u:
                    on_callback(u["callback_query"])
                elif m:
                    on_message(m, sessions)
            except Exception as e:
                print("update failed:", type(e).__name__, str(e)[:200], flush=True)


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
    _order_flow_check()


def _order_flow_check():
    """A whole order through fake Telegram calls: menu, sizes, cart, note, last4, checkout. No network."""
    global tg
    sent, recorded, real = [], [], (tg, order.catalog, order.record)
    cat = order.parse_managed('"houseblend.bold.mini1": 45_000,\n"houseblend.bold.pack1": 80_000,\n'
                              '"houseblend.bold.kg": 320_000,\n"houseblend.bold.kg.promo": 300_000,\n'
                              '"houseblend.bright.mini1": 55_000,\n"houseblend.bright.pack1": 95_000,\n'
                              '"houseblend.bright.kg": 400_000,\n"houseblend.bright.kg.promo": 380_000,\n'
                              'bold: "available",\nbright: "available",\n')
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
    finally:
        tg, (order.catalog, order.record) = real[0], real[1:]
        _carts.clear(); _orders.clear(); _orders_day.clear()


if __name__ == "__main__":
    _check()
    if sys.argv[1:2] == ["--test"]:
        print(answer(" ".join(sys.argv[2:]))[0])
    else:
        run()
