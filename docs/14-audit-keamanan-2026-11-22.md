# Tindak lanjut audit keamanan 22 Nov 2026

Audit black-box atas https://titikasalkopi.vercel.app. Temuan dicek terhadap kode di repositori,
termasuk `ops/order-tracker.gs` yang tidak terlihat oleh auditor.

| # | Temuan audit | Hasil pengecekan kode | Tindakan |
|---|---|---|---|
| 1 | Penegakan `last4` di server (High bila tidak ditegakkan) | **Sudah ditegakkan.** `findOrder_` hanya mengembalikan baris bila kode **dan** last4 cocok; last4 salah dijawab `{found:false}`, sama persis dengan kode yang tidak ada. Baris tanpa last4 tidak pernah bisa dibuka. | Ditambah pagar: kode dikunci 10 gagal / 6 jam (lihat di bawah). Owner perlu memastikan versi yang ter-deploy = versi repo. |
| 3 | Review kode Apps Script | Tidak ada cabang admin/debug. Hanya `?katalog=1` (harga & stok, sudah publik di situs) dan pelacakan. Balasan memakai daftar putih kolom (tanpa nama, HP, alamat, catatan internal). Galat tidak bocor. `doPost` punya kuota harian, kunci serentak, netralisasi rumus, dan tidak pernah menimpa kode yang ada. | **Ditemukan dan diperbaiki dua celah** (di bawah). |
| 4 | Ketebak-tidaknya kode order | Kode acak `TAK-YYMMDD-XXXX` dari alfabet 31 karakter, dibuat dengan `crypto.getRandomValues`: 923.521 kemungkinan per hari, tidak urut. | Tidak diubah. Dengan dua perbaikan di bawah, kode harus ditebak bersama last4, dan setiap kode terkunci setelah 10 gagal. |
| 2 | CSP `script-src 'unsafe-inline'` (Low) | Benar, dan sudah tercatat sebagai utang teknis UT-03 di `web/next.config.ts`. Satu-satunya HTML mentah di situs adalah JSON-LD dari data repositori; data dari Apps Script di `/lacak` dirender React sebagai teks. | Belum diubah: nonce menuntut setiap halaman dirender per permintaan (bukan statis). Ditunda sampai situs menampilkan konten bebas dari luar. App stok (`stok/`) sudah memakai CSP tanpa `unsafe-inline`. |

## Dua celah yang ditemukan saat membaca kode

1. **`doPost` membocorkan kode mana yang nyata.** Kode lama dijawab `{ok:true, duplicate:true}`,
   kode baru `{ok:true}`, dan pengecekan ini berjalan sebelum kuota harian, sehingga tetap
   menjawab setelah kuota habis tanpa menulis apa pun. Diperbaiki: kuota diperiksa lebih dulu,
   kode lama dijawab persis seperti kode baru.
2. **`doGet` tidak membatasi percobaan last4.** Begitu satu kode diketahui, 10.000 kemungkinan
   last4 bisa dicoba semua. Diperbaiki: maksimal 10 gagal per kode dalam 6 jam (CacheService);
   sesudahnya jawaban selalu `{found:false}`. Dihitung juga untuk kode yang tidak ada, supaya
   penguncian tidak menjadi penanda.

Keduanya diuji di `web/scripts/check-order-tracker-gs.mjs`; pemeriksaan barunya gagal terhadap
versi lama dan lulus terhadap versi baru.

Sisa risiko yang diterima: selama kuota harian belum habis, penyerang bisa mendaftarkan kode
tebakan lewat `doPost` lalu mengecek apakah last4 miliknya cocok. Itu dibatasi 50 percobaan
per hari dari ruang 923.521 kode per hari, dan setiap percobaan meninggalkan baris palsu yang
terlihat owner.

## Yang harus dilakukan owner

1. Tempel ulang seluruh isi `ops/order-tracker.gs` ke Apps Script, jalankan `selfCheck`, lalu
   **Deploy > Manage deployments > Edit > Version: New version** (URL tidak berubah).
2. Uji dengan satu pesanan milik sendiri, sesuai langkah reproduksi auditor: kode benar + last4
   benar harus tampil; kode benar + last4 salah harus "tidak ketemu".
