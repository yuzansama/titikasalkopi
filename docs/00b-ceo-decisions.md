# Keputusan CEO — Penutup Open Question Penghambat Rilis

Tanggal: 7 September 2026. Menutup OQ-01, OQ-02, OQ-07 pada `02-BRD.md`. Semua agent WAJIB mengikuti file ini; jika bertentangan dengan BRD, file ini yang menang.

## D-01 — Paket 3 pack wajib satu origin (menutup OQ-01)
Satu paket 3 pack berisi tiga kemasan 200 gr dari **origin yang sama**. Paket campur antar-origin **tidak ditawarkan** di website. Permintaan campur diarahkan ke percakapan WhatsApp sebagai penanganan manual.

Konsekuensi: `BR-11` pada BRD dikonfirmasi apa adanya. UI produk tidak boleh menampilkan pemilih origin campur. Salinan teks pada kartu 3 pack menonjolkan penghematan, bukan variasi. Angkanya **dihitung dari harga resmi, tidak diketik**; sejak harga single origin 9 September 2026 nilainya menjadi Signature hemat Rp28.000 dan Reguler hemat Rp23.000 (sebelumnya Rp25.000 dan Rp20.000).

## D-02 — Houseblend dijual dalam dua ukuran kemasan (menutup OQ-02)

Minimum order houseblend **0,5 kg**, dengan kelipatan **0,5 kg** (0,5 / 1 / 1,5 / 2 ...). `BR-13` pada BRD **direvisi** dari "minimum 1 kg, kelipatan 1 kg".

Keputusan ini sudah direvisi **dua kali**. Riwayatnya ditulis utuh di bawah, bukan ditimpa, karena versi pertamanya sempat masuk ke kode, ke rencana uji, dan ke dokumen turunan. Siapa pun yang membaca versi lama tanpa tahu bahwa ia sudah batal akan "memperbaiki" kode kembali ke perilaku yang salah — dan berkas ini menurut barisnya sendiri mengalahkan BRD, sehingga kesalahan itu akan menyebar, bukan tertahan.

### Aturan semula — sebelum 7 September 2026

`BR-13` versi awal: houseblend dijual **minimum 1 kg dengan kelipatan 1 kg**. Tidak ada kemasan di bawah satu kilogram sama sekali, sehingga tidak ada harga 0,5 kg yang perlu ditetapkan.

### Revisi pertama — 7 September 2026: minimum turun ke 0,5 kg, harganya dihitung

Minimum dan kelipatan turun ke **0,5 kg**. Harga 0,5 kg ditetapkan **tepat setengah harga per kg**: tidak ada premium kemasan kecil dan tidak ada pembulatan sistem, sehingga seluruh harga katalog saat itu habis dibagi dua ke kelipatan Rp500. Konsekuensi implementasinya ditulis tegas: harga per kg adalah **satu-satunya** angka yang boleh disimpan, harga 0,5 kg wajib dihitung dan **tidak boleh ditulis sebagai data terpisah**, karena dua angka yang bisa saling bertentangan berarti dua sumber kebenaran. Validator `V-06` menegakkan kesamaan `unitPrice === pricePerKg / 2`.

**Aturan itu sekarang BATAL seluruhnya**, termasuk tabel harganya. Ia tidak boleh dipakai sebagai rujukan untuk apa pun selain membaca riwayat ini.

### Revisi kedua — 9 September 2026: dua ukuran kemasan, dua harga tersimpan

Sumber: lembar **"Product"** pada `assets/brand/Kopi from heart.xlsx`, dari owner.

Houseblend tidak dijual dalam satu ukuran kemasan yang boleh dipesan berkelipatan. Ia dijual dalam **dua ukuran kemasan**, dan lembar itu menamai kolomnya secara harfiah: **"Main Packs (1kg)"** dan **"Mini Packs (500gr)"**. Keduanya punya harga sendiri yang ditetapkan owner.

Alasan angkanya tidak sejalan: **kemasan mini membawa marginnya sendiri**. BOLD 70:30 dijual Rp215.000 per kg tetapi Rp120.000 per 0,5 kg — bukan Rp107.500. Selisih itu menutup biaya kemasan dan penanganan yang tidak ikut mengecil ketika isinya dibagi dua. Harga semacam itu **bukan turunan**, jadi ia tidak bisa dihitung; memaksanya tetap turunan berarti menayangkan harga yang tidak pernah owner tetapkan.

Tabel harga yang berlaku:

| Varian | per kg (Main Pack) | per 0,5 kg (Mini Pack) |
|---|---|---|
| BOLD 70:30 | Rp215.000 | Rp120.000 |
| BOLD 60:40 | Rp205.000 | Rp115.000 |
| BOLD 50:50 | Rp200.000 | Rp110.000 |
| BOLD 40:60 | Rp195.000 | Rp105.000 |
| BOLD 30:70 | Rp190.000 | Rp100.000 |
| BOLD 20:80 | Rp185.000 | Rp95.000 |
| BRIGHT Signature | Rp280.000 | Rp150.000 |
| BRIGHT Reguler | Rp240.000 | Rp130.000 |
| Full Robusta | Rp180.000 | Rp100.000 |

Implementasi: **kedua** harga disimpan sebagai data. Kekhawatiran yang melahirkan larangan lama tetap sah — dua angka yang bisa saling bertentangan — dan jawabannya bukan menghapus salah satunya, melainkan memindahkan keduanya ke **satu permukaan sunting**: Google Sheet milik owner lewat `D-08`. Owner mengubah satu baris, keduanya ikut terbawa, dan tidak ada berkas kedua yang bisa lupa diperbarui.

Kuantitas tetap disimpan sebagai bilangan bulat "jumlah setengah kilo" (`halfKgUnits`) supaya tidak ada aritmetika pecahan pada uang. Bagian itu tidak berubah.

**`V-06` tidak lagi memeriksa kesamaan.** Ia sekarang memeriksa dua batas kewarasan pada setiap varian houseblend:

1. **Dua kemasan 0,5 kg wajib lebih mahal daripada satu kemasan 1 kg** — harga 0,5 kg tidak boleh turun sampai setengah harga per kg. Kalau ia turun ke situ atau lebih rendah, kemasan 1 kg kehilangan alasan untuk ada dan pembeli yang menghitung akan selalu memesan dua kemasan kecil.
2. **Satu kemasan 0,5 kg wajib lebih murah daripada kemasan 1 kg.** Sama atau di atas itu, halaman yang sama menawarkan kemasan lebih kecil dengan harga lebih tinggi, dan pembeli wajar menyimpulkan situsnya salah harga.

Salah ketik satu nol tetap menggagalkan build. Yang hilang hanyalah asumsi bahwa satu angka bisa menyimpulkan angka yang lain.

Konsekuensi: konfigurator FR-21 tetap memakai stepper 0,5 kg. Minimum order B2B pada `BR-17` tetap 0,5 kg per varian. Jumlah varian houseblend sedang berubah mengikuti pemisahan dua ukuran kemasan ini dan **tidak dituliskan sebagai angka di dokumen mana pun** — angka yang berlaku ada di `web/src/data/validate.ts`.

## D-03 — Jam balas WhatsApp: setiap hari 08.00–21.00 WIB (menutup OQ-07)
Website menuliskan janji balas **setiap hari, 08.00–21.00 WIB**. Ditampilkan di halaman Kontak, blok checkout keranjang, dan footer.

Risiko yang diterima CEO: janji ini berat bila admin hanya satu orang. Mitigasi wajib diimplementasikan: di luar jam tersebut, UI menampilkan status "di luar jam balas — pesan tetap masuk, dibalas mulai pukul 08.00 WIB" berdasarkan waktu lokal pengunjung yang dikonversi ke WIB (UTC+7). Status ini dihitung di klien setelah hydration agar halaman statis tetap bisa di-cache.

## Catatan untuk QA

> **Diperbarui 9 September 2026.** Instruksi lama di tempat ini menyuruh QA memverifikasi bahwa harga 0,5 kg tepat setengah harga per kg. Instruksi itu **dicabut** — aturannya sudah dibatalkan oleh revisi kedua `D-02`, dan test case yang menegakkannya akan gagal pada katalog yang benar.

Ketiga keputusan ini wajib punya test case sendiri:

1. Paket campur antar-origin tidak boleh bisa dibentuk lewat UI (`D-01`).
2. Harga 0,5 kg diambil dari data, **bukan dihitung**, dan setiap varian houseblend memenuhi dua batas `V-06`: harga 0,5 kg tidak lebih murah dari setengah harga per kg, dan tidak mencapai harga per kg penuh (`D-02` revisi kedua). Jumlah varian yang diuji diambil dari `web/src/data/validate.ts`, tidak ditulis sebagai angka tetap di rencana uji.
3. Indikator jam balas benar di kedua sisi batas 08.00 dan 21.00 WIB (`D-03`).

## D-04 — NFR-03 direvisi dari 150 KB menjadi 185 KB (JS muat awal)

Tanggal: 7 September 2026. Menutup DEF-06 pada `06-qa-test-plan.md` dan TC-193.

Target lama 150 KB tidak dapat dicapai dengan tumpukan teknologi yang sudah dikunci, dan itu dibuktikan dengan pengukuran, bukan diperdebatkan.

**Bukti.** Diukur pada situs yang benar-benar tayang, dengan gzip aktif:

| Yang diukur | Mentah | Ter-gzip |
|---|---|---|
| JS dieksekusi di beranda | 570,8 KB | 183,3 KB |
| Kode khas per halaman (terbesar) | 26,5 KB | ~7 KB |

Seluruh 570,8 KB itu dimuat di **kesemua 18 halaman**, termasuk halaman yang nyaris tanpa interaksi. Artinya beratnya bukan berasal dari kode aplikasi.

**Eksperimen penentu.** `CartProvider` dan `AnalyticsProvider` dicabut sepenuhnya dari `layout.tsx`, lalu dibangun ulang dan diukur dengan cara yang sama:

| | Mentah |
|---|---|
| Dengan kedua provider | 570,8 KB |
| Tanpa kedua provider | 565,6 KB |
| Selisih | **5,2 KB** (~1,5 KB ter-gzip) |

Menghapus seluruh lapisan keranjang dan analitik — yaitu seluruh alasan situs ini punya JavaScript sama sekali — hanya menghemat 1,5 KB terkirim. Sisanya adalah runtime React 19 dan App Router Next 16. Tidak ada Client Component yang bisa dipangkas untuk mencapai 150 KB. Yang tersisa hanyalah mengganti tumpukan teknologi, dan itu tidak sebanding untuk situs katalog sepuluh produk.

Layout sudah dikembalikan persis seperti semula setelah eksperimen; tidak ada sisa perubahan.

**Keputusan.** NFR-03 menjadi: JS muat awal **<= 190 KB ter-gzip** pada rute mana pun.

> **Koreksi 7 September 2026.** Angka pertama yang saya tetapkan, 185 KB, salah — diambil dari pengukuran **beranda saja**. Rute produk dan houseblend memuat lebih banyak dan langsung melewatinya. Plafon yang benar harus diambil dari rute TERBERAT, bukan rute yang kebetulan diukur lebih dulu.
>
> Ukuran nyata per rute, ter-gzip:
>
> | Rute | Ter-gzip |
> |---|---|
> | `/produk/<slug>` | 185,4 KB |
> | `/houseblend/<line>` | 185,4 KB |
> | `/` | 181,9 KB |
> | `/katalog` | 181,5 KB |
> | `/keranjang` | 181,0 KB |
>
> Plafon 190 KB memberi margin sekitar 4,6 KB di atas rute terberat. Cukup ketat untuk langsung merah bila ada yang menambahkan pustaka klien besar, tetapi tidak menjadikan setiap penambahan dua baris kondisional sebagai pelanggaran.

Konsekuensi yang diterima: skor Lighthouse mobile bertahan di 89, sedikit di bawah target BRD 90, karena Total Blocking Time 330 ms berakar pada beban runtime yang sama. Seluruh metrik lain sudah lulus — Accessibility 100, Best Practices 100, SEO 100, CLS 0, LCP 2,5 detik. Target Performance >= 90 ikut direvisi menjadi **>= 88** pada host saat ini, dan ditinjau ulang bila situs pindah ke host yang menyajikan brotli.

**Yang tidak boleh disimpulkan dari keputusan ini:** ini bukan izin untuk menambah berat. Setiap pustaka klien baru wajib dibenarkan lebih dulu, karena marginnya sekarang tinggal 1,7 KB.

## D-05 — Pelacakan pesanan dilakukan di website sendiri, bukan dialihkan ke marketplace

Tanggal: 8 September 2026. Membuka FR-51 pada `02-BRD.md`, yang merujuk keputusan ini sebagai **KD-05** — awalan `KD-` dipakai di BRD dan rencana uji karena `D-05` di sana sudah berarti dependensi bisnis pada Bagian 14.2, bukan keputusan CEO. Pemetaan yang sama sudah berlaku untuk D-01 sampai D-03.

CEO menyatakan Shopee **bukan** platform penjualannya; website inilah kanal jualnya. Karena itu jawaban "pembeli yang mau pelacakan silakan lewat Shopee" tidak berlaku, dan pelacakan pesanan harus ada di `titikasalkopi.id`.

Keputusan turunannya:

**Shopee tetap tayang apa adanya.** Tautan di footer, Kontak, Cerita Kami, keranjang, halaman produk, dan beranda tidak diubah. US-15 dan FR-25 tidak dibatalkan. Yang berubah hanya cara kami menjawab: Shopee bukan lagi jalan keluar untuk kebutuhan pelacakan.

**Sumber kebenaran status adalah buku order owner**, bukan basis data baru. Buku itu berbentuk Google Sheet dan disajikan sebagai endpoint baca-saja lewat Apps Script. Alasannya operasional, bukan teknis: adminnya satu orang, dan sistem apa pun yang menuntut ia membuka dashboard kedua akan berakhir tidak diperbarui. Halaman lacak yang menampilkan status basi lebih merusak kepercayaan daripada tidak punya halaman lacak sama sekali.

**Dua syarat privasi yang tidak boleh dilanggar**, keduanya sudah punya pemeriksaan otomatis:

1. Endpoint hanya mengirim kolom pada daftar putih. Nama, nomor telepon, alamat, dan catatan internal tidak pernah keluar, walaupun tersimpan di sheet yang sama.
2. Kode order salah dan 4 digit salah menghasilkan jawaban yang **persis sama**. Membedakannya mengubah endpoint menjadi alat untuk menebak pesanan orang lain.

**Kejujuran atas kebasian.** Setelah lima hari tanpa perubahan pada pesanan yang belum selesai, halaman menyatakan sendiri bahwa statusnya mungkin sudah tidak mutakhir. Ini disengaja: kami memilih mengakui keterlambatan daripada menampilkan label yang terbaca pasti padahal tidak.

### Konsekuensi yang masih menunggu keputusan CEO

`next.config.ts` sudah menulis pemicunya sejak awal: begitu situs menampilkan konten dari luar repositori, ia harus pindah ke host yang bisa menyetel header. Halaman lacak memenuhi syarat itu, sementara host produksi sekarang GitHub Pages yang tidak dapat menyetel header sama sekali — sehingga CSP, `X-Frame-Options`, dan `Permissions-Policy` tidak aktif di produksi.

Pilihannya ada dua: pindah produksi ke Vercel, di mana seluruh header itu sudah ditulis dan langsung aktif tanpa perubahan kode; atau bertahan di Pages dan menerima risikonya secara sadar. Rinciannya di `08-lacak-pesanan.md` Bagian 7. Keputusan ini belum diambil dan tidak boleh digantung.


## D-06 — Pencatatan pesanan ke buku order dilakukan otomatis

Tanggal: 8 September 2026. Dirujuk sebagai **KD-06** dari `02-BRD.md`, mengikuti pemetaan yang sama seperti D-05.

Pesanan pertama yang benar-benar melewati sistem langsung memperlihatkan biayanya: pembeli memesan, lalu melacak, lalu mendapat "tidak ditemukan" — karena barisnya memang belum diketik. Itu bekerja persis seperti rancangannya, dan justru itu masalahnya. Sistem yang benar tetapi menuntut satu langkah manual pada setiap pesanan akan gagal pada hari yang sibuk, bukan pada hari yang tenang.

**Keputusan.** Baris buku order ditulis otomatis oleh website saat pembeli menekan "Pesan via WhatsApp", berisi kode order, ringkasan pesanan beserta subtotal, tanggal, dan status awal `menunggu-konfirmasi`.

**Pembeli mengisi 4 digit terakhir nomornya sendiri**, lewat kolom **opsional** di keranjang. Diisi berarti pelacakan hidup tanpa owner menyentuh apa pun. Dikosongkan berarti barisnya tetap lengkap dan owner mengetik empat digit dari chat. Kolom itu tidak diwajibkan karena kolom wajib satu ketukan sebelum tombol pesan adalah tempat paling mahal untuk kehilangan pembeli; pesanan yang hilang lebih merugikan daripada pelacakan yang tertunda.

**Baris yang tidak pernah menjadi pesanan diterima.** Baris ditulis saat tombol ditekan, bukan saat pesan terkirim, jadi buku order berisi niat juga. Kolom `sumber` menandainya (`web` versus kosong) sehingga owner bisa memilah dan menghapus. Selisih antara baris `web` dan chat yang benar-benar tiba adalah ukuran kebocoran di langkah terakhir — angka yang selama ini tidak ada karena analitik belum menyala.

### Empat pagar pada endpoint tulis, semuanya wajib tetap ada

Endpoint ini terbuka untuk siapa pun, dan itu tidak bisa dihindari karena peramban pembeli yang memanggilnya.

1. **Kuota 50 baris otomatis per hari.** Volume nyata puluhan per bulan; kuota ini longgar untuk pemakaian jujur dan membatasi kerugian bila disalahgunakan.
2. **Netralisasi rumus.** Sel yang diawali `=`, `+`, `-`, atau `@` dieksekusi Google Sheets saat owner membuka bukunya sendiri. Ringkasan berasal dari peramban pembeli, jadi ia teks yang dikendalikan orang lain. Penetralannya ada di sisi Apps Script, bukan hanya di situs, karena sisi situs bisa dilewati.
3. **Kode yang sudah ada tidak pernah ditimpa.** Pengiriman ganda menjadi tidak berbahaya, dan baris yang sudah disunting owner tidak bisa dikembalikan ke status awal oleh siapa pun dari luar.
4. **Gagal tertutup tanpa kolom `sumber`.** Tanpa kolom itu kuota harian tidak punya apa pun untuk dihitung dan pagarnya mati tanpa suara, jadi pencatatan berhenti sama sekali.

### Aturan yang tidak boleh dilanggar

Pencatatan **tidak boleh menunda atau menggagalkan pembukaan WhatsApp**. Ia dikirim sekali jalan lewat `sendBeacon`, tanpa ditunggu, dan kegagalannya diabaikan. Bila endpoint mati, pembeli tetap memesan dan owner tetap menerima chatnya persis seperti sebelum fitur ini ada. Pesanan lebih penting daripada pembukuannya.


## D-07 — Katalog Kopi 100 gram sebagai lini kedua — **DICABUT 9 September 2026**

Tanggal: 8 September 2026. Dirujuk sebagai **KD-07** dari `02-BRD.md`. Membuka FR-52.

> **STATUS: DICABUT SELURUHNYA pada 9 September 2026 oleh `D-09`.** Lini "Katalog
> Kopi 100 gram" — daftar 17–18 kopi dari poster cetak owner — **tidak ada lagi**,
> tidak di situs, tidak di data, tidak di sheet. Alasannya satu kalimat: seluruh
> produk situs kini wajib berasal dari **satu sumber**, lembar `Product` pada
> `assets/brand/Kopi from heart.xlsx`, dan lini poster tidak ada di sana.
>
> Bagian ini **tidak dihapus** karena lini itu sempat tayang, sempat masuk kode,
> rencana uji, dan dokumen owner. Siapa pun yang menemukan sisa-sisanya harus bisa
> membaca di sini mengapa ia pernah ada dan mengapa ia berhenti ada — bukan
> menyimpulkan bahwa ia hilang karena cacat, lalu mengembalikannya.
>
> **Yang BERTAHAN dari keputusan ini, dan tidak boleh ikut dibuang:**
>
> 1. **Satuan pesan `gram-100`.** Ia lahir untuk lini poster, tetapi sekarang
>    melayani **kemasan mini 100 gr pada single origin** (`BR-08`). Satuan itu
>    tetap hidup di keranjang, pesan WhatsApp, dan format harga.
> 2. **Gagasan kemasan 100 gram itu sendiri** — sebagai kemasan mini single
>    origin dari lembar `Product`, berharga **per tier** (Signature Rp85.000,
>    Reguler Rp70.000), bukan per biji.
>
> **Jangan pernah menyamakan keduanya.** Ada dua hal berbeda yang sama-sama
> pernah disebut "100 gram": **kemasan mini** single origin, yang TETAP ADA dan
> merupakan bagian normal katalog; dan **lini "Katalog Kopi 100 gram"** dari
> poster, yang SUDAH TIDAK ADA. Dokumen mana pun yang mencampur keduanya salah.

### Isi keputusan aslinya, disimpan sebagai riwayat

Owner menyerahkan poster "KATALOG KOPI" berisi 18 kopi dalam kemasan 100 gram. Lini ini **tambahan**, berdiri sendiri di samping single origin 200 gram (delapan biji sejak Sindoro masuk, 9 September 2026); keduanya tayang berdampingan dan tidak saling menggantikan. Seluruh biji lini ini **bisa dipesan lewat keranjang**.

> **Revisi 9 September 2026 — tinggal 17 biji.** Kerinci dihapus dari lini ini.
> Sampai 8 September ia hidup di kedua lini dan itu masih bisa dijelaskan:
> beratnya berbeda, 200 gr terhadap 100 gr. Kemasan mini 100 gram yang masuk
> bersama lembar `Product` menghapus penjelasan itu — kedua lini menjual
> Kerinci dalam ukuran **yang sama** seharga Rp70.000 dan Rp85.000, pada satu
> halaman katalog. Pada toko yang dibayar di muka lewat transfer, dua harga
> untuk satu barang terbaca sebagai kesalahan atau itikad buruk.
>
> Yang dipertahankan adalah versi single origin, karena ia punya halaman
> produk dan data asal; baris poster hanya punya nama dan harga. Ditegakkan
> `check-picks.mjs`, yang menolak nama apa pun yang muncul di kedua lini dan
> berjalan di dalam alur sinkronisasi katalog — jadi barisnya tidak bisa
> kembali lewat sheet tanpa disadari.

### `BR-09` sengaja tidak berlaku di lini ini

`BR-09` menetapkan harga single origin ditentukan **tier**, bukan biji — hanya dua angka per ukuran kemasan untuk seluruh katalog: sejak 9 September 2026, Signature Rp140.000 dan Reguler Rp125.000 per 200 gram. Lini baru memberi harga **per biji**, dari Rp65.000 sampai Rp270.000. Dua tier tidak mungkin menampung 18 harga berbeda.

Karena itu lini ini tidak memakai `Tier`, dan `BR-09` tetap berlaku penuh untuk lini 200 gram. Bukan pengecualian yang dibiarkan, melainkan batas yang ditarik sengaja.

### Lini ini tidak memakai tipe `Product`, dan itu keputusan

Yang diketahui hanya **nama dan harga**. Asal desa, wilayah, provinsi, proses, ketinggian, varietas, dan catatan rasa tidak ada.

`Product.origin` mewajibkan `province` terisi dan merakit judul metadata SEO dari sana. Memaksa kopi-kopi ini ke dalamnya menuntut belasan provinsi karangan — dan untuk **Panama** serta **Kenya**, kolom itu salah secara konsep, bukan sekadar kosong. Karena itu lini ini punya bentuk datanya sendiri yang hanya memuat apa yang benar-benar diketahui.

Konsekuensi yang diterima: tidak ada halaman produk per biji, jadi tidak ada halaman yang tampak lengkap padahal isinya karangan. Sebuah biji boleh naik menjadi `Product` penuh begitu owner menyerahkan data asalnya. Halaman katalog menyatakan terus terang bahwa data itu belum ada dan mengarahkan pertanyaan ke WhatsApp.

Bentuknya daftar padat, bukan kartu seperti lini 200 gram. Kartu menjanjikan foto dan catatan rasa; belasan kartu berisi nama dan harga saja akan terbaca sebagai katalog yang rusak.

### Dua bentrokan yang dulu menunggu jawaban owner — keduanya SELESAI 9 September 2026

> Keduanya lahir dari keberadaan lini poster, dan keduanya hilang bersamanya.
> **Kerinci** kini hanya punya satu harga karena hanya ada satu lini: single
> origin, kemasan mini 100 gr Rp70.000 (tier Reguler). Slug `kerinci-100` tidak
> ada lagi. **Gayo** hanya pernah ada di lini poster, jadi tidak ada lagi yang
> bisa tertukar dengan **Pondok Baru**; Pondok Baru tetap tayang sebagai single
> origin. Paragraf di bawah disimpan sebagai riwayat, bukan sebagai pekerjaan
> yang tersisa.

Keduanya tayang apa adanya. Tidak ada angka yang diselaraskan diam-diam, karena menyelaraskan berarti memilihkan jawaban yang belum owner berikan.

**Kerinci ada di kedua lini dengan harga yang tidak sejalan.**

| | Harga | Setara 100 gr |
|---|---|---|
| Single origin 200 gr, tier Reguler | Rp125.000 | Rp62.500 |
| Single origin kemasan mini 100 gr, tier Reguler | Rp70.000 | Rp70.000 |
| Katalog Kopi 100 gr | Rp85.000 | Rp85.000 |

Selisih 36% terhadap kemasan 200 gr, dan 21% terhadap kemasan mini 100 gr. Bentrokannya **bertambah tajam** sejak 9 September 2026: kemasan mini 100 gr pada lini single origin membuat kedua lini kini menjual Kerinci dalam ukuran yang persis sama dengan dua harga berbeda di satu situs. Entah dua lot berbeda, entah salah satunya keliru. Slug-nya dibedakan (`kerinci` versus `kerinci-100`) sehingga keduanya tidak pernah tertukar di keranjang, dan sebuah assertion menjaga pemisahan itu.

**Gayo dan Pondok Baru bisa jadi kopi yang sama.** Pondok Baru berada di Bener Meriah, Aceh — dataran tinggi Gayo. Menayangkan keduanya sebagai produk terpisah berisiko membingungkan bila keduanya berasal dari lot yang sama.

### Urutan poster dipertahankan

Daftar mengikuti poster, kolom kiri lalu kanan, bukan diurutkan menurut harga atau abjad. Owner menyusun posternya sendiri, dan mengurutkan ulang diam-diam membuat daftar cetak dan daftar web tidak lagi bisa dibandingkan baris per baris.

Harga di poster diketik ulang secara terpisah di dalam skrip pemeriksaan, bukan diimpor dari data yang diuji — pemeriksaan yang membandingkan data dengan dirinya sendiri selalu lulus.


## D-08 — Katalog dikelola owner lewat Google Sheet, bukan lewat kode

Tanggal: 8 September 2026. Dirujuk sebagai **KD-08** dari `02-BRD.md`. Membuka FR-53.

Owner meminta katalog mudah dikelola. Sebelum ini, mengubah satu harga menuntut menyunting berkas TypeScript, commit, dan push — alur kerja developer, bukan alur kerja pemilik toko.

**Keputusan.** Harga dan status stok pindah ke tab pada spreadsheet yang sudah dipakai untuk buku order. Owner menyunting di sana, menekan satu tombol di GitHub Actions, dan situs terbit ulang. Ada pula jadwal harian pukul 01.00 WIB.

> **Diperbarui 9 September 2026.** Keputusan ini semula memindahkan **tiga** tab:
> `harga`, `stok`, dan `katalog100`. Tab ketiga melayani lini poster yang dicabut
> `D-09`, jadi ia **tidak dibaca lagi sama sekali**. Yang dibutuhkan sekarang
> **dua tab**: `harga` (24 baris) dan `stok` (11 baris). Tab `katalog100` yang
> terlanjur dibuat owner boleh ditinggalkan begitu saja — ia diabaikan dan tidak
> menggagalkan apa pun.

**Yang TIDAK ikut pindah**: asal, proses, ketinggian, varietas, catatan rasa, dan foto. Batasnya bukan teknis — semuanya klaim tentang produk, bukan angka, pada toko yang dibayar di muka lewat transfer. Klaim yang salah merusak kepercayaan pada seluruh katalog, termasuk bagian yang benar.

### Sheet adalah permukaan sunting; repositori tetap catatannya

Harga TIDAK diambil saat pengunjung membuka halaman. Sinkronisasi menulis ulang `src/data/managed.generated.ts`, meng-commit-nya, dan situs dibangun dari berkas itu.

Alasannya: mengambil harga saat halaman dibuka berarti sheet yang mati atau lambat menjadi halaman produk tanpa harga, dan seluruh situs berhenti bisa di-cache. Harga adalah data paling kritis di sini — ia harus statis, tervalidasi, dan punya riwayat. Cara ini memberi ketiganya sekaligus: setiap perubahan harga masuk riwayat git dengan tanggal dan isinya.

Berkas hasil itu **satu-satunya** sumber harga dan stok. Tidak ada nilai cadangan di berkas lain, karena dua sumber kebenaran untuk harga berarti suatu hari situs menayangkan angka yang tidak seorang pun merasa menuliskannya.

### Gagal tertutup, di empat lapis

Menerbitkan harga yang salah jauh lebih merugikan daripada menerbitkan harga kemarin. Karena itu setiap keraguan menghentikan penerbitan, dan katalog yang sudah ter-commit tetap tayang:

1. Apps Script membedakan tab yang **tidak ada** (`null`) dari tab yang **kosong**. Yang pertama berarti salah nama tab, yang kedua berarti owner mengosongkan isinya; keduanya ditolak dengan pesan berbeda.
2. `validateCatalogPayload()` menolak tab hilang, harga hilang, harga di luar batas wajar, kunci tak dikenal, dan status stok tak dikenal — tanpa menyentuh berkas apa pun.
3. Validator katalog berjalan saat modul dievaluasi, sehingga data rusak menggagalkan build alih-alih tayang.
4. Workflow menjalankan `tsc` dan dua skrip pemeriksaan sebelum commit — `check-cart.mjs` dan `check-sync-katalog.mjs`. Yang pertama menyimpan salinan ketik-ulang daftar produk lembar `Product`, sehingga katalog yang diam-diam bertambah atau berkurang satu produk, atau kemasan mini yang muncul pada biji yang tidak punya barisnya, langsung merah.

Ditambah satu hal kecil yang menentukan: `managedPrice()` **melempar** bila kuncinya hilang, bukan mengembalikan 0. Nol akan tampil sebagai "Rp0" di halaman produk dan ikut ke pesan WhatsApp sebagai penawaran sungguhan.

### Batas kewarasan harga Rp10.000 sampai Rp5.000.000

Bukan aturan bisnis, melainkan jaring pengaman terhadap salah ketik. Satu nol kelebihan mengubah Rp125.000 menjadi Rp1.250.000; satu nol kurang menjadikannya Rp12.500. Keduanya bilangan bulat positif yang sah, jadi pemeriksaan tipe saja tidak akan pernah melihatnya. Bila katalog suatu saat sungguh memuat harga di luar rentang itu, ubah batasnya secara sadar — jangan hapus pemeriksaannya.


## D-09 — Satu sumber untuk seluruh produk: lembar `Product`

Tanggal: 9 September 2026. Dirujuk sebagai **KD-09** dari `02-BRD.md`. Mencabut `D-07` seluruhnya dan menutup FR-52. Menutup pula DEF-17 pada `06-qa-test-plan.md` dan butir 0.5 pada `11-timeline-rilis.md` — bukan dengan menjawab pertanyaannya, melainkan dengan menghapus keadaan yang melahirkannya.

**Keputusan.** Setiap produk yang dijual situs wajib berasal dari **satu** sumber: lembar **"Product"** pada `assets/brand/Kopi from heart.xlsx`. Tidak ada lini kedua, tidak ada daftar tambahan, tidak ada baris yang masuk dari tempat lain.

Konsekuensi langsungnya: lini **"Katalog Kopi 100 gram"** — daftar dari poster cetak owner, yang `D-07` jadikan lini kedua — **dihapus seluruhnya**. Ia tidak ada di lembar itu.

### Mengapa

`D-07` sudah menuliskan sendiri harga yang ia bayar: lini itu tidak memakai `Tier`, tidak memakai tipe `Product`, tidak punya halaman produk, dan punya bentuk datanya sendiri. Setiap aturan katalog karena itu harus ditulis dua kali, dan setiap kali salah satunya lupa ditulis, situs menayangkan dua perlakuan berbeda untuk hal yang sama.

Bentrokan Kerinci adalah wujud pertamanya, dan penyelesaiannya waktu itu — mengeluarkan satu nama dari satu daftar — hanya menutup gejalanya. Selama ada dua daftar, nama berikutnya akan bentrok lagi, dan yang berikutnya lagi. **Yang salah bukan namanya, melainkan adanya daftar kedua.**

Pada toko yang dibayar di muka lewat transfer, satu daftar yang bisa dibaca ulang terhadap dokumen owner lebih berharga daripada belasan baris katalog tambahan yang tidak punya data asal, tidak punya halaman, dan tidak bisa diperiksa terhadap apa pun.

### Katalog yang berlaku, dan tidak ada yang lain

- **8 single origin**: Oelbiteno, Sabin, Abmisibil, Pyramid, Palimping, Kerinci, Pondok Baru, Sindoro.
- **Tujuh di antaranya juga menjual kemasan mini 100 gr**, berharga **per tier** (`BR-09`): Signature Rp85.000, Reguler Rp70.000. Lembar itu **melewatkan Sindoro** pada kolom kemasan mini, jadi Sindoro tidak punya kemasan mini. Ketiadaan itu **sah dan disengaja** (`BR-08`); ia tidak boleh "dilengkapi" sendiri.
- **3 lini houseblend**, setiap rasio dalam **dua ukuran kemasan** (1 kg dan 0,5 kg), harganya masing-masing tersimpan (`D-02` revisi kedua).
- Totalnya **11 produk** dan **41 varian jual**.
- Kolom **"Tier 2"** pada lembar itu masih berisi catatan saja, tanpa satu pun nama biji dan tanpa harga. Selama masih begitu, **tidak ada apa pun yang boleh tayang atas namanya**.

### Yang bertahan dari `D-07`

Satuan pesan **`gram-100` tetap ada** — ia sekarang melayani kemasan mini single origin. Begitu pula gagasan kemasan 100 gram itu sendiri. Yang hilang hanyalah lini poster: nama, harga per biji, bentuk datanya, dan halaman daftarnya.

Dua hal berbeda pernah sama-sama disebut "100 gram". **Kemasan mini** single origin TETAP ADA. **Lini "Katalog Kopi 100 gram"** dari poster SUDAH TIDAK ADA. Keduanya tidak boleh ditulis seolah satu hal.

### Yang hilang dari kode, supaya tidak ada yang mencarinya

`src/data/picks.ts`, `src/features/catalog/pick-list.tsx`, dan `scripts/check-picks.mjs` dihapus. Medan `picks` hilang dari `managed.generated.ts`, dari skrip sinkronisasi, dan dari `ops/order-tracker.gs`. Validator `assertPicksValid` (`V-20`) hilang bersama datanya. Halaman `/katalog` tidak lagi punya bagian kedua.

Tab **`katalog100` tidak dibaca lagi sama sekali**; sheet owner cukup dua tab, `harga` dan `stok` (`D-08`). Tab lama yang terlanjur ada diabaikan dan tidak berbahaya.

### Pagar penggantinya

Pemeriksaan lama menjaga agar tidak ada nama yang muncul di **dua** lini. Karena lini kedua tidak ada, pagar itu kehilangan pekerjaannya — dan digantikan pagar yang menjaga hal yang sekarang benar-benar berisiko: **katalog menyimpang dari lembar `Product`**.

`check-cart.mjs` menyimpan **salinan daftar produk yang diketik ulang dengan tangan** dari lembar itu, dan gagal bila katalog bertambah produk, kehilangan produk, atau menumbuhkan kemasan mini pada biji yang tidak punya barisnya. Salinannya sengaja diketik ulang, bukan diimpor: pemeriksaan yang membandingkan data dengan dirinya sendiri selalu lulus.

### Catatan untuk QA

Test case yang menguji lini poster **dicabut, bukan dihapus** — TC-313, TC-314, TC-403, dan TC-404, dirinci pada Bagian 4.10 `06-qa-test-plan.md`. Menghapusnya diam-diam membuat rujukan lama menunjuk ke ruang kosong; mencabutnya membuat pembaca tahu bahwa kasusnya pernah ada dan mengapa ia tidak dijalankan lagi.
