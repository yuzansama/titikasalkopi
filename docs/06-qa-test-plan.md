# 06 — Rencana dan Laporan Pengujian QA
## Titik Asal Kopi — Website titikasalkopi.id (Fase 1a)

---

## 0. Kendali Dokumen

| Atribut | Isi |
|---|---|
| Judul dokumen | Rencana Uji dan Laporan Eksekusi QA — Website titikasalkopi.id Fase 1a |
| Versi | **2.0** |
| Tanggal | **9 September 2026** (versi awal 7 September 2026) |
| Penulis | QA Engineer |
| Dokumen sumber | `docs/00-brand-brief.md`, `docs/00b-ceo-decisions.md` (KD-01 sampai KD-08), `docs/02-BRD.md` **v1.5**, `docs/03-architecture.md`, `docs/04-frontend.md`, `docs/05-backend.md`, `docs/08-lacak-pesanan.md`, `docs/09-kelola-katalog.md`, `docs/11-timeline-rilis.md` |
| Objek uji | Kode pada `web/`, cabang `main` |
| Sifat dokumen | Rencana uji **dan** ledger defek. Kolom **Cakupan** menyatakan apakah sebuah butir sudah dijaga mesin atau menuntut manusia; tidak ada butir yang dibiarkan ambigu |
| Sumber angka katalog | `web/src/data/validate.ts` (`EXPECTED_*`) dan `web/src/data/managed.generated.ts`. **Dokumen ini tidak menuliskan satu pun harga sebagai angka** |
| Bahasa | Bahasa Indonesia |

### 0.1 Riwayat revisi

| Versi | Tanggal | Penulis | Perubahan |
|---|---|---|---|
| 1.0 | 7 September 2026 | QA Engineer | Rencana uji dan laporan eksekusi pertama: 208 test case (TC-001…TC-208), 118 assertion otomatis, 14 defek tercatat, verdikt GO bersyarat atas pratinjau GitHub Pages |
| 1.1 | 8 September 2026 | QA Engineer | Rekapitulasi defek 8 September ditambahkan sebagai Bagian 8.2 tanpa mengubah potret eksekusi 7 September; assertion otomatis naik 118 → 122 |
| **2.0** | **9 September 2026** | **QA Engineer** | **Penulisan ulang penuh (butir 2.1 `11-timeline-rilis.md`).** Rencana v1.x menguji katalog 10 produk / 23 varian dengan harga 0,5 kg houseblend sebagai turunan setengah harga per kg — model itu dicabut `KD-02` revisi kedua. Modul E lama menegakkan aturan yang sudah batal dan menghasilkan kegagalan palsu. Versi ini menguji katalog yang benar-benar ada (8 single origin termasuk **Sindoro**, kemasan mini **100 gr**, houseblend **dua ukuran kemasan**), menambahkan cakupan **lacak pesanan** (`KD-05`, `KD-06`), **sinkronisasi katalog dari sheet** (`KD-08`), **lini Katalog Kopi 100 gram** (`KD-07`), dan **status stok** (FR-14). Penomoran test case dimulai ulang dari **TC-301** agar rujukan lama ke TC-001…TC-208 tetap menunjuk arsip v1.x, bukan tertukar. Prinsip pengujian uang diubah dari nilai literal menjadi **invarian** setelah cacat 9 September 2026 |

### 0.2 Kedudukan dokumen ini

Rencana v1.x bukan dokumen yang salah tulis; ia dokumen yang **produknya berubah di bawahnya**. Isinya diperlakukan sebagai arsip — potret atas apa yang tayang pada 7 dan 8 September 2026 — dan yang dibawa ke sini hanyalah dua hal yang memang hidup: **ledger defek** (Bagian 7) dan **pelajaran** yang melahirkan Bagian 1.1. Segala sesuatu yang lain ditulis ulang dari nol terhadap kode hari ini.

Dokumen ini **bukan** laporan eksekusi. Situs belum pernah diuji di peramban, di perangkat nyata, maupun terhadap endpoint hidup; seluruh bukti yang ada sampai hari ini bersifat aritmetika. Karena itu kolom status pada v1.x diganti kolom **Cakupan**, yang menyatakan siapa yang menutup butir itu — mesin atau manusia — dan manusia itu butuh apa. Laporan eksekusi manual ditulis pada Sprint 2 `11-timeline-rilis.md`, di bawah dokumen ini.

### 0.3 Ringkasan angka

| Ukuran | Angka |
|---|---|
| Test case tertulis | **98** (TC-301 sampai TC-437) |
| Sepenuhnya dijaga pemeriksaan otomatis | **44** |
| Menuntut manusia | **54** — di antaranya **9 campuran**, yaitu aritmetikanya dijaga mesin sementara pengalamannya tidak |
| Assertion otomatis pada `web/scripts/` | **200** pada 9 berkas (angka berjalan; yang berlaku adalah keluaran `node scripts/check-all.mjs`, bukan dokumen ini) |
| Defek diwariskan dari v1.x | 14 — 12 tertutup, **2 terbuka** |
| Defek baru pada v2.0 | **3** — DEF-15 (Major), DEF-16 (Major), DEF-17 (Minor) |

---

## 1. Strategi Pengujian

### 1.1 Prinsip yang dipakai

**Prinsip 1 — uji hubungan, bukan angka. Ini prinsip terpenting dalam dokumen ini.**

Pada 9 September 2026 sebuah cacat harga masuk ke pohon kerja dan **tidak satu pun pemeriksaan menangkapnya**. Pesan yang dikirim pembeli berbunyi:

```
   Jumlah: 5 kg x Rp205.000/kg
   Subtotal: Rp1.150.000
```

Angkanya tidak berkalian. Cacat itu selamat bukan karena cakupannya kurang, melainkan karena **setiap pemeriksaan menegaskan sebuah NILAI**, dan ketika keluarannya berubah, nilai pada pemeriksaan ikut diperbarui agar cocok dengan keluaran yang salah. Suite-nya menyetujui kode, bukan mempertanyakannya. Suite yang berperilaku begitu lebih berbahaya daripada tidak punya suite sama sekali, karena ia mengubah "belum diperiksa" menjadi "sudah lulus".

Konsekuensinya mengikat seluruh dokumen ini:

1. **Test case yang memaku angka rupiah adalah liabilitas** pada situs yang harganya disunting owner lewat spreadsheet (`KD-08`). Setiap kali owner mengubah satu harga, test case semacam itu berubah merah tanpa ada yang rusak — dan orang yang memperbaikinya akan memperbaikinya dengan cara yang salah: mengetik ulang angkanya.
2. **Kasus uang ditulis sebagai hubungan yang diverifikasi tester terhadap harga yang tayang saat itu.** Bentuk bakunya: *"jumlah yang tertulis × harga satuan yang tertulis = subtotal yang tertulis"*, *"jumlah seluruh subtotal baris = subtotal pesanan"*, *"angka hemat yang tayang = 3 × harga 1 pack − harga 3 pack, ketiganya diambil dari layar yang sama"*. Tester tidak perlu tahu harganya berapa; ia perlu tahu angka-angka itu wajib saling menutup.
3. **Dokumen ini tidak menuliskan satu pun harga.** Di mana pun sebuah harga diperlukan, yang tertulis adalah **"harga yang tayang"**. Sumber angka yang berlaku ada di `web/src/data/managed.generated.ts` (diisi sheet owner) dan pagarnya di `web/src/data/validate.ts`. Hal yang sama berlaku untuk jumlah varian: `EXPECTED_*`, bukan angka di sini.
4. **Literal masih sah, tetapi hanya untuk angka yang merupakan KEPUTUSAN, bukan harga.** Batas 1.500 karakter terkode, jam 08.00–21.00 WIB, ambang basi 5 hari, kuota 50 baris per hari, anggaran 190 KB ter-gzip, batas kewarasan Rp10.000–Rp5.000.000. Angka-angka itu berubah hanya lewat keputusan tertulis, dan justru karena itu memakukannya berguna: pemeriksaannya berubah merah tepat ketika seseorang mengubah keputusan tanpa mengambil keputusan.
5. **Bila keluaran berubah, pemeriksaan tidak boleh diperbarui agar cocok — kebenaran keluaran baru harus dibuktikan lebih dulu.** Bila pembuktiannya tidak bisa dilakukan dalam hitungan menit, pemeriksaannya dibiarkan merah dan defeknya dicatat. Merah yang jujur lebih murah daripada hijau yang salah.

**Prinsip 2 — pemeriksaan yang menormalkan perilaku yang sedang diuji tidak sah.** Diwarisi dari v1.0 dan masih berlaku. `check-whatsapp.mjs` versi lama menghapus U+00A0 sebelum membandingkan, sehingga puluhan assertion bisa hijau sementara BR-02 dilanggar pada setiap harga di seluruh situs. Penggantinya, `check-format.mjs`, menguji titik kodenya langsung dan tidak menormalkan apa pun.

**Prinsip 3 — yang diuji adalah keluaran yang benar-benar tayang.** Modul murni boleh diuji, tetapi tidak boleh menjadi satu-satunya gerbang. `check-build-output.mjs` bekerja pada HTML hasil `next build` di kedua target.

**Prinsip 4 — klaim developer adalah hipotesis, bukan bukti.** Termasuk klaim dokumen ini sendiri: setiap baris berkolom "OTOMATIS" menyebut **nama berkas skriptnya**, sehingga pembaca dapat menjalankannya dan menilai sendiri, bukan mempercayai tabel.

**Prinsip 5 — pekerjaan manusia tidak boleh menduplikasi pekerjaan mesin.** Bagian 3 memetakan seluruh cakupan otomatis lebih dulu, dan test case manual pada Bagian 4 sengaja dibatasi pada hal yang **tidak bisa** dibuktikan tanpa peramban, perangkat, endpoint hidup, atau owner. Menyuruh manusia mengulang apa yang sudah dijaga CI adalah cara paling cepat membuat pengujian manual berhenti dikerjakan.

### 1.2 Tingkatan pengujian

| Tingkat | Objek | Cara | Otomatis |
|---|---|---|---|
| **L1 — Statis** | Tipe, lint, aturan ketergantungan | `npx next typegen`, `npx tsc --noEmit`, `npx eslint .` | Ya |
| **L2 — Unit murni** | Keranjang, generator pesan, jam balas, format, lacak, lini 100 gram | `check-cart`, `check-whatsapp`, `check-reply-hours`, `check-format`, `check-picks`, `check-tracking` | Ya |
| **L3 — Gerbang data** | Validator katalog FR-43 (V-01…V-20) dan `validateCatalogPayload()` | `check-sync-katalog.mjs` untuk payload sheet; perusakan data sengaja lalu build untuk V-06, V-10b, V-11 | Sebagian |
| **L4 — Keluaran build** | HTML, sitemap, robots, JSON-LD, metadata, kelas warna, penanda stok | `check-build-output.mjs` | Ya |
| **L5 — Kontrak Apps Script** | Daftar putih kolom, pagar tulis, kuota, netralisasi rumus | `check-order-tracker-gs.mjs` (menjalankan `ops/order-tracker.gs` di atas sheet tiruan) | Ya |
| **L6 — Manual peramban** | Interaksi, papan ketik, pembaca layar, tata letak | Penelusuran manual | Tidak |
| **L7 — Lapangan** | Endpoint hidup, perangkat nyata, WhatsApp nyata, Lighthouse, GA4, indeks Google | Alat eksternal pada deployment nyata | Tidak |

L1 sampai L5 sudah berjalan dan menjadi gerbang penerbitan pada `.github/workflows/pages.yml`. **L6 dan L7 belum pernah dieksekusi satu kali pun** — itu kesenjangan terbesar proyek ini hari ini, dan Bagian 5 menyusunnya menjadi kelompok kerja yang bisa dijadwalkan.

### 1.3 Cakupan yang diuji

Seluruh FR Fase 1a termasuk FR-51 (lacak pesanan), FR-52 (lini 100 gram), dan FR-53 (katalog lewat sheet); NFR-01 sampai NFR-16 sejauh dapat diukur — dengan NFR-03 dan NFR-04 memakai angka hasil revisi `KD-04` (**≤ 190 KB ter-gzip**, **Lighthouse Performance ≥ 88**), bukan angka BRD v1.0; seluruh BR-01 sampai BR-20 dengan BR-13 dan BR-14 dibaca menurut `KD-02` revisi kedua; dan kedelapan keputusan CEO KD-01 sampai KD-08.

**Kedua target build diuji terpisah**: target Vercel (`npm run build`) dan ekspor statis GitHub Pages (`STATIC_EXPORT=1 BASE_PATH=/titikasalkopi`). Keduanya menghasilkan HTML yang berbeda dan pernah berbeda pula perilakunya (DEF-03).

### 1.4 Yang TIDAK diuji, dan alasannya

| # | Tidak diuji | Alasan |
|---|---|---|
| N-01 | **FR Fase 1b** (FR-04, FR-05, FR-06, FR-13, FR-15, FR-30, FR-32, FR-33, FR-34, FR-39, FR-40, FR-50) | Di luar ruang lingkup rilis 1a menurut BRD Bagian 13.1. Menguji fitur yang belum dibangun menghasilkan kegagalan palsu yang mengaburkan defek nyata. **Pengecualian: FR-14 (status stok) kini DIUJI PENUH** — ia sudah tayang sejak `KD-08`, bukan lagi persiapan 1b |
| N-02 | **Ketepatan isi cerita brand dan salinan pemasaran** | Bukan wewenang QA. Yang diuji adalah larangan yang dapat diperiksa mesin: tidak ada klaim sertifikasi, tidak ada janji balas selain KD-03, tidak ada atribut origin yang dikarang |
| N-03 | **Uji beban dan uji penetrasi** | Situs statis; satu-satunya permukaan tulis adalah endpoint buku order, yang pagarnya diuji sebagai kontrak pada `check-order-tracker-gs.mjs`. Uji beban tidak sebanding biayanya pada Fase 1 |
| N-04 | **Kebenaran harga sebagai keputusan bisnis** | QA memverifikasi bahwa harga yang tayang **konsisten dengan dirinya sendiri** di seluruh permukaan dan sama dengan isi sheet owner. Apakah angkanya tepat secara komersial adalah wewenang CEO (BR-01) |
| N-05 | **Ketepatan pelacakan kurir** | `/lacak` menayangkan apa yang ditulis owner di sheet, bukan apa yang kurir tahu. Batas ini dinyatakan terbuka pada `08-lacak-pesanan.md` Bagian 6 dan bukan cacat |
| N-06 | **Aturan promo "beli 2 disc 10%" dan Tier 2** | Belum ada aturannya; `11-timeline-rilis.md` Bagian 3 menyatakan keduanya menunggu CEO dan tidak boleh diiklankan sampai aturannya jelas. Tidak ada yang bisa diuji |

### 1.5 Kriteria masuk dan keluar

**Kriteria masuk:** `npx next typegen` → `npx tsc --noEmit` → `npx eslint .` → `next build` pada kedua target → `node scripts/check-all.mjs` seluruhnya keluar dengan kode 0, **dan hijaunya dicapai karena benar, bukan karena assertion disesuaikan dengan keluaran** (Prinsip 1 butir 5).

**Kriteria keluar rilis produksi 5 Oktober 2026:**

1. Seluruh test case berprioritas **Kritis** berstatus lulus, termasuk yang manual.
2. Tidak ada defek **Blocker** terbuka; setiap **Major** yang tersisa disetujui CEO secara tertulis sebagai risiko yang diterima.
3. Kelompok manual **M-0**, **M-1**, **M-2**, dan **M-3** pada Bagian 5 sudah dieksekusi seluruhnya — bukan sebagian.
4. Gerbang rilis pada `11-timeline-rilis.md` seluruhnya hijau.

---

## 2. Lingkungan dan Cara Menjalankan Gerbang

### 2.1 Lingkungan

| Komponen | Nilai |
|---|---|
| Sistem operasi | Windows 11 — PowerShell dan Git Bash |
| Node.js | v24.13.0 |
| Next.js | 16.3.4 (Turbopack) · React 19.2.8 |
| Peramban | **Belum tersedia** pada mesin QA |
| Perangkat seluler | **Belum tersedia** |
| URL staging | **Belum ada** — prasyarat seluruh kelompok M-2 (butir 1.6 `11-timeline-rilis.md`) |

### 2.2 Perintah gerbang

```
npx next typegen                 -> exit 0   (WAJIB lebih dulu; tanpa ini tsc gagal TS2304)
npx tsc --noEmit                 -> exit 0
npx eslint .                     -> exit 0
npm run build                    -> exit 0   (target Vercel)
node scripts/check-all.mjs       -> exit 0   (9 berkas pemeriksaan)
```

Ekspor statis dijalankan **dari PowerShell**, bukan Git Bash:

```
PS> $env:STATIC_EXPORT="1"; $env:BASE_PATH="/titikasalkopi"; npx next build
```

### 2.3 Dua jebakan lingkungan yang wajib diketahui pelari tes

**Pertama — MSYS merusak `BASE_PATH`.** Git Bash mengubah nilai berbentuk path POSIX menjadi path Windows, sehingga `BASE_PATH=/titikasalkopi` menjadi `C:/Program Files/Git/titikasalkopi` **tanpa satu pun pesan galat**. Seluruh build ekspor statis dijalankan dari PowerShell.

**Kedua — `check-all.mjs` membaca env yang sama dengan build.** Menjalankannya polos, tanpa env, membandingkan keluaran produksi terhadap harapan pratinjau dan memberi kegagalan palsu pada kanonis, sitemap, dan `robots.txt`. Jalankan persis seperti `pages.yml`:

```
STATIC_EXPORT=1 BASE_PATH=/titikasalkopi SITE_ENV=production
NEXT_PUBLIC_SITE_ORIGIN=https://yuzansama.github.io
```

Kegagalan pada ketiga assertion itu **hampir selalu berarti env-nya salah, bukan situsnya rusak**. Jangan mengubah assertion-nya agar hijau; perbaiki env-nya (Prinsip 1 butir 5).

---

## 3. Peta Cakupan Otomatis

Bagian ini ditulis lebih dulu supaya test case manual pada Bagian 4 dapat dibatasi pada hal yang benar-benar menuntut manusia. Angka assertion adalah keluaran nyata `node scripts/check-all.mjs`; ia bergerak seiring kode, dan **yang berlaku adalah keluaran skrip, bukan tabel ini**.

| Berkas | Assertion | Yang dijaganya |
|---|---|---|
| `check-cart.mjs` | 27 | Hitungan varian houseblend per rasio; satu harga per varian; kewajaran kedua ukuran kemasan; pita harga per gram; BR-10; kemasan mini 100 gr pada tujuh biji dan bukan Sindoro; FR-14 status sampai ke produk; reducer, storage, kedaluwarsa, data rusak, PRUNE; **invarian `qty × harga satuan == subtotal baris` dan `Σ baris == subtotal pesanan`**; tidak ada harga kedua pada baris keranjang |
| `check-whatsapp.mjs` | 24 | Kode order; pembersih catatan; **pesan bisa dijumlahkan sendiri untuk setiap jenis kemasan**; lima blok wajib; penanda sumber di badan pesan; houseblend menyebut kemasan bukan berat; batas 1.500 terkode; tangga peringkasan sebagai sifat; pengodean URL |
| `check-reply-hours.mjs` | 12 | KD-03 pada kedua sisi kedua batas, 13 jam, zona waktu lain, tujuh hari |
| `check-format.mjs` | 13 | BR-02 sampai ke titik kode, tanpa normalisasi; koma desimal Indonesia; label satuan menyebut kemasan yang dihargai; BR-02 hulu ke hilir sampai pesan WhatsApp |
| `check-picks.mjs` | 11 | KD-07: seluruh baris poster tayang dengan nama dan harga persis, urutan poster dipertahankan, slug unik dan tidak bertabrakan dengan produk 200 gr, tidak ada kopi yang dijual di kedua lini sekaligus |
| `check-sync-katalog.mjs` | 14 | KD-08: penolakan tab hilang, harga hilang, kunci salah ketik, harga pecahan/nol/negatif, salah ketik jumlah nol di kedua arah, status stok hilang, slug 100 gram bentrok, `katalog100` kosong; setiap `managedPrice()` punya kuncinya |
| `check-tracking.mjs` | 28 | FR-51: normalisasi kode, penolakan sebelum jaringan, penguraian jawaban, `found:false`, jawaban rusak, status di luar kosakata, ambang basi tepat di batas, `not-configured`; KD-06: perakitan baris, netralisasi rumus, batas panjang, `last4` tidak sah |
| `check-order-tracker-gs.mjs` | 14 | Kontrak `ops/order-tracker.gs` di atas sheet tiruan: baris lengkap, kode tidak pernah ditimpa, kuota harian, netralisasi rumus, gagal tertutup tanpa kolom `sumber`, daftar putih kolom, **kode salah dan `last4` salah menjawab byte yang sama** |
| `check-build-output.mjs` | 57 | HTML hasil build kedua target: rute, judul dan deskripsi unik, kanonis, `noindex` pada `/keranjang` dan `/lacak`, OG, JSON-LD sah dan lengkap, satuan pada Offer houseblend, BR-02 di seluruh HTML, harga sampai ke halamannya, **penanda stok kosong dan penolakan tombol pesan**, Sindoro tanpa kemasan mini, penghematan bundling dihitung, KD-01, jam balas, aksesibilitas struktural, sitemap dan robots, KD-07 |

**Yang TIDAK dijaga mesin, dan karena itu menjadi seluruh isi kelompok manual Bagian 5:** apa pun yang menuntut mesin tata letak, DOM hidup, aplikasi WhatsApp sungguhan, endpoint Apps Script yang benar-benar ter-deploy, akun Google owner, atau jam dinding.

---

## 4. Test Case

**Prioritas:** **Kritis** (kegagalannya memblokir rilis tanpa perdebatan) · **Tinggi** (memblokir kecuali CEO menerima risikonya tertulis) · **Sedang** (diperbaiki sebelum Fase 1b) · **Rendah** (dicatat).

**Cakupan:** `OTOMATIS — <berkas>` berarti butir itu sudah dijaga CI dan **tidak perlu diulang manusia**. `MANUAL — M-n` merujuk kelompok pada Bagian 5, yang menyebut persis apa yang dibutuhkan. Beberapa butir berlabel keduanya: bagian aritmetikanya dijaga mesin, bagian pengalamannya tidak.

### 4.1 Modul A — Katalog, harga, dan dua ukuran kemasan

| ID | Yang diverifikasi | Prasyarat | Langkah | Hasil yang diharapkan | Prio | Cakupan |
|---|---|---|---|---|---|---|
| **TC-301** | Hitungan katalog yang tayang sama dengan pagar `EXPECTED_*`, dan pagar itulah sumbernya | Build selesai | Baca `EXPECTED_SINGLE_ORIGIN_COUNT`, `EXPECTED_HOUSEBLEND_LINE_COUNT`, `EXPECTED_HOUSEBLEND_VARIANT_COUNT`; hitung produk dan varian pada HTML `/katalog` | Jumlah pada halaman sama dengan konstanta; menambah atau menghapus produk tanpa mengubah konstanta **menggagalkan build** lewat V-15 | Kritis | OTOMATIS — `check-build-output.mjs`, `validate.ts` V-15 |
| **TC-302** | Setiap rasio houseblend dijual dalam **tepat dua ukuran kemasan**, 1 kg dan 0,5 kg, dipasangkan lewat `groupId` | Katalog tersusun | Kelompokkan varian houseblend menurut `groupId`; periksa tiap kelompok berisi satu `unit: "kg"` dan satu `unit: "half-kg"` | Tiap kelompok tepat dua varian, satu per ukuran; kelompok yang timpang **menggagalkan build** lewat V-06 | Kritis | OTOMATIS — `check-cart.mjs`, `validate.ts` V-06 |
| **TC-303** | Setiap varian membawa **tepat satu** harga; tidak ada medan harga kedua yang bisa berbeda dari yang ditagih | Katalog tersusun | Sisir tipe `Variant` dan seluruh baris keranjang hasil resolve; cari medan harga selain `unitPrice` | Nol medan harga kedua. Ini pagar struktural atas cacat 9 September: dua angka yang tidak berhubungan aritmetika tidak bisa lagi ditulis | Kritis | OTOMATIS — `check-cart.mjs` |
| **TC-304** | Tarif `/kg` hanya muncul pada varian kemasan 1 kg — di situ ia benar dan bisa dibeli | Build selesai + peramban | Buka halaman lini houseblend; untuk setiap harga yang tayang, periksa apakah ia bersufiks `/kg`; cocokkan dengan ukuran kemasan barisnya | Sufiks `/kg` **hanya** pada baris kemasan 1 kg. Tidak ada tarif per kg di samping harga kemasan 0,5 kg | Kritis | OTOMATIS sebagian — `check-format.mjs` · **MANUAL — M-1** |
| **TC-305** | V-06 batas bawah: dua kemasan 0,5 kg wajib lebih mahal daripada satu kemasan 1 kg | Cadangan `managed.generated.ts` disalin | Turunkan satu harga berakhiran `.half` sampai dua kalinya ≤ harga per kg-nya, lalu `npm run build` | Build **gagal** dengan `[V-06] … tidak lebih mahal daripada satu kemasan 1 kg`; nol halaman dihasilkan | Kritis | MANUAL — M-0 |
| **TC-306** | V-06 batas atas: satu kemasan 0,5 kg wajib lebih murah daripada kemasan 1 kg | Sama | Naikkan satu harga `.half` sampai ≥ harga per kg-nya, lalu build | Build gagal dengan `[V-06] … tidak lebih murah daripada kemasan 1 kg` | Kritis | MANUAL — M-0 |
| **TC-307** | V-10b: kemasan mini 100 gr wajib lebih murah daripada kemasan 200 gr | Sama | Naikkan kunci `single.*.mini1` sampai ≥ harga `pack1` tier yang sama, lalu build | Build gagal dengan `[V-10] kemasan 100 gr berharga … tidak lebih murah dari kemasan 200 gr` | Tinggi | MANUAL — M-0 |
| **TC-308** | Tujuh biji menawarkan kemasan mini 100 gr, dan **Sindoro sengaja tidak** | Build selesai | Hitung varian `unit: "gram-100"` pada produk single origin; buka halaman Sindoro | Tepat tujuh biji punya kemasan mini; halaman Sindoro tidak menawarkan kemasan yang tidak dijual dan tidak menyisakan kontrol varian kosong | Kritis | OTOMATIS — `check-cart.mjs`, `check-build-output.mjs` |
| **TC-309** | BR-09: harga single origin ditentukan **tier**, bukan biji | Cadangan disalin | Ubah satu harga single origin sehingga berbeda dari biji lain bertier sama, lalu build | Build gagal `[V-11] … harga single origin ditentukan tier, bukan biji` | Tinggi | MANUAL — M-0 |
| **TC-310** | Penghematan 3 pack **dihitung dari harga**, tidak diketik manual | Build selesai | Sisir HTML halaman produk; bandingkan angka hemat yang tayang terhadap `3 × harga 1 pack − harga 3 pack` yang tayang di halaman yang sama | Kedua angka menutup persis. Tidak ada angka hemat yang ditulis sebagai teks tetap | Tinggi | OTOMATIS — `check-build-output.mjs` |
| **TC-311** | Hubungan hemat itu benar **di mata pembeli**, bukan hanya di HTML | Peramban | Buka satu halaman Signature dan satu Reguler; baca ketiga angka di layar (1 pack, 3 pack, hemat); kalikan dan kurangkan sendiri | `3 × harga 1 pack − harga 3 pack` = angka hemat yang tayang, apa pun harga yang sedang berlaku | Tinggi | MANUAL — M-1 |
| **TC-312** | BR-02: tidak pernah ada spasi antara `Rp` dan angka, di permukaan mana pun | Build selesai | Sisir seluruh HTML kedua target dengan pola `Rp` diikuti spasi, NBSP, `&nbsp;`, `&#160;`, `%C2%A0`; periksa titik kode hasil `formatIDR()` | Nol kemunculan; karakter setelah `Rp` selalu digit | Kritis | OTOMATIS — `check-format.mjs`, `check-build-output.mjs` |
| **TC-313** | KD-07: lini Katalog Kopi 100 gram tayang lengkap, dalam **urutan poster owner** | Build selesai | Bandingkan daftar yang tayang terhadap daftar poster yang diketik ulang secara terpisah di dalam skrip | Seluruh baris tayang dengan nama dan harga persis, urut sesuai poster, bukan diurutkan menurut harga atau abjad | Tinggi | OTOMATIS — `check-picks.mjs` |
| **TC-314** | Tidak ada kopi yang dijual di **dua lini sekaligus** dalam ukuran yang sama | Build selesai | Bandingkan nama pada lini 100 gram terhadap nama produk 200 gr yang punya kemasan mini | Nol tumpang tindih. Kerinci dikeluarkan dari lini 100 gram pada 9 September 2026 atas keputusan owner; alasannya tertulis di kepala `check-picks.mjs` — tetapi belum masuk `00b-ceo-decisions.md`, lihat DEF-17 | Tinggi | OTOMATIS — `check-picks.mjs` |
| **TC-315** | Tidak ada harga yang ditulis langsung di komponen tampilan | Kode sumber | Sisir `src/components` dan `src/features` mencari literal rupiah; periksa berkas `"use client"` tidak mengimpor `@/data/*` | Seluruh harga berasal dari katalog lewat props; nol pelanggaran aturan ketergantungan | Tinggi | MANUAL — M-0 |
| **TC-316** | Harga varian yang sama identik di seluruh permukaan | Peramban | Untuk satu varian, catat harga pada kartu `/katalog`, halaman produk, baris keranjang, dan pesan WhatsApp | Keempatnya angka yang sama. Tester tidak perlu tahu angkanya; yang diuji adalah kesamaannya | Kritis | MANUAL — M-1 |

### 4.2 Modul B — Keranjang

| ID | Yang diverifikasi | Prasyarat | Langkah | Hasil yang diharapkan | Prio | Cakupan |
|---|---|---|---|---|---|---|
| **TC-320** | Menambahkan varian yang sama dua kali menambah jumlah, bukan baris | Reducer dimuat | `ADD` varian yang sama dua kali | Satu baris, jumlah bertambah | Kritis | OTOMATIS — `check-cart.mjs` |
| **TC-321** | Dua varian berbeda dari produk yang sama menghasilkan dua baris | Reducer dimuat | `ADD` kemasan 1 kg dan 0,5 kg dari rasio yang sama | Dua baris terpisah, masing-masing berharga sendiri | Tinggi | OTOMATIS — `check-cart.mjs` |
| **TC-322** | Kuantitas pecahan dan `NaN` dijepit ke bilangan bulat 1..99 | Reducer dimuat | Kirim 1,7 dan `NaN` | Dijepit; tidak pernah ada pecahan pada uang | Tinggi | OTOMATIS — `check-cart.mjs` |
| **TC-323** | `SET_QTY` ≤ 0 menghapus baris, bukan menyimpan jumlah nol | Reducer dimuat | Kirim 0 dan −3 | Baris hilang | Tinggi | OTOMATIS — `check-cart.mjs` |
| **TC-324** | Catatan dipotong tepat pada 200 karakter | Reducer dimuat | Isi 250 karakter | Terpotong tepat 200 | Tinggi | OTOMATIS — `check-cart.mjs` |
| **TC-325** | Persistensi bertahan terhadap seluruh bentuk data rusak | Storage dimuat | Baca: kosong; JSON terpotong; versi skema lebih tua dan lebih baru; umur lebih dari 7 hari; item salah bentuk; slug tak dikenal; varian tak dikenal | Tidak pernah melempar. Yang tidak sah dibuang, yang sah dipertahankan, keranjang lewat 7 hari dikosongkan | Kritis | OTOMATIS — `check-cart.mjs` (7 assertion) |
| **TC-326** | Yang dipersistensikan hanya `{slug, variantId, qty}` — tanpa harga, tanpa nama | Peramban + storage | Baca kunci keranjang di `localStorage` setelah menambah dua item | Nol harga dan nol nama tersimpan. Harga selalu di-resolve saat render | Kritis | OTOMATIS — `check-cart.mjs` · **MANUAL — M-1** (konfirmasi di DevTools) |
| **TC-327** | **Harga di-resolve ulang** ketika harga berubah sementara item sudah berada di keranjang | Peramban + satu kali sinkronisasi | Isi keranjang; ubah satu harga di sheet dan terbitkan; muat ulang `/keranjang` | Baris menampilkan **harga yang tayang sekarang**, bukan harga saat ditambahkan; subtotal dan pesan WhatsApp ikut memakai harga baru | Kritis | OTOMATIS sebagian — `check-cart.mjs` · **MANUAL — M-4** |
| **TC-328** | **Invarian uang keranjang**: `qty × harga satuan = subtotal baris`, dan `Σ subtotal baris = subtotal pesanan` | Selector dimuat | Untuk setiap varian katalog, resolve satu keranjang dan periksa kedua persamaan | Keduanya berlaku pada setiap varian, apa pun harganya. **Ini pengganti seluruh assertion nilai literal yang gagal menangkap cacat 9 September** | Kritis | OTOMATIS — `check-cart.mjs` |
| **TC-329** | Keranjang bertahan setelah peramban ditutup dan dibuka kembali | Peramban | Isi dua item; tutup peramban; buka kembali `/keranjang` | Isi keranjang utuh, subtotal sama | Tinggi | MANUAL — M-1 |
| **TC-330** | Indikator jumlah item terbarui seketika di seluruh halaman | Peramban | Tambah dan hapus item sambil berpindah halaman | Angka pada header berubah tanpa muat ulang, konsisten di setiap rute | Tinggi | MANUAL — M-1 |
| **TC-331** | Baris yang produknya hilang dari katalog dibuang **dan pengunjung diberi tahu satu kali** | Peramban + satu kali sinkronisasi | Tambahkan satu biji 100 gram; owner menandainya `out-of-stock` di tab `katalog100`; terbitkan; buka `/keranjang` | Baris hilang tanpa galat; muncul pemberitahuan baris terbuang; subtotal ikut turun | Tinggi | OTOMATIS sebagian — `check-cart.mjs` (PRUNE) · **MANUAL — M-4** |
| **TC-332** | Keranjang tidak pernah dikirim ke server, kecuali satu beacon buku order yang disengaja | Kode sumber | Sisir seluruh kode mencari `fetch`, Server Action, dan endpoint pada jalur keranjang | Satu-satunya pengiriman keluar adalah `sendBeacon` KD-06 ke endpoint buku order; tidak ada yang lain, dan kegagalannya tidak pernah menahan pembukaan WhatsApp | Kritis | MANUAL — M-0 |

### 4.3 Modul C — Pesan WhatsApp

| ID | Yang diverifikasi | Prasyarat | Langkah | Hasil yang diharapkan | Prio | Cakupan |
|---|---|---|---|---|---|---|
| **TC-340** | **Pesan bisa dijumlahkan sendiri.** Angka yang tercetak di pesan wajib merekonstruksi subtotalnya | Modul dimuat | Untuk setiap baris pesan, urai angka jumlah dan harga satuan dari teks yang benar-benar tercetak, kalikan, bandingkan dengan subtotal baris yang tercetak; lalu jumlahkan seluruh subtotal baris dan bandingkan dengan subtotal pesanan | Kedua persamaan berlaku. **Cacat 9 September ("5 kg x Rp205.000/kg" di atas "Subtotal: Rp1.150.000") melanggar tepat butir ini** | Kritis | OTOMATIS — `check-whatsapp.mjs` |
| **TC-341** | Aritmetika itu utuh untuk **setiap jenis kemasan yang dijual** | Modul dimuat | Ulangi TC-340 untuk `pack`, `paket`, `kg`, `half-kg`, dan `gram-100` | Tidak ada satuan yang lolos tanpa diperiksa | Kritis | OTOMATIS — `check-whatsapp.mjs` |
| **TC-342** | Baris houseblend menyebut **jumlah kemasan**, bukan berat, dan tarif `/kg` hanya pada kemasan 1 kg | Modul dimuat | Bangkitkan pesan untuk kedua ukuran kemasan satu rasio | Baris jumlah menghitung kemasan; kemasan 0,5 kg tertulis sebagai kemasan dan aritmetikanya utuh | Kritis | OTOMATIS — `check-whatsapp.mjs`, `check-format.mjs` |
| **TC-343** | Kelima blok wajib selalu ada | Modul dimuat | Bangkitkan pesan untuk keranjang berisi | Salam pembuka, `Kode order:`, subtotal pesanan, pernyataan ongkir, dan penanda sumber — kelimanya ada | Kritis | OTOMATIS — `check-whatsapp.mjs` |
| **TC-344** | Penanda sumber berada di **badan pesan**, bukan sebagai parameter UTM | Modul dimuat | Periksa letak baris `Dikirim dari …` | Ada di dalam teks pesan; UTM tidak pernah sampai lewat `wa.me` | Kritis | OTOMATIS — `check-whatsapp.mjs` |
| **TC-345** | **Tangga peringkasan sebagai sifat**, bukan sebagai ambang angka | Modul dimuat | Sapu n = 1 sampai jumlah varian katalog; amati bentuk pesan pada setiap n | Bentuk hanya boleh menurun berurutan (penuh → ringkas → dipotong) dan tidak pernah naik kembali; kelima blok wajib tidak pernah hilang; panjang terkode ≤ 1.500 pada setiap n; blok `(+N item lainnya)` muncul saat dipotong | Kritis | OTOMATIS — `check-whatsapp.mjs` |
| **TC-346** | Pembersih catatan menahan seluruh bentuk penyalahgunaan | Modul dimuat | Catatan berisi baris baru, karakter kontrol, pemalsuan `Kode order:` dan `Dikirim dari`, serta lebih panjang dari batas | Diratakan, dibersihkan, pemalsuan dibuang, dipotong tepat pada batas; catatan kosong tidak menghasilkan blok kosong | Tinggi | OTOMATIS — `check-whatsapp.mjs` |
| **TC-347** | Kode order: pola, tanggal lokal pembeli, alfabet tanpa karakter ambigu, batas atas acak | Modul dimuat | Bangkitkan kode pada beberapa tanggal dan nilai acak | Cocok `TAK-YYMMDD-XXXX`; memakai tanggal lokal pembeli; tanpa `0`, `O`, `1`, `I`, `L` | Tinggi | OTOMATIS — `check-whatsapp.mjs` |
| **TC-348** | Pengodean URL benar dan dapat dibalik, tanpa NBSP terkode | Modul dimuat | Kodekan pesan panjang; balikkan pengodeannya; cari `%C2%A0` | Pembalikan mengembalikan teks asli persis; nol `%C2%A0` | Kritis | OTOMATIS — `check-whatsapp.mjs`, `check-format.mjs` |
| **TC-349** | **Pesan yang benar-benar sampai** terbaca utuh dan aritmetikanya benar **di layar pembeli** | Android + iOS + WhatsApp Web, nomor tujuan sungguhan | Susun keranjang berisi minimal satu single origin, satu kemasan 1 kg, satu kemasan 0,5 kg, dan satu biji 100 gram; kirim dari ketiga perangkat; **baca pesan yang tiba di nomor tujuan** dan hitung sendiri setiap barisnya | Pesan tiba utuh, tidak terpotong, baris tidak berantakan; untuk setiap baris, jumlah × harga satuan yang **terbaca di layar** = subtotal baris; jumlah seluruh subtotal = subtotal pesanan. **Tidak dapat digantikan pembuktian aritmetika di Node** (R-04, NFR-15) | Kritis | MANUAL — M-3 |
| **TC-350** | Pesan "Tanya produk ini" menyebut identitas dan harga tanpa kode order | Modul dimuat + perangkat | Tekan tombol tanya pada satu single origin dan satu houseblend | Menyebut nama, kategori, varian, harga kemasan yang ditanyakan, dan penanda sumber; **tanpa** kode order | Tinggi | OTOMATIS — `check-whatsapp.mjs` · **MANUAL — M-3** (keterbacaan) |
| **TC-351** | Pesan tidak memuat data pribadi pembeli selain 4 digit opsional yang ia isi sendiri | Kode sumber + perangkat | Sisir seluruh jalur pesan mencari medan nama, alamat, nomor telepon; baca pesan yang tiba | Nol medan data pribadi. Empat digit terakhir hanya ikut ke buku order, bukan ke badan pesan | Kritis | MANUAL — M-0 dan M-3 |
| **TC-352** | Alur beli maksimal 3 ketukan dari halaman produk sampai WhatsApp terbuka | Peramban atau perangkat | Hitung ketukan: pilih varian → tambah → keranjang → tombol pesan | Maksimal 3 ketukan bermakna (NFR-14) | Tinggi | MANUAL — M-1 |

### 4.4 Modul D — Lacak pesanan (`/lacak`)

Assertion yang ada seluruhnya berjalan di atas **fixture**. Endpoint hidup belum pernah disentuh satu kali pun; itulah isi TC-370 ke bawah.

| ID | Yang diverifikasi | Prasyarat | Langkah | Hasil yang diharapkan | Prio | Cakupan |
|---|---|---|---|---|---|---|
| **TC-360** | Kode order dinormalisasi dari bentuk yang biasa disalin pembeli | Modul dimuat | Masukkan kode berspasi, huruf kecil, dan berimbuhan salin-tempel | Dinormalisasi ke bentuk kanonis sebelum dikirim | Tinggi | OTOMATIS — `check-tracking.mjs` |
| **TC-361** | Masukan tidak sah ditolak **sebelum jaringan dipakai**, dengan pesan yang bisa ditindaklanjuti | Modul dimuat | Kirim kode kosong, bentuk salah, dan `last4` bukan 4 digit | Ditolak lokal; setiap masalah punya pesannya sendiri | Tinggi | OTOMATIS — `check-tracking.mjs` |
| **TC-362** | `found:false` menjadi "tidak ditemukan", bukan galat | Modul dimuat | Beri jawaban `{"found":false}` | Status `not-found`, bukan lemparan | Tinggi | OTOMATIS — `check-tracking.mjs` |
| **TC-363** | Jawaban rusak tidak pernah dipaksa menjadi pesanan; medan tak dikenal tidak terbawa | Modul dimuat | Beri JSON rusak, JSON tanpa medan wajib, dan JSON bermedan asing | `error: jawaban-rusak`; medan asing tidak pernah sampai ke UI (batas kepercayaan) | Kritis | OTOMATIS — `check-tracking.mjs` |
| **TC-364** | Status di luar kosakata dilaporkan apa adanya, tidak ditebak | Modul dimuat | Beri status yang salah ketik | Halaman menyatakan statusnya belum dikenali; tidak menampilkan status lain | Kritis | OTOMATIS — `check-tracking.mjs` |
| **TC-365** | Kejujuran atas kebasian, tepat pada ambangnya | Modul dimuat | Uji tanggal status 4, 5, dan 6 hari lalu; status final; tanggal hilang dan rusak | Basi hanya setelah melewati ambang; status final tidak pernah basi; tanggal hilang atau rusak dianggap basi, bukan segar | Tinggi | OTOMATIS — `check-tracking.mjs` |
| **TC-366** | Endpoint kosong menghasilkan "belum aktif", bukan galat jaringan | Modul dimuat | Kosongkan `NEXT_PUBLIC_TRACKING_ENDPOINT` | `not-configured`; halaman tetap tayang dan mengarahkan ke WhatsApp | Tinggi | OTOMATIS — `check-tracking.mjs` |
| **TC-367** | Daftar putih kolom Apps Script sama dengan medan yang dibaca situs; kolom internal tidak pernah keluar | Modul dimuat | Jalankan `ops/order-tracker.gs` di atas sheet tiruan berisi `catatan_internal` dan kolom tambahan | Hanya kolom daftar putih terkirim; nama, telepon, alamat, dan catatan internal tidak pernah keluar | Kritis | OTOMATIS — `check-order-tracker-gs.mjs`, `check-tracking.mjs` |
| **TC-368** | Kode salah dan `last4` salah menghasilkan jawaban **yang persis sama** | Modul dimuat | Bandingkan byte jawaban untuk kode tidak ada versus kode benar dengan `last4` salah | Identik. Membedakannya mengubah endpoint menjadi alat menebak pesanan orang lain | Kritis | OTOMATIS — `check-order-tracker-gs.mjs` |
| **TC-369** | `/lacak` tidak terindeks dan HTML-nya tidak memuat data pesanan siapa pun | Build selesai | Periksa `meta robots`, isi sitemap, `robots.txt` produksi, dan HTML `/lacak` | `noindex`; tidak ada di sitemap; dilarang di `robots.txt`; HTML kosong dari data pesanan | Kritis | OTOMATIS — `check-build-output.mjs` |
| **TC-370** | **Ujung ke ujung dengan pesanan sungguhan** terhadap Apps Script yang benar-benar ter-deploy | URL ter-deploy + sheet owner + Apps Script versi terbaru | Pesan dari situs dengan 4 digit diisi → buka sheet, cari baris `sumber` = `web` → buka `/lacak`, masukkan kode dan 4 digit | Baris muncul lengkap (kode, ringkasan, subtotal, tanggal, status awal `menunggu-konfirmasi`); `/lacak` menampilkan status yang sama dengan sheet | Kritis | MANUAL — M-4 |
| **TC-371** | Cabang gagal: kode benar, 4 digit salah — pada endpoint hidup | Sama | Cari dengan kode yang ada tetapi 4 digit salah, lalu dengan kode yang tidak ada; bandingkan jawaban | Kedua jawaban identik di layar; tidak ada petunjuk bahwa kodenya ada | Kritis | MANUAL — M-4 |
| **TC-372** | Cabang gagal: kode tidak ditemukan | Sama | Cari kode acak yang sah bentuknya | Pesan "tidak ditemukan" beserta ajakan bertanya lewat WhatsApp | Tinggi | MANUAL — M-4 |
| **TC-373** | Cabang gagal: endpoint mati, lambat, atau menjawab rusak | Sama | Arahkan sementara ke URL yang tidak menjawab; ulangi dengan URL yang menjawab bukan JSON | Pesan galat jaringan atau waktu habis yang bisa dibaca pembeli, bukan halaman kosong; jalur WhatsApp tetap ditawarkan | Tinggi | MANUAL — M-4 |
| **TC-374** | Cabang gagal: pembeli **mengosongkan** kolom 4 digit | Sama | Pesan tanpa mengisi 4 digit; periksa sheet; owner mengisi `last4` dari nomor pengirim; ulangi pelacakan | Baris tetap lengkap dengan `last4` kosong; pelacakan hidup setelah owner mengisinya. Kolom itu tidak boleh menjadi wajib | Tinggi | MANUAL — M-4 |
| **TC-375** | Ketukan ganda tidak menghasilkan dua baris, dan kode yang sudah ada tidak pernah ditimpa | Sama | Tekan tombol pesan dua kali cepat; lalu kirim ulang kode yang sudah tercatat setelah owner menyunting barisnya | Satu baris untuk ketukan ganda (tombol terkunci dua detik); baris yang sudah disunting owner tidak berubah | Tinggi | OTOMATIS sebagian — `check-order-tracker-gs.mjs` · **MANUAL — M-4** |
| **TC-376** | Kuota 50 baris otomatis per hari benar-benar menutup endpoint | Sama | Baca implementasi kuota; jalankan satu rangkaian tulis terbatas dan amati penghitungnya bertambah | Penghitung naik dari kolom `sumber`; setelah batas, penulisan ditolak. **Jangan menghabiskan kuota pada sheet produksi** — pakai salinan sheet | Sedang | OTOMATIS sebagian — `check-order-tracker-gs.mjs` · **MANUAL — M-4** |
| **TC-377** | Netralisasi rumus benar-benar bekerja **di dalam Google Sheets**, bukan hanya di skrip | Sama + owner membuka sheet | Pesan dengan catatan yang diawali `=`, `+`, `-`, dan `@`; owner membuka sheet | Sel berisi teks apa adanya; Google Sheets tidak mengeksekusinya sebagai rumus | Kritis | OTOMATIS sebagian — `check-tracking.mjs` · **MANUAL — M-4** |
| **TC-378** | Banner "status mungkin sudah tidak mutakhir" tayang setelah ambangnya lewat | Sama | Owner memundurkan `tanggal_status` sebuah pesanan yang belum selesai melewati ambang basi; buka `/lacak` | Banner tayang beserta ajakan bertanya lewat WhatsApp; status final tidak pernah memunculkannya | Tinggi | MANUAL — M-4 |
| **TC-379** | **Pencatatan tidak boleh menunda atau menggagalkan pembukaan WhatsApp** | Peramban + endpoint dimatikan | Kosongkan atau matikan endpoint buku order; tekan "Pesan via WhatsApp" | WhatsApp terbuka seketika dengan pesan lengkap; kegagalan pencatatan tidak terlihat pembeli dan tidak menahan apa pun | Kritis | MANUAL — M-1 |

### 4.5 Modul E — Sinkronisasi katalog dari sheet owner (KD-08)

| ID | Yang diverifikasi | Prasyarat | Langkah | Hasil yang diharapkan | Prio | Cakupan |
|---|---|---|---|---|---|---|
| **TC-390** | `validateCatalogPayload()` menolak setiap bentuk data sheet yang meragukan | Modul dimuat | Umpankan: tab hilang satu per satu; `katalog100` kosong; jawaban rusak total; harga hilang; salah ketik jumlah nol di kedua arah; harga pecahan, nol, dan negatif; kunci salah ketik; status stok hilang atau tak dikenal; slug 100 gram bentrok atau ganda; baris tanpa nama | Setiap kasus **ditolak dengan pesan sendiri**, dan **tidak ada berkas yang disentuh**. Gagal tertutup, bukan diterbitkan sebagai kosong atau nol | Kritis | OTOMATIS — `check-sync-katalog.mjs` |
| **TC-391** | Setiap `managedPrice()` di `products.ts` punya kunci yang benar-benar ada | Modul dimuat | Bandingkan seluruh pemanggilan `managedPrice()` terhadap kunci pada tab `harga` | Nol kunci hilang. Kunci hilang **melempar**, bukan mengembalikan 0 — nol akan tayang sebagai "Rp0" dan ikut ke pesan WhatsApp sebagai penawaran sungguhan | Kritis | OTOMATIS — `check-sync-katalog.mjs` |
| **TC-392** | Berkas hasil sinkronisasi menyatakan dirinya tidak boleh disunting tangan | Modul dimuat | Baca kepala `managed.generated.ts` | Peringatan tertulis; suntingan tangan hilang pada sinkronisasi berikutnya | Sedang | OTOMATIS — `check-sync-katalog.mjs` |
| **TC-393** | Endpoint hidup benar-benar melayani `?katalog=1` dengan ketiga tab | Apps Script versi terbaru ter-deploy + tiga tab terisi | Panggil `GET <endpoint>?katalog=1` | Mengembalikan `harga`, `stok`, dan `katalog100` yang terisi. **Keadaan yang diketahui per 9 September 2026: masih menjawab `{"found":false}`, sehingga cron sinkronisasi gagal setiap malam** — butir 1.1 `11-timeline-rilis.md` | Kritis | MANUAL — M-4 |
| **TC-394** | **Owner mengubah satu harga sendiri, tanpa dibantu, dalam ≤ 15 menit** (NFR-13, G-10) | Owner hadir + akun Google + stopwatch | Owner membuka sheet, mengubah satu harga, menjalankan workflow, menunggu situs terbit; QA mendampingi tanpa memberi petunjuk | Selesai ≤ 15 menit; **harga baru yang sama tayang di kartu katalog, halaman produk, keranjang, dan pesan WhatsApp** — keempatnya berubah bersama. Bila gagal, NFR-13 tidak boleh diklaim | Kritis | MANUAL — M-4 |
| **TC-395** | Sinkronisasi yang gagal **tidak merusak situs**: katalog terakhir yang benar tetap tayang | Akses GitHub Actions | Ketik satu kunci yang salah di tab `harga`; jalankan workflow | Run merah dengan pesan berbahasa manusia; `managed.generated.ts` tidak berubah; situs tetap menayangkan katalog sebelumnya | Kritis | MANUAL — M-4 |
| **TC-396** | Cron 01.00 WIB berjalan hijau tiga malam berturut-turut | Cron aktif | Amati tiga run terjadwal berikutnya | Tiga hijau berturut-turut; ini butir gerbang rilis pada `11-timeline-rilis.md` | Tinggi | MANUAL — M-5 |
| **TC-397** | Setiap perubahan harga masuk riwayat git dengan tanggal dan isinya | Repositori | `git log` pada `managed.generated.ts` | Setiap perubahan harga punya commit tersendiri yang bisa dibaca dan dikembalikan | Sedang | MANUAL — M-0 |
| **TC-398** | **Alur sinkronisasi tidak mengunci harga sebagai literal.** Owner mengubah harga tidak boleh membuat CI merah | Pohon kerja bersih | Ubah satu harga pada `managed.generated.ts` secara lokal, naik dan turun, tetap di dalam batas kewarasan dan batas V-06 serta V-10b; jalankan `node scripts/check-all.mjs`; kembalikan berkas | **Seluruh pemeriksaan tetap hijau.** Satu pun assertion yang merah karena harga berubah adalah defek pada suite, bukan pada harga — dan wajib diganti invarian sebelum rilis. Ini butir yang mencegah kambuhnya cacat 9 September | Kritis | MANUAL — M-0 |

### 4.6 Modul F — Status stok (FR-14)

| ID | Yang diverifikasi | Prasyarat | Langkah | Hasil yang diharapkan | Prio | Cakupan |
|---|---|---|---|---|---|---|
| **TC-400** | Setiap produk membawa status yang dikenal, dan status dari sheet **sampai ke produk**, tidak berhenti di data | Katalog tersusun | Bandingkan `managedStatus(slug)` terhadap `Product.status` untuk seluruh produk | Nilai sama untuk seluruhnya; nilai di luar `available` dan `out-of-stock` menggagalkan build | Kritis | OTOMATIS — `check-cart.mjs`, `validate.ts` V-03 |
| **TC-401** | Produk yang ditandai kosong **berhenti bisa dipesan** dari halaman dan kartunya | Build selesai dengan satu produk `out-of-stock` | Periksa HTML kartu katalog dan halaman produk | Penanda stok kosong tayang di keduanya, dan kontrol tambah ke keranjang **menolak**, bukan sekadar diberi label | Kritis | OTOMATIS — `check-build-output.mjs` |
| **TC-402** | **Produk yang sudah berada di keranjang lalu ditandai kosong tidak boleh tetap dipesan** | Peramban + satu kali sinkronisasi | Tambahkan satu produk ke keranjang; owner menandai produk itu `out-of-stock` di tab `stok`; terbitkan; muat ulang `/keranjang`; tekan "Pesan via WhatsApp" | Baris ditandai kosong dan **tidak ikut** subtotal maupun pesan WhatsApp, atau checkout ditahan sampai pembeli mengeluarkannya. **Keadaan sekarang: GAGAL — lihat DEF-15.** `cartCatalogIndex` tidak membawa `status`, sehingga baris lama resolve normal dan ikut ke pesan serta ke baris otomatis buku order | Kritis | MANUAL — M-1 · **DEF-15 terbuka** |
| **TC-403** | Biji 100 gram yang ditandai kosong **hilang** dari situs, dan keranjang yang memuatnya membuang barisnya dengan pemberitahuan | Sama | Tandai satu baris `katalog100` sebagai `out-of-stock`; terbitkan; periksa `/katalog` dan keranjang yang sudah memuatnya | Baris hilang dari daftar tanpa dihapus dari sheet; keranjang lama membuang barisnya lewat PRUNE dan memberi tahu pengunjung satu kali | Tinggi | OTOMATIS sebagian — `check-cart.mjs` · **MANUAL — M-4** |
| **TC-404** | Kedua lini memperlakukan "kosong" secara berbeda, dan perbedaan itu **disengaja serta terdokumentasi** | Dokumen + build | Bandingkan perilaku produk 200 gr (penanda tayang, halaman tetap ada) terhadap biji 100 gram (baris disembunyikan) dengan `09-kelola-katalog.md` Bagian 2 | Perbedaan sesuai dokumen owner: produk punya halaman ber-URL permanen yang tidak boleh menghilang, biji 100 gram hanya baris daftar. Bila dokumen dan perilaku berbeda, salah satunya salah — dan tidak boleh dibiarkan | Sedang | MANUAL — M-0 |

### 4.7 Modul G — SEO dan metadata

| ID | Yang diverifikasi | Prasyarat | Langkah | Hasil yang diharapkan | Prio | Cakupan |
|---|---|---|---|---|---|---|
| **TC-410** | Seluruh rute publik hadir statis, berjudul dan berdeskripsi **unik**, berkanonis absolut yang menunjuk rutenya sendiri | Build kedua target | Sisir HTML hasil build | Seluruh rute ada; nol judul kembar; deskripsi ada dan unik; kanonis absolut dan menunjuk dirinya | Kritis | OTOMATIS — `check-build-output.mjs` |
| **TC-411** | `noindex` tepat pada `/keranjang` dan `/lacak`, dan tidak pada rute publik mana pun; sitemap serta `robots.txt` sejalan | Build kedua target | Periksa `meta robots`, `sitemap.xml`, dan `robots.txt` pada build pratinjau dan produksi | Hanya kedua rute itu ber-`noindex` dan absen dari sitemap; kanonis dan `<loc>` sama persis termasuk garis miring; `robots.txt` mengikuti `SITE_ENV` | Kritis | OTOMATIS — `check-build-output.mjs` |
| **TC-412** | JSON-LD sah dan lengkap, dan `Offer` houseblend **menyebut satuannya** | Build kedua target | Urai setiap blok `ld+json`; periksa `Product`, `Offer`, `BreadcrumbList` pada seluruh halaman produk dan `Organization` pada beranda | Seluruh blok terurai; `Offer` houseblend tidak bisa terbaca sebagai harga per kilogram tanpa keterangan satuan (pagar DEF-02) | Kritis | OTOMATIS — `check-build-output.mjs` |
| **TC-413** | Alias pencarian yang tayang hanya yang sudah dikonfirmasi owner (BR-20) | Build kedua target | Sisir HTML mencari alias; bandingkan dengan konfirmasi tertulis owner | Alias yang dikonfirmasi tayang; alias yang belum dikonfirmasi tidak. Assertion-nya **dibalik**, bukan dihapus, saat OQ-12 ditutup — sehingga cakupannya selamat bila keputusannya dibalik lagi | Tinggi | OTOMATIS — `check-build-output.mjs` |
| **TC-414** | Kartu pratinjau tautan benar di WhatsApp, Instagram, dan Facebook | Domain final tayang | Tempel tautan beranda dan satu halaman produk di ketiga kanal | Kartu memuat judul, deskripsi, dan gambar yang benar | Tinggi | MANUAL — M-2 |
| **TC-415** | Rich Results Test lolos pada halaman produk | URL ter-deploy | Jalankan Rich Results Test pada beberapa halaman produk dan beranda | Lolos tanpa galat | Tinggi | MANUAL — M-2 |
| **TC-416** | Search Console terverifikasi di origin final dan sitemap terkirim | Akun Google atas nama brand + domain final | Verifikasi properti; kirim sitemap; periksa cakupan setelah beberapa hari | Domain terverifikasi; sitemap diterima; halaman produk mulai terindeks | Tinggi | MANUAL — M-4 |
| **TC-417** | GA4 menerima kesembilan event beserta parameternya, dan `click_whatsapp_order` ditandai konversi | Properti GA4 + `NEXT_PUBLIC_GA_ID` terisi | Picu setiap event dan amati DebugView; tandai konversi | Seluruh event tiba beserta `product_id`, `variant`, `source_page`, `cart_value`, dan `order_code`; tanpa env var seluruh fungsi tetap no-op dan aman saat pembangkitan statis | Kritis | MANUAL — M-4 |

### 4.8 Modul H — Aksesibilitas

| ID | Yang diverifikasi | Prasyarat | Langkah | Hasil yang diharapkan | Prio | Cakupan |
|---|---|---|---|---|---|---|
| **TC-420** | Struktur HTML dan pemakaian warna sesuai BRD Bagian 12.1 | Build kedua target | Periksa jumlah `<h1>`, urutan heading, `alt`, landmark `<main>`, tautan lewati, `lang`, pasangan warna terlarang, dan `outline-none` | Satu `<h1>` per halaman; tidak ada lompatan tingkat; nol gambar tanpa `alt`; nol pasangan warna terlarang | Tinggi | OTOMATIS — `check-build-output.mjs` |
| **TC-421** | Pemeriksaan aksesibilitas otomatis pada DOM hidup | Peramban + axe | Jalankan axe pada beranda, katalog, satu halaman produk, satu halaman houseblend, keranjang, dan `/lacak` | Tanpa pelanggaran serius | Kritis | MANUAL — M-1 |
| **TC-422** | Alur beli lengkap dapat diselesaikan **hanya dengan papan ketik** | Peramban | Katalog → detail → pilih ukuran kemasan → tambah → keranjang → isi 4 digit → tombol WhatsApp, seluruhnya tanpa tetikus | Setiap langkah tercapai; tidak ada jebakan fokus; indikator fokus selalu terlihat | Kritis | MANUAL — M-1 |
| **TC-423** | Kontrol punya nama yang terbaca pembaca layar, dan perubahan subtotal diumumkan | NVDA atau VoiceOver | Telusuri halaman produk dan keranjang; ubah kuantitas | Setiap kontrol bernama bermakna; perubahan subtotal diumumkan lewat `aria-live` | Tinggi | MANUAL — M-1 |
| **TC-424** | Target sentuh cukup besar dan tidak ada penggeseran horizontal | Peramban | Ukur seluruh tombol dan tautan; muat pada lebar 320, 360, 390, 768, 1280, dan 1920 px | Minimal 44 × 44 px dengan jarak antar target 8 px; nol penggeseran horizontal pada setiap lebar | Tinggi | MANUAL — M-1 |
| **TC-425** | Tabel rasio houseblend terbaca di layar sempit tanpa memaksa halaman menggeser | Peramban lebar 360 px | Buka halaman lini houseblend; geser tabel | Area geser tabel ditandai jelas; **halaman** tidak ikut menggeser; kedua kolom harga (1 kg dan 0,5 kg) terbaca | Tinggi | MANUAL — M-1 |

### 4.9 Modul I — Performa, perangkat, dan penyajian

| ID | Yang diverifikasi | Prasyarat | Langkah | Hasil yang diharapkan | Prio | Cakupan |
|---|---|---|---|---|---|---|
| **TC-430** | Lighthouse mobile pada lima halaman, memakai angka hasil revisi KD-04 | Chrome + URL ter-deploy | Tiga kali jalan, ambil median, pada beranda, katalog, satu halaman produk, satu houseblend, dan keranjang | Performance ≥ **88**, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95 | Kritis | MANUAL — M-2 |
| **TC-431** | LCP, INP, dan TTFB pada profil lambat | Chrome + throttling Slow 4G, CPU 4× | Ukur pada beranda, katalog, dan halaman produk | LCP ≤ 2,5 detik; INP ≤ 200 ms; TTFB ≤ 600 ms | Kritis | MANUAL — M-2 |
| **TC-432** | CLS dengan pemuatan gambar diperlambat | Chrome | Ukur seluruh halaman | CLS ≤ 0,05 | Tinggi | MANUAL — M-2 |
| **TC-433** | Anggaran JavaScript diukur pada **rute terberat**, bukan pada rute yang kebetulan diukur lebih dulu | Ekspor statis selesai | `gzip -9` setiap chunk yang dirujuk setiap rute; jumlahkan per rute; ambil yang terbesar | Rute terberat ≤ **190 KB ter-gzip** (NFR-03 setelah KD-04). Marginnya tipis dan tiga fitur ditambahkan sejak pengukuran terakhir; **belum ada gerbang di CI** — lihat DEF-16 | Kritis | MANUAL — M-0 |
| **TC-434** | Situs berfungsi penuh pada perangkat fisik | Android kelas menengah + Safari iOS | Telusuri alur beli lengkap pada keduanya | Berfungsi penuh; tata letak utuh; tombol terjangkau ibu jari | Kritis | MANUAL — M-3 |
| **TC-435** | Situs berfungsi pada peramban desktop arus utama | Chrome, Edge, dan Firefox dua versi terakhir | Telusuri alur beli lengkap | Berfungsi penuh pada ketiganya | Tinggi | MANUAL — M-1 |
| **TC-436** | HTTPS, pengalihan dari HTTP, dan ketiadaan konten campuran pada domain final | Domain diarahkan | Ambil `http://` dan `https://`; periksa sertifikat dan konsol | HTTPS aktif, sertifikat sah, pengalihan otomatis, nol konten campuran | Kritis | MANUAL — M-2 |
| **TC-437** | Pemantauan uptime memberi tahu owner | Layanan pemantauan terpasang | Pasang monitor; picu gangguan uji | Pemberitahuan sampai ke owner dalam ≤ 5 menit | Tinggi | MANUAL — M-4 |

---

## 5. Kelompok Manual: Apa yang Membuka Apa

Enam kelompok, diurutkan dari yang **paling murah dibereskan**. M-0 dan M-1 tidak menunggu siapa pun dan seharusnya dikerjakan lebih dulu; M-4 seluruhnya menunggu CEO atau owner dan karena itu wajib **dijadwalkan** paling awal walau **dikerjakan** paling akhir.

| Kelompok | Yang dibutuhkan | Test case | Jumlah | Estimasi |
|---|---|---|---|---|
| **M-0 — Terminal saja** | Node dan repositori. Tidak perlu peramban, tidak perlu deployment, tidak menunggu siapa pun | TC-305, TC-306, TC-307, TC-309, TC-315, TC-332, TC-351 (bagian kode), TC-397, TC-398, TC-404, TC-433 | 11 | **0,5 hari** |
| **M-1 — Peramban di mesin QA** | Satu peramban desktop, DevTools, dan axe; situs dijalankan lokal (`next start` atau `out/` disajikan sebagai berkas statis). **Tidak** menunggu staging | TC-304, TC-311, TC-316, TC-326, TC-329, TC-330, TC-352, TC-379, TC-402, TC-421, TC-422, TC-423, TC-424, TC-425, TC-435 | 15 | **1,5 hari** |
| **M-2 — URL ter-deploy** | Environment staging atau domain final yang bisa dibuka dari luar (butir 1.6 dan 1.2 `11-timeline-rilis.md`) | TC-414, TC-415, TC-430, TC-431, TC-432, TC-436 | 6 | **1 hari** |
| **M-3 — Perangkat fisik dan nomor WhatsApp sungguhan** | Satu Android kelas menengah, satu iPhone, WhatsApp Web, dan satu nomor tujuan sungguhan yang isinya bisa dibaca | TC-349, TC-350, TC-351 (bagian perangkat), TC-434 | 4 | **1 hari** |
| **M-4 — Akun Google owner** | Owner hadir; spreadsheet buku order; Apps Script ter-deploy versi terbaru; akses GitHub Actions; properti GA4; Search Console; stopwatch | TC-327, TC-331, TC-370, TC-371, TC-372, TC-373, TC-374, TC-375, TC-376, TC-377, TC-378, TC-393, TC-394, TC-395, TC-403, TC-416, TC-417, TC-437 | 18 | **1,5 hari kerja QA**, tersebar karena menunggu owner |
| **M-5 — Waktu berjalan** | Kalender, bukan usaha | TC-396 | 1 | 3 hari kalender, hampir nol jam kerja |

Jumlah baris kelompok 55 sementara test case manualnya 54, karena TC-351 muncul di dua kelompok: bagian kodenya dikerjakan di M-0, bagian perangkatnya di M-3.

**Urutan yang saya sarankan ke CEO.** Kerjakan M-0 dan M-1 sekarang — keduanya tidak menunggu apa pun dan bersama-sama menutup **26 dari 54** test case manual dengan **dua hari kerja**. Keduanya juga memuat butir yang paling mungkin menemukan cacat: TC-402 (stok kosong pada keranjang yang sudah terisi), TC-398 (suite tidak boleh merah hanya karena harga berubah), dan TC-422 (alur beli dengan papan ketik saja). M-2 menyusul begitu staging berdiri. M-3 dan M-4 bergantung pada hal di luar kode dan sudah menjadi butir Sprint 1; menjadwalkannya belakangan berarti menemukan masalahnya belakangan.

**Yang tidak boleh ditukar dengan bukti lain.** TC-349 (kiriman WhatsApp nyata) menutup R-04 dan NFR-15, dan **tidak dapat digantikan pembuktian aritmetika**: yang sudah terbukti adalah panjang dan struktur teksnya, bukan bahwa WhatsApp menampilkannya utuh dan rapi. Dua pernyataan yang berbeda. Hal yang sama berlaku untuk TC-394: seluruh gerbang teknisnya bisa hijau sementara owner tetap tidak bisa mengubah harga sendiri.

---

## 6. Matriks Keterlacakan Ringkas

| Sumber kebutuhan | Test case |
|---|---|
| FR-01, FR-02, FR-03, FR-09 | TC-301, TC-313, TC-316, TC-410 |
| FR-07, FR-10, FR-12 | TC-308, TC-420, kelompok M-1 |
| FR-11, BR-11, KD-01 | TC-302, TC-304, TC-308, TC-310, TC-311 |
| FR-14 (naik ke Fase 1a lewat KD-08) | TC-400, TC-401, TC-402, TC-403, TC-404 |
| FR-16 sampai FR-20, ADR-04 | TC-320 sampai TC-332 |
| FR-21, BR-13, BR-14, **KD-02 revisi kedua** | TC-302, TC-303, TC-304, TC-305, TC-306, TC-342 |
| FR-22, FR-23, FR-24, NFR-15, R-04 | TC-340 sampai TC-352 |
| FR-26, BR-18, BR-19, KD-03 | TC-343, `check-reply-hours.mjs`, `check-build-output.mjs` |
| FR-41, FR-42, FR-43, NFR-12, NFR-13 | TC-305 sampai TC-309, TC-315, TC-390 sampai TC-398 |
| FR-44 sampai FR-49, NFR-10 | TC-410 sampai TC-415 |
| FR-47, G-01, G-03, G-04 | TC-417 |
| **FR-51, KD-05, KD-06** | TC-360 sampai TC-379 |
| **FR-52, KD-07** | TC-313, TC-314, TC-403 |
| **FR-53, KD-08, G-10** | TC-327, TC-331, TC-390 sampai TC-398 |
| NFR-03, NFR-04 (angka **KD-04**) | TC-430, TC-433 |
| NFR-01, NFR-02, NFR-05, NFR-06 | TC-424, TC-425, TC-431, TC-432, TC-434, TC-435 |
| NFR-07, BRD 12.1 | TC-420 sampai TC-425 |
| NFR-08, NFR-09 | TC-436, TC-437 |
| NFR-16, O-19 | TC-326, TC-332, TC-351, TC-367, TC-368 |

### 6.1 Pemetaan ID lama ke ID baru

Rujukan ke rencana v1.x yang masih hidup di dokumen lain:

| ID lama (arsip v1.x) | ID baru | Butir |
|---|---|---|
| TC-110 | **TC-349** | Kiriman WhatsApp nyata pada tiga perangkat |
| TC-144 | **TC-422** | Alur beli lengkap dengan papan ketik saja |
| TC-193, TC-197 | **TC-433** | Anggaran JavaScript |
| TC-194 | **TC-430** | Lighthouse pada lima halaman |
| TC-206 | **TC-394** | Owner mengubah harga sendiri dalam ≤ 15 menit |
| TC-039…TC-056 (Modul E lama) | **dicabut** | Menegakkan aturan "harga 0,5 kg tepat setengah harga per kg" yang dibatalkan `KD-02` revisi kedua. Penggantinya TC-302, TC-305, dan TC-306 |

---

## 7. Daftar Defek

Ledger ini **dibawa utuh** dari v1.x. Kolom Status diperbarui terhadap kode hari ini; catatan penutupan aslinya tidak dihapus, karena ledger adalah alat yang hidup sementara riwayatnya tetap perlu dibaca.

Severitas: **Blocker** menghentikan rilis atau penerbitan · **Major** melanggar aturan bisnis atau NFR yang terukur · **Minor** perlu diperbaiki tetapi tidak menghentikan apa pun.

| # | Sev | Apa yang rusak | Telusur | Pemilik | Status per 9 September 2026 |
|---|---|---|---|---|---|
| **DEF-01** | Blocker | `check-all.mjs` keluar dengan kode 1: assertion tangga peringkasan mengunci ambang persis, dan ambang itu bergeser ketika perbaikan BR-02 memangkas karakter terkode | NFR-15 | FE | **Ditutup.** Ditulis ulang menjadi uji sifat (TC-345). **Contoh paling awal dari Prinsip 1**: assertion yang memaku angka jatuh tanpa ada yang benar-benar rusak |
| **DEF-02** | Major | `Offer` houseblend menerbitkan harga 0,5 kg sebagai `Offer.price` tanpa keterangan satuan; Google akan mengiklankan separuh harga | BR-01, NFR-12, FR-49 | BE | **Ditutup.** Dijaga assertion "Offer houseblend menyebut harga per kg, bukan harga 0,5 kg tanpa satuan" (TC-412) — **diverifikasi masih ada pada `check-build-output.mjs`** |
| **DEF-03** | Blocker (Pages) | Gambar produk dirujuk tanpa basePath sehingga 404 pada ekspor statis | FR-12, ADR-01 | FE | **Ditutup.** Assertion basePath masih ada dan aktif pada target ekspor statis |
| **DEF-04** | Major | `formatIDR()` menyisipkan U+00A0 antara "Rp" dan angka | BR-02, NFR-12 | BE | **Ditutup.** Dijaga `check-format.mjs` sampai ke titik kode, tanpa normalisasi (TC-312) |
| **DEF-05** | Major | Alias "kopi Gayo" tayang sebelum owner mengonfirmasinya (BR-20, OQ-12 masih terbuka saat itu) | BR-20, FR-44 | BA/Owner lalu BE | **Ditutup.** Owner mengonfirmasi; assertion penjaganya **dibalik**, bukan dihapus (TC-413) |
| **DEF-06** | Major | JS muat awal melewati anggaran NFR-03 lama sebesar 150 KB | NFR-03 | FE/Arsitek/CEO | **Ditutup sebagai keputusan** — `KD-04` merevisi anggaran ke 190 KB ter-gzip dan Lighthouse ke ≥ 88, lengkap dengan bukti pengukuran. **Risikonya berpindah ke DEF-16**, bukan hilang |
| **DEF-07** | Minor | `opengraph-image.png` tidak ada | FR-46 | Owner/desainer | **Ditutup.** `src/app/opengraph-image.png` **ada pada pohon hari ini** |
| **DEF-08** | Minor | Produk tayang dengan placeholder karena belum berfoto | FR-12, R-13 | Owner | **TERBUKA sebagian.** Diverifikasi hari ini: **6 dari 11 produk masih `image: null`** — Oelbiteno, Pyramid, Palimping, Kerinci, Full Robusta, dan **Sindoro** yang baru masuk. Sesuai butir 3.3 `11-timeline-rilis.md`. R-13 mengizinkan placeholder, tetapi separuh katalog tanpa foto adalah keputusan, bukan kelalaian |
| **DEF-09** | Minor | `check-whatsapp.mjs` masih menormalkan NBSP dan mencetak catatan yang menyesatkan | Higiene uji | FE | **Ditutup.** BR-02 kini dijaga `check-format.mjs` tanpa normalisasi apa pun |
| **DEF-10** | Minor | Kanonis dan `<loc>` sitemap berbeda garis miring pada target ekspor | FR-45 | BE/Arsitek | **Ditutup.** Dijaga assertion "kanonis dan `<loc>` sitemap sama persis, termasuk garis miring" (TC-411) |
| **DEF-11** | Minor | `province` Palimping diisi "Jawa Barat" sementara brand brief hanya menulis "Desa Palimping, Garut" | FR-07, BR-01 | BA/Owner | **TERBUKA.** Diverifikasi hari ini: nilainya **masih "Jawa Barat"** pada `products.ts`, dengan asal-usulnya tertulis di sebelahnya. Butuh satu kalimat konfirmasi owner, bukan perubahan kode. Butir 3.4 `11-timeline-rilis.md` |
| **DEF-12** | Minor | Janji jam balas pada `/keranjang` hanya hadir lewat footer | BR-19, FR-26 | FE | **Ditutup.** Dijaga assertion yang **menghitung kemunculan**, bukan sekadar mencari satu (`check-build-output.mjs`) |
| **DEF-13** | Minor | `05-backend.md` Bagian 11 butir 4 menyebut pengecualian lint yang sudah dihapus | Higiene dokumen | BE | **Ditutup.** Ditulis ulang menjadi catatan sejarah |
| **DEF-14** | — | `robots.txt` pratinjau berbunyi `Disallow: /`, sempat dicurigai sebagai deindeksasi tak sengaja | FR-45 | — | **Bukan defek, dan tugas turunannya kini selesai.** Diverifikasi hari ini: penjaganya **sudah tidak terikat vendor** — `src/app/robots.ts` dan `next.config.ts` membaca `SITE_ENV`, bukan `VERCEL_ENV`, tepat karena host produksi pindah ke Pages. Butir 6 pada daftar tugas v1.x **ditutup** |
| **DEF-15** | **Major** | **Produk yang ditandai kosong oleh owner tetap bisa dipesan bila sudah berada di keranjang pembeli.** `cartCatalogIndex` (`src/data/catalog.ts`) tidak membawa medan `status`, dan `resolveCart()` (`src/features/cart/cart-selectors.ts`) hanya membuang baris yang slug atau variannya **hilang** dari katalog. Produk yang berubah `out-of-stock` tetap ada di indeks, jadi barisnya resolve normal, ikut subtotal, ikut pesan WhatsApp, dan ikut baris otomatis buku order. Keranjang bertahan tujuh hari, jadi jendelanya nyata. Halaman produk dan kartu katalog sudah menolak penambahan baru — yang bocor adalah keranjang yang sudah terisi lebih dulu | FR-14, KD-08, `09-kelola-katalog.md` Bagian 1 | **FE** | **TERBUKA.** Ditemukan saat menulis v2.0. Reproduksi: TC-402. Perbaikan yang saya sarankan: bawa `status` ke `CartCatalogEntry`, tandai barisnya di `/keranjang`, keluarkan dari subtotal dan dari payload pesan, dan tahan tombol pesan sampai pembeli mengeluarkannya. Owner menandai kosong lalu tetap menerima pesanan adalah persis kegagalan yang ingin dicegah butir 0.6 `11-timeline-rilis.md` |
| **DEF-16** | **Major** | **Tidak ada gerbang ukuran bundle di CI.** `KD-04` menyisakan margin sekitar 4,6 KB di atas rute terberat dan menutup dirinya dengan kalimat "ini bukan izin untuk menambah berat". Sejak pengukuran itu situs bertambah lacak pesanan, pencatatan buku order, dan lini 100 gram. Tidak ada satu pun assertion pada `web/scripts/` yang mengukur ukuran bundle, dan `pages.yml` tidak memeriksanya | NFR-03, KD-04 | **Dev/Arsitek** | **TERBUKA.** Anggarannya bisa jebol tanpa suara, dan tidak akan ada yang tahu sampai seseorang mengukurnya dengan tangan (TC-433). Butir 2.6 `11-timeline-rilis.md` |
| **DEF-17** | Minor | **Pencabutan Kerinci dari lini 100 gram tidak tercatat sebagai keputusan.** Alasannya tertulis rapi di kepala `check-picks.mjs` ("atas keputusan owner, 9 September 2026") dan perilakunya benar, tetapi `00b-ceo-decisions.md` D-07 masih menulis "18 kopi" dan `09-kelola-katalog.md` belum menyebut pencabutannya. Pembaca berikutnya akan mengira satu baris hilang karena cacat, lalu mengembalikannya | KD-07, higiene keputusan | **BA/CEO** | **TERBUKA.** Butuh satu paragraf pada `00b-ceo-decisions.md`, bukan perubahan kode. Diperiksa lewat TC-314 |

### 7.1 Rekapitulasi defek — 9 September 2026

| Severitas | Jumlah | Ditutup | Terbuka |
|---|---|---|---|
| Blocker | 2 | 2 | 0 |
| Major | 6 | 4 | **2** (DEF-15, DEF-16) |
| Minor | 8 | 5 | **3** (DEF-08 sebagian, DEF-11, DEF-17) |
| Alarm palsu | 1 | — | — |
| **Total** | **17** | **11** | **5** |

---

## 8. Verdikt

### 8.1 Yang dapat dibuktikan hari ini

Gerbang otomatis hijau: `typegen` → `tsc` → `eslint` → build kedua target → `check-all.mjs` (9 berkas), dijalankan dengan env yang benar. Katalog yang tayang adalah katalog yang dimaksud `KD-02` revisi kedua: setiap rasio houseblend punya dua ukuran kemasan berharga sendiri, setiap varian membawa **tepat satu** harga, dan invarian `qty × harga satuan = subtotal` dijaga pada tiga tempat sekaligus — keranjang, pesan WhatsApp, dan setiap jenis kemasan yang dijual. Cacat 9 September tidak bisa ditulis ulang tanpa menjatuhkan gerbang.

### 8.2 Yang belum dapat dibuktikan siapa pun

**Situs ini belum pernah dibuka di peramban, belum pernah dilihat di perangkat, dan belum pernah berbicara dengan Apps Script yang sungguhan.** Lima puluh empat test case pada dokumen ini berstatus belum dieksekusi. Tidak satu pun boleh dianggap lulus, dan menandainya lulus tanpa mengukurnya adalah bentuk kebohongan yang paling merugikan dalam laporan QA — ia menutup butir yang sebenarnya masih terbuka.

### 8.3 Verdikt: **belum siap membuka pesanan; siap dilanjutkan ke Sprint 2**

Tiga syarat yang mengikat, seluruhnya sudah menjadi butir gerbang rilis pada `11-timeline-rilis.md`:

1. **DEF-15 wajib ditutup sebelum owner diminta memercayai saklar stoknya.** Sekarang owner bisa menandai kosong, memercayainya, dan tetap menerima pesanan dari keranjang yang sudah terisi. Ini kegagalan kepercayaan, bukan kosmetik.
2. **DEF-16 wajib ditutup dengan gerbang, bukan dengan pengukuran sekali jalan.** Anggaran yang hanya diukur manusia akan jebol lagi, dan itu persis pola yang melahirkan Prinsip 1.
3. **Kelompok M-0, M-1, dan M-3 wajib dieksekusi sebelum rilis produksi**, khususnya TC-349, TC-398, TC-402, dan TC-422. Rilis tanpa keempatnya berarti menyatakan lulus atas hal yang belum pernah dilihat siapa pun.

### 8.4 Satu catatan tentang cara suite ini boleh berubah

Pemeriksaan pada `web/scripts/` sekarang menjadi satu-satunya hal yang berdiri antara sheet owner dan harga yang tayang. Karena itu satu aturan berlaku bagi siapa pun yang menyentuhnya: **bila sebuah assertion berubah merah setelah keluaran berubah, yang pertama diperiksa adalah keluarannya, bukan assertion-nya.** Memperbarui angka pada assertion agar cocok dengan keluaran baru sudah pernah menghasilkan pesan pesanan yang angkanya tidak berkalian, dan ia akan menghasilkannya lagi.

---

## 9. Tugas yang Diserahkan Kembali

| # | Tugas | Pemilik | Sebelum |
|---|---|---|---|
| 1 | Tutup DEF-15: bawa `status` ke indeks keranjang, keluarkan baris kosong dari subtotal dan dari pesan, tahan checkout | **FE** | Rilis produksi |
| 2 | Tutup DEF-16: pasang gerbang ukuran bundle pada `pages.yml` sehingga anggaran NFR-03 tidak bisa jebol diam-diam | **Dev/Arsitek** | Rilis produksi |
| 3 | Tutup DEF-17: catat pencabutan Kerinci dari lini 100 gram pada `00b-ceo-decisions.md` D-07 dan `09-kelola-katalog.md` | **BA/CEO** | Sprint 3 |
| 4 | Konfirmasi provinsi Palimping (DEF-11) dan lengkapi atribut asal Sindoro | **Owner** | Rilis produksi |
| 5 | Sediakan foto untuk enam produk yang masih placeholder, atau terima placeholder secara tertulis (DEF-08) | **Owner** | Rilis produksi |
| 6 | Deploy ulang Apps Script versi terbaru dan isi ketiga tab sheet; tanpa ini seluruh Modul E dan sebagian Modul D tidak dapat dieksekusi (TC-393) | **CEO** | Sprint 1 |
| 7 | Bangun environment staging; tanpa URL yang bisa dibuka, kelompok M-2 tidak dapat dijalankan | **Dev** | Sprint 2 |
| 8 | Sediakan `NEXT_PUBLIC_GA_ID`, properti GA4, dan verifikasi Search Console di origin final (TC-416, TC-417) | **CEO** lalu Dev | Rilis produksi |
| 9 | Putuskan host produksi secara tertulis; `/lacak` menyuntikkan konten eksternal ke DOM sementara Pages tidak dapat menyetel header sama sekali | **CEO** | Rilis produksi |
| 10 | Eksekusi 54 test case manual menurut kelompok Bagian 5 dan laporkan hasilnya di bawah dokumen ini | **QA** | Rilis produksi |

---

## 10. Persetujuan

| Peran | Nama | Tanda tangan | Tanggal |
|---|---|---|---|
| Penyusun — QA Engineer | | | 9 September 2026 |
| Diketahui — Business Analyst | | | |
| Diketahui — Arsitek | | | |
| Pemberi persetujuan rilis — CEO / Owner | | | |
