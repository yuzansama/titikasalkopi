# Keputusan CEO — Penutup Open Question Penghambat Rilis

Tanggal: 7 September 2026. Menutup OQ-01, OQ-02, OQ-07 pada `02-BRD.md`. Semua agent WAJIB mengikuti file ini; jika bertentangan dengan BRD, file ini yang menang.

## D-01 — Paket 3 pack wajib satu origin (menutup OQ-01)
Satu paket 3 pack berisi tiga kemasan 200 gr dari **origin yang sama**. Paket campur antar-origin **tidak ditawarkan** di website. Permintaan campur diarahkan ke percakapan WhatsApp sebagai penanganan manual.

Konsekuensi: `BR-11` pada BRD dikonfirmasi apa adanya. UI produk tidak boleh menampilkan pemilih origin campur. Salinan teks pada kartu 3 pack menonjolkan penghematan (Signature hemat Rp25.000, Reguler hemat Rp20.000), bukan variasi.

## D-02 — Houseblend boleh kelipatan 0,5 kg (menutup OQ-02)
Minimum order houseblend **0,5 kg**, dengan kelipatan **0,5 kg** (0,5 / 1 / 1,5 / 2 ...). `BR-13` pada BRD **direvisi** dari "minimum 1 kg, kelipatan 1 kg".

Aturan harga 0,5 kg: **tepat setengah harga per kg**. Tidak ada premium kemasan kecil dan tidak ada pembulatan sistem — seluruh harga katalog habis dibagi dua ke kelipatan Rp500:

| Varian | per kg | per 0,5 kg |
|---|---|---|
| BOLD 70:30 | Rp210.000 | Rp105.000 |
| BOLD 60:40 | Rp200.000 | Rp100.000 |
| BOLD 50:50 | Rp195.000 | Rp97.500 |
| BOLD 40:60 | Rp190.000 | Rp95.000 |
| BOLD 30:70 | Rp185.000 | Rp92.500 |
| BOLD 20:80 | Rp175.000 | Rp87.500 |
| BRIGHT Signature | Rp260.000 | Rp130.000 |
| BRIGHT Reguler | Rp230.000 | Rp115.000 |
| Full Robusta | Rp175.000 | Rp87.500 |

Implementasi: harga per kg tetap satu-satunya angka yang disimpan di `products.ts`. Harga 0,5 kg **dihitung**, jangan ditulis ulang sebagai data terpisah — hindari dua sumber kebenaran. Kuantitas disimpan sebagai bilangan bulat "jumlah setengah kilo" (`halfKgUnits`) supaya tidak ada aritmetika pecahan pada uang.

Konsekuensi: konfigurator FR-21 memakai stepper 0,5 kg. Minimum order B2B pada `BR-17` ikut turun ke 0,5 kg per varian.

## D-03 — Jam balas WhatsApp: setiap hari 08.00–21.00 WIB (menutup OQ-07)
Website menuliskan janji balas **setiap hari, 08.00–21.00 WIB**. Ditampilkan di halaman Kontak, blok checkout keranjang, dan footer.

Risiko yang diterima CEO: janji ini berat bila admin hanya satu orang. Mitigasi wajib diimplementasikan: di luar jam tersebut, UI menampilkan status "di luar jam balas — pesan tetap masuk, dibalas mulai pukul 08.00 WIB" berdasarkan waktu lokal pengunjung yang dikonversi ke WIB (UTC+7). Status ini dihitung di klien setelah hydration agar halaman statis tetap bisa di-cache.

## Catatan untuk QA
Ketiga keputusan ini wajib punya test case sendiri: paket campur tidak boleh bisa dibentuk lewat UI, harga 0,5 kg harus tepat setengah untuk kesembilan varian, dan indikator jam balas harus benar di kedua sisi batas 08.00 dan 21.00 WIB.

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


## D-07 — Katalog Kopi 100 gram sebagai lini kedua

Tanggal: 8 September 2026. Dirujuk sebagai **KD-07** dari `02-BRD.md`. Membuka FR-52.

Owner menyerahkan poster "KATALOG KOPI" berisi 18 kopi dalam kemasan 100 gram. Lini ini **tambahan**, berdiri sendiri di samping tujuh single origin 200 gram; keduanya tayang berdampingan dan tidak saling menggantikan. Ke-18 biji **bisa dipesan lewat keranjang**.

### `BR-09` sengaja tidak berlaku di lini ini

`BR-09` menetapkan harga single origin ditentukan **tier**, bukan biji — hanya dua angka untuk seluruh katalog: Signature Rp125.000 dan Reguler Rp110.000 per 200 gram. Lini baru memberi harga **per biji**, dari Rp65.000 sampai Rp270.000. Dua tier tidak mungkin menampung 18 harga berbeda.

Karena itu lini ini tidak memakai `Tier`, dan `BR-09` tetap berlaku penuh untuk lini 200 gram. Bukan pengecualian yang dibiarkan, melainkan batas yang ditarik sengaja.

### Lini ini tidak memakai tipe `Product`, dan itu keputusan

Yang diketahui hanya **nama dan harga**. Asal desa, wilayah, provinsi, proses, ketinggian, varietas, dan catatan rasa tidak ada.

`Product.origin` mewajibkan `province` terisi dan merakit judul metadata SEO dari sana. Memaksa 18 kopi ini ke dalamnya menuntut 18 provinsi karangan — dan untuk **Panama** serta **Kenya**, kolom itu salah secara konsep, bukan sekadar kosong. Karena itu lini ini punya bentuk datanya sendiri yang hanya memuat apa yang benar-benar diketahui.

Konsekuensi yang diterima: tidak ada halaman produk per biji, jadi tidak ada halaman yang tampak lengkap padahal isinya karangan. Sebuah biji boleh naik menjadi `Product` penuh begitu owner menyerahkan data asalnya. Halaman katalog menyatakan terus terang bahwa data itu belum ada dan mengarahkan pertanyaan ke WhatsApp.

Bentuknya daftar padat, bukan kartu seperti lini 200 gram. Kartu menjanjikan foto dan catatan rasa; delapan belas kartu berisi nama dan harga saja akan terbaca sebagai katalog yang rusak.

### Dua bentrokan yang MASIH menunggu jawaban owner

Keduanya tayang apa adanya. Tidak ada angka yang diselaraskan diam-diam, karena menyelaraskan berarti memilihkan jawaban yang belum owner berikan.

**Kerinci ada di kedua lini dengan harga yang tidak sejalan.**

| | Harga | Setara 100 gr |
|---|---|---|
| Single origin 200 gr, tier Reguler | Rp110.000 | Rp55.000 |
| Katalog Kopi 100 gr | Rp85.000 | Rp85.000 |

Selisih 55%. Entah dua lot berbeda, entah salah satunya keliru. Slug-nya dibedakan (`kerinci` versus `kerinci-100`) sehingga keduanya tidak pernah tertukar di keranjang, dan sebuah assertion menjaga pemisahan itu.

**Gayo dan Pondok Baru bisa jadi kopi yang sama.** Pondok Baru berada di Bener Meriah, Aceh — dataran tinggi Gayo. Menayangkan keduanya sebagai produk terpisah berisiko membingungkan bila keduanya berasal dari lot yang sama.

### Urutan poster dipertahankan

Daftar mengikuti poster, kolom kiri lalu kanan, bukan diurutkan menurut harga atau abjad. Owner menyusun posternya sendiri, dan mengurutkan ulang diam-diam membuat daftar cetak dan daftar web tidak lagi bisa dibandingkan baris per baris.

Harga di poster diketik ulang secara terpisah di dalam skrip pemeriksaan, bukan diimpor dari data yang diuji — pemeriksaan yang membandingkan data dengan dirinya sendiri selalu lulus.
