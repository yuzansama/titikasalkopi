# Lacak Pesanan — Pemasangan dan Cara Pakai Harian

Tanggal: 8 September 2026. Menutup permintaan CEO atas halaman lacak pesanan sungguhan di `titikasalkopi.id`, bukan pengalihan ke marketplace.

Dokumen ini punya dua pembaca. Bagian 1 sampai 4 untuk **owner** — tidak perlu mengerti kode. Bagian 5 sampai 7 untuk siapa pun yang memelihara situs.

---

## 1. Cara kerjanya, dalam satu paragraf

Buku order Anda pindah dari catatan manual ke satu Google Sheet. Sebuah skrip kecil milik Google membaca sheet itu dan menjawab satu pertanyaan saja: "pesanan dengan kode ini dan empat digit ini, statusnya apa?" Halaman `/lacak` di website bertanya ke skrip itu lalu menampilkan jawabannya. Tidak ada server baru, tidak ada biaya bulanan, dan sheet Anda tetap privat.

Sejak KD-06, barisnya **tidak lagi Anda ketik**. Begitu pembeli menekan "Pesan via WhatsApp", website langsung menuliskan barisnya sendiri ke sheet — kode order, isi pesanan, subtotal, tanggal, dan status awal. Yang tersisa untuk Anda hanyalah memperbarui status dan mengisi resi.

Yang **tidak** berubah: pesanan tetap masuk lewat WhatsApp, dan Anda tetap yang menentukan statusnya. Halaman lacak hanya menayangkan apa yang ada di sheet. Ia tidak menilai apa pun sendiri.

---

## 2. Menyiapkan sheet

Buat satu Google Sheet baru. Beri nama tab pertamanya **`pesanan`** (huruf kecil).

Baris pertama adalah judul kolom. Tulis persis seperti ini, huruf kecil semua:

| kode | tanggal_pesan | last4 | status | tanggal_status | kurir | resi | ringkasan | sumber | catatan_internal |
|---|---|---|---|---|---|---|---|---|---|
| TAK-260908-K7Q2 | 2026-09-08 | 9567 | dikirim | 2026-09-09 | JNE | JX1234567890 | Abmisibil 200 gr x2 = Rp410.000 | web | sudah transfer |

Arti tiap kolom:

| Kolom | Isi | Wajib |
|---|---|---|
| `kode` | Kode order dari pesan WhatsApp pembeli, bentuk `TAK-YYMMDD-XXXX` | Ya |
| `tanggal_pesan` | Tanggal pesanan masuk, `YYYY-MM-DD` | Tidak |
| `last4` | **4 digit terakhir nomor WhatsApp pembeli**. Diisi pembeli sendiri di keranjang; kosong bila ia melewatinya, lalu Anda ambil dari chat | Ya |
| `status` | Salah satu slug pada tabel Bagian 3 | Ya |
| `tanggal_status` | Tanggal Anda terakhir mengubah status, `YYYY-MM-DD` | Sangat dianjurkan |
| `kurir` | JNE, J&T, SiCepat, dan seterusnya | Tidak |
| `resi` | Nomor resi setelah paket berangkat | Tidak |
| `ringkasan` | Isi pesanan singkat, supaya pembeli yakin ini pesanannya | Tidak |
| `sumber` | `web` untuk baris yang ditulis website sendiri, kosong untuk yang Anda ketik | **Ya** |
| `catatan_internal` | Catatan Anda sendiri | Tidak |

Kolom `sumber` **wajib ada** walaupun Anda tidak pernah mengisinya sendiri. Tanpa kolom itu, website menolak mencatat apa pun — dan itu disengaja: kuota harian yang membatasi penyalahgunaan menghitung dari kolom ini, jadi kalau kolomnya hilang, pagarnya ikut mati tanpa suara. Lebih baik pencatatan berhenti daripada terbuka tanpa batas.

**`catatan_internal` tidak pernah dikirim ke website.** Begitu juga kolom lain yang Anda tambahkan sendiri. Skrip hanya mengirim kolom yang disebut namanya di dalamnya — kolom baru aman secara bawaan. Kalau Anda ingin menyimpan nama, nomor telepon, atau alamat pembeli di sheet ini, silakan; keduanya tidak akan pernah keluar.

### Kenapa perlu `last4`

Kode order hanya 4 karakter acak. Tanpa penyaring kedua, orang bisa menebak kode secara massal dan membaca status pesanan orang lain. Meminta empat digit terakhir nomor WhatsApp menutup itu tanpa membuat pembeli mendaftar akun: mereka jelas tahu nomornya sendiri.

**Siapa yang mengisinya.** Di keranjang ada kolom opsional untuk empat digit itu. Kalau pembeli mengisinya, kolom `last4` terisi sendiri dan ia langsung bisa melacak. Kalau dikosongkan, barisnya tetap masuk lengkap — hanya kolom `last4` yang kosong, dan Anda mengetiknya dari nomor pengirim chat. Empat ketukan, bukan mengetik ulang seluruh pesanan.

Kolomnya sengaja **tidak** diwajibkan. Kolom wajib satu ketukan sebelum tombol pesan adalah tempat paling mahal untuk kehilangan pembeli, dan pesanan yang hilang jauh lebih merugikan daripada pelacakan yang tertunda.

---

## 3. Kosakata status

Ketik **persis** salah satu slug ini di kolom `status`. Salah ketik tidak akan menampilkan status yang salah — halaman akan mengatakan statusnya belum dikenali, karena menampilkan status keliru kepada orang yang sudah transfer jauh lebih buruk.

| Yang Anda ketik | Yang dilihat pembeli |
|---|---|
| `menunggu-konfirmasi` | **Menunggu konfirmasi** — pesanan sudah masuk dan sedang diperiksa |
| `menunggu-pembayaran` | **Menunggu pembayaran** — total akhir sudah dikirim, menunggu transfer |
| `diproses` | **Sedang disiapkan** — kopi sedang digiling dan dikemas |
| `dikirim` | **Dalam pengiriman** — paket sudah diserahkan ke kurir |
| `selesai` | **Selesai** — paket sudah sampai |
| `batal` | **Dibatalkan** |

---

## 4. Memasang skripnya

Sekali saja, sekitar sepuluh menit.

1. Buka sheet Anda, lalu menu **Extensions > Apps Script**.
2. Hapus isi berkas `Code.gs` yang muncul, tempelkan seluruh isi `ops/order-tracker.gs` dari repositori ini.
3. Simpan.
4. Pilih fungsi **`selfCheck`** di bar atas, tekan **Run**. Izinkan aksesnya saat diminta. Baca Execution log: kalau tertulis `OK.` beserta daftar kolom, bentuk sheet Anda sudah benar. Kalau ada pesan kolom wajib tidak ada, betulkan baris judulnya lalu ulangi.
5. Tekan **Deploy > New deployment**. Pilih tipe **Web app**.
   - **Execute as:** Me
   - **Who has access:** Anyone
6. Salin **Web app URL** yang muncul. Bentuknya `https://script.google.com/macros/s/AKfy…/exec`.

Dua setelan pada langkah 5 sering disalahpahami, jadi ditulis terang di sini. "Anyone" berarti siapa pun boleh memanggil skripnya — bukan berarti sheet Anda menjadi publik. Sheet tetap privat; hanya skrip yang membacanya, dan skrip hanya menjawab kolom yang boleh keluar. "Execute as: Me" justru yang membuat sheet bisa tetap privat.

### Menghubungkannya ke website

URL dari langkah 6 dipasang sebagai variabel lingkungan `NEXT_PUBLIC_TRACKING_ENDPOINT` di alur penerbitan (`.github/workflows/pages.yml`). Selama variabel itu kosong, halaman `/lacak` tetap tayang dan menyatakan pelacakan belum aktif sambil mengarahkan pembeli ke WhatsApp — ia tidak pernah gagal diam-diam.

Setiap kali Anda mengubah isi skrip, tekan **Deploy > Manage deployments > Edit > Version: New version**. Tanpa itu, perubahan tidak tayang.

> **Wajib dilakukan sekarang bila Anda sudah memasang versi sebelumnya.**
> Skripnya berubah cukup besar sejak KD-06: ia sekarang punya `doPost` yang menulis baris otomatis, dan satu bug diperbaiki — versi pertama menolak menulis ke sheet yang baru punya baris judul tanpa data, sehingga **pesanan pertama Anda akan gagal tercatat**. Bug itu ditemukan oleh `web/scripts/check-order-tracker-gs.mjs`, bukan oleh pembeli.
>
> Langkahnya: tambahkan kolom **`sumber`** ke baris judul, tempel ulang seluruh isi `ops/order-tracker.gs`, jalankan `selfCheck`, lalu **Deploy > Manage deployments > Edit > Version: New version**. URL-nya tidak berubah, jadi tidak ada yang perlu disentuh di sisi website.

---

## 5. Kerja harian

Barisnya sudah ada sebelum Anda membuka WhatsApp. Yang tersisa:

1. Cocokkan kode order di chat dengan baris ber-`sumber` = `web` di sheet.
2. Kalau `last4` kosong, isi dari empat digit terakhir nomor pengirim.
3. Ubah `status` dan `tanggal_status` seiring pesanan berjalan.
4. Setelah paket berangkat, isi `kurir` dan `resi`, ubah `status` menjadi `dikirim`, perbarui `tanggal_status`.

Anda tidak perlu lagi mengetik kode, isi pesanan, subtotal, atau tanggal. Semuanya sudah tertulis sendiri.

### Baris yang tidak pernah menjadi pesanan

Baris ditulis saat pembeli **menekan tombol**, bukan saat pesannya terkirim. Sebagian orang menekan tombol lalu berubah pikiran di aplikasi WhatsApp, dan barisnya tetap ada.

Itu diterima secara sadar, dengan dua alasan. Pertama, membedakan keduanya menuntut satu langkah konfirmasi manual — persis pekerjaan yang ingin dihilangkan. Kedua, selisihnya justru berguna: jumlah baris `sumber` = `web` dikurangi jumlah chat yang benar-benar tiba adalah ukuran kebocoran di langkah terakhir, angka yang selama ini tidak Anda punya karena analitik belum menyala.

Cara menanganinya: **jangan hapus buru-buru.** Beri waktu sehari. Kalau chatnya tidak pernah datang, ubah `status` menjadi `batal` atau hapus barisnya. Baris ber-`sumber` kosong adalah yang Anda ketik sendiri dan tidak pernah tersentuh otomatisasi.

**Ketukan ganda.** Tombol pesan terkunci dua detik setelah diklik, jadi ketukan ganda di layar sentuh tidak menghasilkan dua baris. Kalau pembeli benar-benar menekan dua kali dengan jeda lebih lama, ia punya dua kode dan dua baris; yang berlaku adalah kode pada pesan yang **benar-benar terkirim** ke Anda. Kode yang sudah ada di sheet tidak pernah ditimpa, jadi baris yang sudah Anda sunting aman.

**Kalau Anda lupa memperbarui.** Setelah lebih dari lima hari tanpa perubahan, dan pesanan belum selesai atau batal, halaman menambahkan peringatan bahwa status mungkin sudah tidak mutakhir dan mengarahkan pembeli bertanya lewat WhatsApp. Ini disengaja: halaman lacak yang menampilkan "Sedang disiapkan" selama dua minggu berbohong tanpa niat, dan lebih merusak kepercayaan daripada tidak punya halaman lacak sama sekali.

---

## 6. Batasnya, ditulis terus terang

- **Bukan pelacakan kurir.** Posisi paket tetap dilacak di situs kurir memakai nomor resi. Halaman ini menampilkan apa yang Anda tulis, bukan apa yang kurir tahu.
- **Sheet adalah satu-satunya sumber kebenaran.** Tidak ada pencadangan otomatis di luar riwayat versi Google Sheet.
- **Tidak ada notifikasi.** Pembeli harus membuka halaman untuk melihat perubahan.
- **Batas kuota Apps Script** cukup untuk skala ini, tetapi bukan tak terhingga. Bila volume naik ke ratusan order per hari, ini saatnya pindah ke basis data sungguhan — dan pindahnya murah, karena situs hanya mengenal satu URL endpoint.
- **Endpoint pencatatan terbuka.** Siapa pun yang menemukan URL-nya bisa menambah baris. Yang membatasi kerusakannya: kuota 50 baris otomatis per hari, kode yang sudah ada tidak pernah ditimpa, dan teks dari luar dinetralkan sebelum masuk sel. Kalau suatu hari Anda melihat lonjakan baris `sumber` = `web` yang tidak berpasangan dengan chat mana pun, saring kolom itu dan hapus sekaligus — lalu beri tahu, karena berarti kuotanya perlu diturunkan.
- **Formula injection sudah ditutup.** Ringkasan yang masuk sheet berasal dari peramban pembeli, jadi ia teks yang dikendalikan orang lain. Sel yang diawali `=`, `+`, `-`, atau `@` akan dieksekusi Google Sheets sebagai rumus saat **Anda** membuka bukunya. Karakter itu dibuang di sisi Apps Script, bukan hanya di situs, karena sisi situs bisa dilewati.

---

## 7. Konsekuensi arsitektur yang harus diputuskan CEO

`next.config.ts` sudah menulis pemicunya jauh sebelum halaman ini ada:

> *"Begitu situs menampilkan konten dari luar repositori atau menerima input yang dipersistensikan, CSP wajib naik ke nonce dan halaman terkait berhenti statis."*
>
> *"Risiko itu kecil selama situs hanya menyajikan konten statis dari repositori dan tidak menerima input yang dipersistensikan. Begitu salah satu berubah, situs harus pindah ke host yang bisa menyetel header."*

Halaman `/lacak` memenuhi syarat itu: ia menampilkan konten dari luar repositori.

Keadaan sekarang: host produksi adalah **GitHub Pages**, dan Pages **tidak dapat menyetel header sama sekali**. Artinya CSP, `X-Frame-Options`, dan `Permissions-Policy` tidak aktif di produksi hari ini — sudah begitu sejak sebelum halaman lacak ada, dan sudah dicatat sebagai risiko yang diterima. Yang berubah adalah bobot risikonya, karena sekarang ada satu halaman yang menyuntikkan data eksternal ke DOM.

Yang menahan risikonya tetap kecil untuk saat ini:

- Data yang masuk hanya teks, dirender React sebagai teks. Tidak ada `dangerouslySetInnerHTML` di jalur ini.
- Penguraiannya menyalin hanya medan yang disebut namanya, sehingga medan tak dikenal tidak pernah sampai ke UI.
- Endpoint tidak pernah mengembalikan data pribadi.

Yang tetap hilang tanpa header: `connect-src` tidak ditegakkan, sehingga bila suatu saat ada skrip pihak ketiga yang tersuntik, tidak ada yang mencegahnya mengirim data ke mana pun. CSP-nya sudah disiapkan di `next.config.ts` dan aktif pada target Vercel — ia hanya tidak pernah terpasang di Pages.

**Pilihan yang ada di tangan CEO:**

1. **Pindah produksi ke Vercel.** CSP dan header keamanan lain langsung aktif tanpa perubahan kode; keduanya sudah ditulis. Domain `titikasalkopi.id` diarahkan ke sana. Ini yang direkomendasikan.
2. **Tetap di GitHub Pages.** Halaman lacak tetap berfungsi, tetapi situs berjalan tanpa header keamanan sementara sekarang menampilkan konten eksternal. Risiko yang harus diterima secara sadar, bukan diabaikan.

Selama keputusan belum diambil, halaman lacak tetap aman dipakai — tetapi keputusannya jangan digantung, karena pemicunya sudah lewat.
