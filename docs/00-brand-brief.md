# Titik Asal Kopi — Shared Brand & Project Brief

Semua agent WAJIB baca file ini sebelum bekerja. Sumber kebenaran untuk brand, produk, harga.

## Bisnis
- Nama: Titik Asal Kopi
- Domain: titikasalkopi.id
- Tagline: "Pilih rasa, temukan asalnya, nikmati setiap momen."
- Positioning: kopi single origin & houseblend dari titik terbaik di Indonesia (fokus Indonesia Timur + Nusantara).
- Kontak: WhatsApp 087777939567 | Instagram @Titikasalkopi | Shopee: Titikasalkopi
- Bahasa utama situs: Bahasa Indonesia.

## Palet warna (hasil sampling dari aset marketing di assets/brand/)
| Peran | Hex |
|---|---|
| Base / background | `#F9F4EE` |
| Surface / card | `#FDF8F2` |
| Primary dark (forest green) | `#0E251F` |
| Deep green alt | `#063026` |
| Olive (secondary) | `#474A2D` |
| Rust / terracotta (accent) | `#A34215` |
| Clay brown | `#954E24` |
| Coffee brown | `#7F4321` |
| Gold (accent only) | `#AC6D04` |
| Espresso (dark text-brown) | `#2C1100` |

Aturan pakai: cream selalu jadi base halaman; hijau = primary/authority; keluarga cokelat-rust = produk & kehangatan; gold hanya aksen. Teks di atas cream = `#0E251F`. Teks di atas fill cokelat/hijau = cream.

Tipografi (dari aset): heading sans-serif tebal condensed + serif display untuk nama kategori; body sans-serif reguler. Boleh pakai Google Fonts.

## Katalog produk (harga resmi)

### Houseblend — BOLD (Arabica Natural & Fine Robusta Natural; notes: choco, almond, caramel)
| Rasio | Harga |
|---|---|
| 70% Arabica : 30% Robusta | Rp210.000 / kg |
| 60% Arabica : 40% Robusta | Rp200.000 / kg |
| 50% Arabica : 50% Robusta | Rp195.000 / kg |
| 40% Arabica : 60% Robusta | Rp190.000 / kg |
| 30% Arabica : 70% Robusta | Rp185.000 / kg |
| 20% Arabica : 80% Robusta | Rp175.000 / kg |

### Houseblend — BRIGHT (Full Arabica, natural & washed; notes: raisin, orange, lemon zest)
| Varian | Harga |
|---|---|
| Signature | Rp260.000 / kg |
| Reguler | Rp230.000 / kg |

### Houseblend — Full Robusta
Rp175.000 / kg

### Single Origin (kemasan 200 gr)
| Tier | 1 Pack | 3 Pack |
|---|---|---|
| Signature (Kupang / Papua) | Rp125.000 | Rp350.000 |
| Reguler (Sumatera / Jawa) | Rp110.000 | Rp310.000 |

### Single Origin — Signature (Indonesia Timur)
- **Oelbiteno** — Desa Oelbiteno, Kupang NTT
- **Abmisibil** — Pegunungan Bintang, Papua — Natural Anaerob Process — 1900 MASL — Arabica Bourbon & Typica
- **Sabin** — Pegunungan Bintang, Papua — Washed Process by Elias Kaladana — 1900 MASL — Arabica Typica
- **Pyramid** — Perabaga, Jayawijaya, Papua

### Single Origin — Reguler (Pilihan Nusantara)
- **Palimping** — Desa Palimping, Garut
- **Kerinci** — Pegunungan Kerinci, Jambi
- **Pondok Baru** — Bener Meriah, Aceh — Natural Classic Process by BBMC — 1400 MASL — Arabica Bourbon, Ateng Super

## Keputusan CEO (tidak untuk diperdebatkan ulang)
1. Stack: Next.js (App Router) + TypeScript + Tailwind CSS. Deploy Vercel.
2. Checkout MVP: keranjang di sisi klien, lalu kirim order via WhatsApp deeplink (wa.me) + link Shopee sebagai alternatif. TIDAK ada payment gateway di fase 1.
3. Data produk: satu sumber di repo (TypeScript/JSON), dibaca FE dan BE. Tidak perlu CMS eksternal di fase 1.
4. Prioritas: mobile-first, cepat, SEO lokal (kopi Papua, kopi Kupang, kopi Gayo, biji kopi roasted).
5. Ruang lingkup fase 1 selesai dalam artefak dokumen + kode kerangka yang bisa dijalankan. Jangan bikin fitur spekulatif (loyalty point, multi-currency, subscription) kecuali diminta.

## Konvensi dokumen
Semua deliverable ditulis ke folder `docs/` dengan penomoran:
- `01-business-requirements-input.md` — Bisnis User
- `02-BRD.md` — Business Analyst
- `03-architecture.md` — Arsitek
- `04-frontend.md` + kode di `web/` — FE Developer
- `05-backend.md` + kode di `web/` — BE Developer
- `06-qa-test-plan.md` — QA
