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

> **Direvisi 9 September 2026** oleh lembar `Product` pada
> `assets/brand/Kopi from heart.xlsx`. Seluruh harga di bawah adalah kolom
> "Jual" pada lembar itu. Dua hal berubah bentuknya, bukan sekadar angkanya:
>
> 1. **Houseblend punya dua harga tersimpan**, per kg dan per 0,5 kg. Kemasan
>    0,5 kg BUKAN setengah harga kilogram — ia membawa marginnya sendiri.
>    Ini merevisi D-02; lihat `docs/03-architecture.md`.
> 2. **Single origin punya kemasan mini 100 gr**, harganya per tier seperti
>    kemasan 200 gr.
>
> Angka yang tayang tetap dibaca dari Google Sheet owner lewat
> `web/src/data/managed.generated.ts` (KD-08); tabel di sini adalah rujukan
> manusia, bukan sumber build.

> **Diperbarui 9 September 2026 — katalog di bawah ini LENGKAP.** Sejak KD-09,
> seluruh produk situs berasal dari lembar `Product` saja: **11 produk**,
> **41 varian jual**. Lini **"Katalog Kopi 100 gram"** dari poster cetak owner
> (KD-07) — Bali Kintamani, Gayo, Panama, Kenya, Luwak, dan seterusnya — sudah
> **dihapus seluruhnya** dan tidak boleh dituliskan kembali di sini.
>
> Yang tetap ada adalah **kemasan mini 100 gr** pada single origin, yang
> berharga per tier dan ada di tabel Single Origin di bawah. Keduanya sama-sama
> 100 gram dan karena itu wajib dibedakan setiap kali disebut.
>
> Kolom **"Tier 2"** pada lembar itu masih berisi catatan tanpa satu pun nama
> biji dan tanpa harga, jadi tidak ada apa pun yang tayang atas namanya.

### Houseblend — BOLD (Arabica Natural & Fine Robusta Natural; notes: choco, almond, caramel)
| Rasio | Harga / kg | Harga / 0,5 kg |
|---|---|---|
| 70% Arabica : 30% Robusta | Rp215.000 | Rp120.000 |
| 60% Arabica : 40% Robusta | Rp205.000 | Rp115.000 |
| 50% Arabica : 50% Robusta | Rp200.000 | Rp110.000 |
| 40% Arabica : 60% Robusta | Rp195.000 | Rp105.000 |
| 30% Arabica : 70% Robusta | Rp190.000 | Rp100.000 |
| 20% Arabica : 80% Robusta | Rp185.000 | Rp95.000 |

### Houseblend — BRIGHT (Full Arabica, natural & washed; notes: raisin, orange, lemon zest)
| Varian | Harga / kg | Harga / 0,5 kg |
|---|---|---|
| Signature | Rp280.000 | Rp150.000 |
| Reguler | Rp240.000 | Rp130.000 |

### Houseblend — Full Robusta
Rp180.000 / kg — Rp100.000 / 0,5 kg

### Single Origin
| Tier | 100 gr | 1 Pack (200 gr) | 3 Pack |
|---|---|---|---|
| Signature (Kupang / Papua) | Rp85.000 | Rp140.000 | Rp392.000 |
| Reguler (Sumatera / Jawa) | Rp70.000 | Rp125.000 | Rp352.000 |

Harga 3 pack tidak disebut lembar `Product`. Owner memutuskan pada 9 September
2026 untuk menaikkan harga paket lama secara proporsional terhadap kenaikan
1 pack, sehingga kedalaman diskonnya tidak berubah: Rp350.000 x 140/125 =
Rp392.000, dan Rp310.000 x 125/110 dibulatkan ke kelipatan seribu terdekat =
Rp352.000. Penghematan paket menjadi Rp28.000 (Signature) dan Rp23.000
(Reguler), keduanya tetap positif seperti disyaratkan BR-10.

Sindoro tidak punya kemasan 100 gr: lembar `Product` mendaftarkannya hanya di
kolom 200 gr. Kolomnya ditulis per biji di `products.ts`, bukan diturunkan dari
tier, supaya situs tidak menerima pesanan kemasan yang tidak ada.

### Single Origin — Signature (Indonesia Timur)
- **Oelbiteno** — Desa Oelbiteno, Kupang NTT
- **Abmisibil** — Pegunungan Bintang, Papua — Natural Anaerob Process — 1900 MASL — Arabica Bourbon & Typica
- **Sabin** — Pegunungan Bintang, Papua — Washed Process by Elias Kaladana — 1900 MASL — Arabica Typica
- **Pyramid** — Perabaga, Jayawijaya, Papua

### Single Origin — Reguler (Pilihan Nusantara)
- **Palimping** — Desa Palimping, Garut
- **Kerinci** — Pegunungan Kerinci, Jambi
- **Pondok Baru** — Bener Meriah, Aceh — Natural Classic Process by BBMC — 1400 MASL — Arabica Bourbon, Ateng Super
- **Sindoro** — Gunung Sindoro, Jawa Tengah. Ditambahkan 9 September 2026 dari
  lembar `Product`; provinsinya dikonfirmasi owner pada tanggal yang sama.
  Proses, ketinggian, dan varietas belum diketahui dan tetap `null`.

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
