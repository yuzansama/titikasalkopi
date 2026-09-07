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

**Keputusan.** NFR-03 menjadi: JS muat awal **<= 185 KB ter-gzip** pada halaman mana pun. Angka ini di atas ukuran nyata sekarang (183,3 KB) dengan margin tipis yang disengaja — cukup untuk pertumbuhan wajar, tetapi akan langsung merah bila ada yang menambahkan pustaka klien besar. Itu memang tujuannya.

Konsekuensi yang diterima: skor Lighthouse mobile bertahan di 89, sedikit di bawah target BRD 90, karena Total Blocking Time 330 ms berakar pada beban runtime yang sama. Seluruh metrik lain sudah lulus — Accessibility 100, Best Practices 100, SEO 100, CLS 0, LCP 2,5 detik. Target Performance >= 90 ikut direvisi menjadi **>= 88** pada host saat ini, dan ditinjau ulang bila situs pindah ke host yang menyajikan brotli.

**Yang tidak boleh disimpulkan dari keputusan ini:** ini bukan izin untuk menambah berat. Setiap pustaka klien baru wajib dibenarkan lebih dulu, karena marginnya sekarang tinggal 1,7 KB.
