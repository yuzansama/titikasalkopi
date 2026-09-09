# Yang hanya bisa dikerjakan owner

Disusun 9 September 2026, dari `docs/11-timeline-rilis.md`.

Setiap item di bawah menahan sesuatu, dan tidak satu pun bisa dikerjakan
developer karena semuanya butuh akun, uang, perangkat, atau keputusan Anda.
Sisanya di seluruh timeline sudah dikerjakan atau bisa dikerjakan tanpa Anda.

Urutannya bukan urutan kepentingan, melainkan urutan **berapa banyak yang
terbuka begitu ia selesai**. Kerjakan dari atas.

---

## 1. Deploy ulang Apps Script dan isi dua tab sheet · ~1 jam

**Menahan:** sinkronisasi katalog (gagal setiap malam jam 01.00 WIB sekarang),
pengujian lacak pesanan ujung ke ujung, dan latihan Anda mengubah harga
sendiri. Tiga item Sprint 2 menunggu ini.

Endpoint yang hidup sekarang menjawab `{"found":false}` untuk permintaan
katalog, artinya versi Apps Script yang ter-deploy dibuat **sebelum** fitur
katalog ada. Selama itu, situs tetap tayang dengan harga yang ter-commit di
repositori — tidak ada bahaya, tapi Anda belum benar-benar memegang kendali
harga yang dijanjikan `docs/09-kelola-katalog.md`.

1. Buka spreadsheet buku order → **Extensions → Apps Script**.
2. Hapus seluruh isinya, tempel ulang `ops/order-tracker.gs` dari repositori.
3. Jalankan fungsi `selfCheck` sekali, pastikan tidak ada galat.
4. **Deploy → Manage deployments → (ikon pensil) → Version: New version →
   Deploy.** Ini langkah yang paling sering terlewat. Membuat *deployment*
   baru akan mengubah URL-nya dan justru merusak `/lacak`; yang dibutuhkan
   adalah *versi* baru pada deployment yang sudah ada.
5. Buat **dua** tab, nama persis huruf kecil: `harga` dan `stok`. Isinya
   lengkap ada di `docs/09-kelola-katalog.md` bagian 2 — 24 baris harga dan
   11 baris stok.

> **Berubah 9 September 2026: dulu tiga tab, sekarang dua.** Tab ketiga
> `katalog100` melayani lini "Katalog Kopi 100 gram" dari poster cetak Anda.
> Lini itu **sudah dihapus dari situs**: seluruh produk kini berasal dari satu
> sumber, lembar `Product` pada `assets/brand/Kopi from heart.xlsx`, dan
> kopi-kopi poster tidak ada di sana. Alasan lengkapnya di
> `docs/00b-ceo-decisions.md` keputusan D-09.
>
> **Kalau Anda terlanjur membuat tab `katalog100`, biarkan saja.** Sistem tidak
> membacanya lagi, sinkronisasi tetap hijau, dan tidak ada yang perlu dihapus.
>
> Yang **tetap dijual** adalah kemasan **mini 100 gr** pada single origin —
> Signature Rp85.000, Reguler Rp70.000 — dan harganya Anda atur dari tab
> `harga`, bukan dari tab yang dihapus itu.

**Cara tahu berhasil:** buka Actions → "Sync katalog dari Google Sheet" → Run
workflow. Ia harus hijau dan melaporkan jumlah baris yang terbaca.

---

## 2. Beli `titikasalkopi.id` dan arahkan DNS · ~1 hari termasuk propagasi

**Menahan:** verifikasi Search Console, pengujian kartu pratinjau tautan
WhatsApp dan Instagram, Rich Results Test, dan seluruh pengukuran SEO.

Seluruh URL kanonis, sitemap, dan Open Graph sekarang menunjuk
`yuzansama.github.io/titikasalkopi`. Itu berfungsi, tetapi setiap tautan yang
dibagikan sebelum domain pindah akan menunjuk alamat lama, dan memindahkan
domain setelah situs terindeks berarti membuang start SEO-nya.

Setelah DNS mengarah, developer mengubah dua baris di
`.github/workflows/pages.yml`: `NEXT_PUBLIC_SITE_ORIGIN` menjadi
`https://titikasalkopi.id` dan `BASE_PATH` dikosongkan. Kodenya sudah
memparameterkan keduanya; tidak ada perubahan lain yang diperlukan.

---

## 3. Putuskan host: GitHub Pages atau Vercel · keputusan, bukan pekerjaan

**Menahan:** apakah situs ini punya security header sama sekali.

`next.config.ts` sudah menuliskan CSP, `X-Frame-Options`, dan
`Permissions-Policy`. Pada ekspor statis ke GitHub Pages, Next membuang
seluruhnya — Pages tidak melayani header kustom. Jadi header-header itu ada di
kode dan **tidak aktif di produksi**, sementara halaman `/lacak` menyuntikkan
konten dari luar ke DOM.

- **Tetap di Pages:** gratis, sudah jalan, tidak ada yang perlu diubah. Risiko
  header diterima. Kalau ini pilihannya, saya minta satu kalimat tertulis dari
  Anda agar tercatat sebagai keputusan, bukan kelalaian.
- **Pindah ke Vercel:** header langsung aktif tanpa satu baris kode pun
  berubah, plus rollback instan. Perlu akun dan konfigurasi ulang deploy.

Dokumen `docs/08-lacak-pesanan.md` bagian 7 menandai ini sebagai keputusan yang
"jangan digantung".

---

## 4. Buat properti GA4 dan serahkan ID-nya · ~10 menit

**Menahan:** enam dari sepuluh KPI proyek ini.

Kodenya sudah lengkap dan menunggu satu nilai. Tanpa `NEXT_PUBLIC_GA_ID`,
modul analitik tidak memuat apa pun dan setiap peristiwa hilang.

Yang paling penting: **data yang tidak dikumpulkan hari pertama tidak bisa
dikejar mundur.** Kalau ini baru dipasang sebulan setelah buka, bulan pertama
— justru yang paling ingin Anda pelajari — tidak akan pernah ada datanya.

1. analytics.google.com → buat properti untuk `titikasalkopi.id`.
2. Salin Measurement ID berbentuk `G-XXXXXXXXXX`, kirim ke developer.
3. Setelah situs tayang: tandai peristiwa `click_whatsapp_order` sebagai
   **konversi** di antarmuka GA4. Ini tidak bisa dilakukan dari kode.

---

## 5. Verifikasi akun Instagram · ~5 menit

**Menahan:** tidak ada. Tapi ini yang paling murah dan paling memalukan kalau
salah.

`instagram.com/titikasalkopi` sudah tertaut dari **setiap halaman** situs,
diambil dari brand brief dan tidak pernah dikonfirmasi ke Anda. Kalau akun itu
bukan milik Anda, seluruh trafik sosial situs ini mengalir ke akun orang lain.

Buka tautannya. Kalau itu akun Anda, beri tahu saja. Kalau bukan, kirim nama
akun yang benar — atau minta tautannya dicabut sampai ada.

---

## 6. Verifikasi Google Search Console · ~30 menit, setelah domain

Perlu dilakukan di bawah origin final, bukan `github.io`. Google memberi token
verifikasi; developer memasangnya lewat `GOOGLE_SITE_VERIFICATION`. Setelah
terverifikasi, submit `sitemap.xml`.

---

## 7. Kebijakan pengiriman dan komplain · ~1 hari

**Menahan:** ini celah kewajiban terbesar yang tersisa, lebih serius daripada
foto atau catatan rasa.

Situs ini menerima pembayaran di muka lewat transfer. Toko seperti itu tanpa
jalur komplain tertulis adalah eksposur konsumen yang nyata, dan tidak ada satu
baris pun di situs yang menyatakan apa yang terjadi bila barang rusak di jalan
atau tidak sampai.

Minimal yang perlu Anda putuskan, dan tidak bisa saya tebak:

- Kurir apa yang dipakai, dan area mana yang dilayani.
- Berapa lama pesanan diproses sebelum dikirim.
- Apa yang terjadi bila paket rusak, hilang, atau salah kirim — diganti,
  dikembalikan uangnya, atau dikirim ulang.
- Sampai kapan pembeli boleh komplain setelah barang diterima.
- Ongkir Jawa di luar Jabodetabek. Sekarang sengaja dikosongkan, dan ada
  penjaga di CI yang menggagalkan build kalau ada yang mengarang angkanya.

---

## 8. Identitas usaha di footer · ~30 menit

Nama entitas dan satu alamat yang bisa dihubungi. Sekarang tidak ada sama
sekali di situs. Saya tidak bisa mengarangnya.

---

## 9. Foto enam produk · ~1 hari

Oelbiteno, Pyramid, Palimping, Kerinci, Full Robusta, Sindoro. Rasio 4:5,
800×1000, di bawah 120 KB. Sisanya sudah punya gambar.

Placeholder bergaya brand sudah tayang dan tidak merusak apa pun (R-13), jadi
ini tidak memblokir rilis. Tapi separuh katalog tanpa foto pada toko yang
memposisikan diri premium adalah keputusan yang sebaiknya Anda ambil sadar,
bukan yang terjadi karena waktu habis.

---

## 10. Data yang belum ada · ~30 menit

- **Sindoro:** proses, ketinggian, varietas. Halaman produknya yang paling
  kosong di situs. Provinsinya sudah Anda konfirmasi.
- **Palimping:** satu kalimat konfirmasi bahwa provinsinya Jawa Barat. Nilai
  itu diturunkan dari fakta administratif Garut, bukan dari brand brief, dan
  ia ikut tayang di judul halaman (DEF-11).

---

## 11. Pengujian yang butuh perangkat sungguhan

Tidak bisa digantikan bukti aritmetika, dan rencana uji menyatakannya
eksplisit.

- **Kirim pesanan WhatsApp sungguhan** dari Android, iOS, dan WhatsApp Web ke
  nomor tujuan sungguhan, lalu baca apa yang sampai. Ini mitigasi R-04 dan item
  bernilai tertinggi di Sprint 2.
- **Konfirmasi nomor tujuan** `6287777939567` memang benar.
- **Buka situs di Android kelas menengah dan Safari iOS.**

Untuk pengujian yang cuma butuh peramban — konfigurator, keranjang,
keyboard-only, axe, Lighthouse, lebar layar — sudah tidak perlu menunggu
apa pun. Jalankan dari folder `web/`:

```
npm run build:preview
npm run preview
```

lalu buka `http://localhost:4173/titikasalkopi/`.

---

## 12. Monitor uptime · ~15 menit

Layanan gratis mana pun yang mengirim notifikasi ke Anda saat situs mati
(NFR-08). Sekarang tidak dimiliki siapa pun dan tidak ada di mana pun. Perlu
akun, jadi tidak bisa dipasang dari sisi kami.

---

## Yang tidak memblokir rilis

Tier 2, aturan promo "beli 2 disc 10%", dan akun TikTok. Tidak ada permukaan di
situs yang bergantung padanya.

Satu peringatan tentang promo: jangan mengiklankannya di mana pun sampai
aturannya jelas. Tiga pembacaan yang sama wajarnya menghasilkan tiga subtotal
berbeda untuk keranjang yang sama, dan ia bertabrakan dengan harga paket 3 pack
yang sudah ada. Kalau promo diiklankan di Instagram sementara situs tidak bisa
memenuhinya, situs yang jadi salah.
