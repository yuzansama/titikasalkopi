"""JNE regular shipping rates from RajaOngkir (Komerce, free Starter plan: 100 rate checks a day), from the warehouse.

Key in ~/.rajaongkir on the VM (chmod 600, never in git). Tested 26 Nov 2026: inside Jakarta JNE's regular service is
"CTC" (City Courier), elsewhere "REG"; the API applies JNE's weight rounding itself, so send real grams.

  python bot/ship.py    # self-check, no network
"""
import json
import os
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://rajaongkir.komerce.id/api/v1"
ORIGIN = 17687   # SETU, CIPAYUNG, JAKARTA TIMUR 13880: the warehouse on Jl. Mabes Hankam
KEY_FILE = Path(os.environ.get("RAJAONGKIR_KEY_FILE", Path.home() / ".rajaongkir"))
UA = "Mozilla/5.0 (compatible; titikasalkopi-bot/1.0)"   # Cloudflare in front of the API refuses Python-urllib (1010)
REGULAR = ("REG", "CTC")
_cache = {}   # ponytail: unbounded until 500 entries, then cleared; restart also clears


def configured():
    return KEY_FILE.exists()


def _call(path, data=None):
    req = urllib.request.Request(API + path, data=urllib.parse.urlencode(data).encode() if data else None,
                                 headers={"key": KEY_FILE.read_text(encoding="utf-8").strip(), "User-Agent": UA})
    return json.load(urllib.request.urlopen(req, timeout=20)).get("data") or []


def _cached(key, fetch):
    if len(_cache) > 500:
        _cache.clear()
    if key not in _cache:
        _cache[key] = fetch()
    return _cache[key]


def short(label):
    """'TEBET BARAT, TEBET, JAKARTA SELATAN, DKI JAKARTA, 12810' -> 'Tebet Barat, Tebet, Jakarta Selatan 12810'."""
    p = [s.strip() for s in label.split(",")]
    return (", ".join(s.title() for s in p[:3]) + (f" {p[-1]}" if len(p) > 3 else "")) if p else label


def search(text):
    """[(id, label)] for a kelurahan, kecamatan or postal code, at most 6. Raises OSError/ValueError on API trouble."""
    q = " ".join(text.lower().split())[:50]
    return _cached(("s", q), lambda: [(d["id"], d["label"]) for d in _call(
        "/destination/domestic-destination?" + urllib.parse.urlencode({"search": q, "limit": 6, "offset": 0}))
        if isinstance(d.get("id"), int) and d.get("label")])


def pick(rates):
    """(cost, etd) of JNE's regular service out of the API's list, or None."""
    for r in rates:
        if r.get("service") in REGULAR and isinstance(r.get("cost"), int) and r["cost"] > 0:
            return r["cost"], str(r.get("etd") or "").replace("day", "hari").strip()
    return None


def cost(dest, grams):
    """(cost, etd) of JNE regular from the warehouse to `dest` for `grams`, or None if JNE has no regular service."""
    return _cached(("c", dest, grams), lambda: pick(_call("/calculate/domestic-cost", {
        "origin": ORIGIN, "destination": dest, "weight": grams, "courier": "jne", "price": "lowest"})))


def _check():
    assert short("TEBET BARAT, TEBET, JAKARTA SELATAN, DKI JAKARTA, 12810") == "Tebet Barat, Tebet, Jakarta Selatan 12810"
    rates = [{"service": "CTCYES", "cost": 18000}, {"service": "CTC", "cost": 10000, "etd": "1 day"}]
    assert pick(rates) == (10000, "1 hari") and pick([{"service": "YES", "cost": 1}]) is None
    assert pick([{"service": "REG", "cost": 0}, {"service": "REG", "cost": "12000"}]) is None   # never a Rp0 or text price


if __name__ == "__main__":
    _check()
    print("ship check ok")
