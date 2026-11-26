"""Visual single origin SOLOK (Arabica, Sumatera Barat) — flat vector, palet brand, logo asli.

Satu adegan lanskap (Gunung Talang, Danau Kembar, rumah gadang, dahan kopi berbuah) dipakai di empat keluaran:
  solok_feed-ig_1080x1350.png       -> feed Instagram 4:5
  solok_kartu-origin_1400x1120.png  -> kartu origin, tata letak sama dengan kartu Abmisibil / Sabin / Pondok Baru
  solok_produk_800x1000.png         -> gambar produk web 4:5 tanpa teks (calon web/src/images/produk/solok.jpg)
  solok_kemasan_1200x1500.png       -> usulan label pouch single origin 200 gr (mockup flat)
  preview_solok.png                 -> lembar pratinjau keempatnya (bukan file kirim)
Sumber SVG tiap keluaran ikut disimpan di svg/.

Teks lot (proses, mdpl, varietas, catatan rasa, tier) diisi di LOT. Nilai None = tidak ditampilkan; isi setelah
owner konfirmasi lalu jalankan ulang:  python marketing/solok/make_solok.py   (butuh Google Chrome)
"""
import base64
import sys
import xml.etree.ElementTree as ET
from xml.sax.saxutils import escape
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "maskot"))
import make_maskot as mm  # noqa: E402  render SVG -> PNG lewat Chrome headless

# ---------- isi ----------
LOT = {               # ponytail: data lot di sini saja; pindah ke products.ts kalau sudah final
    "tier": None,           # "Reguler" / "Signature" — tunggu owner
    "process": None,        # mis. "Full Washed"
    "altitude": None,       # mis. "1.400 MASL"
    "varietals": None,      # mis. "Arabica Sigararutang"
    "notes": None,          # mis. ("Gula aren", "Jeruk", "Rempah") — draf, tunggu owner
}
REGION = "Solok, Sumatera Barat"
# Dataran tinggi = abstrak IG DJKI 2019 ("dataran tinggi Solok"). Kecamatan/nagari lot belum diketahui, jadi tidak disebut.
KAWASAN = "Arabica dataran tinggi Sumatera Barat"
WA, IG, SHOPEE = "0851-2155-9488", "titikasalkopi", "Titikasalkopi"

# ---------- palet ----------
CREAM, CREAM2 = "#F9F4EE", "#EFE4D4"
GREEN, RUST, OLIVE = "#0E251F", "#A34215", "#474A2D"
SAGE, SAGE_L, SAGE_LL, SAGE_D = "#8C9C78", "#AEBB9C", "#CDD5C0", "#5F6E4E"
LAKE, LAKE_L = "#8FA8A3", "#B9CCC6"
CHERRY, CHERRY_L, SKY = "#B8461C", "#D7693A", "#E9E3D3"
INK = "#2C1100"

SANS = 'font-family="Century Gothic"'
COND = 'font-family="Bahnschrift" font-weight="700" font-stretch="condensed"'
SERIF = 'font-family="Georgia"'


def logo_uri(kind):
    return "data:image/png;base64," + base64.b64encode((HERE.parent / "brand" / f"logo_{kind}.png").read_bytes()).decode()


# ---------- elemen adegan (koordinat 1600 x 1000) ----------
def leaf(x, y, ang, ln, fill, vein):
    return (f'<g transform="translate({x} {y}) rotate({ang})">'
            f'<path d="M0 0 Q{ln * .45} {-ln * .30} {ln} 0 Q{ln * .45} {ln * .30} 0 0Z" fill="{fill}"/>'
            f'<path d="M{ln * .06} 0 L{ln * .9} 0" stroke="{vein}" stroke-width="3" stroke-linecap="round"/></g>')


def cherries(x, y, n=5, r=15):
    offs = [(0, 0), (24, 6), (10, 22), (-14, 16), (30, -14), (-20, -8), (18, -22)][:n]
    out = ""
    for i, (dx, dy) in enumerate(offs):
        c = CHERRY if i % 3 else "#8E3412"
        out += (f'<circle cx="{x + dx}" cy="{y + dy}" r="{r}" fill="{c}"/>'
                f'<circle cx="{x + dx - r * .35}" cy="{y + dy - r * .35}" r="{r * .28}" fill="{CHERRY_L}"/>')
    return out


def rumah_gadang(x, y, s):
    """Rumah gadang Minangkabau: atap bergonjong, badan kayu, tiang."""
    roof = ("M-100 -86 Q-86 -38 -72 -38 Q-60 -40 -52 -66 Q-30 -30 0 -32 Q30 -30 52 -66 "
            "Q60 -40 72 -38 Q86 -38 100 -86 L84 -4 L-84 -4Z")
    win = "".join(f'<rect x="{wx}" y="8" width="14" height="18" fill="{CREAM2}"/>' for wx in range(-58, 60, 28))
    legs = "".join(f'<rect x="{lx}" y="38" width="6" height="16" fill="{GREEN}"/>' for lx in range(-70, 71, 35))
    return (f'<g transform="translate({x} {y}) scale({s})">{legs}'
            f'<path d="M-78 -4 L78 -4 L70 40 L-70 40Z" fill="{RUST}"/>'
            f'<rect x="-78" y="-6" width="156" height="6" fill="{INK}"/>{win}'
            f'<path d="{roof}" fill="{GREEN}"/>'
            f'<path d="M-52 -66 Q-30 -30 0 -32 Q30 -30 52 -66" fill="none" stroke="{OLIVE}" stroke-width="3"/></g>')


def cloud(x, y, s, fill=CREAM):
    return (f'<g transform="translate({x} {y}) scale({s})" fill="{fill}">'
            f'<rect x="-80" y="-10" width="190" height="26" rx="13"/><circle cx="-20" cy="-12" r="30"/>'
            f'<circle cx="30" cy="-22" r="38"/><circle cx="72" cy="-6" r="22"/></g>')


def rows(path_d, clip_id, y0, y1, step, color, ang=-6):
    """Baris tanaman (kebun) sebagai garis miring di dalam bukit."""
    lines = "".join(f'<path d="M-50 {yy} Q800 {yy + 40} 1650 {yy - 10}" stroke="{color}" stroke-width="5" '
                    f'stroke-dasharray="14 10" fill="none" stroke-linecap="round"/>' for yy in range(y0, y1, step))
    return (f'<clipPath id="{clip_id}"><path d="{path_d}"/></clipPath>'
            f'<path d="{path_d}"/><g clip-path="url(#{clip_id})" transform="rotate({ang} 800 700)">{lines}</g>')


def scene(uid="s", house=(1280, 620, .95), branch_dx=0):
    hill_mid = "M-20 640 Q260 560 520 600 Q800 640 1040 580 Q1320 520 1620 600 L1620 1000 L-20 1000Z"
    hill_near = "M-20 760 Q300 690 640 740 Q980 790 1260 720 Q1450 680 1620 720 L1620 1000 L-20 1000Z"
    return f'''
<defs><linearGradient id="{uid}sky" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="{SKY}"/><stop offset="1" stop-color="{CREAM}"/></linearGradient></defs>
<rect width="1600" height="1000" fill="url(#{uid}sky)"/>
<circle cx="1210" cy="230" r="78" fill="#F1D9BE"/>
{cloud(300, 190, 1.0)}{cloud(1380, 150, .8)}
<path d="M-20 520 Q180 420 360 470 Q520 400 700 470 L1000 430 Q1200 380 1400 450 Q1520 420 1620 460 L1620 1000 L-20 1000Z" fill="{SAGE_LL}"/>
<!-- Gunung Talang: kerucut gunung api dengan kawah -->
<path d="M240 640 L560 300 Q585 272 610 290 L640 282 Q662 270 680 296 L1020 640Z" fill="{SAGE}"/>
<path d="M640 282 Q662 270 680 296 L1020 640 L760 640 L700 420Z" fill="{SAGE_D}" opacity=".55"/>
<path d="M560 300 Q585 272 610 290 L640 282 Q662 270 680 296 L700 330 L660 318 L620 336 L585 320 L548 340Z" fill="{SAGE_L}"/>
{cloud(820, 400, .75)}{cloud(430, 450, .55)}
<path d="M900 600 Q1060 470 1200 520 Q1330 470 1620 560 L1620 700 L900 700Z" fill="{SAGE_L}"/>
<path fill="{SAGE_D}" d="{hill_mid}"/>
<g fill="{SAGE_D}">{rows(hill_mid, uid + "r1", 560, 1000, 34, SAGE)}</g>
<!-- Danau Kembar: dua danau berdampingan -->
<ellipse cx="560" cy="700" rx="230" ry="44" fill="{LAKE}"/>
<ellipse cx="930" cy="690" rx="150" ry="32" fill="{LAKE}"/>
<path d="M430 696 L520 696 M600 708 L700 708 M870 688 L960 688" stroke="{LAKE_L}" stroke-width="5" stroke-linecap="round"/>
{rumah_gadang(*house)}
<g fill="{OLIVE}">{rows(hill_near, uid + "r2", 680, 1000, 30, "#5A5E39", -3)}</g>
<path d="M-20 900 Q400 800 820 880 Q1200 950 1620 860 L1620 1000 L-20 1000Z" fill="{GREEN}"/>
<!-- dahan kopi di depan -->
<g transform="translate({branch_dx} 0)">
  <path d="M-30 330 Q160 380 260 520 Q330 620 330 760" stroke="#3A2414" stroke-width="16" fill="none" stroke-linecap="round"/>
  {leaf(40, 345, -25, 210, GREEN, OLIVE)}{leaf(60, 352, 40, 190, OLIVE, SAGE_D)}
  {leaf(190, 445, -35, 200, GREEN, OLIVE)}{leaf(200, 455, 55, 180, "#24402F", OLIVE)}
  {leaf(285, 600, -20, 190, OLIVE, SAGE_D)}{leaf(290, 610, 80, 170, GREEN, OLIVE)}
  {cherries(140, 405, 6)}{cherries(255, 520, 5)}{cherries(312, 690, 6)}
  <path d="M1620 700 Q1480 760 1440 900" stroke="#3A2414" stroke-width="13" fill="none" stroke-linecap="round"/>
  {leaf(1600, 712, 200, 170, GREEN, OLIVE)}{leaf(1520, 750, 150, 160, OLIVE, SAGE_D)}
  {leaf(1470, 830, 210, 150, "#24402F", OLIVE)}{cherries(1500, 795, 5, 13)}
</g>'''


def scene_box(x, y, w, h, r=0, uid="s", vb="0 0 1600 1000", house=(1280, 620, .95), branch_dx=0):
    clip = f'<clipPath id="{uid}c"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}"/></clipPath>'
    return (f'{clip}<g clip-path="url(#{uid}c)"><svg x="{x}" y="{y}" width="{w}" height="{h}" viewBox="{vb}" '
            f'preserveAspectRatio="xMidYMid slice">{scene(uid, house, branch_dx)}</svg></g>')


def logo(kind, x, y, w):
    return f'<image href="{logo_uri(kind)}" x="{x}" y="{y}" width="{w}" height="{w * 510 / 1275}"/>'


def spec_lines():
    v = [REGION.replace(", ", ", "), "Arabica"]
    v += [s for s in (LOT["process"], LOT["altitude"], LOT["varietals"]) if s]
    return v


def icon(kind, x, y, c=GREEN):
    if kind == "wa":
        return (f'<g fill="none" stroke="{c}" stroke-width="3.5"><circle cx="{x}" cy="{y}" r="15"/>'
                f'<path d="M{x - 11} {y + 11} L{x - 16} {y + 18} L{x - 6} {y + 14}" fill="{c}"/></g>')
    if kind == "ig":
        return (f'<g fill="none" stroke="{c}" stroke-width="3.5"><rect x="{x - 15}" y="{y - 15}" width="30" height="30" rx="9"/>'
                f'<circle cx="{x}" cy="{y}" r="7"/></g><circle cx="{x + 9}" cy="{y - 9}" r="2.4" fill="{c}"/>')
    return (f'<g fill="none" stroke="{c}" stroke-width="3.5"><path d="M{x - 14} {y - 8} L{x + 14} {y - 8} L{x + 12} {y + 16} '
            f'L{x - 12} {y + 16}Z"/><path d="M{x - 7} {y - 8} Q{x - 7} {y - 20} {x} {y - 20} Q{x + 7} {y - 20} {x + 7} {y - 8}"/></g>')


def contacts(cx, y, size=26, c=GREEN):
    items = [("wa", WA), ("ig", IG), ("shop", SHOPEE)]
    gap = 330 * size / 26
    x0 = cx - gap
    out = ""
    for i, (k, t) in enumerate(items):
        x = x0 + i * gap - 90 * size / 26
        out += icon(k, x, y, c) + f'<text x="{x + 30}" y="{y + 9}" {SANS} font-size="{size}" fill="{c}">{t}</text>'
    return out


def svg_doc(w, h, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
            f'<rect width="{w}" height="{h}" fill="{CREAM}"/>{body}</svg>')


# ---------- keluaran ----------
def kartu_origin():
    """Sama dengan kartu Abmisibil/Sabin/Pondok Baru: nama besar kiri, rincian kanan, ilustrasi, kontak."""
    w, h = 1400, 1120
    specs = "".join(f'<text x="790" y="{92 + i * 38}" {SANS} font-size="27" fill="{INK}">{s}</text>'
                    for i, s in enumerate(spec_lines()))
    body = (f'<text x="70" y="190" {COND} font-size="168" fill="{RUST}" letter-spacing="2">SOLOK</text>'
            f'<rect x="74" y="222" width="92" height="7" fill="{RUST}"/>'
            f'<rect x="745" y="66" width="3" height="170" fill="{INK}"/>{specs}'
            f'{scene_box(44, 280, 1312, 700, 36, "k")}'
            f'{logo("cream", 1110, 860, 220)}'
            f'{contacts(700, 1052)}')
    return w, h, svg_doc(w, h, body)


def feed_ig():
    w, h = 1080, 1350
    tier = f"SINGLE ORIGIN · {LOT['tier'].upper()}" if LOT["tier"] else "SINGLE ORIGIN · ARABICA"
    notes = ""
    if LOT["notes"]:
        notes = (f'<text x="540" y="1182" text-anchor="middle" {SANS} font-size="26" letter-spacing="4" fill="{OLIVE}">'
                 f'{"  ·  ".join(n.upper() for n in LOT["notes"])}</text>')
    specs = " · ".join(s for s in (LOT["process"], LOT["altitude"], LOT["varietals"]) if s)
    spec_t = (f'<text x="540" y="1140" text-anchor="middle" {SANS} font-size="27" fill="{INK}">{specs}</text>'
              if specs else
              f'<text x="540" y="1140" text-anchor="middle" {SANS} font-size="27" fill="{INK}">{KAWASAN}</text>')
    body = (f'{logo("dark", 400, 40, 280)}'
            f'<text x="540" y="210" text-anchor="middle" {SANS} font-weight="bold" font-size="28" letter-spacing="8" fill="{RUST}">{tier}</text>'
            f'<text x="540" y="350" text-anchor="middle" {COND} font-size="170" letter-spacing="4" fill="{GREEN}">SOLOK</text>'
            f'<text x="540" y="412" text-anchor="middle" {SERIF} font-size="40" fill="{RUST}">Sumatera Barat</text>'
            f'<rect x="300" y="440" width="140" height="2" fill="{INK}"/><circle cx="540" cy="441" r="5" fill="{RUST}"/>'
            f'<rect x="640" y="440" width="140" height="2" fill="{INK}"/>'
            f'{scene_box(60, 476, 960, 600, 32, "f")}'
            f'{logo("cream", 820, 1000, 170)}'
            f'{spec_t}{notes}'
            f'<rect x="0" y="1230" width="{w}" height="120" fill="{GREEN}"/>'
            f'<text x="540" y="1278" text-anchor="middle" {SANS} font-size="22" letter-spacing="6" fill="{CREAM}">PILIH RASA, TEMUKAN ASALNYA, NIKMATI SETIAP MOMEN.</text>'
            f'{contacts(540, 1316, 22, CREAM)}')
    return w, h, svg_doc(w, h, body)


def produk():
    w, h = 800, 1000
    return w, h, svg_doc(w, h, scene_box(0, 0, w, h, 0, "p", "220 0 800 1000", (890, 600, .8), 230))  # ponytail: potong 4:5, rumah digeser masuk bingkai


def kemasan():
    """Usulan pouch stand-up 200 gr: badan hijau tua, label krem dengan jendela ilustrasi."""
    w, h = 1200, 1500
    px, py, pw, ph = 230, 150, 740, 1220
    notes = ""
    if LOT["notes"]:
        notes = (f'<text x="600" y="1150" text-anchor="middle" {SANS} font-size="22" letter-spacing="3" fill="{OLIVE}">'
                 f'{" · ".join(n.upper() for n in LOT["notes"])}</text>')
    specs = "".join(f'<text x="600" y="{1030 + i * 32}" text-anchor="middle" {SANS} font-size="24" fill="{INK}">{s}</text>'
                    for i, s in enumerate(s for s in (LOT["process"], LOT["altitude"], LOT["varietals"]) if s))
    tier = f"SINGLE ORIGIN · {LOT['tier'].upper()}" if LOT["tier"] else "SINGLE ORIGIN"
    tagline = (f'<text x="600" y="1090" text-anchor="middle" {SERIF} font-style="italic" font-size="26" fill="{OLIVE}">'
               f'Pilih rasa, temukan asalnya.</text>')
    body = (f'<rect width="{w}" height="{h}" fill="{CREAM2}"/>'
            f'<ellipse cx="600" cy="1395" rx="420" ry="34" fill="#D9CCB8"/>'
            # badan pouch + gusset bawah + zip
            f'<path d="M{px} {py + 40} Q{px} {py} {px + 40} {py} L{px + pw - 40} {py} Q{px + pw} {py} {px + pw} {py + 40} '
            f'L{px + pw + 20} {py + ph} L{px - 20} {py + ph}Z" fill="{GREEN}"/>'
            f'<rect x="{px}" y="{py + 70}" width="{pw}" height="6" fill="#1C3A30"/>'
            f'<circle cx="{px + pw - 70}" cy="{py + 40}" r="12" fill="{CREAM2}" opacity=".35"/>'
            # label krem
            f'<rect x="290" y="300" width="620" height="970" rx="26" fill="{CREAM}"/>'
            f'{logo("dark", 440, 322, 320)}'
            f'<text x="600" y="490" text-anchor="middle" {SANS} font-weight="bold" font-size="22" letter-spacing="6" fill="{RUST}">{tier}</text>'
            f'<text x="600" y="610" text-anchor="middle" {COND} font-size="138" letter-spacing="3" fill="{GREEN}">SOLOK</text>'
            f'<text x="600" y="660" text-anchor="middle" {SERIF} font-size="32" fill="{RUST}">Sumatera Barat</text>'
            f'{scene_box(330, 690, 540, 300, 18, "m")}'
            f'<text x="600" y="{1030 if not specs else 1000}" text-anchor="middle" {SANS} font-size="24" font-weight="bold" fill="{INK}">ARABICA</text>'
            f'{specs}{notes}'
            f'{"" if specs or notes else tagline}'
            f'<rect x="440" y="1185" width="320" height="2" fill="{INK}"/>'
            f'<text x="600" y="1235" text-anchor="middle" {SANS} font-size="26" font-weight="bold" fill="{GREEN}">200 gr · biji sangrai</text>')
    return w, h, svg_doc(w, h, body)


OUT = {"solok_feed-ig_1080x1350": feed_ig, "solok_kartu-origin_1400x1120": kartu_origin,
       "solok_produk_800x1000": produk, "solok_kemasan_1200x1500": kemasan}

if __name__ == "__main__":
    (HERE / "svg").mkdir(exist_ok=True)
    ims = []
    for name, fn in OUT.items():
        w, h, s = fn()
        ET.fromstring(s)  # SVG rusak = Chrome merender halaman error, jadi gagal di sini saja
        (HERE / "svg" / f"{name}.svg").write_text(s, encoding="utf-8")
        im = mm.render(s, HERE / f"{name}.png", w, h).convert("RGB")
        assert im.getextrema() != ((249, 249), (244, 244), (238, 238)), f"{name} kosong"
        ims.append(im)
    H = 700
    ims = [i.resize((round(i.width * H / i.height), H), Image.LANCZOS) for i in ims]
    sheet = Image.new("RGB", (sum(i.width for i in ims) + 40 * (len(ims) + 1), H + 80), (226, 222, 214))
    x = 40
    for i in ims:
        sheet.paste(i, (x, 40))
        x += i.width + 40
    sheet.save(HERE / "preview_solok.png")
    print("ok:", ", ".join(OUT))
