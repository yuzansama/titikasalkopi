# Bisnis plan — "Kopi from heart"

Sumber: `assets/brand/Kopi from heart.xlsx`, diterima 9 September 2026. Tiga
lembar: `bisnis Plan`, `Product`, dan `Timeline`.

Dokumen ini menyalin isi lembar `bisnis Plan` apa adanya dan mencatat apa yang
sudah masuk ke katalog dan apa yang belum. Harga dari lembar `Product` tidak
diulang di sini — ia sudah menjadi tabel resmi di `docs/00-brand-brief.md` dan
angka yang tayang dibaca dari sheet owner lewat `managed.generated.ts` (KD-08).

---

## 1. Target segmen

- Premium
- Pecinta kopi
- Fokus ke kualitas

Belum ada yang perlu diubah di situs: posisi premium sudah tercermin dari
palet, tipografi, dan penolakan diskon-diskonan di halaman katalog.

## 2. Struktur produk

| Tier | Peran | Status di katalog |
|---|---|---|
| Tier 1 | Utama / highlight | **Tayang.** Delapan single origin dan tiga lini houseblend. |
| Tier 2 | Volume | **Belum ada.** Lembar `Product` hanya menuliskan keterangan "product dengan quality dibawah Fuad dikit" tanpa satu pun nama biji, harga, atau modal. |

Tier 2 sengaja tidak dibuatkan apa pun di kode. Kolomnya kosong, dan menebak
isinya berarti mengarang produk pada toko yang dibayar di muka lewat transfer.
Begitu owner mengisi nama dan harganya, ia masuk lewat jalur yang sama dengan
Tier 1.

## 3. Harga per ukuran kemasan

Lembar `bisnis Plan` menetapkan kerangka ukuran:

| Ukuran | Catatan lembar | Status |
|---|---|---|
| 100 gr | ">70rb" | **Tayang.** Signature Rp85.000, Reguler Rp70.000 — keduanya di atas Rp70.000. |
| 200 gr / 250 gr | — | **Tayang pada 200 gr.** Lembar `Product` memakai 200 gr; 250 gr tidak muncul di sana dan tidak dibuatkan. |
| 500 gr | — | **Tayang sebagai kemasan houseblend 0,5 kg.** Single origin tidak punya ukuran ini di lembar `Product`. |
| 1 kg | — | **Tayang sebagai harga per kg houseblend.** |

## 4. Kemasan

- Warna — belum ditentukan di lembar.
- Tempat packaging — belum ditentukan di lembar.

Kedua baris kosong. Palet yang dipakai situs tetap dari
`docs/00-brand-brief.md`.

## 5. Kanal penjualan

| Kanal | Catatan lembar | Status |
|---|---|---|
| Instagram | — | Belum tertaut dari situs. |
| TikTok | "grab customers" | Belum tertaut dari situs. |
| Website | — | **Berjalan.** Ini repositorinya. |
| Komunitas | — | Di luar lingkup situs. |
| Event kecil | — | Di luar lingkup situs. |

Situs belum memuat tautan Instagram maupun TikTok karena owner belum memberikan
nama akunnya. Menautkan akun yang salah lebih buruk daripada tidak menautkan.

## 6. Kampanye pemasaran

| Program | Catatan lembar | Status |
|---|---|---|
| Paid Ads | — | Di luar lingkup situs. |
| Meta Ads | — | Di luar lingkup situs. |
| Promo Discount | "Beli 2 disc 10%", "Limited promo" | **Belum diterapkan.** |

Promo "beli 2 diskon 10%" belum masuk ke keranjang, dan itu keputusan yang
disengaja. Situs sudah punya satu mekanisme paket — bundel 3 pack single origin
dengan harga paket (BR-10) — dan aturan diskon kedua yang berlaku lintas
produk akan bertumpuk dengannya. Pertanyaan yang belum owner jawab: apakah
"beli 2" berarti dua item apa pun di keranjang, dua kemasan produk yang sama,
atau dua paket; dan apakah ia boleh digabung dengan harga bundel. Jawaban yang
berbeda menghasilkan subtotal yang berbeda pada keranjang yang sama.

## 7. Timeline

Lembar `Timeline` **kosong**, tidak satu sel pun terisi — tidak ada tanggal,
milestone, maupun urutan peluncuran yang bisa disalin.

Isinya disusun dari sisi kami dan ada di **`docs/11-timeline-rilis.md`**:
empat sprint sampai buka pesanan pada 5 Oktober 2026, dengan gerbang rilis dan
pembagian jelas antara pekerjaan developer dan keputusan yang hanya bisa
diambil owner.

---

## Yang masih menunggu owner

1. **Isi Tier 2.** Nama biji, modal, harga jual.
2. **Aturan promo "beli 2 disc 10%".** Lihat Bagian 6.
3. **Akun Instagram dan TikTok.**
4. **Proses, ketinggian, dan varietas Sindoro.** Provinsinya sudah; sisanya
   belum, dan tetap `null` sampai owner menyerahkannya.

## Yang sudah diputuskan owner

- **Harga 3 pack single origin**, 9 September 2026. Lembar `Product` tidak
  menyebutnya, dan owner memilih menaikkan harga paket lama secara proporsional
  terhadap kenaikan 1 pack: Signature Rp392.000, Reguler Rp352.000. Kedalaman
  diskonnya tidak berubah.
- **Provinsi Sindoro adalah Jawa Tengah**, 9 September 2026. Ditanyakan karena
  lembar `Product` tidak menyebut asal sama sekali dan `province` wajib terisi
  untuk judul metadata SEO.
- **Houseblend dijual dalam dua ukuran kemasan, 1 kg dan 0,5 kg**,
  9 September 2026. Lembar `Product` memang menuliskannya begitu ("Main Packs
  (1kg)" dan "Mini Packs (500gr)"); implementasi awal keliru memperlakukan
  kolom 1kg sebagai tarif tampilan, sehingga situs mengiklankan harga per kg
  yang tidak bisa dibeli siapa pun. Perbaikannya item 0.1 pada
  `docs/11-timeline-rilis.md`.
- **Lembar `Timeline` kosong diisi dari sisi kami**, 9 September 2026. Hasilnya
  ada di `docs/11-timeline-rilis.md`.
