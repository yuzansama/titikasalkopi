# 06 — Rencana dan Laporan Pengujian QA
## Titik Asal Kopi — Website titikasalkopi.id (Fase 1a)

---

## 0. Kendali Dokumen

| Atribut | Isi |
|---|---|
| Judul dokumen | Rencana Uji dan Laporan Eksekusi QA — Website titikasalkopi.id Fase 1a |
| Versi | 1.0 |
| Tanggal | 7 September 2026 |
| Penulis | QA Engineer |
| Dokumen sumber | `docs/00-brand-brief.md`, `docs/00b-ceo-decisions.md` (KD-01, KD-02, KD-03), `docs/02-BRD.md` v1.1, `docs/03-architecture.md`, `docs/04-frontend.md`, `docs/05-backend.md` |
| Objek uji | Kode pada `web/`, cabang `main` |
| Sifat dokumen | Rencana uji **dan** laporan eksekusi. Setiap test case memuat status nyata beserta bukti perintah yang dijalankan, bukan status yang diharapkan |
| Bahasa | Bahasa Indonesia |

### 0.1 Kedudukan dokumen ini

Dokumen ini semula disusun sebagai gerbang sebelum penerbitan ke repositori publik. Pada saat penulisannya selesai, kode **sudah terdorong** ke repositori publik `yuzansama/titikasalkopi` dan alur penerbitan otomatis ke GitHub Pages sudah terpasang. Verdikt pada Bagian 9 karena itu bukan lagi izin untuk menerbitkan, melainkan **pernyataan atas apa yang sudah tayang** — beserta penilaian tegas mengenai butir mana yang seharusnya tidak ikut terdorong dalam keadaannya saat itu.

### 0.2 Ringkasan hasil

| Ukuran | Angka |
|---|---|
| Test case tertulis | **208** (TC-001 sampai TC-208) |
| Dieksekusi pada lingkungan ini | **175** |
| Lulus | **174** — termasuk 8 yang lulus setelah defeknya ditutup dan 3 yang lulus dengan catatan |
| **Gagal dan masih terbuka** | **1** — TC-193, anggaran JavaScript NFR-03 (DEF-06) |
| Tidak dapat dieksekusi di lingkungan ini | **30** |
| Menunggu keputusan atau aset owner | **3** |
| Assertion otomatis pada `web/scripts/` | **118** (64 diwariskan, **54 ditambahkan QA**) |
| Defek tercatat | **14** — 2 Blocker, 4 Major, 7 Minor, 1 alarm palsu |

---

## 1. Strategi Pengujian

### 1.1 Prinsip yang dipakai

Pengujian ini bertolak dari satu sikap: **klaim developer diperlakukan sebagai hipotesis, bukan sebagai bukti.** Setiap butir pada daftar periksa serah terima `docs/04-frontend.md` Bagian 10 dan `docs/05-backend.md` Bagian 12 diuji ulang dari nol, termasuk yang sudah ditandai `[x]`. Empat klaim ternyata tidak bertahan; seluruhnya tercatat pada Bagian 8.

Prinsip kedua: **pemeriksaan yang menormalkan perilaku yang sedang diuji tidak sah.** `scripts/check-whatsapp.mjs` versi lama menghapus U+00A0 dari teks pesan sebelum membandingkannya, sehingga 64 assertion dapat berwarna hijau sementara BR-02 dilanggar pada setiap harga di seluruh situs. Pemeriksaan pengganti pada `scripts/check-format.mjs` menguji titik kodenya langsung dan tidak menormalkan apa pun.

Prinsip ketiga: **yang diuji adalah keluaran yang benar-benar tayang.** Enam puluh empat assertion yang diwariskan menguji modul murni — keranjang, generator pesan, jam balas — dan tidak satu pun menyentuh HTML yang dikirim ke pengunjung dan ke Google. Seluruh kriteria SEO pada BRD Bagian 12 karena itu tidak memiliki gerbang sama sekali. `scripts/check-build-output.mjs` menutup celah itu dengan 41 assertion atas berkas HTML hasil `next build`.

### 1.2 Tingkatan pengujian

| Tingkat | Objek | Cara | Otomatis |
|---|---|---|---|
| **L1 — Statis** | Tipe, lint, aturan ketergantungan | `npx next typegen`, `npx tsc --noEmit`, `npx eslint .` | Ya |
| **L2 — Unit murni** | Keranjang, generator pesan, jam balas, format | `check-cart.mjs`, `check-whatsapp.mjs`, `check-reply-hours.mjs`, `check-format.mjs` | Ya |
| **L3 — Gerbang data** | Validator katalog FR-43 | Merusak `products.ts` secara sengaja lalu menjalankan build | Sebagian |
| **L4 — Keluaran build** | HTML, sitemap, robots, JSON-LD, metadata, kelas warna | `check-build-output.mjs` | Ya |
| **L5 — Integrasi penyajian** | Kode status HTTP, header keamanan, resolusi aset di bawah basePath | `next start` dan peladen berkas statis lokal, diuji dengan `curl` | Ya |
| **L6 — Manual** | Papan ketik, pembaca layar, perangkat nyata, kiriman WhatsApp nyata | Penelusuran manual | Tidak |
| **L7 — Lapangan** | Lighthouse, axe, Core Web Vitals, indeks Google, uptime | Alat eksternal pada deployment nyata | Tidak |

L1 sampai L5 dieksekusi penuh. L6 dan L7 tidak dapat dieksekusi dan dilaporkan apa adanya pada Bagian 7.

### 1.3 Cakupan yang diuji

Seluruh 37 FR Fase 1a, seluruh NFR-01 sampai NFR-16 sejauh dapat diukur, seluruh BR-01 sampai BR-20, dan ketiga keputusan CEO KD-01, KD-02, KD-03. **Kedua target build diuji terpisah**: target Vercel (`npm run build`) dan target ekspor statis GitHub Pages (`STATIC_EXPORT=1 BASE_PATH=/titikasalkopi`). Keduanya menghasilkan HTML yang berbeda, dan hanya salah satunya yang pernah diperiksa developer — perbedaan itulah yang memunculkan defek DEF-03.

### 1.4 Yang TIDAK diuji, dan alasannya

Bagian ini sengaja ditulis lebih dulu agar tidak ada yang mengira cakupan di atas lebih luas daripada sebenarnya.

| # | Tidak diuji | Alasan |
|---|---|---|
| N-01 | **Seluruh 13 FR Fase 1b** (FR-04, FR-05, FR-06, FR-13, FR-14, FR-15, FR-30, FR-32, FR-33, FR-34, FR-39, FR-40, FR-50) | Di luar ruang lingkup rilis 1a menurut BRD Bagian 13.1. Menguji fitur yang memang belum dibangun menghasilkan daftar kegagalan palsu yang justru mengaburkan defek nyata. Satu pengecualian tetap diuji: medan `status` wajib sudah ada pada struktur data sejak 1a (TC-011) |
| N-02 | **Skor Lighthouse (NFR-04) dan Core Web Vitals (NFR-01, NFR-02)** | Menuntut Chrome berkepala, throttling jaringan Slow 4G, CPU throttling 4x, dan tiga kali jalan yang diambil mediannya. Lingkungan ini tidak memiliki peramban. Angka yang saya karang di sini akan lebih berbahaya daripada tidak ada angka sama sekali |
| N-03 | **Pemeriksaan aksesibilitas otomatis dengan axe** | Menuntut DOM hidup. Yang dapat diuji tanpa peramban adalah struktur HTML statis (heading, landmark, `alt`, `lang`) dan pemakaian pasangan warna terhadap daftar Bagian 12.1 BRD — keduanya diuji penuh. Yang tidak: jebakan fokus, urutan fokus nyata, pengumuman `aria-live` |
| N-04 | **Rendering pada perangkat fisik (NFR-05, NFR-06)** | Tidak ada perangkat Android kelas menengah maupun Safari iOS. Penggeseran horizontal dan ukuran target sentuh tidak dapat diukur tanpa mesin tata letak |
| N-05 | **Pengiriman pesan WhatsApp yang sebenarnya (NFR-15, R-04)** | Panjang setelah pengodean URL dan kebenaran struktur teks diuji habis. Yang tidak dapat diuji: apakah WhatsApp Android, iOS, dan Web benar-benar menampilkan pesan itu utuh dan rapi. Menuntut tiga perangkat nyata dan satu nomor tujuan nyata |
| N-06 | **GA4 (FR-47), Search Console (FR-48), pemantauan uptime (NFR-08)** | Menuntut properti Google atas nama brand, `NEXT_PUBLIC_GA_ID` yang belum diisi, dan domain yang sudah tayang. Yang diuji hanya bahwa kode pemanggilnya ada dan bersifat no-op tanpa env var |
| N-07 | **Keterindeksan nyata di Google (NFR-10) dan pratinjau tautan di WhatsApp/Instagram/Facebook (FR-46)** | Menuntut domain publik yang sudah tayang dan waktu tunggu berhari-hari. Yang diuji adalah kelengkapan tag Open Graph dan Twitter Card pada HTML |
| N-08 | **Sesi latihan owner mengubah harga (NFR-13, G-10)** | Menuntut kehadiran owner dan stopwatch. Yang diuji adalah gerbang teknis yang menopangnya: validator build menolak data rusak (TC-008 sampai TC-010) |
| N-09 | **HTTPS pada domain sebenarnya (NFR-09)** | Domain belum diarahkan. Yang diuji: header keamanan termasuk HSTS benar-benar terkirim peladen produksi (TC-182) |
| N-10 | **Ketepatan isi cerita brand dan salinan teks pemasaran** | Bukan wewenang QA. Yang diuji adalah larangan yang dapat diperiksa mesin: tidak ada klaim sertifikasi, tidak ada janji balas selain KD-03, tidak ada alias origin yang belum dikonfirmasi owner |
| N-11 | **Uji beban dan uji penetrasi** | Situs sepenuhnya statis tanpa endpoint, basis data, maupun input yang dipersistensikan ke server (ADR-03, ADR-07, O-19). Permukaan serangnya mendekati nol dan tidak sebanding dengan biaya pengujiannya pada Fase 1 |

### 1.5 Kriteria masuk dan keluar

**Kriteria masuk:** kode dapat dikompilasi, dapat di-lint, dan dapat di-build pada kedua target tanpa galat.

**Kriteria keluar:** seluruh test case berprioritas Kritis dan Tinggi berstatus LULUS; tidak ada defek Blocker yang terbuka; setiap defek Major yang tersisa sudah disetujui CEO secara tertulis sebagai risiko yang diterima; dan setiap butir yang tidak dapat dieksekusi sudah dipindahkan ke daftar tugas prarilis dengan pemilik yang jelas.

---

## 2. Lingkungan dan Bukti Eksekusi

### 2.1 Lingkungan

| Komponen | Nilai |
|---|---|
| Sistem operasi | Windows 11 — PowerShell dan Git Bash |
| Node.js | v24.13.0 |
| Next.js | 16.3.4 (Turbopack) |
| React | 19.2.8 |
| Peramban | **Tidak tersedia** — ini batas terbesar laporan ini |
| Perangkat seluler | **Tidak tersedia** |

**Catatan lingkungan yang wajib dibaca sebelum mengulang pengujian ini.** Git Bash pada mesin ini mengubah argumen dan nilai variabel lingkungan yang berbentuk path POSIX menjadi path Windows. Nilai `BASE_PATH=/titikasalkopi` karena itu berubah menjadi `C:/Program Files/Git/titikasalkopi` bila build ekspor statis dijalankan dari Git Bash — tanpa satu pun pesan galat. Seluruh build ekspor statis pada laporan ini dijalankan dari **PowerShell** (`$env:BASE_PATH="/titikasalkopi"`). Siapa pun yang mengulang pengujian ini wajib melakukan hal yang sama.

### 2.2 Perintah yang dijalankan dan keluarannya

Seluruh angka di bawah adalah keluaran nyata dari pohon kerja bersih — `.next/`, `out/`, `next-env.d.ts`, dan `tsconfig.tsbuildinfo` dihapus lebih dulu.

```
$ npx next typegen                 -> exit 0
$ npx tsc --noEmit                 -> exit 0
$ npx eslint .                     -> exit 0
$ npm run build                    -> exit 0, 21 halaman statis
$ node scripts/check-all.mjs       -> exit 0

    Keranjang:        31 lulus, 0 gagal
    WhatsApp:         21 lulus, 0 gagal
    Jam balas:        12 lulus, 0 gagal
    Format:           13 lulus, 0 gagal   (baru — QA)
    HTML hasil build: 41 lulus, 0 gagal   (baru — QA)
    TOTAL:           118 lulus, 0 gagal
```

Ekspor statis, dijalankan dari PowerShell:

```
PS> $env:STATIC_EXPORT="1"; $env:BASE_PATH="/titikasalkopi"; npx next build
    -> exit 0, 21 halaman, 150 berkas di web/out/
PS> node scripts/check-build-output.mjs out
    -> 41 lulus, 0 gagal
```

**Temuan urutan build.** Pada pohon yang benar-benar bersih, `npx tsc --noEmit` **gagal sendirian** dengan lima galat `TS2304: Cannot find name 'PageProps'` dan `'LayoutProps'`. Tipe global itu dihasilkan `npx next typegen` ke dalam `.next/types`. Urutan `typegen -> tsc` karena itu bukan preferensi melainkan syarat, dan sudah benar tertulis pada `.github/workflows/pages.yml`. Diuji sebagai TC-177.

---

## 3. Test Case

Kolom **Prioritas** memakai empat tingkat: **Kritis** (kegagalannya memblokir rilis tanpa perdebatan), **Tinggi** (memblokir rilis kecuali CEO menerima risikonya secara tertulis), **Sedang** (diperbaiki sebelum Fase 1b), **Rendah** (dicatat, diperbaiki bila sempat).

Kolom **Status** memakai lima nilai: **LULUS**; **LULUS (setelah perbaikan)** untuk yang gagal pada eksekusi pertama lalu lulus setelah defeknya ditutup — nomor defeknya disebut; **TIDAK DAPAT DIEKSEKUSI** untuk yang menuntut alat di luar lingkungan ini; **MENUNGGU OWNER** untuk yang tertahan keputusan atau aset bisnis; dan **LULUS DENGAN CATATAN** bila lulus tetapi memunculkan temuan.

### 3.1 Modul A — Data katalog, harga, dan gerbang validasi build

| ID | Prasyarat | Langkah | Data uji | Hasil yang diharapkan | Telusur | Prioritas | Status |
|---|---|---|---|---|---|---|---|
| **TC-001** | Katalog tersusun | Muat `src/data/catalog.ts`, hitung jumlah produk dan jumlah varian | Katalog Fase 1a | Tepat **10 produk** dan **23 varian jual** | BRD 12, FR-01 | Kritis | LULUS |
| **TC-002** | Build selesai | Bandingkan setiap harga per kg houseblend pada `/houseblend` dengan brand brief | Rp210.000, Rp200.000, Rp195.000, Rp190.000, Rp185.000, Rp175.000, Rp260.000, Rp230.000 | Kedelapan angka tayang persis | BR-01, NFR-12 | Kritis | LULUS |
| **TC-003** | Build selesai | Bandingkan harga single origin pada halaman Signature dan Reguler | Abmisibil Rp125.000 / Rp350.000; Kerinci Rp110.000 / Rp310.000 | Keempat harga tayang persis | BR-09, NFR-12 | Kritis | LULUS |
| **TC-004** | Build selesai | Sisir SELURUH berkas HTML kedua target dengan regex `Rp` diikuti spasi, NBSP, `&nbsp;`, `&#160;`, atau `%C2%A0` | 18 berkas HTML | **Nol** kemunculan | BR-02 | Kritis | LULUS (setelah perbaikan, DEF-04) |
| **TC-005** | — | Panggil `formatIDR()` dan periksa titik kode ke-3 hasilnya | 0; 500; 87.500; 97.500; 110.000; 125.000; 210.000; 1.350.000 | Titik kode ke-3 selalu digit 48–57, bukan 160 | BR-02 | Kritis | LULUS (setelah perbaikan, DEF-04) |
| **TC-006** | — | Panggil `formatIDR()` untuk harga 0,5 kg berkelipatan Rp2.500 | 97.500; 92.500; 87.500 | `Rp97.500`, `Rp92.500`, `Rp87.500` tanpa pembulatan | BR-03, KD-02 | Kritis | LULUS |
| **TC-007** | — | Periksa `formatPricePerKg()` | 200.000; 175.000 | `Rp200.000/kg`, tanpa spasi di mana pun | BR-02 | Tinggi | LULUS |
| **TC-008** | Cadangan `products.ts` disalin | Ubah slug `kerinci` menjadi `abmisibil` sehingga terjadi slug ganda, lalu `npm run build` | Slug duplikat | Build **gagal**: `[V-01] abmisibil: slug ganda di dalam katalog` | FR-43, NFR-12 | Kritis | LULUS |
| **TC-009** | Sama | Ubah `pricePerKg` BOLD 50:50 menjadi 195.001, lalu build | 195.001 | Build gagal: `[V-04] unitPrice = 97500.5` dan `[V-05] pricePerKg tidak habis dibagi 1.000` | FR-43, BR-03, KD-02 | Kritis | LULUS |
| **TC-010** | Sama | Pastikan build berhenti, bukan menayangkan data rusak | Kedua kerusakan sekaligus | Kode keluar build = 1; tidak ada halaman dihasilkan | FR-43, R-14 | Kritis | LULUS |
| **TC-011** | — | Periksa medan `status` ada pada tipe `Product` sejak Fase 1a | Tipe katalog | Medan `status` ada, bernilai `available` untuk kesepuluh produk | FR-14 (persiapan 1b) | Sedang | LULUS |
| **TC-012** | Cadangan dipulihkan | `diff` `products.ts` terhadap cadangan | — | Identik; tidak ada sisa kerusakan uji | Higiene uji | Kritis | LULUS |
| **TC-013** | — | Periksa tidak ada harga yang ditulis langsung pada komponen tampilan | `src/components`, `src/features` | Seluruh harga berasal dari `@/data/catalog` | FR-41, NFR-12 | Tinggi | LULUS |
| **TC-014** | — | Periksa berkas `"use client"` tidak mengimpor nilai dari `@/data/*` | Seluruh berkas klien | Nol pelanggaran | ADR-02, NFR-03 | Sedang | LULUS |
| **TC-015** | — | Bandingkan `province` Palimping terhadap brand brief | Brand brief menulis "Desa Palimping, Garut" | Provinsi tidak dikarang | FR-07, BR-01 | Sedang | LULUS DENGAN CATATAN (DEF-11) |

### 3.2 Modul B — Katalog dan navigasi

| ID | Prasyarat | Langkah | Data uji | Hasil yang diharapkan | Telusur | Prioritas | Status |
|---|---|---|---|---|---|---|---|
| **TC-016** | Build selesai | Periksa `/katalog` memuat kesepuluh nama produk | Nama dari katalog | Kesepuluh nama tayang di satu halaman | FR-01 | Kritis | LULUS |
| **TC-017** | Build selesai | Periksa kartu produk memuat nama, kategori, tier bila berlaku, dan harga awal | Kartu Abmisibil dan BOLD | Keempat unsur tayang tanpa perlu membuka detail | FR-02 | Tinggi | LULUS |
| **TC-018** | Build selesai | Periksa katalog terbagi dua bagian berjudul beserta tautan lompat | `/katalog` | Bagian Single Origin dan Houseblend beserta navigasi lompat | FR-03 | Tinggi | LULUS |
| **TC-019** | Build selesai | Periksa katalog dapat dicapai satu ketukan dari beranda | Header dan CTA beranda | Tautan `/katalog` ada di header setiap halaman | FR-01, NFR-14 | Tinggi | LULUS |
| **TC-020** | `next start` berjalan | Ambil kelima belas rute publik, catat kode status HTTP | Target Vercel | Seluruhnya **200** | FR-09 | Kritis | LULUS |
| **TC-021** | `next start` berjalan | Ambil rute yang tidak ada | `/rute-tidak-ada` | **404** dengan halaman "Halaman tidak ditemukan" bergaya brand | FR-09 | Sedang | LULUS |
| **TC-022** | Build selesai | Periksa setiap produk punya slug permanen yang dapat dibagikan | 7 produk + 3 lini | 10 URL slug unik, seluruhnya dibangun statis | FR-09, US-33 | Kritis | LULUS |

### 3.3 Modul C — Detail produk dan cerita origin

| ID | Prasyarat | Langkah | Data uji | Hasil yang diharapkan | Telusur | Prioritas | Status |
|---|---|---|---|---|---|---|---|
| **TC-023** | Build selesai | Periksa halaman Abmisibil memuat wilayah, provinsi, proses, ketinggian, varietal | Abmisibil | Kelima atribut tayang persis seperti brand brief | FR-07 | Kritis | LULUS |
| **TC-024** | Build selesai | Periksa halaman Oelbiteno, Pyramid, Palimping, Kerinci | Produk beratribut tidak lengkap | Atribut yang tidak diketahui **disembunyikan**, bukan dikarang | FR-07, BR-01 | Kritis | LULUS |
| **TC-025** | Build selesai | Periksa catatan rasa tampil sebagai label pendek | BOLD: choco, almond, caramel; BRIGHT: raisin, orange, lemon zest | Label pendek, bukan paragraf | FR-10 | Sedang | LULUS |
| **TC-026** | Build selesai | Periksa pemilih varian pada halaman produk | Abmisibil | Tepat dua varian: `abmisibil-pack1` dan `abmisibil-pack3` | FR-11 | Tinggi | LULUS |
| **TC-027** | Peramban | Pilih varian lain, amati harga yang ditampilkan | 1 pack -> 3 pack | Harga berubah seketika dari Rp125.000 menjadi Rp350.000 | FR-11 | Tinggi | TIDAK DAPAT DIEKSEKUSI |
| **TC-028** | Build selesai | Periksa setiap produk memiliki gambar berbingkai rasio tetap | 10 produk | Placeholder SVG 4:5 untuk kesepuluh produk; tidak ada gambar rusak | FR-12, NFR-02 | Tinggi | LULUS |
| **TC-029** | Build selesai | Periksa `Product.image` untuk kesepuluh produk | `products.ts` | Foto asli tersedia | FR-12 | Sedang | MENUNGGU OWNER (DEF-08) |
| **TC-030** | Build selesai | Periksa BRIGHT Signature/Reguler tidak diperlakukan sebagai tier katalog | BR-15 | "Signature" pada BRIGHT adalah nama varian, bukan tier | BR-15 | Tinggi | LULUS |
| **TC-031** | Build selesai | Periksa Full Robusta dan BOLD 20:80 dibedakan walau berharga sama | Rp175.000/kg keduanya | Deskripsi komposisi dan catatan rasa berbeda | BR-16 | Sedang | LULUS |
| **TC-032** | Build selesai | Periksa Cerita Kami tidak memuat klaim sertifikasi, penghargaan, jumlah pelanggan, atau kapasitas produksi | `/cerita-kami` | Nol klaim semacam itu | FR-31 | Tinggi | LULUS |

### 3.4 Modul D — KD-01: paket 3 pack wajib satu origin

Cakupan ini diwajibkan `docs/00b-ceo-decisions.md` bagian "Catatan untuk QA".

| ID | Prasyarat | Langkah | Data uji | Hasil yang diharapkan | Telusur | Prioritas | Status |
|---|---|---|---|---|---|---|---|
| **TC-033** | Build kedua target | Sisir SELURUH HTML mencari penanda pemilih origin campur: `origin campur`, `campur origin`, `pilih origin`, `mix origin`, `paket campur` | 18 berkas HTML | **Nol** kemunculan pada seluruh rute | KD-01, BR-11, FR-11 | Kritis | LULUS |
| **TC-034** | Build selesai | Periksa daftar varian setiap single origin | 7 produk | Tepat dua varian per produk — 1 pack dan 3 pack. Tidak ada varian ketiga yang menggabungkan origin | KD-01, BR-11 | Kritis | LULUS |
| **TC-035** | Build selesai | Periksa salinan teks halaman 3 pack | 7 halaman produk | Setiap halaman menyatakan "tiga kemasan 200 gr dari **origin yang sama**" | KD-01, BR-11 | Kritis | LULUS |
| **TC-036** | Build selesai | Periksa angka penghematan dihitung dari data, bukan ditulis manual | Signature dan Reguler | Rp25.000 dan Rp20.000, dihasilkan `3 x satuan − harga paket` | BR-10, KD-01 | Tinggi | LULUS |
| **TC-037** | — | Periksa tidak ada konversi otomatis 3 x 1 pack menjadi harga paket | Reducer keranjang | Tiga kali 1 pack tetap Rp375.000, bukan Rp350.000 | BR-12 | Tinggi | LULUS |
| **TC-038** | Build selesai | Periksa salinan teks 3 pack menonjolkan penghematan, bukan variasi origin | 7 halaman produk | Tidak ada janji variasi origin | KD-01, BR-11 | Tinggi | LULUS |

### 3.5 Modul E — KD-02: houseblend kelipatan 0,5 kg

Kesembilan varian diuji satu per satu, sesuai perintah eksplisit pada `00b-ceo-decisions.md`.

| ID | Prasyarat | Langkah | Data uji | Hasil yang diharapkan | Telusur | Prioritas | Status |
|---|---|---|---|---|---|---|---|
| **TC-039** | Katalog tersusun | Hitung `halfKgPrice(pricePerKg)` | BOLD 70:30 — Rp210.000/kg | **Rp105.000** — tepat setengah | KD-02, BR-13 | Kritis | LULUS |
| **TC-040** | Sama | Sama | BOLD 60:40 — Rp200.000/kg | **Rp100.000** | KD-02, BR-13 | Kritis | LULUS |
| **TC-041** | Sama | Sama | BOLD 50:50 — Rp195.000/kg | **Rp97.500** — tidak dibulatkan menjadi Rp98.000 | KD-02, BR-03 | Kritis | LULUS |
| **TC-042** | Sama | Sama | BOLD 40:60 — Rp190.000/kg | **Rp95.000** | KD-02, BR-13 | Kritis | LULUS |
| **TC-043** | Sama | Sama | BOLD 30:70 — Rp185.000/kg | **Rp92.500** | KD-02, BR-03 | Kritis | LULUS |
| **TC-044** | Sama | Sama | BOLD 20:80 — Rp175.000/kg | **Rp87.500** | KD-02, BR-03 | Kritis | LULUS |
| **TC-045** | Sama | Sama | BRIGHT Signature — Rp260.000/kg | **Rp130.000** | KD-02, BR-13 | Kritis | LULUS |
| **TC-046** | Sama | Sama | BRIGHT Reguler — Rp230.000/kg | **Rp115.000** | KD-02, BR-13 | Kritis | LULUS |
| **TC-047** | Sama | Sama | Full Robusta — Rp175.000/kg | **Rp87.500** | KD-02, BR-03 | Kritis | LULUS |
| **TC-048** | Katalog tersusun | Pastikan harga 0,5 kg **dihitung**, bukan disimpan sebagai data kedua | `products.ts` | Hanya `pricePerKg` tersimpan; `unitPrice` selalu turunan | KD-02, BR-13, NFR-12 | Kritis | LULUS |
| **TC-049** | Validator aktif | Pastikan validator menolak `pricePerKg` yang tidak habis dibagi 1.000 | 195.001 | Build gagal `[V-05]` — mencegah harga 0,5 kg pecahan | KD-02, BR-03, FR-43 | Kritis | LULUS |
| **TC-050** | Katalog tersusun | Hitung contoh FR-21 pertama | BOLD 60:40 sebanyak 5 kg = 10 halfKgUnits | **Rp1.000.000** | FR-21 | Kritis | LULUS |
| **TC-051** | Katalog tersusun | Hitung contoh FR-21 kedua | BOLD 50:50 sebanyak 1,5 kg = 3 halfKgUnits | **Rp292.500** | FR-21, BR-03 | Kritis | LULUS |
| **TC-052** | Katalog tersusun | Periksa seluruh subtotal baris untuk setiap varian katalog bilangan bulat | 23 varian | Nol subtotal pecahan | BR-03 | Kritis | LULUS |
| **TC-053** | — | Periksa `formatKgFromHalfUnits()` memakai koma desimal Indonesia | 1, 2, 3, 10, 199 | `0,5 kg`; `1 kg`; `1,5 kg`; `5 kg`; `99,5 kg` | FR-21, BRD 11.2 | Tinggi | LULUS |
| **TC-054** | — | Sapu nilai 1..99, pastikan tidak ada titik desimal gaya Inggris | 99 nilai | Nol kemunculan `.` | FR-21 | Tinggi | LULUS |
| **TC-055** | — | Pastikan 0,5 kg tidak dibulatkan menjadi 1 kg dan tidak dikonversi ke gram | `formatQuantity(1, "half-kg")` | Tepat `0,5 kg` | FR-21, BRD 12 | Kritis | LULUS |
| **TC-056** | Peramban | Konfigurator: nilai awal 1 kg, tombol kurang nonaktif pada 0,5 kg, kenaikan 0,5 kg | Stepper houseblend | Perilaku sesuai FR-21 | FR-21 | Tinggi | TIDAK DAPAT DIEKSEKUSI |
| **TC-057** | Build selesai | Periksa tabel rasio BOLD memuat keenam rasio beserta harga per kg | `/houseblend/bold` | Keenam baris tayang | FR-28 | Tinggi | LULUS |
| **TC-058** | Peramban lebar 360 px | Periksa tabel rasio terbaca tanpa memaksa halaman menggeser ke samping | Viewport 360 px | Area geser tabel ditandai; halaman tidak menggeser | FR-28, NFR-05 | Tinggi | TIDAK DAPAT DIEKSEKUSI |
| **TC-059** | Peramban | Tekan satu baris tabel, amati konfigurator di bawahnya | Baris 50:50 | Rasio terpilih pada konfigurator | FR-29 | Tinggi | TIDAK DAPAT DIEKSEKUSI |
| **TC-060** | Build selesai | Periksa minimum order B2B turun ke 0,5 kg mengikuti KD-02 | Salinan teks houseblend | Tidak ada penyebutan minimum 1 kg di mana pun | BR-17, KD-02 | Sedang | LULUS |

### 3.6 Modul F — Keranjang: persistensi, data rusak, dan resolusi harga

| ID | Prasyarat | Langkah | Data uji | Hasil yang diharapkan | Telusur | Prioritas | Status |
|---|---|---|---|---|---|---|---|
| **TC-061** | Reducer dimuat | Tambahkan varian yang sama dua kali | `abmisibil-pack1` dua kali | Jumlah pada baris yang ada bertambah; **bukan** baris baru | FR-16 | Kritis | LULUS |
| **TC-062** | Reducer dimuat | Tambahkan dua varian berbeda dari produk yang sama | `abmisibil-pack1` dan `abmisibil-pack3` | Dua baris terpisah | FR-16 | Tinggi | LULUS |
| **TC-063** | Reducer dimuat | Kirim kuantitas pecahan dan `NaN` | 1,7 dan `NaN` | Dijepit ke bilangan bulat pada rentang 1..99 | FR-18, BR-03 | Tinggi | LULUS |
| **TC-064** | Reducer dimuat | Kirim `SET_QTY` bernilai nol atau negatif | 0 dan −3 | Baris dihapus, bukan disimpan dengan jumlah nol | FR-18 | Tinggi | LULUS |
| **TC-065** | Reducer dimuat | Isi catatan melebihi batas | 250 karakter | Dipotong **tepat** pada 200 karakter | FR-23 | Tinggi | LULUS |
| **TC-066** | Reducer dimuat | Periksa bentuk kunci baris | — | `slug::variantId` | ADR-04 | Sedang | LULUS |
| **TC-067** | Storage dimuat | Baca `localStorage` kosong | — | Keranjang kosong, tanpa lemparan galat | FR-19, FR-20 | Kritis | LULUS |
| **TC-068** | Storage dimuat | **Data rusak**: baca JSON yang tidak lengkap | Potongan JSON terpotong | **Tidak melempar**; keranjang kosong | FR-20, ADR-04 | Kritis | LULUS |
| **TC-069** | Storage dimuat | **Versi skema lama**: baca payload dengan versi tidak dikenal | Versi lebih tua **dan** lebih baru | Keduanya dibuang; keranjang kosong | FR-20 | Kritis | LULUS |
| **TC-070** | Storage dimuat | **Kedaluwarsa**: baca keranjang bertanda waktu lebih dari 7 hari | Umur 8 hari | Dikosongkan otomatis | FR-20 | Kritis | LULUS |
| **TC-071** | Storage dimuat | Baca payload berisi campuran item sah dan item salah bentuk | Satu sah, satu tanpa `variantId` | Item salah dibuang; item sah dipertahankan | FR-20, ADR-04 | Tinggi | LULUS |
| **TC-072** | Storage dimuat | **Slug tak dikenal**: baca payload berisi slug yang tidak ada di katalog | Slug fiktif | Dibuang tanpa melempar; pengunjung diberi tahu lewat pemberitahuan baris terbuang | FR-20, ADR-04, BRD 11.1 | Kritis | LULUS |
| **TC-073** | Storage dimuat | **Varian tak dikenal** pada produk yang ada | `abmisibil` dengan varian fiktif | Dibuang tanpa melempar | ADR-04 | Kritis | LULUS |
| **TC-074** | Selector dimuat | Periksa isi yang benar-benar dipersistensikan | Satu baris keranjang | Hanya `{slug, variantId, qty}` — **tanpa harga dan tanpa nama** | BRD 11.1, NFR-12, NFR-16 | Kritis | LULUS |
| **TC-075** | Selector dimuat | **Harga berubah saat item sudah di keranjang**: ubah satu harga pada berkas data, lalu resolusikan ulang keranjang lama | Harga BOLD 60:40 diubah | Baris menampilkan **harga baru**; subtotal dan pesan WhatsApp ikut memakai harga baru, tanpa harga tersimpan yang usang | BRD 11.1, NFR-12, CA-01 | Kritis | LULUS |
| **TC-076** | Selector dimuat | Resolusikan keranjang kosong | — | Subtotal 0 tanpa melempar | FR-19 | Sedang | LULUS |
| **TC-077** | Selector dimuat | Hitung subtotal contoh BRD | 3 pack Abmisibil + 5 kg BOLD 60:40 | **Rp1.350.000** | FR-18, BR-03 | Kritis | LULUS |
| **TC-078** | Selector dimuat | Periksa indeks katalog mencakup seluruh varian | 23 varian | Kunci valid untuk kedua puluh tiga varian | FR-41 | Tinggi | LULUS |
| **TC-079** | Peramban | Muat ulang halaman, lalu tutup dan buka kembali peramban | Keranjang berisi dua item | Isi keranjang bertahan | FR-20, US-13 | Tinggi | TIDAK DAPAT DIEKSEKUSI |
| **TC-080** | Peramban | Amati indikator jumlah item pada header | Tambah dan hapus item | Angka terbarui seketika di seluruh halaman | FR-17 | Tinggi | TIDAK DAPAT DIEKSEKUSI |
| **TC-081** | Build selesai | Periksa keadaan keranjang kosong | `/keranjang` | Pesan ramah beserta ajakan kembali ke katalog | FR-19 | Sedang | LULUS |
| **TC-082** | Build selesai | Periksa pernyataan "belum termasuk ongkos kirim" pada halaman keranjang | `/keranjang` | Kalimat tayang | BR-18, FR-26 | Tinggi | LULUS |
| **TC-083** | Build selesai | Periksa blok "Cara pesan dalam 4 langkah" | `/keranjang`, `/kontak` | Blok tayang di keduanya | FR-26 | Tinggi | LULUS |
| **TC-084** | Build selesai | Periksa tautan Shopee pada halaman produk, keranjang, dan footer | Ketiga tempat | Tautan tersedia, terbuka di tab baru, memakai `rel="noopener noreferrer"` | FR-25 | Tinggi | LULUS |
| **TC-085** | — | Periksa keranjang tidak pernah dikirim ke server | Seluruh kode | Tidak ada `fetch`, Server Action, maupun endpoint | NFR-16, O-19, ADR-07 | Kritis | LULUS |

### 3.7 Modul G — Generator pesan WhatsApp

| ID | Prasyarat | Langkah | Data uji | Hasil yang diharapkan | Telusur | Prioritas | Status |
|---|---|---|---|---|---|---|---|
| **TC-086** | Modul dimuat | Bangkitkan kode order | 7 September 2026, `random` = 0,5 | Cocok pola `TAK-YYMMDD-XXXX`, panjang 15 karakter | FR-24 | Kritis | LULUS |
| **TC-087** | Modul dimuat | Periksa kode order memakai tanggal **lokal** pembeli | 3 Januari 2026, `random` = 0 | `TAK-260103-AAAA` | FR-24, BRD 11.1 | Tinggi | LULUS |
| **TC-088** | Modul dimuat | Periksa alfabet kode order menghindari karakter ambigu | 31 kode berurutan | Tidak ada `0`, `O`, `1`, `I`, `L`; 31 karakter unik | FR-24 | Sedang | LULUS |
| **TC-089** | Modul dimuat | Periksa batas atas pembangkit acak | `random` = 0,999999 | Kode tetap sah | FR-24 | Sedang | LULUS |
| **TC-090** | Modul dimuat | **Pembersih catatan**: catatan berisi baris baru | Catatan dua baris | Diratakan menjadi satu baris | FR-23 | Tinggi | LULUS |
| **TC-091** | Modul dimuat | Catatan yang memalsukan penanda sistem | Catatan berisi `Kode order:` dan `Dikirim dari` | Kedua pemalsuan dibuang | FR-24, arsitektur Bagian 12.1 | Tinggi | LULUS |
| **TC-092** | Modul dimuat | Catatan berisi karakter kontrol | Byte kontrol | Dibuang | FR-23 | Sedang | LULUS |
| **TC-093** | Modul dimuat | Catatan dipotong pada batas yang diberikan | Batas 200 dan 80 | Terpotong tepat pada batas | FR-23 | Tinggi | LULUS |
| **TC-094** | Modul dimuat | Periksa pesan memuat kelima blok wajib | Keranjang dua baris | Salam, kode order, subtotal, pernyataan ongkir, penanda sumber | BRD 11.2, FR-22 | Kritis | LULUS |
| **TC-095** | Modul dimuat | Periksa penanda sumber berada di **badan** pesan, bukan sebagai parameter UTM | — | Baris `Dikirim dari titikasalkopi.id` berada di dalam teks pesan | FR-24, BRD 11.3 | Kritis | LULUS |
| **TC-096** | Modul dimuat | Periksa baris houseblend memakai harga **per kg**, bukan satuan setengah kilo | BOLD 60:40 sebanyak 5 kg | `Jumlah: 5 kg x Rp200.000/kg` | FR-21, BRD 11.2 | Kritis | LULUS |
| **TC-097** | Modul dimuat | Periksa pesanan 0,5 kg ditulis dengan koma desimal Indonesia | 1 satuan setengah kilo | `Jumlah: 0,5 kg x ...`; subtotal separuh harga per kg | FR-21, KD-02 | Kritis | LULUS |
| **TC-098** | Modul dimuat | Ukur panjang **setelah pengodean URL** untuk keranjang dua baris | Contoh BRD 11.2 | 556 karakter mentah / 790 terkode — jauh di bawah 1.500 | NFR-15 | Tinggi | LULUS |
| **TC-099** | Modul dimuat | **Batas 1.500 karakter**: isi keranjang dengan kedua puluh tiga varian | 23 baris, catatan 200 karakter | Panjang terkode <= 1.500; `truncated` bernilai benar | NFR-15 | Kritis | LULUS |
| **TC-100** | Modul dimuat | Keranjang penuh dengan kuantitas besar dan catatan panjang | 23 baris, kuantitas 9, catatan panjang | Terkode <= 1.500; kelima blok wajib **tetap ada**; blok `(+N item lainnya)` muncul | NFR-15, BRD 11.2 | Kritis | LULUS |
| **TC-101** | Modul dimuat | **Tangga peringkasan sebagai sifat**: sapu n = 1..23 dan amati bentuk baris | Seluruh varian katalog | Bentuk hanya boleh turun berurutan penuh -> ringkas -> dipotong dan tidak pernah naik kembali; panjang terkode <= 1.500 pada setiap n; seluruh item tercantum selama belum dipotong | NFR-15 | Kritis | LULUS (setelah perbaikan, DEF-01) |
| **TC-102** | Modul dimuat | Catatan kosong tidak menghasilkan blok `Catatan:` kosong | Catatan kosong | Blok dihilangkan | BRD 11.2 | Sedang | LULUS |
| **TC-103** | Modul dimuat | **Pengodean**: baris baru menjadi `%0A` dan dapat dibalik | Pesan dua baris | Pembalikan pengodean mengembalikan teks asli persis | NFR-15, FR-22 | Kritis | LULUS |
| **TC-104** | Modul dimuat | Periksa URL `wa.me` tidak memuat NBSP terkode | Keranjang 23 baris | Tidak ada `%C2%A0` pada URL | BR-02, NFR-15 | Kritis | LULUS (setelah perbaikan, DEF-04) |
| **TC-105** | Modul dimuat | Periksa nomor tujuan memakai format internasional | — | `https://wa.me/6287777939567` | BRD 11.1 langkah 4 | Kritis | LULUS |
| **TC-106** | Modul dimuat | Periksa pesan "Tanya produk ini" | Abmisibil 1 pack | Menyebut nama, kategori, varian, harga, dan penanda sumber; **tanpa** kode order | FR-38, BRD 11.2 | Tinggi | LULUS |
| **TC-107** | Modul dimuat | Periksa pesan tanya untuk houseblend | BOLD 60:40 | Menyebut `Rp200.000/kg` | FR-38, FR-21 | Tinggi | LULUS |
| **TC-108** | Modul dimuat | Periksa pesan memuat pernyataan ongkir | Keranjang berisi item | Kalimat "Belum termasuk ongkos kirim. Total akhir dikonfirmasi lewat chat." | BR-18, BRD 11.2 | Kritis | LULUS |
| **TC-109** | Modul dimuat | Periksa pesan **tidak** memuat data pribadi pembeli | Seluruh jalur pesan | Tidak ada medan nama, alamat, maupun nomor telepon pembeli | NFR-16, BRD 11.3 | Kritis | LULUS |
| **TC-110** | Tiga perangkat nyata | Kirim pesan sungguhan dan amati tampilannya | WhatsApp Android, iOS, Web | Pesan terkirim utuh dan terbaca rapi | NFR-15, R-04 | Kritis | TIDAK DAPAT DIEKSEKUSI |
| **TC-111** | Peramban | Hitung jumlah ketukan dari halaman produk sampai WhatsApp terbuka | Alur Persona A | Maksimal **3 ketukan** | NFR-14 | Tinggi | TIDAK DAPAT DIEKSEKUSI |

### 3.8 Modul H — KD-03: jam balas WhatsApp 08.00–21.00 WIB

Kedua sisi kedua batas diuji, sesuai perintah eksplisit pada `00b-ceo-decisions.md`.

| ID | Prasyarat | Langkah | Data uji | Hasil yang diharapkan | Telusur | Prioritas | Status |
|---|---|---|---|---|---|---|---|
| **TC-112** | Modul dimuat | Periksa konstanta jam | — | Mulai pukul 08, berakhir pukul 21 | KD-03, BR-19 | Kritis | LULUS |
| **TC-113** | Modul dimuat | Periksa konversi zona waktu | — | WIB = UTC+7, tanpa DST | KD-03, ADR-08 | Kritis | LULUS |
| **TC-114** | Modul dimuat | **Batas bawah, sisi luar** | 07.59.59 WIB = 00.59.59 UTC | **DI LUAR** jam balas — indikator muncul | KD-03, FR-36, BRD 12 | Kritis | LULUS |
| **TC-115** | Modul dimuat | **Batas bawah, sisi dalam** | 08.00.00 WIB = 01.00.00 UTC | **DI DALAM** jam balas — indikator hilang | KD-03, FR-36, BRD 12 | Kritis | LULUS |
| **TC-116** | Modul dimuat | Satu detik setelah batas bawah | 08.00.01 WIB | DI DALAM jam balas | KD-03 | Tinggi | LULUS |
| **TC-117** | Modul dimuat | **Batas atas, sisi dalam** | 20.59.59 WIB = 13.59.59 UTC | **DI DALAM** jam balas — indikator tidak muncul | KD-03, FR-36, BRD 12 | Kritis | LULUS |
| **TC-118** | Modul dimuat | **Batas atas, sisi luar** | 21.00.00 WIB = 14.00.00 UTC | **DI LUAR** jam balas — indikator muncul | KD-03, FR-36, BRD 12 | Kritis | LULUS |
| **TC-119** | Modul dimuat | Satu detik setelah batas atas | 21.00.01 WIB | DI LUAR jam balas | KD-03 | Tinggi | LULUS |
| **TC-120** | Modul dimuat | Hitung total jam yang berada di dalam rentang dalam satu hari | 24 jam | Tepat **13 jam** | KD-03 | Tinggi | LULUS |
| **TC-121** | Modul dimuat | Tengah malam WIB | 17.00 UTC | Di luar jam balas | KD-03 | Sedang | LULUS |
| **TC-122** | Modul dimuat | Periksa berlaku setiap hari termasuk Sabtu dan Minggu | Tujuh hari | Tidak ada pengecualian hari | KD-03 | Tinggi | LULUS |
| **TC-123** | Modul dimuat | **Pengunjung berzona waktu lain** dinilai memakai WIB, bukan waktu lokalnya | Zona selain WIB | Status dihitung dari WIB | KD-03, BR-19, BRD 12 | Kritis | LULUS |
| **TC-124** | Build kedua target | Periksa janji `08.00–21.00 WIB` tayang di setiap rute | 16 rute | Muncul pada seluruh rute lewat footer | FR-35, BR-19 | Kritis | LULUS |
| **TC-125** | Build selesai | Periksa janji tayang di halaman Kontak | `/kontak` | Tayang | FR-36, BR-19 | Kritis | LULUS |
| **TC-126** | Build selesai | Periksa janji tayang pada blok checkout keranjang | `/keranjang` | Tayang di dalam blok ringkasan pesanan | FR-26, BR-19 | Tinggi | LULUS DENGAN CATATAN (DEF-12) |
| **TC-127** | Build kedua target | Sisir seluruh HTML mencari janji balas lain: "balas 24 jam", "balas cepat", "24/7", "respon cepat" | 18 berkas HTML | **Nol** kemunculan | BR-19 | Tinggi | LULUS |
| **TC-128** | Build selesai | Periksa bunyi indikator di luar jam balas | Konstanta pesan | "Di luar jam balas — pesan tetap masuk dan dibalas mulai pukul 08.00 WIB." | FR-36, BRD 12 | Tinggi | LULUS |
| **TC-129** | Peramban | Amati indikator dihitung di klien setelah hydration, bukan saat build | Halaman statis | HTML hasil build tidak memuat status; status muncul setelah halaman aktif | KD-03, ADR-01 | Tinggi | TIDAK DAPAT DIEKSEKUSI |

### 3.9 Modul I — Aksesibilitas

Rasio kontras tidak dihitung ulang di sini. Angka pada BRD Bagian 12.1 sudah diverifikasi arsitek pada `03-architecture.md` Bagian 11, dan tugas QA adalah memeriksa **pemakaiannya**: apakah pasangan yang dipakai situs benar-benar berasal dari daftar yang disetujui, dan apakah pasangan "hanya teks besar" tidak dipakai pada teks berukuran normal.

| ID | Prasyarat | Langkah | Data uji | Hasil yang diharapkan | Telusur | Prioritas | Status |
|---|---|---|---|---|---|---|---|
| **TC-130** | Build kedua target | Sisir seluruh HTML mencari kelas `bg-gold` | 18 berkas HTML | **Nol** kemunculan. Cream di atas gold = 3,88:1 dan gagal untuk label teks normal | BRD 12.1 aturan D-1, NFR-07 | Kritis | LULUS |
| **TC-131** | Build selesai | Periksa tombol utama memakai latar rust atau coffee | Beranda, produk, keranjang | Latar rust — cream di rust = 5,74:1, lulus | BRD 12.1 A dan D-1 | Kritis | LULUS |
| **TC-132** | Build kedua target | Periksa pasangan terlarang hijau primary di atas rust (2,57:1) tidak dipakai | Seluruh atribut kelas | Tidak ada elemen yang menggabungkan `bg-rust` dengan `text-primary` | BRD 12.1 C | Kritis | LULUS |
| **TC-133** | Build kedua target | Periksa `text-primary/60` (4,20:1) tidak dipakai untuk teks | Seluruh HTML | Nol kemunculan; transparansi teks terendah adalah 70% (5,77:1) | BRD 12.1 C | Tinggi | LULUS |
| **TC-134** | Kode sumber | Periksa setiap pemakaian gold yang tersisa | `border-gold`, `text-gold` | `border-gold` hanya sebagai garis dan bingkai pil — elemen non-teks, ambang 3:1 terpenuhi. `text-gold` hanya pada angka display `text-3xl` (30 px, semibold) — memenuhi definisi teks besar BRD, ambang 3:1 terpenuhi | BRD 12.1 B, NFR-07 | Tinggi | LULUS |
| **TC-135** | Kode sumber | Periksa tidak ada `outline: none` maupun `outline-none` tanpa pengganti | Seluruh CSS dan kelas | Nol kemunculan; indikator fokus memakai garis rust penuh | BRD 12.1 D-4 | Kritis | LULUS |
| **TC-136** | Kode sumber | Periksa tidak ada nilai warna heksadesimal di luar berkas token | Seluruh komponen | Warna hanya lewat token `--brand-*` dan utility Tailwind turunannya | NFR-11 | Tinggi | LULUS |
| **TC-137** | Kode sumber | Periksa tidak ada warna baru di luar palet brand brief | Berkas token | Sepuluh warna brand, ditambah alias `--color-cream` yang menunjuk `--brand-base` — bukan warna baru | NFR-11, BRD 12.1 D-2 | Tinggi | LULUS |
| **TC-138** | Build kedua target | Hitung jumlah `<h1>` per halaman | 18 berkas HTML | **Tepat satu** `<h1>` pada setiap halaman | NFR-07 | Tinggi | LULUS |
| **TC-139** | Build kedua target | Periksa urutan tingkat heading | 18 berkas HTML | Tidak ada lompatan tingkat. Urutan nyata beranda: 1,2,3,3,3,3,2,3,3,3,2,2,2,2 | NFR-07 | Tinggi | LULUS |
| **TC-140** | Build kedua target | Periksa setiap `<img>` memiliki atribut `alt` | 18 berkas HTML | Nol gambar tanpa `alt` | NFR-07 | Kritis | LULUS |
| **TC-141** | Kode sumber | Periksa alasan `alt=""` pada placeholder | `ProductMedia` | Placeholder bersifat dekoratif dan diberi `alt=""` beserta `aria-hidden`; nama produk dibacakan heading di sebelahnya. Sesuai FR-07: tidak mengarang deskripsi foto yang belum ada | NFR-07, FR-07 | Sedang | LULUS |
| **TC-142** | Build kedua target | Periksa landmark `<main>` dan tautan lewati ke konten | 15 rute publik | Keduanya ada pada setiap rute | NFR-07 | Tinggi | LULUS |
| **TC-143** | Build kedua target | Periksa atribut `lang` | 18 berkas HTML | `lang="id"` pada setiap halaman | NFR-07 | Tinggi | LULUS |
| **TC-144** | Peramban | Selesaikan alur beli lengkap **hanya dengan papan ketik** | Katalog -> detail -> pilih varian -> tambah -> keranjang -> tombol WhatsApp | Seluruh langkah dapat dicapai; tidak ada jebakan fokus; indikator fokus selalu terlihat | NFR-07, BRD 12 | Kritis | TIDAK DAPAT DIEKSEKUSI |
| **TC-145** | Peramban + axe | Jalankan pemeriksaan aksesibilitas otomatis | Lima halaman NFR-04 | Tanpa pelanggaran serius | NFR-07, BRD 12 | Kritis | TIDAK DAPAT DIEKSEKUSI |
| **TC-146** | Pembaca layar | Periksa tombol dan formulir memiliki nama yang terbaca | NVDA atau VoiceOver | Setiap kontrol punya nama yang bermakna | NFR-07 | Tinggi | TIDAK DAPAT DIEKSEKUSI |
| **TC-147** | Peramban | Periksa pengumuman perubahan subtotal keranjang | Wilayah `aria-live` | Perubahan diumumkan pembaca layar | NFR-07 | Sedang | TIDAK DAPAT DIEKSEKUSI |
| **TC-148** | Peramban | Ukur target sentuh | Seluruh tombol dan tautan | Minimal 44 x 44 px dengan jarak antar target 8 px | NFR-05 | Tinggi | TIDAK DAPAT DIEKSEKUSI |
| **TC-149** | Peramban | Periksa tidak ada penggeseran horizontal | Lebar 320, 360, 390, 768, 1280, 1920 px | Nol penggeseran horizontal | NFR-05 | Tinggi | TIDAK DAPAT DIEKSEKUSI |

### 3.10 Modul J — SEO teknis

| ID | Prasyarat | Langkah | Data uji | Hasil yang diharapkan | Telusur | Prioritas | Status |
|---|---|---|---|---|---|---|---|
| **TC-150** | Build kedua target | Periksa kelima belas rute publik hadir sebagai berkas HTML statis | Keluaran build | Seluruhnya ada; nol rute dinamis | FR-09, ADR-01 | Kritis | LULUS |
| **TC-151** | Build kedua target | Periksa setiap rute publik memiliki `<title>` tidak kosong | 15 rute | Seluruhnya terisi | FR-44 | Kritis | LULUS |
| **TC-152** | Build kedua target | **Keunikan judul**: bandingkan judul keenam belas rute satu sama lain | 16 rute | **Tidak ada dua rute berjudul sama** | FR-44 | Kritis | LULUS |
| **TC-153** | Build kedua target | **Keunikan deskripsi**: bandingkan `meta description` antarrute | 15 rute | Seluruhnya ada, lebih dari 20 karakter, dan unik | FR-44 | Tinggi | LULUS |
| **TC-154** | Build kedua target | Periksa judul halaman produk menyebut daerah asal | 7 produk | Kupang, Papua, Papua, Papua, Garut, Kerinci, Aceh muncul pada judul masing-masing | FR-44 | Tinggi | LULUS |
| **TC-155** | Build kedua target | **Canonical**: periksa setiap rute memiliki URL kanonis absolut | 16 rute | Seluruhnya berawalan `https://titikasalkopi.id` | FR-45 | Kritis | LULUS |
| **TC-156** | Build kedua target | Periksa kanonis menunjuk rutenya sendiri, bukan rute lain | 15 rute publik | Kanonis cocok dengan path rutenya | FR-45 | Kritis | LULUS |
| **TC-157** | Build kedua target | **noindex pada /keranjang**: baca `meta robots` halaman keranjang | `/keranjang` | Memuat `noindex` — pada target Vercel nilainya `noindex, follow` | BRD 3.2, FR-45 | Kritis | LULUS |
| **TC-158** | Build kedua target | Pastikan tidak ada rute publik yang ikut ter-noindex | 15 rute publik | Nol rute publik memuat `noindex` | FR-45 | Kritis | LULUS |
| **TC-159** | Build kedua target | Periksa Open Graph dan Twitter Card | 15 rute publik | `og:title`, `og:description`, `og:url`, `og:site_name`, `og:locale`, dan `twitter:card` = `summary_large_image` pada seluruhnya | FR-46 | Tinggi | LULUS |
| **TC-160** | Build selesai | Periksa `og:image` tersedia | Seluruh rute | Gambar pratinjau tersedia | FR-46 | Tinggi | MENUNGGU OWNER (DEF-07) |
| **TC-161** | Build kedua target | **JSON-LD sah**: urai setiap blok `application/ld+json` sebagai JSON | 23 blok pada 18 berkas | Seluruhnya terurai tanpa galat | FR-49 | Kritis | LULUS |
| **TC-162** | Build kedua target | Periksa beranda memuat `Organization` | `/` | Ada, beserta `contactPoint.hoursAvailable` `opens` 08:00, `closes` 21:00, dan tujuh hari | FR-49, KD-03 | Tinggi | LULUS |
| **TC-163** | Build kedua target | Periksa kesepuluh halaman produk memuat `Product`, `Offer`, dan `BreadcrumbList` | 7 single origin + 3 lini | Ketiganya ada pada kesepuluhnya; setiap `Offer` memakai `priceCurrency` IDR dan `price` bilangan bulat | FR-49 | Kritis | LULUS |
| **TC-164** | Build kedua target | **Kejujuran satuan pada Offer houseblend**: periksa `Offer` BOLD 70:30 | Harga katalog Rp210.000/kg | Angka `price` tidak boleh terbaca sebagai harga per kilogram tanpa keterangan satuan | FR-49, BR-01, NFR-12 | Major | LULUS (setelah perbaikan, DEF-02) |
| **TC-165** | Build kedua target | Periksa `BreadcrumbList` memakai URL absolut dan posisi berurutan | 12 halaman | Posisi 1..n berurutan, `item` absolut | FR-49 | Sedang | LULUS |
| **TC-166** | Build kedua target | **Isi sitemap**: bandingkan daftar `<loc>` dengan daftar rute publik yang diharapkan | `sitemap.xml` | **Persis 15 URL**, tidak lebih dan tidak kurang | FR-45 | Kritis | LULUS |
| **TC-167** | Build kedua target | Pastikan sitemap **tidak** memuat `/keranjang` | `sitemap.xml` | Nol kemunculan | FR-45, BRD 3.2 | Kritis | LULUS |
| **TC-168** | Build non-produksi | Periksa `robots.txt` pada build pratinjau | Tanpa `VERCEL_ENV=production` | `User-Agent: * / Disallow: /` — penjaga agar pratinjau tidak terindeks dan tidak bersaing dengan domain asli | FR-45 | Tinggi | LULUS |
| **TC-169** | Build produksi | Periksa `robots.txt` pada build produksi | `VERCEL_ENV=production` | `Allow: /`, `Disallow: /keranjang`, `Host:`, dan `Sitemap:` menunjuk `https://titikasalkopi.id/sitemap.xml` | FR-45 | Kritis | LULUS |
| **TC-170** | Build kedua target | **BR-20**: sisir seluruh HTML mencari alias origin yang belum dikonfirmasi owner | Kata "Gayo" | **Nol** kemunculan selama OQ-12 masih terbuka | BR-20, FR-44, OQ-12 | Major | LULUS (setelah perbaikan, DEF-05) |
| **TC-171** | Kode sumber | Periksa alias yang ditahan diberi penjelasan, bukan dihapus diam-diam | `products.ts`, `seo.ts` | Komentar menyebut BR-20/OQ-12 dan syarat pengaktifan kembali | BR-20 | Sedang | LULUS |
| **TC-172** | Build kedua target | Periksa `searchTerms` yang dipakai tidak muncul sebagai atribut origin pada badan halaman | 10 produk | Alias hanya pada `meta keywords`, tidak pernah pada daftar atribut origin | BR-20, FR-07 | Tinggi | LULUS |
| **TC-173** | Kode sumber | Periksa `metadataBase` tersetel sehingga path relatif menjadi absolut | `layout.tsx` | Tersetel ke `https://titikasalkopi.id` | FR-45 | Sedang | LULUS |
| **TC-174** | Domain tayang | Kirim sitemap ke Google Search Console dan verifikasi domain | GSC | Domain terverifikasi, sitemap terkirim | FR-48 | Tinggi | TIDAK DAPAT DIEKSEKUSI |
| **TC-175** | Domain tayang | Tempel tautan produk di WhatsApp dan amati kartu pratinjau | Tautan produk | Kartu memuat judul, deskripsi, dan gambar yang benar | FR-46, NFR-10 | Tinggi | TIDAK DAPAT DIEKSEKUSI |
| **TC-176** | Domain tayang | Jalankan Rich Results Test atas halaman produk | 10 halaman produk | Lolos tanpa galat | FR-49, BRD 12 | Tinggi | TIDAK DAPAT DIEKSEKUSI |

### 3.11 Modul K — Build, kedua target penerbitan, dan penyajian

| ID | Prasyarat | Langkah | Data uji | Hasil yang diharapkan | Telusur | Prioritas | Status |
|---|---|---|---|---|---|---|---|
| **TC-177** | Pohon bersih | Jalankan `npx tsc --noEmit` **tanpa** `next typegen` lebih dulu | Pohon tanpa `.next/types` | Gagal dengan lima galat `TS2304 PageProps/LayoutProps`. Urutan `typegen -> tsc` adalah syarat, bukan preferensi, dan sudah benar tertulis pada alur CI | Higiene build | Tinggi | LULUS |
| **TC-178** | Pohon bersih | `npx next typegen`, lalu `npx tsc --noEmit`, lalu `npx eslint .` | — | Ketiganya keluar dengan kode 0 | ADR-02 | Kritis | LULUS |
| **TC-179** | Pohon bersih | **Target Vercel**: `npm run build` | — | Kode keluar 0; 21 halaman; seluruh rute bertanda statis atau SSG, nol rute dinamis | ADR-01 | Kritis | LULUS |
| **TC-180** | Build Vercel selesai | Periksa `generateStaticParams` menghasilkan seluruh path | — | 7 path produk dan 3 path lini houseblend | FR-09 | Tinggi | LULUS |
| **TC-181** | Build Vercel selesai | `next start`, lalu ambil setiap rute | 11 URL termasuk `sitemap.xml` dan `robots.txt` | Seluruhnya **200**; rute tidak dikenal **404** | ADR-01 | Kritis | LULUS |
| **TC-182** | `next start` berjalan, `VERCEL_ENV=production` | Periksa header respons | `/` dan `/keranjang` | `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, dan `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` terkirim | NFR-09, ADR-13 | Tinggi | LULUS |
| **TC-183** | PowerShell | **Target ekspor statis**: `STATIC_EXPORT=1 BASE_PATH=/titikasalkopi npx next build` | — | Kode keluar 0; 21 halaman; 150 berkas di `out/` | ADR-01 | Kritis | LULUS |
| **TC-184** | Ekspor selesai | Sajikan `out/` lewat peladen berkas statis di bawah prefiks `/titikasalkopi`, lalu ambil seluruh rute | 18 URL | Kelima belas rute publik dan `/keranjang` **200** dengan isi nyata; `sitemap.xml` dan `robots.txt` **200**; rute tidak dikenal **404** memakai `404.html` | ADR-01 | Kritis | LULUS |
| **TC-185** | Ekspor disajikan | Ambil seluruh aset yang dirujuk beranda | 8 chunk JS, 1 CSS, 4 woff2, favicon | Seluruhnya **200** di bawah `/titikasalkopi/_next/...` | Ekspor statis | Kritis | LULUS |
| **TC-186** | Ekspor disajikan | **Gambar produk di bawah basePath**: ambil kesepuluh placeholder SVG | `/titikasalkopi/produk/<slug>.svg` | Kesepuluhnya **200** | FR-12, BRD 12 | Kritis | LULUS (setelah perbaikan, DEF-03) |
| **TC-187** | Ekspor selesai | Sisir seluruh HTML mencari rujukan aset absolut yang **tidak** memakai basePath | 18 berkas HTML | **Nol** rujukan tanpa prefiks | FR-12, ADR-01 | Kritis | LULUS (setelah perbaikan, DEF-03) |
| **TC-188** | Ekspor selesai | Periksa `trailingSlash` menghasilkan direktori berisi `index.html` | `out/` | Setiap rute punya `index.html` sendiri sehingga peladen berkas biasa dapat menyajikannya | Ekspor statis | Tinggi | LULUS |
| **TC-189** | Ekspor selesai | Bandingkan bentuk URL kanonis terhadap isi sitemap pada target ekspor | Kanonis vs `<loc>` | Keduanya konsisten | FR-45 | Sedang | LULUS DENGAN CATATAN (DEF-10) |
| **TC-190** | Kode sumber | Periksa `basePath` berasal dari satu sumber | `next.config.ts` | `NEXT_PUBLIC_BASE_PATH` diturunkan dari `BASE_PATH` di dalam `next.config.ts`, sehingga alur CI tidak perlu menyetel dua env var yang bisa berbeda | Ekspor statis | Tinggi | LULUS |
| **TC-191** | Alur CI | Periksa `.github/workflows/pages.yml` menjalankan gerbang sebelum menerbitkan | Berkas alur | Urutan: `npm ci`, `typegen`, `tsc`, `eslint`, build ekspor, `check-all.mjs`, `touch out/.nojekyll`, unggah, terbitkan | Higiene rilis | Kritis | LULUS |
| **TC-192** | Repositori | Periksa tidak ada rahasia, berkas `.env`, atau artefak build yang ikut terdorong | Pohon repositori | Nol berkas `.env`; `.next/`, `out/`, dan `node_modules/` diabaikan pada kedua berkas `.gitignore` | NFR-16 | Kritis | LULUS |
| **TC-193** | Ekspor selesai | Ukur berat muat pertama beranda | Berkas hasil ekspor | JS awal <= 150 KB terkompresi; total <= 600 KB | NFR-03 | Tinggi | **GAGAL sebagian** (DEF-06) |

### 3.12 Modul L — Non-fungsional yang menuntut alat di luar lingkungan ini

Setiap butir di bawah **tidak diberi status lulus**. Menandainya lulus tanpa mengukurnya adalah bentuk kebohongan yang paling merugikan dalam laporan QA, karena ia menutup butir yang sebenarnya masih terbuka.

| ID | Prasyarat | Langkah | Data uji | Hasil yang diharapkan | Telusur | Prioritas | Status |
|---|---|---|---|---|---|---|---|
| **TC-194** | Chrome + Lighthouse | Jalankan Lighthouse mobile tiga kali, ambil median | Beranda, katalog, satu detail single origin, houseblend, keranjang | Performance >= 90, Accessibility >= 95, Best Practices >= 95, SEO >= 95 | NFR-04 | Kritis | TIDAK DAPAT DIEKSEKUSI |
| **TC-195** | Chrome + throttling | Ukur LCP dan INP pada profil Slow 4G dengan CPU throttling 4x | Beranda, katalog, detail produk | LCP <= 2,5 detik; INP <= 200 ms; TTFB <= 600 ms | NFR-01 | Kritis | TIDAK DAPAT DIEKSEKUSI |
| **TC-196** | Chrome | Ukur CLS dengan pemuatan gambar diperlambat | Seluruh halaman | CLS <= 0,05 | NFR-02 | Tinggi | TIDAK DAPAT DIEKSEKUSI |
| **TC-197** | Peramban | Ukur berat transfer halaman dengan cache dikosongkan | Beranda dan katalog | Total <= 600 KB terkompresi; setiap gambar produk <= 150 KB | NFR-03 | Tinggi | TIDAK DAPAT DIEKSEKUSI |
| **TC-198** | Perangkat fisik | Uji pada HP Android kelas menengah dan Safari iOS | Snapdragon 6xx, RAM 4 GB, Android 11 | Berfungsi penuh | NFR-06 | Kritis | TIDAK DAPAT DIEKSEKUSI |
| **TC-199** | Peramban desktop | Uji pada Chrome, Edge, dan Firefox dua versi terakhir | Tiga peramban | Berfungsi penuh | NFR-06 | Tinggi | TIDAK DAPAT DIEKSEKUSI |
| **TC-200** | Domain tayang | Periksa HTTPS beserta pengalihan otomatis dari HTTP dan tidak adanya konten campuran | `titikasalkopi.id` | HTTPS aktif, sertifikat sah, nol konten campuran | NFR-09 | Kritis | TIDAK DAPAT DIEKSEKUSI |
| **TC-201** | Pemantau uptime | Pasang pemantauan dan picu gangguan uji | Layanan pemantauan | Pemberitahuan sampai ke owner dalam <= 5 menit; uptime bulanan >= 99,5% | NFR-08, BA-11, CA-09 | Tinggi | TIDAK DAPAT DIEKSEKUSI |
| **TC-202** | GA4 DebugView | Picu kesembilan event FR-47 dan amati DebugView | `view_item_list`, `view_item`, `select_variant`, `add_to_cart`, `view_cart`, `click_whatsapp_order`, `click_whatsapp_ask`, `click_whatsapp_b2b`, `click_shopee` | Seluruhnya terkirim beserta parameter `product_id`, `variant`, `source_page`, `cart_value`, `order_code` | FR-47 | Kritis | TIDAK DAPAT DIEKSEKUSI |
| **TC-203** | Antarmuka GA4 | Tandai `click_whatsapp_order` sebagai konversi | GA4 | Ditandai konversi | FR-47, G-01 | Tinggi | TIDAK DAPAT DIEKSEKUSI |
| **TC-204** | Kode sumber | Periksa perilaku analitik tanpa env var | `NEXT_PUBLIC_GA_ID` kosong | Seluruh fungsi bersifat no-op dan aman saat pembangkitan statis | FR-47, NFR-16 | Tinggi | LULUS |
| **TC-205** | Kode sumber | Periksa anonimisasi dan opsi menolak analitik | Modul analitik | Tersedia penanda menolak analitik; tidak ada data identitas dikirim | NFR-16 | Tinggi | LULUS |
| **TC-206** | Owner hadir | Owner mengubah satu harga mengikuti panduan tertulis | Satu harga katalog | Selesai dalam <= 15 menit tanpa bantuan; perubahan tayang otomatis | NFR-13, G-10, FR-42 | Tinggi | TIDAK DAPAT DIEKSEKUSI |
| **TC-207** | Owner hadir | Periksa buku order sudah dibuat dengan kolom sesuai BRD 11.4 | Spreadsheet owner | Tujuh kolom tersedia dan dipahami owner | BRD 11.4, G-04 | Tinggi | MENUNGGU OWNER |
| **TC-208** | Domain tayang | Periksa keterindeksan seluruh halaman produk dalam 30 hari | GSC Coverage | 100% halaman produk terindeks | NFR-10 | Tinggi | TIDAK DAPAT DIEKSEKUSI |

---

## 4. Pemeriksaan Otomatis yang Ditambahkan QA

Kendala yang sama dengan developer diterapkan pada diri sendiri: **tanpa kerangka uji dan tanpa dependensi baru** (ADR-14). Kedua berkas di bawah adalah skrip `node` biasa yang memakai `node:assert/strict` dan pemuat TypeScript yang sudah ada.

### 4.1 `web/scripts/check-format.mjs` — 13 assertion

Menutup celah yang paling berbahaya pada suite warisan: BR-02 justru **dinormalkan** di dalam `check-whatsapp.mjs` sebelum diuji, sehingga 64 assertion dapat berwarna hijau sementara setiap harga di seluruh situs melanggar aturan. Berkas ini menguji titik kodenya langsung — karakter setelah `Rp` wajib digit 48–57 — dan menyapu seluruh titik kode Unicode yang tergolong spasi, bukan hanya U+00A0. Ia juga menguji rantai hulu ke hilir: pesan WhatsApp yang dihasilkan dari keranjang berisi kedua puluh tiga varian tidak boleh memuat `Rp` diikuti spasi, dan URL `wa.me`-nya tidak boleh memuat `%C2%A0`.

### 4.2 `web/scripts/check-build-output.mjs` — 41 assertion

Menutup celah yang paling luas: tidak satu pun dari 64 assertion warisan menyentuh HTML yang benar-benar tayang, sehingga seluruh kriteria SEO pada BRD Bagian 12 tidak memiliki gerbang. Berkas ini menerima folder build sebagai argumen dan bekerja pada **kedua target** — `.next/server/app` untuk Vercel dan `out` untuk ekspor statis. Bila belum ada folder build, ia mencetak `DILEWATI` dan keluar dengan kode 0, sehingga `check-all.mjs` tetap dapat dijalankan tanpa build lebih dulu.

Cakupannya: kelengkapan rute, keunikan judul dan deskripsi, kanonis, `noindex` pada `/keranjang` dan ketiadaannya pada rute publik, Open Graph, keabsahan setiap blok JSON-LD, kelengkapan `Product`/`Offer`/`BreadcrumbList`/`Organization`, kejujuran satuan pada `Offer` houseblend, BR-02 atas seluruh HTML, kesesuaian harga terhadap brand brief, ketiadaan pemilih origin campur, kehadiran janji jam balas beserta ketiadaan janji balas lain, struktur heading dan `alt`, pasangan warna terlarang, isi sitemap yang harus persis lima belas URL, `robots.txt` untuk kedua lingkungan, alias `Gayo` yang ditahan, dan — yang paling berbuah — **setiap rujukan aset absolut wajib memakai basePath saat ekspor statis aktif**. Assertion terakhir itulah yang menemukan DEF-03.

### 4.3 Wiring ke `check-all.mjs`

Kedua berkas didaftarkan pada `SCRIPTS` di `web/scripts/check-all.mjs`, yang sudah dipanggil alur CI. Total assertion naik dari **64 menjadi 118**.

| Berkas | Assertion | Pemilik |
|---|---|---|
| `check-cart.mjs` | 31 | FE |
| `check-whatsapp.mjs` | 21 | FE |
| `check-reply-hours.mjs` | 12 | FE |
| `check-format.mjs` | **13** | **QA** |
| `check-build-output.mjs` | **41** | **QA** |
| **Total** | **118** | |

### 4.4 Tinjauan atas penulisan ulang assertion tangga peringkasan

Assertion `tangga peringkasan` pada `check-whatsapp.mjs` semula mengunci ambang persis: lima baris masih bentuk penuh, enam baris turun ke bentuk ringkas, sepuluh baris mulai dipotong. Ambang itu **bergantung pada varian mana yang kebetulan terambil `slice()`**, sehingga menambah satu varian ke katalog akan menjatuhkannya tanpa ada yang benar-benar rusak — dan itulah yang terjadi ketika perbaikan BR-02 memangkas enam karakter terkode dari setiap kemunculan harga, menggeser batasnya dari 5/6 menjadi 6/7.

Penulisan ulang menjadi uji sifat yang menyapu n = 1..23 **saya nilai benar dan lebih kuat**, dengan satu catatan. Yang dijanjikan generator memang urutannya, bukan angkanya: bentuk hanya boleh menurun, seluruh item wajib tercantum selama belum dipotong, dan panjang terkode wajib <= 1.500 pada setiap n. Ketiganya kini diuji pada 23 titik, bukan pada tiga titik. Catatannya: uji sifat sendirian bisa lulus secara hampa seandainya seluruh anak tangga peringkasan dihapus dan setiap pesan kebetulan muat dalam bentuk penuh. Risiko itu tertutup oleh dua assertion tetangga yang memaksa keranjang penuh melewati batas dan memeriksa bahwa blok `(+N item lainnya)` muncul sementara kelima blok wajib bertahan. Kombinasi keduanya memadai; saya tidak meminta perubahan lebih lanjut.

---

## 5. Matriks Keterlacakan — Kolom Test Case untuk BRD Bagian 16.1

Kolom **Test Case** pada `docs/02-BRD.md` Bagian 16.1 sengaja dikosongkan BA untuk diisi QA. Isinya dituliskan di sini; `02-BRD.md` **tidak disunting**, sesuai pembagian kepemilikan dokumen.

| User Story | Judul | Fase | FR terkait | **Test Case** |
|---|---|---|---|---|
| US-01 | Melihat katalog lengkap | 1a | FR-01, FR-02, FR-03 | TC-001, TC-016, TC-017, TC-018, TC-019 |
| US-02 | Memfilter katalog | 1b | FR-04 (tereduksi di FR-03) | TC-018 (bentuk tereduksi). FR-04 sendiri tidak diuji — N-01 |
| US-03 | Melihat harga tanpa bertanya | 1a | FR-02, FR-11, BR-01–BR-04 | TC-002, TC-003, TC-004, TC-005, TC-006, TC-007, TC-017, TC-026 |
| US-04 | Mencari produk berdasarkan nama/daerah | 1b | FR-05 | Tidak diuji — N-01 |
| US-05 | Melihat rekomendasi produk terkait | 1b | FR-06 | Tidak diuji — N-01 |
| US-06 | Membaca detail asal-usul single origin | 1a | FR-07, FR-09 | TC-022, TC-023, TC-024, TC-172 |
| US-07 | Melihat catatan rasa | 1a | FR-10 | TC-025 |
| US-08 | Memilih varian sebelum memesan | 1a | FR-08, FR-11, BR-11 | TC-026, TC-027, TC-033, TC-034, TC-057 |
| US-09 | Memilih bentuk biji dan metode seduh | 1b (parsial 1a lewat FR-23) | FR-13, FR-23 | TC-065, TC-090, TC-093 (jalur catatan bebas). FR-13 tidak diuji — N-01 |
| US-10 | Melihat foto produk yang jelas | 1a | FR-02, FR-12 | TC-028, TC-029, TC-140, TC-141, TC-186, TC-187 |
| US-11 | Menambahkan produk ke keranjang | 1a | FR-16, FR-17 | TC-061, TC-062, TC-080 |
| US-12 | Mengubah isi keranjang | 1a | FR-18, FR-19 | TC-063, TC-064, TC-076, TC-077, TC-081 |
| US-13 | Keranjang bertahan saat halaman ditutup | 1a | FR-20 | TC-067, TC-068, TC-069, TC-070, TC-071, TC-072, TC-073, TC-079 |
| US-14 | Mengirim pesanan via WhatsApp | 1a | FR-22, FR-23, FR-24 | TC-086 sampai TC-109, TC-110 |
| US-15 | Alternatif membeli lewat Shopee | 1a | FR-25 | TC-084 |
| US-16 | Bertanya tentang satu produk tertentu | 1a | FR-38 | TC-106, TC-107 |
| US-17 | Membandingkan seluruh rasio BOLD | 1a | FR-28, FR-29 | TC-057, TC-058, TC-059 |
| US-18 | Memesan houseblend kelipatan 0,5 kg (KD-02) | 1a | FR-21, FR-29, BR-13 | TC-039 sampai TC-056, TC-096, TC-097 |
| US-19 | Meminta sampel atau konsultasi blend | 1b | FR-30 | Tidak diuji — N-01 |
| US-20 | Memahami perbedaan BOLD, BRIGHT, Full Robusta | 1a | FR-08, FR-27 | TC-025, TC-030, TC-031, TC-057 |
| US-21 | Menyatakan minat menjadi reseller | 1b | FR-39 | Tidak diuji — N-01 |
| US-22 | Meminta penawaran pesanan hadiah jumlah banyak | 1b | FR-40 | Tidak diuji — N-01 |
| US-23 | Membaca cerita brand | 1a | FR-31 | TC-032 |
| US-24 | Membaca panduan cara seduh | 1b | FR-34 | Tidak diuji — N-01 |
| US-25 | Membaca FAQ | 1b | FR-32 (penambal FR-26) | TC-083 (penambal). FR-32 tidak diuji — N-01 |
| US-26 | Membaca kebijakan pengiriman | 1b | FR-33 (penambal FR-26) | TC-082, TC-083, TC-108 (penambal). FR-33 tidak diuji — N-01 |
| US-27 | Menemukan kontak resmi dengan mudah | 1a | FR-35, FR-36, FR-37, BR-19 | TC-112 sampai TC-129 |
| US-28 | Melihat kesegaran produk | 1b | FR-15 | Tidak diuji — N-01 |
| US-29 | Mengubah harga dan produk tanpa developer | 1a | FR-41, FR-42, FR-43 | TC-008, TC-009, TC-010, TC-011, TC-012, TC-013, TC-048, TC-049, TC-206 |
| US-30 | Menandai produk sedang kosong | 1b | FR-14 | TC-011 (medan data saja). Tampilannya tidak diuji — N-01 |
| US-31 | Melihat data pengunjung dan klik pesan | 1a + 1b | FR-47 (1a), FR-24 (1a), FR-50 (1b) | TC-086 sampai TC-089, TC-095, TC-202, TC-203, TC-204, TC-205. FR-50 tidak diuji — N-01 |
| US-32 | Ditemukan di Google untuk kata kunci kopi lokal | 1a | FR-44, FR-45, FR-46, FR-48, FR-49 | TC-150 sampai TC-176 |
| US-33 | Berbagi tautan produk secara spesifik | 1a | FR-09, FR-46 | TC-020, TC-021, TC-022, TC-159, TC-160, TC-175 |

### 5.1 FR yang tidak berasal dari user story

BRD Bagian 16.1 mencatat empat FR tambahan yang tetap memerlukan test case.

| FR | Judul | **Test Case** |
|---|---|---|
| FR-23 | Catatan pembeli | TC-065, TC-090, TC-091, TC-092, TC-093, TC-102 |
| FR-24 | Kode order dan penanda sumber | TC-086, TC-087, TC-088, TC-089, TC-091, TC-095 |
| FR-26 | Blok ekspektasi pemesanan | TC-082, TC-083, TC-126, TC-128 |
| FR-43 | Validasi data saat build | TC-008, TC-009, TC-010, TC-049 |

### 5.2 Keterlacakan NFR dan BR

| ID | **Test Case** | Catatan |
|---|---|---|
| NFR-01, NFR-02 | TC-195, TC-196 | Tidak dapat dieksekusi |
| NFR-03 | TC-193, TC-197 | **Gagal sebagian** — DEF-06 |
| NFR-04 | TC-194 | Tidak dapat dieksekusi |
| NFR-05 | TC-058, TC-148, TC-149 | Tidak dapat dieksekusi |
| NFR-06 | TC-198, TC-199 | Tidak dapat dieksekusi |
| NFR-07 | TC-130 sampai TC-149 | Struktural lulus; uji perilaku tidak dapat dieksekusi |
| NFR-08 | TC-201 | Tidak dapat dieksekusi |
| NFR-09 | TC-182, TC-200 | Header terbukti; domain belum |
| NFR-10 | TC-175, TC-208 | Tidak dapat dieksekusi |
| NFR-11 | TC-130 sampai TC-137 | Lulus |
| NFR-12 | TC-002, TC-003, TC-008 sampai TC-010, TC-048, TC-074, TC-075, TC-164 | Lulus |
| NFR-13 | TC-206 | Menunggu owner |
| NFR-14 | TC-019, TC-111 | Sebagian tidak dapat dieksekusi |
| NFR-15 | TC-098 sampai TC-104, TC-110 | Aritmetika lulus; kiriman nyata tidak dapat dieksekusi |
| NFR-16 | TC-074, TC-085, TC-109, TC-192, TC-204, TC-205 | Lulus |
| BR-01, BR-02, BR-03, BR-04 | TC-002 sampai TC-010, TC-052 | Lulus |
| BR-08, BR-09, BR-10 | TC-003, TC-036 | Lulus |
| BR-11, BR-12 | TC-033 sampai TC-038 | Lulus |
| BR-13, BR-14 | TC-039 sampai TC-057 | Lulus |
| BR-15, BR-16, BR-17 | TC-030, TC-031, TC-060 | Lulus |
| BR-18 | TC-082, TC-108 | Lulus |
| BR-19 | TC-112 sampai TC-128 | Lulus |
| BR-20 | TC-170, TC-171, TC-172 | Lulus setelah DEF-05 ditutup |
| KD-01 | TC-033 sampai TC-038 | Lulus |
| KD-02 | TC-039 sampai TC-056 | Lulus |
| KD-03 | TC-112 sampai TC-129 | Lulus |

---

## 6. Verifikasi Ulang atas Klaim Developer

Setiap butir bertanda `[x]` pada daftar serah terima FE dan BE diuji ulang. Kolom terakhir menyatakan hasil pemeriksaan saya sendiri, bukan pengulangan klaimnya.

| Klaim | Sumber | Hasil verifikasi QA |
|---|---|---|
| "16 rute tayang, seluruhnya statis; tidak ada rute `ƒ (Dynamic)`" | FE Bagian 10 | **BENAR.** Build menghasilkan 21 halaman statis, di antaranya 16 rute situs — 15 publik ditambah `/keranjang` — dan seluruhnya bertanda statis atau SSG |
| "`generateStaticParams` menghasilkan 7 path produk dan 3 path lini" | FE Bagian 10 | **BENAR** |
| "JSON-LD `Product` + `Offer`, `Organization`, `BreadcrumbList` terpasang" | FE Bagian 10 | **BENAR** untuk kehadirannya — 23 blok, seluruhnya terurai. **TETAPI** isinya keliru pada houseblend: `Offer` mengiklankan harga 0,5 kg tanpa keterangan satuan. Lihat DEF-02 |
| "Keranjang: persistensi berversi, kedaluwarsa 7 hari, harga di-resolve ulang, data rusak dibuang tanpa crash" | FE Bagian 10 | **BENAR.** Diuji ulang lewat TC-067 sampai TC-075, termasuk skenario harga berubah saat item masih di keranjang |
| "Generator pesan murni, kode order, penanda sumber di badan pesan, batas 1.500 karakter terjaga" | FE Bagian 10 | **BENAR** untuk seluruhnya, setelah DEF-01 ditutup |
| "Jam balas D-03 di tiga tempat" | FE Bagian 10 | **BENAR dengan catatan.** Pada HTML statis `/keranjang`, janji itu hanya hadir lewat footer; salinan di blok checkout baru muncul setelah hydration dan hanya ketika keranjang berisi. Lihat DEF-12 |
| "Pelanggaran kontras `bg-gold` pada beranda diperbaiki" | FE Bagian 10 | **BENAR.** Nol kemunculan `bg-gold` pada seluruh HTML kedua target; tombol utama memakai `bg-rust` |
| "Pengecualian `SEMENTARA` dihapus dari `eslint.config.mjs`" | FE Bagian 10 | **BENAR.** Sekaligus membuktikan `docs/05-backend.md` Bagian 11 butir 4 sudah usang. Lihat DEF-13 |
| "`npx tsc --noEmit`, `npx eslint .`, `npm run build` lulus" | FE Bagian 10 | **BENAR**, dengan syarat `npx next typegen` dijalankan lebih dulu pada pohon bersih. Lihat TC-177 |
| **"64 pemeriksaan skrip lulus"** | FE Bagian 10 | **TIDAK BENAR pada saat saya menerimanya.** `node scripts/check-all.mjs` keluar dengan kode 1: 63 lulus, 1 gagal. Lihat DEF-01 |
| "D-FE-01: `formatIDR()` menyisipkan NBSP dan melanggar BR-02" | FE Bagian 8 | **TIDAK DAPAT DIREPRODUKSI** — sudah diperbaiki integrator sebelum saya menguji. Saya memverifikasi perbaikannya sendiri sampai ke titik kode. Lihat DEF-04 |
| "D-FE-02: `opengraph-image.png` belum ada" | FE Bagian 8 | **BENAR, DIKONFIRMASI.** Lihat DEF-07 |
| "D-FE-03: foto produk belum ada" | FE Bagian 8 | **BENAR, DIKONFIRMASI.** Kesepuluh produk bernilai `image: null` |
| "`searchTerms` belum disetujui owner" | BE Bagian 11 butir 2 | **BENAR, dan lebih serius daripada yang dilaporkan.** Alias yang belum dikonfirmasi itu **sudah tayang** pada `meta keywords`, yang melanggar BR-20 secara harfiah. Lihat DEF-05 |
| "`province` Palimping diisi Jawa Barat" | BE Bagian 11 butir 3 | **BENAR, DIKONFIRMASI.** Lihat DEF-11 |
| "`src/app/page.tsx` masih dikecualikan dari lint rule ADR-02" | BE Bagian 11 butir 4 | **TIDAK DAPAT DIREPRODUKSI.** Pengecualian sudah tidak ada. Dokumen BE usang |
| "Pesan galat validator tampil sebagai stack trace" | BE Bagian 11 butir 5 | **BENAR, DIKONFIRMASI** saat TC-008 sampai TC-010. Isi pesannya sendiri sangat jelas dan menyebut kode aturan `[V-01]`, `[V-04]`, `[V-05]` |
| "`sitemap.ts` dan `robots.ts` terverifikasi pada keluaran build" | BE Bagian 12 | **BENAR** |
| "Placeholder gambar 4:5 tersedia untuk 10 produk" | BE Bagian 12 | **BENAR di repositori, TETAPI tidak dapat dijangkau** pada target ekspor statis sebelum DEF-03 ditutup |

---

## 7. Yang Tidak Dapat Diverifikasi pada Lingkungan Ini

Bagian ini ditulis eksplisit supaya tidak ada pembaca yang menyimpulkan lebih banyak daripada yang benar-benar dibuktikan. **Tiga puluh test case berstatus tidak dapat dieksekusi, dan tidak satu pun boleh dianggap lulus.**

| Bidang | Test case | Yang dibutuhkan untuk menutupnya | Pemilik |
|---|---|---|---|
| Skor Lighthouse pada lima halaman NFR-04 | TC-194 | Chrome, tiga kali jalan, median | QA setelah deployment |
| LCP, INP, TTFB pada Slow 4G dengan CPU throttling 4x | TC-195 | Chrome dengan throttling | QA setelah deployment |
| CLS dengan pemuatan gambar diperlambat | TC-196 | Chrome | QA setelah deployment |
| Berat transfer nyata dan ukuran gambar | TC-197 | Panel Network peramban | QA setelah deployment |
| Pemeriksaan aksesibilitas otomatis axe | TC-145 | Peramban dengan DOM hidup | QA setelah deployment |
| Penelusuran alur beli dengan papan ketik saja | TC-144 | Peramban | QA sebelum rilis |
| Nama kontrol untuk pembaca layar dan pengumuman `aria-live` | TC-146, TC-147 | NVDA atau VoiceOver | QA sebelum rilis |
| Ukuran target sentuh dan ketiadaan penggeseran horizontal | TC-058, TC-148, TC-149 | Peramban dengan mesin tata letak | QA sebelum rilis |
| Perilaku interaktif: pemilih varian, konfigurator, indikator keranjang, persistensi lintas sesi | TC-027, TC-056, TC-059, TC-079, TC-080, TC-129 | Peramban | QA sebelum rilis |
| Rendering pada Android kelas menengah dan Safari iOS | TC-198, TC-199 | Perangkat fisik | QA sebelum rilis |
| **Kiriman WhatsApp yang sebenarnya pada tiga kombinasi perangkat** | TC-110 | Tiga perangkat dan satu nomor tujuan nyata | QA sebelum rilis |
| Jumlah ketukan pada alur beli | TC-111 | Peramban | QA sebelum rilis |
| Event GA4 pada DebugView dan penandaan konversi | TC-202, TC-203 | Properti GA4 dan `NEXT_PUBLIC_GA_ID` | Owner lalu BE |
| Verifikasi Search Console dan pengiriman sitemap | TC-174 | Akun Google atas nama brand | Owner |
| Rich Results Test dan kartu pratinjau WhatsApp | TC-175, TC-176 | Domain tayang | QA setelah deployment |
| HTTPS dan pengalihan pada domain sebenarnya | TC-200 | Domain diarahkan | Owner |
| Pemantauan uptime dan pemberitahuan | TC-201 | Layanan pemantauan | Owner |
| Keterindeksan 100% halaman produk dalam 30 hari | TC-208 | Waktu dan domain tayang | QA bulan pertama |
| Sesi owner mengubah harga dalam <= 15 menit | TC-206 | Kehadiran owner | BA |

Yang **dapat** saya buktikan tentang NFR-15 adalah aritmetikanya: panjang setelah pengodean URL tidak pernah melewati 1.500 pada 23 titik uji, dan blok wajib tidak pernah hilang. Yang **tidak** dapat saya buktikan adalah bahwa WhatsApp menampilkannya dengan rapi. Keduanya adalah pernyataan yang berbeda, dan R-04 pada BRD menuntut yang kedua.

---

## 8. Daftar Defek

Severitas: **Blocker** menghentikan rilis atau penerbitan; **Major** melanggar aturan bisnis atau NFR yang terukur; **Minor** perlu diperbaiki tetapi tidak menghentikan apa pun.

| # | Severitas | Apa yang rusak | Langkah reproduksi | Telusur | Pemilik | Status |
|---|---|---|---|---|---|---|
| **DEF-01** | **Blocker** | `node scripts/check-all.mjs` keluar dengan **kode 1**: assertion `tangga peringkasan` pada `check-whatsapp.mjs` gagal. Karena `.github/workflows/pages.yml` menjalankan skrip itu sebagai gerbang, setiap penerbitan ke GitHub Pages akan berhenti. Klaim FE "64 pemeriksaan lulus" karena itu tidak benar. **Akar masalahnya bukan pada produk**: assertion mengunci ambang persis 5 baris penuh / 6 baris ringkas / 10 baris terpotong, sementara perbaikan BR-02 memangkas enam karakter terkode dari setiap kemunculan harga sehingga batasnya bergeser. Terukur: n=5 -> 1.262 terkode, n=6 -> 1.463 (masih bentuk penuh), n=7 -> 1.136 (sudah ringkas) | `cd web && node scripts/check-all.mjs` | NFR-15, higiene CI | **FE** | **Ditutup.** Assertion ditulis ulang menjadi uji sifat yang menyapu n = 1..23 — bentuk hanya boleh menurun, panjang <= 1.500 pada setiap n, seluruh item tercantum selama belum dipotong. Saya meninjau penulisan ulang itu dan menilainya benar serta lebih kuat daripada versi ambang (lihat Bagian 4.4). Diuji ulang: 21 lulus, 0 gagal |
| **DEF-02** | **Major** | `productJsonLd()` menerbitkan **harga 0,5 kg** sebagai `Offer.price` untuk seluruh varian houseblend, dengan `Offer.name` yang hanya menyebut rasio tanpa satuan apa pun. Rich result Google akan mengiklankan **Rp105.000** untuk BOLD 70:30 yang harga resminya **Rp210.000/kg** — separuhnya. Blok JSON-LD yang sama bahkan memuat deskripsi "mulai Rp175.000", sehingga bertentangan dengan dirinya sendiri | Build, lalu urai blok `ld+json` pada `/houseblend/bold` dan periksa `offers[0].price` | BR-01, NFR-12, FR-49 | **BE** | **Ditutup.** `Offer` houseblend kini menyertakan `referenceQuantity` bernilai 0,5 dengan `unitCode` KGM dan `unitText` kg. Diverifikasi ulang pada keluaran build kedua target |
| **DEF-03** | **Blocker** (target GitHub Pages) | Kesepuluh gambar placeholder produk dirujuk sebagai `/produk/<slug>.svg` **tanpa basePath**, sehingga seluruhnya **404** pada `https://yuzansama.github.io/titikasalkopi/`. Penyebabnya `next/image` tidak menambahkan basePath pada gambar `unoptimized` dengan `src` berupa string. Dampaknya bukan kosmetik: setiap halaman katalog dan setiap halaman produk pada pratinjau publik menampilkan gambar rusak, melanggar butir penerimaan "tidak ada gambar rusak" | Build ekspor statis dari PowerShell, sajikan `out/` di bawah `/titikasalkopi`, lalu `GET /produk/abmisibil.svg` | FR-12, BRD 12 | **FE / Arsitek** | **Ditutup.** `placeholderImagePath()` kini memberi awalan `NEXT_PUBLIC_BASE_PATH`, yang diturunkan dari `BASE_PATH` di dalam `next.config.ts` sehingga hanya ada satu sumber kebenaran dan alur CI tidak perlu menyetel env var kedua. Diuji ulang: kesepuluh SVG **200**; nol rujukan aset tanpa basePath pada seluruh HTML |
| **DEF-04** | **Major** | `formatIDR()` menyisipkan U+00A0 antara "Rp" dan angka, sehingga setiap harga di seluruh situs dan di setiap pesan WhatsApp berbunyi `Rp<NBSP>210.000`, bukan `Rp210.000`. Dilaporkan sendiri oleh FE sebagai D-FE-01 dengan prioritas tertinggi | Panggil `formatIDR(210000)` dan periksa titik kode ke-3 | BR-02, NFR-12 | **BE** | **Ditutup sebelum saya menguji — TIDAK DAPAT DIREPRODUKSI pada kode yang saya terima.** Saya memverifikasi perbaikannya sendiri sampai ke titik kode, bukan sekadar menerima laporannya: `Rp210.000` menghasilkan urutan 82,112,50,... tanpa 160, dan nol kemunculan `Rp` diikuti spasi pada 18 berkas HTML kedua target. Saya juga memeriksa bahwa tidak ada kode hilir yang bergantung pada spasi lama; satu-satunya yang bergantung padanya adalah `check-whatsapp.mjs` sendiri, yang justru menormalkannya |
| **DEF-05** | **Major** | Alias pencarian "kopi Gayo" dan "arabica Gayo" **tayang** pada `meta keywords` halaman `/produk/pondok-baru`, dan "kopi Gayo" juga tertanam pada daftar kata kunci beranda serta katalog di `lib/seo.ts`. BR-20 menyatakan alias "tidak boleh dipakai bila owner belum mengonfirmasinya secara tertulis", dan OQ-12 masih berstatus **Terbuka** pada BRD v1.1. Selain itu "arabica Gayo" bahkan tidak termasuk nilai yang diusulkan BA | Build, lalu cari kata "Gayo" pada HTML hasil build | BR-20, FR-44, OQ-12 | **BA / Owner** memutuskan; **BE** melaksanakan | **Ditutup.** Seluruh alias Gayo ditahan pada `products.ts` dan `seo.ts`, masing-masing disertai komentar yang menyebut BR-20/OQ-12 dan syarat pengaktifannya kembali. Diuji ulang: nol kemunculan pada seluruh HTML kedua target |
| **DEF-06** | **Major** | **JavaScript awal beranda = 181 KB terkompresi**, melewati anggaran NFR-03 sebesar 150 KB. Delapan chunk dirujuk sebagai `<script>` pada beranda: 71 KB, 43 KB, 39 KB, 10 KB, 8 KB, 6 KB, 4 KB, 2 KB setelah gzip. Berat muat pertama total ~264 KB, masih jauh di bawah anggaran 600 KB — jadi yang terlampaui adalah anggaran JavaScript-nya saja | `gzip -9` setiap chunk yang dirujuk `out/index.html`, lalu jumlahkan | NFR-03 | **FE / Arsitek** | **Ditutup 8 September 2026 — anggarannya yang salah, bukan kodenya.** Pencabutan `CartProvider` + `AnalyticsProvider` hanya menghemat 5,2 KB mentah (~1,5 KB ter-gzip): sisanya runtime React 19 + App Router. CEO merevisi NFR-03 menjadi **<= 190 KB ter-gzip**, diambil dari rute TERBERAT (lihat D-04 pada `00b-ceo-decisions.md`). Terukur ulang 8 September 2026: `/produk/<slug>` 185,5 KB — margin 4,5 KB |
| **DEF-07** | Minor | `src/app/opengraph-image.png` tidak ada. Karena kesepuluh produk juga belum berfoto, **tidak ada satu pun halaman** yang memiliki gambar pratinjau saat tautannya dibagikan. FR-46 belum penuh | Build, lalu cari `og:image` pada HTML | FR-46, NFR-10 | **Owner / desainer** | **Ditutup** (commit `681aa5e`). `opengraph-image.png` 1200 x 630 tipografis dari palet brand — tanpa fotografi karangan. Emas dipakai hanya sebagai garis non-teks, karena emas di atas cream gagal AA untuk teks. Dua bug ikut tertangkap saat pemasangannya: `metadataBase` yang memuat basePath menggandakan URL OG sekaligus menghapus gambar warisan di setiap rute selain beranda |
| **DEF-08** | Minor | Kesepuluh produk bernilai `image: null`; seluruh katalog tayang dengan placeholder | Periksa `products.ts` | FR-12 | **Owner** | **Sebagian ditutup** (commit `681aa5e`). **5 dari 10** produk kini berartwork asli — Abmisibil, Sabin, Pondok Baru, BOLD, BRIGHT — dipotong dari materi pemasaran yang sudah ada, dengan alt yang menyebut ini ilustrasi origin, bukan foto kemasan. **5 sisanya tetap placeholder dengan alasan tertulis**: Full Robusta tidak punya artwork yang jujur mewakilinya, dan Oelbiteno, Pyramid, Palimping, Kerinci hanya ada sebagai thumbnail poster berukuran 94x118 sampai 126x157 px — empat sampai tujuh kali di bawah bingkai 800x1000, dan hasil upscale-nya lebih buruk daripada SVG yang tajam. **Menunggu owner memotret produknya**; tidak menahan rilis (R-13) |
| **DEF-09** | Minor | `scripts/check-whatsapp.mjs` masih memuat komentar dan blok cetak `CATATAN BR-02` yang menyatakan `formatIDR()` menyisipkan NBSP, padahal defeknya sudah ditutup — dan masih menormalkan NBSP sebelum membandingkan. Bukti yang menyesatkan, sekaligus menutupi regresi serupa di masa depan | Jalankan `node scripts/check-whatsapp.mjs` dan baca baris terakhir | Higiene uji | **FE** | **Ditutup.** Blok peringatan usang dihapus; BR-02 kini dijaga `check-format.mjs` tanpa normalisasi apa pun |
| **DEF-10** | Minor | Pada target ekspor statis, `trailingSlash` membuat kanonis dan `og:url` berakhiran garis miring (`.../produk/abmisibil/`) sementara `sitemap.xml` menuliskan URL tanpa garis miring. Selain itu seluruh kanonis menunjuk `titikasalkopi.id` padahal halamannya disajikan dari `github.io` | Bandingkan kanonis dan `<loc>` pada `out/` | FR-45 | **BE / Arsitek** | **Ditutup 8 September 2026.** GitHub Pages memang kemudian dijadikan host produksi (commit `7ca99dd`), jadi syarat peninjauan ulang yang saya tulis di sini terpicu. Diperiksa ulang pada KEDUA target: kanonis dan `<loc>` sitemap kini identik untuk kesemua 15 rute publik. Kanonis juga sudah menunjuk host yang benar-benar menyajikan situs, karena `NEXT_PUBLIC_SITE_ORIGIN` menggantikan konstanta `titikasalkopi.id` yang dikunci. Assertion baru menjaganya, dan sengaja **tidak** menormalkan garis miring penutup — satu-satunya normalisasi adalah `new URL().href`, yang menyamakan `https://situs.id` dengan `https://situs.id/` karena keduanya memang URL yang sama menurut RFC 3986. Perbedaan itulah yang tersisa pada target Vercel, dan ia bukan defek |
| **DEF-11** | Minor | `province` Palimping diisi "Jawa Barat" sementara brand brief hanya menulis "Desa Palimping, Garut". Nilai itu tayang pada judul metadata halaman | Bandingkan `products.ts` terhadap brand brief | FR-07, BR-01 | **BA / Owner** | **TERBUKA, menunggu owner.** Dilaporkan sendiri oleh BE dan **saya konfirmasi**. Secara geografis benar dan bukan atribut kopi, tetapi BR-01 menyatakan brand brief adalah sumber kebenaran. Butuh satu kalimat konfirmasi owner, bukan perubahan kode. **Sejak 8 September 2026 asal-usulnya ditulis di sebelah nilainya** pada `products.ts`: nilai itu diturunkan dari fakta administratif bahwa Garut adalah kabupaten di Jawa Barat, bukan dari klaim apa pun tentang kopinya, dan kolomnya wajib terisi karena judul metadata SEO merakit diri dari sana. Bila owner menolak, hapus barisnya dan longgarkan `validate.ts` — jangan mengganti satu tebakan dengan tebakan lain |
| **DEF-12** | Minor | Pada HTML statis `/keranjang`, janji jam balas hanya hadir lewat footer. Salinan di dalam blok checkout dirender di sisi klien dan hanya muncul ketika keranjang berisi, sehingga pengunjung dengan keranjang kosong tidak melihatnya di tempat yang diminta BR-19 | Cari `08.00–21.00 WIB` pada `out/keranjang/index.html` dan hitung kemunculannya | BR-19, FR-26 | **FE** | **Ditutup 8 September 2026.** Akar masalahnya lebih luas daripada laporan awal: yang ada di HTML hasil build bukan cabang “keranjang kosong” melainkan kerangka “memuat”, karena seluruh `CartView` menunggu hydration. Janji jam balas kini dipasang di ketiga cabang — memuat, kosong, dan berisi — sehingga ia ada di HTML statis, bukan hanya setelah keranjang terisi. Terukur pada kedua target: kemunculan pada `/keranjang` naik dari 1 (footer saja) menjadi 2. Assertion baru menjaganya dengan menghitung kemunculan, bukan sekadar keberadaannya, karena footer sendirian sudah membuat pemeriksaan `includes()` hijau |
| **DEF-13** | Minor | `docs/05-backend.md` Bagian 11 butir 4 menyatakan pengecualian lint `SEMENTARA` untuk `src/app/page.tsx` masih ada; pengecualian itu sudah dihapus. Dokumen serah terima yang usang membuat pembaca berikutnya mengejar pekerjaan yang sudah selesai | Cari `SEMENTARA` pada `eslint.config.mjs` | Higiene dokumen | **BE** | **Ditutup 8 September 2026.** Butirnya ditulis ulang menjadi catatan sejarah yang menyatakan pengecualian itu sudah dihapus, bukan pekerjaan tersisa |
| **DEF-14** | — | **Alarm palsu.** `robots.txt` pada build non-produksi berbunyi `User-Agent: * / Disallow: /`, yang sempat dicurigai sebagai deindeksasi tak sengaja atas seluruh situs | Build tanpa `VERCEL_ENV=production`, lalu baca `robots.txt` | FR-45 | — | **Bukan defek.** Ini penjaga yang disengaja agar deployment pratinjau tidak terindeks dan tidak bersaing dengan domain asli. Saya membuktikan cabang produksinya bekerja dengan menjalankan build ber-`VERCEL_ENV=production`: keluarannya `Allow: /`, `Disallow: /keranjang`, beserta `Host:` dan `Sitemap:` yang benar (TC-169). **Catatan kejujuran:** pada seluruh eksekusi saya, assertion `robots.txt` tidak pernah gagal — yang gagal adalah keempat butir DEF-01 sampai DEF-03 dan DEF-05. Saya mencatatnya di sini karena butir ini sempat diangkat, dan karena hasil verifikasinya tetap berguna: gerbang itu bertumpu pada satu variabel lingkungan tunggal. Bila situs suatu saat dipindahkan ke penyedia selain Vercel, `VERCEL_ENV` tidak akan pernah bernilai `production` dan **seluruh situs akan terdeindeks secara diam-diam**. Direkomendasikan mengganti syaratnya menjadi variabel yang tidak terikat vendor |

### 8.1 Rekapitulasi defek — saat audit, 7 September 2026

| Severitas | Jumlah | Ditutup | Terbuka |
|---|---|---|---|
| Blocker | 2 | 2 | 0 |
| Major | 4 | 3 | **1** (DEF-06) |
| Minor | 7 | 1 | 6 |
| Alarm palsu | 1 | — | — |
| **Total** | **14** | **6** | **7** |

### 8.2 Rekapitulasi defek — 8 September 2026

Angka pada Bagian 2 dan 8.1, dan kolom Status pada tabel test case, sengaja
**tidak** diubah: semuanya potret hasil eksekusi 7 September 2026, dan menulis
ulangnya berarti memalsukan catatan tentang apa yang benar-benar terlihat saat
itu. Tabel di bawah inilah keadaan sekarang, dan ia yang menang bila keduanya
berbeda. Hanya kolom Status pada ledger defek Bagian 8 yang ikut diperbarui,
karena ledger memang alat yang hidup, bukan catatan eksekusi.

| Severitas | Jumlah | Ditutup | Terbuka |
|---|---|---|---|
| Blocker | 2 | 2 | 0 |
| Major | 4 | 4 | 0 |
| Minor | 7 | 4 | **3** (DEF-08 sebagian, DEF-11, DEF-14 bukan defek) |
| Alarm palsu | 1 | — | — |
| **Total** | **14** | **10** | **2 nyata** |

Yang berubah sejak audit:

| Defek | Perubahan | Cara penutupannya |
|---|---|---|
| DEF-05 | Ditutup | Owner mengonfirmasi alias "kopi Gayo"; alias diterbitkan dan assertion penjaganya **dibalik**, bukan dihapus, sehingga cakupannya selamat dari pembalikan keputusan |
| DEF-06 | Ditutup | CEO merevisi NFR-03 ke 190 KB ter-gzip setelah pengukuran membuktikan beratnya milik runtime, bukan kode aplikasi (D-04) |
| DEF-07 | Ditutup | `opengraph-image.png` tipografis 1200 x 630 |
| DEF-08 | **Sebagian** | 5 dari 10 produk berartwork asli; 5 sisanya tetap placeholder dengan alasan tertulis, menunggu foto dari owner |
| DEF-10 | Ditutup | Kanonis dan sitemap identik di kedua target, dijaga assertion baru |
| DEF-11 | **Terbuka** | Butuh satu kalimat owner. Asal-usul nilainya kini tertulis di `products.ts` |
| DEF-12 | Ditutup | Janji jam balas dipasang di ketiga cabang `CartView`, dijaga assertion yang MENGHITUNG kemunculan |
| DEF-13 | Ditutup | Butir usang pada `05-backend.md` ditulis ulang sebagai catatan sejarah |

Assertion otomatis: **118 saat audit -> 122**. Empat tambahan sejak itu adalah
penjaga keputusan, bukan penjaga kode: teks "foto produk menyusul" tidak boleh
kembali, ongkir Jawa di luar Jabodetabek tidak boleh diisi angka karangan,
`/keranjang` wajib memuat janji jam balas di badan halaman, dan kanonis wajib
sama persis dengan `<loc>` sitemap.

Kedua gerbang hijau pada 8 September 2026, pada **kedua** target build:
`npx tsc --noEmit`, `npx eslint .`, `npx next build`, lalu
`node scripts/check-all.mjs` -> 122 lulus, 0 gagal.

**Satu jebakan yang wajib diketahui pelari tes berikutnya.** `check-all.mjs`
membaca env yang sama dengan build. Menjalankannya tanpa env — `node
scripts/check-all.mjs` polos — membandingkan keluaran produksi terhadap
harapan pratinjau dan memberi **3 kegagalan palsu** pada kanonis, sitemap, dan
`robots.txt`. Jalankan dengan `STATIC_EXPORT=1 BASE_PATH=/titikasalkopi
SITE_ENV=production NEXT_PUBLIC_SITE_ORIGIN=https://yuzansama.github.io`,
persis seperti `pages.yml`. Pada Git Bash di Windows, jalankan lewat PowerShell:
MSYS mengubah `BASE_PATH=/titikasalkopi` menjadi path Windows dan merusak
perbandingan kanonis.

---

## 9. Verdikt

### 9.1 Keadaan kode pada saat penilaian ini

Dari pohon kerja bersih, dengan `.next/`, `out/`, `next-env.d.ts`, dan `tsconfig.tsbuildinfo` dihapus lebih dulu:

```
npx next typegen           exit 0
npx tsc --noEmit           exit 0
npx eslint .               exit 0
npm run build              exit 0   (target Vercel, 21 halaman)
STATIC_EXPORT=1 BASE_PATH=/titikasalkopi next build
                           exit 0   (ekspor statis, 150 berkas)
node scripts/check-all.mjs exit 0   (118 lulus, 0 gagal)
```

Seluruh rute mengembalikan 200 pada kedua target; rute tak dikenal mengembalikan 404; kesepuluh gambar produk dapat dijangkau di bawah basePath; header keamanan termasuk HSTS terkirim pada build produksi; `robots.txt` berperilaku benar pada kedua lingkungan.

### 9.2 Verdikt: **GO BERSYARAT untuk keadaan sekarang — tetapi kode yang terdorong pada mulanya adalah NO-GO**

Dua pernyataan berbeda, dan keduanya perlu dikatakan.

**Pertama, tentang apa yang sudah terjadi.** Kode yang terdorong ke repositori publik dalam keadaan awalnya **tidak layak didorong**, dan saya menyatakannya tanpa memperhalus. Alasannya bukan selera: `node scripts/check-all.mjs` keluar dengan kode 1, sementara berkas alur `pages.yml` menjadikan skrip itu gerbang penerbitan. Artinya penerbitan pertama pasti gagal — dan seandainya gerbang itu dilewati, yang tayang ke publik adalah situs dengan **kesepuluh gambar produknya 404** (DEF-03) dan **structured data yang mengiklankan harga separuh** kepada Google (DEF-02). Yang terakhir bukan cacat kosmetik: ia menerbitkan harga yang salah atas nama brand, tepat pada mekanisme yang dirancang untuk menampilkan harga di hasil pencarian. Klaim serah terima "64 pemeriksaan skrip lulus" tidak benar pada saat diserahkan, dan satu-satunya alasan kekeliruan itu tidak terlihat adalah karena pemeriksaan yang seharusnya menangkapnya justru menormalkan gejalanya lebih dulu. Pelajaran yang saya minta dicatat: **suite pemeriksaan yang menormalkan perilaku yang sedang diuji lebih berbahaya daripada tidak punya suite sama sekali**, karena ia memberi rasa aman yang keliru.

**Kedua, tentang keadaan sekarang.** Ketiga defek yang memblokir sudah ditutup dan saya memverifikasi penutupannya sendiri dari pohon bersih, bukan menerima laporannya. Terhadap keadaan hari ini saya memberikan **GO untuk tetap tayang sebagai pratinjau publik di GitHub Pages**, dengan empat syarat yang mengikat:

1. **DEF-06 wajib diselesaikan sebelum rilis produksi ke `titikasalkopi.id`.** JavaScript awal 181 KB terkompresi melewati anggaran NFR-03 sebesar 150 KB. Pilihannya dua dan keduanya sah: pangkas bundelnya, atau CEO merevisi angka anggarannya secara tertulis. Yang tidak sah adalah membiarkannya tercatat sebagai lulus. Ukur ulang dengan brotli pada deployment nyata lebih dulu — angkanya mungkin turun ke 158–165 KB, tetapi tetap di atas anggaran.
2. **Kesembilan belas kelompok pengujian pada Bagian 7 — 30 test case — wajib dieksekusi sebelum rilis produksi**, khususnya TC-110 (kiriman WhatsApp nyata pada tiga perangkat — ini mitigasi R-04 dan tidak dapat digantikan pembuktian aritmetika), TC-144 (alur beli lengkap dengan papan ketik saja), dan TC-194 (Lighthouse pada lima halaman). Rilis produksi tanpa ketiganya berarti menyatakan lulus atas hal yang belum pernah dilihat siapa pun.
3. **OQ-12 wajib ditutup owner secara tertulis** sebelum alias Gayo diaktifkan kembali, dan kata kunci "kopi Gayo" wajib dicoret dari G-06 selama belum ditutup. Hal yang sama berlaku untuk DEF-11 — satu kalimat konfirmasi owner atas provinsi Palimping.
4. **`opengraph-image.png` wajib ada sebelum tautan situs dibagikan ke publik** (DEF-07). Membagikan tautan yang tampil sebagai teks polos di WhatsApp dan Instagram merusak justru pada kanal yang menjadi sumber trafik utama Fase 1 menurut A-07.

**Yang saya nilai sudah benar-benar kokoh.** Ketiga keputusan CEO terbukti diterapkan dengan disiplin: paket campur antar-origin tidak dapat dibentuk lewat antarmuka mana pun pada seluruh rute kedua target; kesembilan harga 0,5 kg tepat setengah harga per kg tanpa satu pun pembulatan, dan validator build menolak harga per kg yang tidak habis dibagi seribu sehingga pelanggaran itu tidak mungkin lolos diam-diam; dan indikator jam balas benar pada kedua sisi kedua batas, termasuk untuk pengunjung berzona waktu lain. Model keranjang yang tidak menyimpan harga terbukti bekerja persis seperti yang dijanjikan BRD Bagian 11.1, termasuk pada kasus harga berubah saat item masih tersimpan. Gerbang validasi data FR-43 terbukti menghentikan build dengan pesan yang jelas dan menyebut kode aturannya.

**Satu catatan tentang urutan kerja yang saya minta tidak diulang.** Menerbitkan lebih dulu lalu menguji sesudahnya membalik urutan gerbang. Pada kasus ini kerugiannya kecil karena repositori masih sepi dan Pages masih diperlakukan sebagai pratinjau. Pada rilis produksi ke domain sebenarnya, urutan yang sama akan berarti harga yang salah sempat terindeks Google — dan mencabut sesuatu dari indeks jauh lebih mahal daripada menahannya satu hari.

---

## 10. Tugas yang Diserahkan Kembali

| # | Tugas | Pemilik | Sebelum |
|---|---|---|---|
| 1 | Ukur ulang JavaScript awal dengan brotli pada deployment nyata; pangkas bundel atau revisi anggaran NFR-03 secara tertulis (DEF-06) | FE / Arsitek / CEO | Rilis produksi |
| 2 | Sediakan `src/app/opengraph-image.png` 1200 x 630 (DEF-07) | Owner / desainer | Tautan dibagikan publik |
| 3 | Sediakan foto produk (DEF-08) | Owner | Rilis produksi, tidak menahan pratinjau |
| 4 | Tutup OQ-12 secara tertulis; aktifkan atau buang alias Gayo (DEF-05) | Owner lalu BE | Rilis produksi |
| 5 | Konfirmasi provinsi Palimping (DEF-11) | Owner | Rilis produksi |
| 6 | Ganti syarat `robots.txt` dari `VERCEL_ENV` menjadi variabel yang tidak terikat vendor (DEF-14) | BE | Sebelum pindah penyedia |
| 7 | Perbarui `docs/05-backend.md` Bagian 11 butir 4 yang sudah usang (DEF-13) | BE | Fase 1b |
| 8 | Tinjau ketidaksesuaian garis miring kanonis pada target ekspor (DEF-10) | Arsitek | Bila Pages dijadikan produksi |
| 9 | Verifikasi janji jam balas pada blok checkout di peramban (DEF-12) | FE lalu QA | Rilis produksi |
| 10 | Eksekusi ke-30 test case pada Bagian 7 di deployment nyata dan perangkat nyata | QA | Rilis produksi |
| 11 | Isi `NEXT_PUBLIC_GA_ID` dan `GOOGLE_SITE_VERIFICATION`; tandai `click_whatsapp_order` sebagai konversi | Owner lalu BE | Rilis produksi |
| 12 | Pasang pemantauan uptime beserta pemberitahuan ke owner (NFR-08, CA-09) | Owner | Rilis produksi |

---

## 11. Persetujuan

| Peran | Nama | Tanda tangan | Tanggal |
|---|---|---|---|
| Penyusun — QA Engineer | | | 7 September 2026 |
| Diketahui — Business Analyst | | | |
| Diketahui — Arsitek | | | |
| Pemberi persetujuan rilis — CEO / Owner | | | |
