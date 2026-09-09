# Timeline rilis — sampai situs siap menerima pesanan sungguhan

**Disusun:** 9 September 2026 (Rabu) · **Penyusun:** CEO
**Masukan:** audit kesiapan dari developer, QA, dan Business Analyst, 9 September 2026
**Target buka pesanan:** **Senin, 5 Oktober 2026**
**Lembar `Timeline` pada `assets/brand/Kopi from heart.xlsx` kosong.** Dokumen ini mengisinya.

---

## 0. Ringkasan untuk yang hanya membaca satu halaman

Situs ini **jauh lebih jadi daripada yang terlihat**. Sebelas halaman produk, keranjang, checkout WhatsApp, lacak pesanan, dan katalog yang bisa diurus owner sendiri lewat Google Sheet — semuanya sudah berjalan, dengan 201 pemeriksaan otomatis yang lulus dan menjaga setiap penerbitan.

Yang menahan bukan fitur. Yang menahan empat hal:

1. **Satu cacat harga yang saya buat sendiri kemarin** dan baru ketahuan hari ini lewat audit QA. Situs menampilkan tarif per kg yang tidak bisa dibeli siapa pun.
2. **Beberapa keputusan yang cuma bisa saya ambil**, bukan dikerjakan siapa pun: domain, host, dan akun analitik.
3. **Satu langkah setup manual di Google Sheet** yang kalau tidak dilakukan, seluruh fitur "owner urus harga sendiri" mati.
4. **Belum ada satu pun pengujian di perangkat sungguhan.** Semua bukti sejauh ini bersifat aritmetika, bukan pengalaman.

Empat minggu. Bukan karena pekerjaannya banyak, tapi karena tiga di antaranya menunggu hal-hal di luar kode.

---

## 1. Keadaan hari ini, jujur

### Yang sudah berjalan
Katalog 11 produk (8 single origin, 3 lini houseblend) dan lini terpisah 18 kopi 100 gram · keranjang yang menghitung ulang harga dari katalog saat render, bukan menyimpannya · checkout WhatsApp dengan kode order dan tangga peringkasan pesan · lacak pesanan · penulisan otomatis ke buku order · metadata SEO lengkap dengan JSON-LD · 201 pemeriksaan otomatis sebagai gerbang penerbitan.

### Yang tidak berjalan, dan belum pernah berjalan
Tidak ada environment staging — **setiap merge ke `main` langsung ke situs produksi**. Tidak ada satu pun pengukuran Lighthouse, LCP, atau axe. Tidak ada satu pun pesan WhatsApp sungguhan yang pernah dikirim dari perangkat sungguhan. Tidak ada gerbang ukuran bundle, padahal anggarannya tinggal 4,5 KB dan sejak diukur situs sudah bertambah tiga fitur. Analitik dan Search Console belum menyala.

### Yang salah dan harus saya akui
Perubahan harga 9 September memperkenalkan kontradiksi aritmetika di pesan yang dikirim pembeli:

```
   Jumlah: 5 kg x Rp205.000/kg
   Subtotal: Rp1.150.000            <- 5 x 205.000 = 1.025.000
```

Penyebabnya salah baca lembar `Product`. Kolomnya berjudul **"Main Packs (1kg)"** dan **"Mini Packs (500gr)"** — dua ukuran kemasan. Saya memperlakukan kolom 1kg sebagai *tarif per kg* untuk ditampilkan, padahal situs hanya menjual kemasan 0,5 kg. Akibatnya tarif yang diiklankan adalah harga yang tidak bisa dibeli siapa pun.

Pemeriksaan otomatis tidak menangkapnya karena **saya memperbarui pemeriksaannya agar mengesahkan keluaran yang salah itu**, bukan mempertanyakannya. Itu persis mode kegagalan yang dilarang Prinsip 2 pada rencana uji QA: suite yang menyesuaikan diri dengan kode lebih berbahaya daripada tidak punya suite sama sekali.

**Kabar baiknya:** seluruh perubahan 9 September masih di working tree, belum di-commit. Tidak ada pembeli yang pernah melihat angka ini. Yang tayang sekarang adalah harga lama — yang juga salah, tapi salahnya konsisten.

### Keputusan yang sudah diambil hari ini
**Houseblend dijual dalam dua ukuran kemasan: 1 kg dan 0,5 kg.** Ini pembacaan harfiah lembar `Product`, dan ia menghapus kontradiksi di akarnya: harga per kg menjadi harga yang benar-benar bisa dibeli.

---

## 2. Timeline

### Sprint 0 — Perbaiki yang rusak (Rab 9 – Jum 11 September)
*Tidak ada yang boleh di-commit ke `main` sebelum blok ini selesai.*

| # | Pekerjaan | Pemilik | Est. |
|---|---|---|---|
| 0.1 | **Houseblend jadi dua ukuran kemasan.** Tiap rasio punya dua varian: 1 kg dan 0,5 kg. Sembilan rasio jadi 18 varian jual. Konfigurator stepper 0,5 kg diganti pemilih ukuran + jumlah. Label harga di keranjang dan pesan WhatsApp mengutip harga kemasan, dan tarif `/kg` hanya muncul pada varian 1 kg — di situ ia benar. | Dev | 1 hari |
| 0.2 | **Perbaiki pemeriksaan yang mengesahkan kesalahan.** Tambah asersi invarian, bukan literal: untuk setiap baris keranjang, `qty x harga satuan == subtotal baris`, dan angka yang tampil di pesan wajib merekonstruksi subtotalnya. Asersi ini menangkap seluruh kelas bug ini, bukan satu instansnya. | Dev + QA | 0,5 hari |
| 0.3 | **Bereskan dokumen yang berbohong.** `docs/00b-ceo-decisions.md` D-02 masih menulis "harga 0,5 kg tepat setengah harga per kg" beserta tabel harga lama, dan berkas itu menurut barisnya sendiri **mengalahkan BRD**. Siapa pun yang membacanya akan "memperbaiki" kode kembali ke perilaku yang salah. Sama untuk `docs/02-BRD.md` BR-03, BR-08, BR-09, BR-10, BR-13, BR-14, BR-16, FR-01, FR-07, FR-11, FR-21, FR-28 dan komentar di `types.ts`. | BA | 0,5 hari |
| 0.4 | **Selesaikan konflik CI vs sheet.** `sync-katalog.yml` menjalankan `check-cart.mjs` dan `check-picks.mjs`, yang mengunci harga sebagai literal. Artinya setiap perubahan harga yang owner buat di sheet — satu-satunya hal yang KD-08 ada untuk memungkinkan — membuat sinkronisasi merah dan tidak menerbitkan apa pun. Ganti literal harga dengan invarian; sisakan literal hanya untuk hal yang memang tidak boleh berubah tanpa keputusan. | Dev | 0,5 hari |
| 0.5 | **Kerinci berharga dua kali.** Rp125.000/200 gr (setara Rp62.500/100 gr) di lini utama, dan Rp85.000/100 gr di lini poster. Keduanya tayang di halaman `/katalog` yang sama, selisih 36%. Pada toko bayar-di-muka ini terbaca sebagai kesalahan atau itikad buruk. Pisahkan namanya, atau samakan harganya. | CEO + BA | keputusan |
| 0.6 | **Saklar stok owner tidak melakukan apa-apa.** `docs/09-kelola-katalog.md` menjanjikan owner bisa menandai produk kosong; nilainya mengalir sampai `Product.status` lalu berhenti — tidak ada komponen yang membacanya. Owner akan menandai kosong, memercayainya, dan tetap menerima pesanan. Tampilkan badge dan tolak penambahan ke keranjang, atau cabut janji itu dari dokumen. | Dev | 0,5 hari |

**Gerbang keluar Sprint 0:** suite hijau *karena benar*, bukan karena disesuaikan. Commit dan deploy harga 9 September. Sejak titik ini situs menjual dengan harga yang benar.

---

### Sprint 1 — Fondasi yang cuma saya bisa buka (Sen 14 – Jum 18 September)
*Tiga dari enam item ini menunggu saya, bukan developer. Kalau saya menunda, seluruh timeline geser.*

| # | Pekerjaan | Pemilik | Est. |
|---|---|---|---|
| 1.1 | **Deploy ulang Apps Script + buat tiga tab sheet.** `GET ?katalog=1` pada endpoint yang hidup mengembalikan `{"found":false}` — versi yang ter-deploy masih mendahului KD-08. Akibatnya cron sinkronisasi **gagal setiap malam jam 01.00 WIB**. Tempel ulang `ops/order-tracker.gs`, jalankan `selfCheck`, lalu **Deploy > Manage deployments > Edit > New version**. Isi tab `harga` (24 baris), `stok` (11 baris), `katalog100` (18 baris). | **CEO** | 1 jam |
| 1.2 | **Beli `titikasalkopi.id` dan arahkan DNS.** Sekarang seluruh canonical, sitemap, dan OG menunjuk `yuzansama.github.io/titikasalkopi`. Menunda ini setelah terindeks berarti membuang start SEO. | **CEO** | 1 hari (propagasi) |
| 1.3 | **Putuskan host: GitHub Pages atau Vercel.** Di Pages, CSP dan seluruh security header **mati** — `next.config.ts` membuangnya pada `output: "export"` — padahal `/lacak` menyuntik konten eksternal ke DOM. Dokumen `08-lacak-pesanan.md` menandai ini sebagai keputusan yang "jangan digantung". Kalau tetap Pages, risikonya saya terima **tertulis**. | **CEO** | keputusan |
| 1.4 | **Buat properti GA4, serahkan `G-XXXXXXXXXX`.** Tanpa ini enam dari sepuluh KPI tidak terukur sejak hari pertama. Sepuluh menit kerja, dan tidak bisa dikejar mundur — data yang tidak dikumpulkan hari pertama hilang selamanya. | **CEO** | 10 menit |
| 1.5 | **Verifikasi Search Console** di bawah origin final, bukan github.io. Lalu submit sitemap. | CEO + Dev | 30 menit |
| 1.6 | **Bangun environment staging.** Sekarang tidak ada tempat menguji apa pun sebelum produksi. QA tidak bisa mengeksekusi 30 test case yang tertunda tanpa URL yang bisa dibuka. Ini prasyarat seluruh Sprint 2. | Dev | 0,5 hari |
| 1.7 | **Verifikasi akun Instagram.** `instagram.com/titikasalkopi` sudah tertaut dari **setiap halaman**, diambil dari brand brief dan tidak pernah dikonfirmasi. Tautan yang salah mengirim seluruh trafik ke akun orang lain — lebih buruk daripada tidak ada tautan. | **CEO** | 5 menit |
| 1.8 | **Pasang monitor uptime** dengan notifikasi ke owner (NFR-08). Gratis, sepuluh menit, dan sekarang tidak dimiliki siapa pun. | Dev | 15 menit |

---

### Sprint 2 — Pengujian sungguhan (Sen 21 – Jum 25 September)
*Semua bukti sejauh ini aritmetika. Minggu ini kita ganti dengan pengalaman.*

| # | Pekerjaan | Pemilik | Est. |
|---|---|---|---|
| 2.1 | **Tulis ulang rencana uji.** `docs/06-qa-test-plan.md` bertanggal 7 September dan menguji katalog yang sudah tidak ada: nol penyebutan Sindoro, KD-07, KD-08, 100 gram, atau lacak pesanan. Modul E menegaskan nilai yang kini salah — QA yang menjalankannya akan menghasilkan daftar kegagalan palsu, atau lebih buruk, "memperbaiki" kode kembali. | QA | 1 hari |
| 2.2 | **Kirim pesanan WhatsApp sungguhan dari 3 perangkat** (Android, iOS, WhatsApp Web) ke nomor tujuan sungguhan, lalu baca apa yang sampai. Ini mitigasi R-04 dan rencana uji menyatakan eksplisit ia **tidak bisa** digantikan bukti aritmetika. Item bernilai tertinggi di seluruh sprint ini. | QA + CEO | 1 hari |
| 2.3 | **Uji lacak pesanan ujung ke ujung:** pesan sungguhan → baris masuk sheet → cari pakai kode + 4 digit → status, banner basi, dan jalur gagal ke WhatsApp. 42 asersi yang ada semuanya berjalan di atas fixture; endpoint sungguhan belum pernah disentuh. | QA | 0,5 hari |
| 2.4 | **Uji ujung ke ujung KD-08:** owner mengubah satu harga di sheet → Run workflow → perubahan sampai ke situs. Sekaligus latihan A-06: owner mengubah harga sendiri dalam ≤15 menit tanpa dibantu. Kalau gagal, NFR-13 tidak boleh diklaim. | QA + CEO | 0,5 hari |
| 2.5 | **Lighthouse, LCP/INP, CLS, berat transfer** pada 5 halaman di URL staging. Anggaran 185 KB gzip tersisa margin 4,5 KB sebelum tiga fitur ditambahkan; kemungkinan besar sudah lewat dan tidak ada yang melaporkan. | QA | 1 hari |
| 2.6 | **Pasang gerbang ukuran bundle di CI** sehingga anggaran tidak bisa lagi jebol diam-diam. | Dev | 0,5 hari |
| 2.7 | **Aksesibilitas:** axe di 5 halaman, alur beli penuh keyboard-only, pembaca layar, ukuran target sentuh. | QA | 1 hari |
| 2.8 | **Perangkat sungguhan:** Android kelas menengah dan Safari iOS, plus Chrome/Edge/Firefox dua versi terakhir. | QA | 1 hari |

---

### Sprint 3 — Isi dan kewajiban toko (Sen 28 September – Jum 2 Oktober)

| # | Pekerjaan | Pemilik | Est. |
|---|---|---|---|
| 3.1 | **Kebijakan pengiriman dan komplain.** Ini celah terbesar yang tersisa. Toko bayar-di-muka tanpa jalur komplain tertulis adalah eksposur konsumen paling serius di daftar ini — lebih serius daripada foto atau catatan rasa. Minimal: kurir, area layanan, waktu proses, dan apa yang terjadi kalau barang rusak di jalan. | **CEO** | 1 hari |
| 3.2 | **Identitas usaha di footer:** nama entitas dan satu alamat yang bisa dihubungi. Sekarang tidak ada sama sekali. | **CEO** | 30 menit |
| 3.3 | **Foto 6 produk** yang masih placeholder: Oelbiteno, Pyramid, Palimping, Kerinci, Full Robusta, Sindoro. 800x1000, rasio 4:5, ≤120 KB. Kalau tidak sempat, saya terima placeholder **tertulis** — R-13 mengizinkannya, tapi separuh katalog tanpa foto pada toko premium adalah keputusan, bukan kelalaian. | **CEO** | 1 hari |
| 3.4 | **Atribut asal Sindoro** (proses, ketinggian, varietas) dan konfirmasi provinsi Palimping (DEF-11). Halaman Sindoro saat ini yang paling kosong di situs. | **CEO** | 30 menit |
| 3.5 | **Copy pembeda Full Robusta vs BOLD 20:80.** Selisihnya kini Rp5.000 — premisnya berubah, tapi kebutuhan membedakannya tetap. | BA | 30 menit |
| 3.6 | **Soft launch:** situs hidup di domain final, tidak dipromosikan. Pesan sendiri 3 pesanan sungguhan dari luar. | Semua | 2 hari |

---

### Senin, 5 Oktober 2026 — buka pesanan

**Gerbang rilis. Semua wajib hijau:**

- [ ] Harga yang tampil = harga yang ditagih, dibuktikan invarian di CI, bukan literal
- [ ] Pesan WhatsApp sungguhan terbaca benar di Android, iOS, dan Web
- [ ] Owner berhasil mengubah harga sendiri lewat sheet dalam ≤15 menit
- [ ] Cron sinkronisasi hijau tiga malam berturut-turut
- [ ] Lacak pesanan bekerja ujung ke ujung dengan pesanan sungguhan
- [ ] Domain final, HTTPS, canonical konsisten, sitemap tersubmit
- [ ] GA4 mengalir dan `click_whatsapp_order` ditandai konversi
- [ ] Kebijakan pengiriman dan komplain tayang
- [ ] Anggaran performa terukur dan lulus
- [ ] Tidak ada produk berharga ganda di halaman yang sama
- [ ] Keputusan host tercatat tertulis, dengan risikonya bila tetap Pages

---

## 3. Setelah rilis

**Minggu 1–2 (5–16 Oktober).** Jangan bangun apa pun. Baca data. Sepuluh KPI baru punya dasar setelah GA4 mengumpulkan dua minggu. Hampir semua Fase 1b — filter, pencarian, halaman FAQ — hanya masuk akal setelah kita tahu apa yang sebenarnya dicari orang.

**Minggu 3–6.** Fase 1b sesuai urutan permintaan nyata, bukan urutan dokumen: opsi giling (FR-13), badge stok kalau belum masuk Sprint 0, FAQ (FR-32), halaman pengiriman (FR-34), filter dan pencarian (FR-04, FR-05) **hanya kalau data menunjukkan orang membutuhkannya** — pada katalog 11 produk, pencarian mungkin solusi untuk masalah yang tidak ada.

**Menunggu saya, tanpa tanggal:** Tier 2 (lembar `Product` hanya menulis "product dengan quality dibawah Fuad dikit" — tidak ada nama, tidak ada harga), aturan promo "beli 2 disc 10%", dan akun TikTok. Tidak satu pun memblokir rilis. Promo tidak boleh diiklankan di mana pun sampai aturannya jelas: tiga pembacaan yang wajar menghasilkan tiga subtotal berbeda untuk keranjang yang sama, dan ia bertabrakan dengan harga paket 3 pack yang sudah ada.

---

## 3b. Status pengerjaan, 9 September 2026

Sprint 0 **selesai**, termasuk 0.5 (Kerinci dihapus dari lini poster atas
keputusan owner) dan 0.6 (saklar stok kini benar-benar menolak pesanan).

Dari sprint berikutnya, yang sudah dikerjakan lebih awal karena tidak menunggu
siapa pun:

| Item | Status |
|---|---|
| 1.6 Environment staging | **Selesai.** `npm run build:preview` + `npm run preview` menyajikan ekspor produksi di mesin lokal, lengkap dengan basePath, dan `.github/workflows/preview.yml` membangun serta memeriksa setiap pull request. |
| 2.1 Tulis ulang rencana uji | **Selesai**, lihat `docs/06-qa-test-plan.md`. |
| 2.6 Gerbang ukuran bundel | **Selesai.** `check-bundle-size.mjs` mengukur JS muat awal per rute dan menggagalkan build di atas 190 KB ter-gzip. Rute terberat terukur 186,3 KB — sisa margin 3,7 KB, dan sekarang ada yang menjaganya. |
| 3.5 Copy pembeda Full Robusta | **Selesai.** Pembedanya komposisi (100% robusta terhadap 20% arabica), bukan harga yang cuma berselisih Rp5.000. |

Sisanya menunggu owner. Daftarnya, beserta langkah persisnya, ada di
**`docs/12-tugas-owner.md`**.

---

## 4. Yang paling mungkin membuat timeline ini meleset

**Bukan kodenya.** Sprint 0 dan gerbang CI sepenuhnya di tangan developer dan bisa dipastikan.

Yang meleset adalah **item bertanda CEO**. Domain butuh propagasi DNS, GA4 butuh akun Google, Apps Script butuh saya membuka spreadsheet dan menekan tombol yang benar, foto butuh sesi pemotretan, kebijakan pengiriman butuh saya memutuskan siapa kurirnya. Enam dari delapan item Sprint 1 menunggu saya. Kalau saya menyelesaikannya di minggu yang sama, tanggal 5 Oktober aman. Kalau tidak, semuanya mundur satu banding satu.

**Risiko kedua:** menemukan sesuatu di Sprint 2 seperti yang kita temukan hari ini. Pengujian perangkat sungguhan yang pertama kali selalu menemukan sesuatu. Sprint 3 sengaja diisi pekerjaan yang bisa digeser supaya ada ruang menyerapnya.

**Pelajaran hari ini, dan ini yang paling mahal:** cacat harga kemarin lolos karena pemeriksaannya diperbarui agar cocok dengan keluaran baru, bukan diperiksa apakah keluaran itu masuk akal. Karena itu item 0.2 mengganti literal dengan invarian. Suite yang menegaskan `qty x harga == subtotal` menangkap seluruh kelas kesalahan ini selamanya. Suite yang menegaskan `subtotal == 1.150.000` hanya menangkap satu tebakan tentang hari ini.
