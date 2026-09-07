# 01 — Business Requirements Input
## Titik Asal Kopi (titikasalkopi.id)

**Penulis:** Bisnis User / Product Owner
**Untuk:** Business Analyst (input mentah untuk penyusunan `02-BRD.md`)
**Referensi wajib:** `docs/00-brand-brief.md` (sumber kebenaran brand, katalog, harga, dan keputusan CEO)
**Tanggal:** 2026-09-07
**Status:** Final untuk Fase 1

> Cara baca dokumen ini: ditulis dari sudut pandang bisnis, bukan teknis. Setiap detail yang belum pernah diputuskan secara resmi oleh manajemen ditandai `[ASUMSI]` dan harus dikonfirmasi ke Product Owner sebelum masuk ke BRD sebagai kebutuhan final. Keputusan CEO pada brand brief tidak dibuka ulang di sini.

---

## 1. Latar Belakang Bisnis dan Masalah yang Ingin Dipecahkan

### 1.1 Situasi saat ini

Titik Asal Kopi adalah roaster kopi specialty Indonesia dengan positioning "kopi single origin & houseblend dari titik terbaik di Indonesia", berfokus pada Indonesia Timur (Kupang NTT, Pegunungan Bintang dan Jayawijaya Papua) serta pilihan Nusantara (Garut, Kerinci, Bener Meriah Aceh). Tagline brand: *"Pilih rasa, temukan asalnya, nikmati setiap momen."*

Sampai hari ini seluruh penjualan berjalan lewat tiga kanal:

1. **WhatsApp (087777939567)** — kanal utama. Semua order masuk lewat chat, termasuk order houseblend per kilogram dari kedai.
2. **Instagram (@Titikasalkopi)** — kanal awareness dan etalase visual. Calon pembeli menemukan brand di sini, lalu berpindah ke WhatsApp untuk menanyakan harga dan stok.
3. **Shopee (Titikasalkopi)** — kanal transaksi ritel dengan pembayaran dan pengiriman yang sudah ditangani marketplace.

### 1.2 Masalah yang dirasakan

| # | Masalah | Dampak bisnis |
|---|---|---|
| M-01 | **Tidak ada etalase yang lengkap dan permanen.** Katalog "hidup" di kepala owner dan di broadcast WhatsApp. Instagram hanya menampilkan sebagian produk dan tenggelam oleh unggahan baru; Shopee tidak memuat seluruh varian houseblend per kg. | Calon pembeli tidak pernah melihat katalog utuh. Varian bermargin baik (BOLD 70:30, BRIGHT Signature) jarang tertawarkan karena tidak terlihat. |
| M-02 | **Pertanyaan berulang menghabiskan waktu owner.** Setiap chat dimulai dari nol: "harga berapa?", "ada apa saja?", "bedanya Abmisibil dan Sabin apa?", "bisa kirim ke luar kota?", "bisa minta digiling?". | Waktu produktif owner habis untuk menjawab hal yang sama. Respons melambat pada jam roasting, sebagian calon pembeli hilang. |
| M-03 | **Cerita origin tidak tersampaikan.** Nilai jual utama Titik Asal Kopi adalah asal-usul biji: Abmisibil di 1900 MASL dengan proses Natural Anaerob, Sabin Washed oleh Elias Kaladana, Pondok Baru Natural Classic oleh BBMC di 1400 MASL. Caption Instagram terlalu pendek untuk memuatnya. | Produk terlihat seperti komoditas. Sulit mempertahankan harga premium Rp125.000 per 200 gr dibanding kopi tanpa cerita. |
| M-04 | **Segmen B2B (kedai kopi) tidak terlayani dengan baik.** Pemilik kedai butuh perbandingan rasio Arabica–Robusta, profil rasa, dan harga per kg untuk menghitung HPP per cangkir. Informasi itu hanya tersedia lewat tanya-jawab manual. | Siklus penjualan B2B panjang dan tidak konsisten. Kedai sering memutuskan tanpa mencoba varian yang paling cocok. |
| M-05 | **Brand sulit ditemukan di Google.** Pencarian "kopi Papua", "kopi Kupang", "kopi Gayo", "biji kopi roasted" tidak memunculkan Titik Asal Kopi. | Seluruh traffic bergantung pada Instagram dan rekomendasi mulut ke mulut. Tidak ada pertumbuhan organik yang bisa diprediksi. |
| M-06 | **Tidak ada aset yang bisa dijadikan "alamat resmi" brand.** Saat memperkenalkan diri ke kedai, calon reseller, atau pembeli korporat, tidak ada satu tautan yang membuktikan brand ini serius. | Kredibilitas rendah pada penjualan bernilai besar (order per kg dan hadiah korporat). |
| M-07 | **Data perilaku pembeli nol.** Tidak diketahui produk mana yang paling dilihat, dari kota mana peminat terbanyak, atau kata kunci apa yang membawa orang datang. | Keputusan roasting, stok, dan promosi diambil berdasarkan perkiraan. |

### 1.3 Peran website dalam memecahkan masalah

Website titikasalkopi.id **tidak menggantikan** WhatsApp dan Shopee, melainkan menjadi **lapisan informasi dan kualifikasi di depan keduanya**:

- Katalog resmi yang lengkap, akurat, dan selalu tersedia (menjawab M-01 dan M-02).
- Rumah cerita origin dan panduan seduh yang membenarkan harga premium (M-03).
- Alat bantu jual untuk segmen kedai lewat tabel rasio dan harga per kg (M-04).
- Aset SEO lokal yang mendatangkan pembeli baru tanpa iklan (M-05).
- Tautan tunggal yang kredibel untuk semua perkenalan brand (M-06).
- Sumber data perilaku pembeli lewat analitik (M-07).

Sesuai keputusan CEO, transaksi Fase 1 tetap ditutup di WhatsApp (keranjang di sisi klien lalu dikirim sebagai pesan terstruktur) dengan Shopee sebagai alternatif bagi pembeli yang lebih nyaman membayar di marketplace. Tidak ada payment gateway di Fase 1.

### 1.4 Definisi sukses secara kualitatif

Fase 1 berhasil jika: owner bisa membalas chat dengan satu tautan alih-alih mengetik ulang daftar harga; calon pembeli tiba di WhatsApp sudah tahu produk apa yang dia inginkan; dan owner sendiri bisa mengubah harga atau menambah varian tanpa memanggil developer.

---

## 2. Tujuan Bisnis yang Terukur

Periode pengukuran: **6 bulan sejak website tayang**. Angka baseline adalah kondisi saat ini menurut catatan operasional owner.

| Kode | Tujuan | Baseline | Target bulan ke-3 | Target bulan ke-6 | Cara ukur |
|---|---|---|---|---|---|
| G-01 | Inquiry WhatsApp yang berasal dari website per bulan | 0 | 60 chat/bulan | 120 chat/bulan | Klik tombol WhatsApp tercatat di analitik + penanda sumber pada isi pesan |
| G-02 | Total inquiry WhatsApp seluruh kanal per bulan | ± 70 chat/bulan | 130 chat/bulan | 180 chat/bulan | Hitungan manual owner + analitik |
| G-03 | Conversion rate katalog ke chat (pengunjung halaman produk yang menekan tombol pesan/tanya) | Belum terukur | 5% | 8% | Klik CTA WhatsApp dibagi sesi yang membuka halaman produk |
| G-04 | Share of order yang berasal dari website | 0% | 15% dari jumlah order | 30% dari jumlah order | Penandaan sumber order pada catatan penjualan owner |
| G-05 | Sesi organik dari Google per bulan | ± 0 | 400 sesi/bulan | 1.200 sesi/bulan | Google Search Console / analitik |
| G-06 | Kata kunci target yang masuk halaman 1 Google ("kopi Papua", "kopi Kupang", "kopi Gayo", "biji kopi roasted", "houseblend kopi per kg") | 0 | 1 kata kunci | 3 kata kunci | Google Search Console |
| G-07 | Kedai/B2B baru yang order pertama lewat jalur website | ± 1 kedai/bulan | 2 kedai/bulan | 4 kedai/bulan | Catatan penjualan owner |
| G-08 | Rata-rata nilai order ritel | ± Rp125.000 (1 pack) | Rp180.000 | Rp210.000 | Dorongan bundling 3 pack (Rp350.000 Signature / Rp310.000 Reguler) di halaman produk |
| G-09 | Waktu owner menjawab pertanyaan berulang | ± 8 jam/minggu | 5 jam/minggu | 3 jam/minggu | Estimasi owner, dibantu FAQ dan halaman cara seduh |
| G-10 | Waktu update harga/produk oleh owner sendiri | Belum mungkin | ≤ 30 menit per perubahan | ≤ 15 menit per perubahan | Catatan waktu saat perubahan harga dilakukan |

`[ASUMSI]` Baseline G-02 (±70 chat/bulan) dan G-09 (±8 jam/minggu) berasal dari estimasi owner, bukan pencatatan sistematis. Disarankan satu bulan pencatatan manual sebelum website tayang agar pengukuran adil.

`[ASUMSI]` Target G-05 dan G-06 mengasumsikan tidak ada belanja iklan berbayar di Fase 1; pertumbuhan sepenuhnya organik ditambah dorongan dari Instagram.

---

## 3. Persona Pengguna

### Persona A — Rani, Penikmat Kopi Rumahan (Home Brewer)

| Aspek | Detail |
|---|---|
| **Profil** | 27 tahun, karyawan swasta di kota besar. Punya V60 dan grinder manual, kadang memakai French press. Mengikuti beberapa akun kopi di Instagram. |
| **Konteks** | Membeli 200 gr setiap 3–4 minggu. Suka mencoba origin baru, tetapi tidak mau membuang uang untuk kopi yang tidak cocok dengan lidahnya. Menjelajah dari HP, sering sambil di perjalanan. |
| **Kebutuhan** | Mengetahui profil rasa sebelum membeli (catatan rasa, proses, ketinggian, varietas). Tanggal roasting. Pilihan biji utuh atau digiling sesuai alat seduh. Panduan seduh yang bisa langsung dipraktikkan. |
| **Kekhawatiran** | Kopi datang sudah lama di-roasting dan rasanya hambar. Harga Rp110.000–125.000 per 200 gr terasa mahal jika ternyata tidak cocok. Takut salah memilih tingkat gilingan. Ragu pada toko kecil yang tidak jelas kebijakan pengirimannya. |
| **Pemicu beli** | Deskripsi rasa yang spesifik dan jujur (misalnya Abmisibil: Natural Anaerob, 1900 MASL, Arabica Bourbon & Typica), foto kemasan yang meyakinkan, opsi 3 pack Rp350.000 yang terasa lebih hemat, dan proses pesan cepat lewat WhatsApp tanpa perlu mendaftar akun. |
| **Produk relevan** | Single Origin 200 gr — Signature (Oelbiteno, Abmisibil, Sabin, Pyramid) dan Reguler (Palimping, Kerinci, Pondok Baru). |

### Persona B — Mas Dwi, Pemilik / Purchasing Coffee Shop (Beli per Kg)

| Aspek | Detail |
|---|---|
| **Profil** | 34 tahun, pemilik kedai kopi kecil dengan satu mesin espresso dua grup, penjualan 80–120 cangkir per hari. Membeli 5–15 kg per bulan. |
| **Konteks** | Sedang mencari supplier houseblend yang konsisten dan harganya masuk untuk HPP. Pernah kecewa dengan supplier yang rasanya berubah tiap batch. Membandingkan dua sampai tiga roaster sekaligus. |
| **Kebutuhan** | Daftar harga per kg yang transparan untuk semua rasio (BOLD 70:30 sampai 20:80, BRIGHT Signature dan Reguler, Full Robusta). Profil rasa tiap blend untuk menilai kecocokan dengan menu berbasis susu. Kesempatan mencoba sampel sebelum komitmen. Kepastian ketersediaan stok bulanan dan konsistensi roasting. |
| **Kekhawatiran** | Rasa tidak konsisten antar batch. Roaster kehabisan stok saat kedai sedang ramai. Harga naik mendadak. Minimum order terlalu besar untuk kedai kecil. Tidak ada nota resmi untuk pembukuan. |
| **Pemicu beli** | Tabel rasio–harga yang bisa langsung dihitung menjadi HPP per cangkir; penjelasan bahwa BOLD memakai Arabica Natural dan Fine Robusta Natural dengan catatan rasa choco, almond, caramel (cocok untuk kopi susu); kemudahan meminta sampel; serta respons WhatsApp yang cepat dan profesional. |
| **Produk relevan** | Houseblend BOLD (enam rasio, Rp175.000–210.000/kg), BRIGHT Signature Rp260.000/kg dan Reguler Rp230.000/kg, Full Robusta Rp175.000/kg. |

### Persona C — Bu Lestari, Pembeli Hadiah / Korporat

| Aspek | Detail |
|---|---|
| **Profil** | 41 tahun, staf General Affairs di perusahaan menengah. Juga membeli hadiah pribadi untuk kolega dan klien. |
| **Konteks** | Membutuhkan 20–100 paket untuk acara kantor, Lebaran, atau suvenir tamu. Terikat tanggal acara yang keras dan butuh kepastian jauh hari. Tidak akrab dengan istilah kopi. |
| **Kebutuhan** | Paket hadiah yang terlihat pantas diberikan, cerita brand yang bisa diceritakan ulang ke penerima ("kopi dari Pegunungan Bintang, Papua"), kepastian jumlah dan tanggal kirim, serta harga total yang bisa diajukan ke atasan. |
| **Kekhawatiran** | Barang tidak siap tepat waktu. Kemasan tidak layak sebagai hadiah. Tidak ada nota atau bukti pembayaran untuk penggantian biaya kantor. Harus menjelaskan istilah kopi yang tidak dia pahami. |
| **Pemicu beli** | Halaman yang menjelaskan opsi hadiah dan cara memesan dalam jumlah banyak, cerita brand yang kuat dan mudah diulang, kontak yang jelas untuk permintaan penawaran, serta respons meyakinkan pada chat pertama. |
| **Produk relevan** | Single Origin 3 pack (Rp350.000 Signature / Rp310.000 Reguler) sebagai paket hadiah dasar dan paket cicip. `[ASUMSI]` Belum ada SKU hampers atau gift box resmi; Fase 1 hanya menyediakan jalur permintaan penawaran, bukan produk hampers yang dijual di katalog. |

### Persona D — Yoga, Reseller

| Aspek | Detail |
|---|---|
| **Profil** | 29 tahun, punya toko daring kecil dan komunitas kopi di kotanya. Menjual ulang produk roaster dengan margin. |
| **Konteks** | Mencari brand dengan cerita kuat dan visual bagus supaya mudah dijual ulang. Ingin memastikan brand tidak menjual langsung ke pelanggannya dengan harga lebih murah. |
| **Kebutuhan** | Skema harga reseller yang jelas, minimum order yang masuk akal, ketersediaan foto dan deskripsi produk untuk dipakai berjualan, serta jaminan pasokan rutin. |
| **Kekhawatiran** | Margin tipis karena harga ritel brand terlalu rendah. Stok tidak stabil sehingga pelanggannya kecewa. Brand membuka reseller lain di kota yang sama. Tidak ada dukungan materi promosi. |
| **Pemicu beli** | Halaman kemitraan yang menjelaskan cara menjadi reseller dan apa yang didapat, ditambah kanal WhatsApp khusus untuk membahas harga. |
| **Produk relevan** | Seluruh lini, terutama houseblend per kg dan single origin 200 gr. `[ASUMSI]` Harga khusus reseller belum ditetapkan dan **tidak ditampilkan di website**; Fase 1 hanya menyediakan CTA pendaftaran minat reseller yang diarahkan ke WhatsApp. |

### 3.1 Prioritas persona untuk Fase 1

1. **Persona A (home brewer)** — volume traffic terbesar, konversi tercepat.
2. **Persona B (kedai)** — nilai order terbesar per transaksi, penentu pertumbuhan.
3. **Persona C (hadiah/korporat)** — musiman tetapi bernilai tinggi.
4. **Persona D (reseller)** — cukup dilayani satu blok informasi dan CTA, tanpa fitur khusus.

---

## 4. User Journey Utama (End-to-End)

### 4.1 Skenario 1 — Rani membeli Single Origin 200 gr

| Tahap | Yang dilakukan pengguna | Yang harus disediakan website | Titik gagal yang harus dicegah |
|---|---|---|---|
| 1. Sadar | Melihat unggahan Instagram tentang Abmisibil, menekan tautan di bio. | Beranda memuat cepat di jaringan seluler, langsung menampilkan positioning dan jalan pintas ke katalog. | Halaman lambat atau berantakan di HP membuatnya keluar sebelum melihat produk. |
| 2. Jelajah | Membuka katalog, memfilter ke Single Origin, membandingkan Abmisibil dan Sabin. | Katalog dengan filter kategori (Single Origin / Houseblend) dan tier (Signature / Reguler); kartu produk menampilkan nama, asal, harga 1 pack, dan foto. | Harga tidak terlihat di kartu produk sehingga ia harus membuka satu per satu. |
| 3. Pertimbang | Membuka detail Abmisibil, membaca proses Natural Anaerob, 1900 MASL, varietas Bourbon & Typica, dan catatan rasa. | Halaman detail origin lengkap: asal, ketinggian, proses, varietas, catatan rasa, rekomendasi metode seduh, harga 1 pack Rp125.000 dan 3 pack Rp350.000. | Deskripsi terlalu singkat sehingga tidak ada alasan membayar harga premium. |
| 4. Konfigurasi | Memilih 1 pack atau 3 pack, memilih bentuk biji (utuh atau digiling) dan metode seduh. | Pilihan varian pada halaman detail; harga ikut berubah saat pilihan berganti. | Pilihan gilingan tidak tersedia sehingga ia harus bertanya lewat chat. |
| 5. Keranjang | Menambahkan 1 pack Abmisibil dan 1 pack Kerinci ke keranjang. | Keranjang sisi klien dengan ringkasan isi, subtotal, dan kemampuan mengubah jumlah atau menghapus item. | Keranjang hilang saat berpindah halaman atau menutup browser sebentar. |
| 6. Checkout | Menekan "Pesan via WhatsApp". | Pesan WhatsApp terisi otomatis dan rapi: nama produk, varian, jumlah, harga satuan, subtotal, dan penanda sumber titikasalkopi.id. Tautan Shopee ditampilkan berdampingan sebagai alternatif. | Pesan yang terkirim tidak lengkap sehingga owner harus bertanya ulang. |
| 7. Konfirmasi | Mengirim pesan, owner membalas ongkir dan total, Rani mentransfer. | Website sudah menyampaikan ekspektasi: cara pengiriman, estimasi waktu roasting hingga kirim, dan kebijakan pengiriman. | Rani terkejut dengan ongkir atau lama pengiriman karena tidak diberi tahu sejak awal. |
| 8. Pasca-beli | Menerima kopi, membuka halaman "Cara Seduh" untuk resep V60. | Panduan seduh per metode dengan rasio dan langkah. | Tanpa panduan, hasil seduhan buruk dan kopinya yang disalahkan. |

### 4.2 Skenario 2 — Mas Dwi memesan Houseblend per Kg untuk kedai

| Tahap | Yang dilakukan pengguna | Yang harus disediakan website | Titik gagal yang harus dicegah |
|---|---|---|---|
| 1. Sadar | Mencari "supplier houseblend kopi per kg" di Google atau mendapat rekomendasi. | Halaman houseblend yang dioptimasi untuk kata kunci B2B. | Tidak muncul di hasil pencarian sama sekali. |
| 2. Jelajah | Membuka halaman Houseblend, melihat tiga lini: BOLD, BRIGHT, Full Robusta. | Penjelasan karakter tiap lini: BOLD (Arabica Natural & Fine Robusta Natural; choco, almond, caramel), BRIGHT (Full Arabica natural & washed; raisin, orange, lemon zest), dan Full Robusta. | Ketiga lini tercampur sehingga perbedaannya tidak terbaca. |
| 3. Bandingkan | Membandingkan enam rasio BOLD dan harganya untuk menghitung HPP. | Tabel rasio–harga per kg yang terbaca jelas di HP: 70:30 Rp210.000, 60:40 Rp200.000, 50:50 Rp195.000, 40:60 Rp190.000, 30:70 Rp185.000, 20:80 Rp175.000; BRIGHT Signature Rp260.000 dan Reguler Rp230.000; Full Robusta Rp175.000. | Tabel terpotong atau harus digeser menyamping sehingga sulit dibaca. |
| 4. Kualifikasi | Ingin mencoba dahulu sebelum membeli banyak. | Ajakan jelas "Konsultasi blend / minta sampel" yang mengarah ke WhatsApp dengan konteks B2B. | Hanya tersedia tombol beli ritel sehingga ia merasa website ini bukan untuk kedai. |
| 5. Pesan | Memilih BOLD 60:40 sebanyak 5 kg dan menambahkannya ke keranjang. | Keranjang mendukung satuan kg dengan jumlah bebas; subtotal terhitung otomatis (5 × Rp200.000 = Rp1.000.000). | Jumlah dibatasi kecil sehingga order per kg tidak bisa dimasukkan. |
| 6. Checkout | Menekan "Pesan via WhatsApp"; pesan berisi rincian order dan penanda order kedai. | Template pesan yang memuat rasio, jumlah kg, harga per kg, dan subtotal. | Pesan tidak menyebut rasio spesifik sehingga owner salah meracik. |
| 7. Negosiasi | Owner membalas, membahas jadwal roasting, ongkir, dan pembayaran. | Halaman kebijakan pengiriman dan FAQ B2B sudah menjawab sebagian besar pertanyaan sehingga negosiasi lebih singkat. | Waktu owner habis menjelaskan hal dasar. |
| 8. Berulang | Melakukan order bulanan berikutnya. | Halaman houseblend tetap menjadi rujukan harga; owner cukup mengirim tautan. | Harga di web berbeda dengan harga yang diberikan owner. |

### 4.3 Skenario 3 — Bu Lestari bertanya-tanya sebelum membeli

| Tahap | Yang dilakukan pengguna | Yang harus disediakan website | Titik gagal yang harus dicegah |
|---|---|---|---|
| 1. Masuk | Menerima tautan titikasalkopi.id dari kolega saat mencari ide suvenir acara kantor. | Beranda menjelaskan siapa Titik Asal Kopi dalam satu layar tanpa jargon. | Halaman langsung menjejalkan istilah teknis sehingga ia merasa bukan sasarannya. |
| 2. Cari jawaban | Ingin tahu: bisa pesan 50 paket? Bisa kirim ke kota lain? Berapa lama? Bisa dikemas untuk hadiah? | FAQ yang memuat pertanyaan pesanan jumlah banyak, pengiriman, dan pengemasan; halaman kebijakan pengiriman. | Pertanyaan dasar tidak terjawab sehingga ia harus chat untuk hal yang seharusnya bisa dibaca sendiri. |
| 3. Menilai kredibilitas | Membaca cerita brand dan asal biji, melihat kanal resmi. | Halaman "Cerita Kami" dan blok kontak resmi (WhatsApp, Instagram, Shopee) yang konsisten di seluruh halaman. | Tidak ada bukti bahwa brand ini nyata dan aktif. |
| 4. Bertanya | Menekan "Tanya via WhatsApp" dari halaman FAQ atau kontak. | CTA tanya tersedia di setiap halaman, dengan pesan pembuka yang sudah memuat konteks halaman asal. | Nomor WhatsApp harus disalin manual, atau chat dimulai kosong tanpa konteks. |
| 5. Menerima penawaran | Owner mengirim penawaran jumlah dan harga. | Katalog sudah membentuk ekspektasi harga sehingga penawaran tidak mengejutkan. | Harga di web dan penawaran tidak sinkron. |
| 6. Keputusan | Meneruskan tautan produk ke atasannya untuk persetujuan. | Setiap produk memiliki URL sendiri yang bisa dibagikan dan menampilkan pratinjau rapi saat dikirim di WhatsApp. | Semua produk berada di satu URL sehingga tidak bisa dibagikan spesifik. |

### 4.4 Jalur alternatif yang tetap harus didukung

- Pembeli yang lebih percaya marketplace: setiap halaman produk menyediakan tautan ke Shopee sebagai alternatif checkout.
- Pengunjung dari Instagram yang sekadar melihat-lihat: harus bisa mencapai katalog dalam satu ketukan dari beranda.
- Reseller: menemukan blok "Kemitraan / Reseller" dari menu atau footer dan langsung diarahkan ke WhatsApp dengan konteks kemitraan.

---

## 5. Kebutuhan Fungsional (User Story) dan Prioritas MoSCoW

Format: `Sebagai ... saya ingin ... sehingga ...`, dengan acceptance criteria singkat. Kolom prioritas memakai MoSCoW untuk Fase 1: **Must** (wajib rilis), **Should** (sangat diinginkan, boleh menyusul dalam fase 1 jika waktu mepet), **Could** (bonus), **Won't** (disepakati tidak dikerjakan di fase 1).

### Epik 1 — Penemuan Produk dan Katalog

**US-01 — Melihat katalog lengkap** · **Must**
Sebagai penikmat kopi rumahan, saya ingin melihat seluruh produk Titik Asal Kopi dalam satu halaman katalog, sehingga saya tahu pilihan yang tersedia tanpa harus bertanya lewat chat.
*Acceptance criteria:*
- Katalog menampilkan seluruh produk dari brand brief: 3 lini houseblend (BOLD dengan 6 rasio, BRIGHT Signature dan Reguler, Full Robusta) dan 7 single origin (Oelbiteno, Abmisibil, Sabin, Pyramid, Palimping, Kerinci, Pondok Baru).
- Setiap kartu produk menampilkan nama, kategori, tier (Signature/Reguler), harga awal, dan foto.
- Katalog dapat dibuka maksimal satu ketukan dari beranda.

**US-02 — Memfilter katalog** · **Must**
Sebagai pengunjung, saya ingin memfilter katalog berdasarkan kategori dan tier, sehingga saya cepat sampai ke produk yang relevan bagi saya.
*Acceptance criteria:*
- Tersedia filter kategori: Single Origin dan Houseblend.
- Tersedia filter tier: Signature dan Reguler.
- Filter dapat digabungkan dan bisa dikosongkan kembali dalam satu ketukan.
- Hasil filter langsung terlihat tanpa memuat ulang halaman penuh.

**US-03 — Melihat harga tanpa perlu bertanya** · **Must**
Sebagai calon pembeli, saya ingin melihat harga resmi setiap produk langsung di website, sehingga saya bisa menilai kecocokan anggaran sebelum menghubungi penjual.
*Acceptance criteria:*
- Harga single origin ditampilkan untuk 1 pack dan 3 pack (Signature Rp125.000 / Rp350.000; Reguler Rp110.000 / Rp310.000).
- Harga houseblend ditampilkan per kg sesuai daftar resmi.
- Format harga memakai Rupiah dengan pemisah ribuan, contoh "Rp210.000".
- Tidak ada produk yang ditampilkan tanpa harga.

**US-04 — Mencari produk berdasarkan nama atau daerah asal** · **Should**
Sebagai pengunjung yang sudah punya nama di kepala, saya ingin mencari produk berdasarkan nama atau daerah asal, sehingga saya tidak perlu menggulir seluruh katalog.
*Acceptance criteria:*
- Pencarian mencakup nama produk dan nama daerah (misalnya "Papua" memunculkan Abmisibil, Sabin, dan Pyramid).
- Pencarian tidak membedakan huruf besar-kecil.
- Jika tidak ada hasil, ditampilkan pesan dan ajakan menghubungi WhatsApp.

**US-05 — Melihat rekomendasi produk terkait** · **Could**
Sebagai pengunjung di halaman detail produk, saya ingin melihat 2–3 produk lain yang serupa, sehingga saya menemukan pilihan yang mungkin lebih cocok.
*Acceptance criteria:*
- Halaman detail menampilkan produk lain dari kategori atau tier yang sama.
- Rekomendasi tidak menampilkan produk yang sedang dibuka.

### Epik 2 — Detail Produk dan Cerita Origin

**US-06 — Membaca detail asal-usul single origin** · **Must**
Sebagai penikmat kopi rumahan, saya ingin membaca detail asal, proses, ketinggian, dan varietas setiap single origin, sehingga saya yakin kopinya sepadan dengan harganya.
*Acceptance criteria:*
- Halaman detail memuat data yang tersedia di brand brief, misalnya Abmisibil: Pegunungan Bintang Papua, Natural Anaerob Process, 1900 MASL, Arabica Bourbon & Typica.
- Untuk origin yang datanya belum lengkap (Oelbiteno, Pyramid, Palimping, Kerinci), minimal ditampilkan nama daerah asal; kolom lain dikosongkan, tidak dikarang.
- Setiap produk memiliki URL sendiri yang bisa dibagikan.

**US-07 — Melihat catatan rasa** · **Must**
Sebagai pengunjung, saya ingin melihat catatan rasa tiap produk, sehingga saya bisa memilih sesuai selera.
*Acceptance criteria:*
- Catatan rasa houseblend ditampilkan sesuai brand brief: BOLD (choco, almond, caramel), BRIGHT (raisin, orange, lemon zest).
- Catatan rasa ditampilkan sebagai label yang mudah dipindai, bukan paragraf panjang.

**US-08 — Memilih varian sebelum memesan** · **Must**
Sebagai pembeli, saya ingin memilih varian produk (jumlah pack untuk single origin, rasio untuk BOLD, ukuran kg untuk houseblend), sehingga pesanan saya sudah spesifik sejak awal.
*Acceptance criteria:*
- Single origin menyediakan pilihan 1 pack dan 3 pack, dan harga yang ditampilkan mengikuti pilihan.
- Houseblend BOLD menyediakan pemilihan enam rasio dengan harga masing-masing.
- Varian terpilih terbawa ke keranjang dan ke pesan WhatsApp.

**US-09 — Memilih bentuk biji dan metode seduh** · **Should**
Sebagai home brewer, saya ingin menyatakan apakah kopi dikirim dalam bentuk biji utuh atau digiling untuk metode tertentu, sehingga saya tidak perlu menjelaskannya lewat chat.
*Acceptance criteria:*
- Tersedia pilihan biji utuh atau giling.
- Jika memilih giling, tersedia pilihan metode seduh (misalnya V60, French press, espresso, tubruk, moka pot). `[ASUMSI]` Daftar metode ini belum dikonfirmasi owner dan perlu divalidasi terhadap kemampuan grinder yang dimiliki.
- Pilihan ini ikut tertulis dalam pesan WhatsApp.

**US-10 — Melihat foto produk yang jelas** · **Must**
Sebagai pengunjung, saya ingin melihat foto kemasan dan produk dengan jelas, sehingga saya percaya produknya nyata dan layak.
*Acceptance criteria:*
- Setiap produk memiliki minimal satu foto.
- Foto tampil proporsional di layar HP dan tidak membuat halaman melompat saat dimuat.
- Jika foto belum tersedia, ditampilkan placeholder bergaya brand, bukan gambar rusak.

### Epik 3 — Keranjang dan Checkout via WhatsApp

**US-11 — Menambahkan produk ke keranjang** · **Must**
Sebagai pembeli, saya ingin menambahkan beberapa produk ke keranjang, sehingga saya bisa memesan sekaligus dalam satu pesan.
*Acceptance criteria:*
- Produk beserta varian terpilih dapat ditambahkan dari halaman detail.
- Indikator jumlah item di keranjang terlihat di seluruh halaman.
- Menambahkan produk yang sama dengan varian sama akan menambah jumlah, bukan membuat baris baru.

**US-12 — Mengubah isi keranjang** · **Must**
Sebagai pembeli, saya ingin mengubah jumlah atau menghapus item di keranjang, sehingga pesanan saya benar sebelum dikirim.
*Acceptance criteria:*
- Jumlah item dapat dinaikkan, diturunkan, dan item dapat dihapus.
- Subtotal per item dan total keseluruhan diperbarui seketika.
- Keranjang kosong menampilkan pesan dan ajakan kembali ke katalog.

**US-13 — Keranjang bertahan saat halaman ditutup** · **Should**
Sebagai pembeli yang terganggu di tengah belanja, saya ingin isi keranjang saya tetap ada saat kembali, sehingga saya tidak perlu mengulang dari awal.
*Acceptance criteria:*
- Isi keranjang bertahan setelah halaman dimuat ulang atau browser ditutup dan dibuka kembali di perangkat yang sama.
- `[ASUMSI]` Masa simpan keranjang 7 hari, kemudian dikosongkan otomatis.

**US-14 — Mengirim pesanan via WhatsApp** · **Must**
Sebagai pembeli, saya ingin mengirim isi keranjang ke WhatsApp penjual dalam satu ketukan, sehingga saya tidak perlu mengetik ulang pesanan.
*Acceptance criteria:*
- Tombol "Pesan via WhatsApp" membuka WhatsApp ke nomor 087777939567 dengan pesan yang sudah terisi.
- Pesan memuat: daftar produk, varian, jumlah, harga satuan, subtotal per baris, total, dan penanda bahwa pesanan berasal dari titikasalkopi.id.
- Pesan tetap terbaca rapi di aplikasi WhatsApp seluler maupun WhatsApp Web.
- Tombol berfungsi baik dari HP maupun desktop.

**US-15 — Alternatif membeli lewat Shopee** · **Must**
Sebagai pembeli yang lebih nyaman bertransaksi di marketplace, saya ingin tautan ke toko Shopee Titik Asal Kopi, sehingga saya bisa membayar dengan cara yang sudah saya percaya.
*Acceptance criteria:*
- Tautan Shopee tersedia di halaman produk, halaman keranjang, dan footer.
- Tautan terbuka di tab baru.
- Tautan diberi penanda sumber agar bisa dihitung di analitik.

**US-16 — Bertanya tentang satu produk tertentu** · **Must**
Sebagai calon pembeli yang belum yakin, saya ingin bertanya lewat WhatsApp langsung dari halaman produk, sehingga percakapan sudah punya konteks.
*Acceptance criteria:*
- Tombol "Tanya produk ini" tersedia di setiap halaman detail.
- Pesan pembuka otomatis menyebut nama produk yang sedang dibuka.

### Epik 4 — Kebutuhan Segmen Kedai (B2B)

**US-17 — Membandingkan seluruh rasio houseblend BOLD** · **Must**
Sebagai pemilik kedai kopi, saya ingin melihat seluruh rasio Arabica–Robusta beserta harganya dalam satu tampilan, sehingga saya bisa menghitung HPP dan memilih rasio yang pas.
*Acceptance criteria:*
- Tabel memuat enam rasio BOLD lengkap dengan harga per kg sesuai daftar resmi.
- Tabel terbaca di layar HP tanpa harus melebar melewati layar; jika perlu digeser, area gesernya jelas.
- Tiap baris dapat langsung ditambahkan ke keranjang atau ditanyakan lewat WhatsApp.

**US-18 — Memesan houseblend dalam satuan kilogram** · **Must**
Sebagai pemilik kedai, saya ingin memesan houseblend dalam jumlah kilogram yang saya tentukan, sehingga pesanan saya sesuai kebutuhan bulanan.
*Acceptance criteria:*
- Jumlah kg dapat diisi bebas minimal 1 kg.
- Total dihitung otomatis (contoh: BOLD 60:40, 5 kg = Rp1.000.000).
- Satuan kg tertulis jelas di keranjang dan di pesan WhatsApp.

**US-19 — Meminta sampel atau konsultasi blend** · **Should**
Sebagai pemilik kedai yang belum pernah mencoba, saya ingin meminta sampel atau konsultasi blend, sehingga saya bisa menilai kecocokan sebelum order besar.
*Acceptance criteria:*
- Terdapat CTA khusus di halaman houseblend yang mengarah ke WhatsApp dengan pesan pembuka bernuansa B2B.
- Halaman menjelaskan singkat prosedur permintaan sampel. `[ASUMSI]` Ketentuan sampel (jumlah, berbayar atau gratis, ongkir ditanggung siapa) belum ditetapkan dan harus dikonfirmasi owner sebelum ditulis di halaman.

**US-20 — Memahami perbedaan lini BOLD, BRIGHT, dan Full Robusta** · **Must**
Sebagai pemilik kedai, saya ingin memahami perbedaan karakter ketiga lini houseblend, sehingga saya memilih yang cocok dengan menu kedai saya.
*Acceptance criteria:*
- Tiap lini punya blok penjelasan komposisi dan catatan rasa sesuai brand brief.
- Terdapat panduan singkat penggunaan (misalnya cocok untuk kopi susu atau untuk manual brew). `[ASUMSI]` Rekomendasi penggunaan per lini perlu divalidasi ke owner/roaster.

**US-21 — Menyatakan minat menjadi reseller** · **Should**
Sebagai calon reseller, saya ingin tahu cara bermitra dengan Titik Asal Kopi dan menyatakan minat, sehingga saya bisa mulai menjual ulang produknya.
*Acceptance criteria:*
- Terdapat blok atau halaman "Kemitraan / Reseller" yang menjelaskan bahwa kemitraan dibuka dan cara menghubunginya.
- CTA mengarah ke WhatsApp dengan pesan pembuka bernuansa kemitraan.
- Harga reseller tidak ditampilkan di website.

**US-22 — Meminta penawaran untuk pesanan hadiah jumlah banyak** · **Should**
Sebagai pembeli korporat, saya ingin meminta penawaran untuk pesanan dalam jumlah banyak, sehingga saya bisa mengajukan anggaran ke atasan.
*Acceptance criteria:*
- Terdapat blok "Pesanan jumlah banyak / hadiah" pada halaman katalog atau kontak.
- CTA mengarah ke WhatsApp dengan pesan pembuka yang menyebut kebutuhan jumlah dan tanggal acara.
- Blok ini menjelaskan informasi apa saja yang sebaiknya disiapkan pembeli (jumlah, tanggal, kota tujuan).

### Epik 5 — Konten Pendukung dan Kepercayaan

**US-23 — Membaca cerita brand** · **Must**
Sebagai pengunjung baru, saya ingin membaca cerita dan positioning Titik Asal Kopi, sehingga saya percaya membeli dari brand ini.
*Acceptance criteria:*
- Halaman cerita brand memuat positioning, tagline, dan fokus wilayah (Indonesia Timur dan Nusantara).
- Halaman menyebut kanal resmi: WhatsApp, Instagram, dan Shopee.
- Tidak mengarang klaim sertifikasi, penghargaan, atau kapasitas produksi yang belum dikonfirmasi.

**US-24 — Membaca panduan cara seduh** · **Should**
Sebagai home brewer, saya ingin panduan seduh per metode, sehingga hasil seduhan saya maksimal.
*Acceptance criteria:*
- Minimal tiga metode dijelaskan dengan rasio kopi-air, tingkat gilingan, suhu air, dan langkah singkat. `[ASUMSI]` Isi resep harus disediakan/divalidasi owner; tim tidak mengarang parameter seduh.
- Panduan dapat dijangkau dari halaman detail produk.

**US-25 — Membaca FAQ** · **Must**
Sebagai calon pembeli, saya ingin menemukan jawaban pertanyaan umum tanpa harus chat, sehingga saya bisa memutuskan lebih cepat.
*Acceptance criteria:*
- FAQ minimal mencakup: cara memesan, metode pembayaran, pengiriman dan ongkir, kesegaran dan tanggal roasting, pilihan gilingan, pesanan per kg untuk kedai, dan pesanan jumlah banyak.
- Setiap jawaban diakhiri jalan keluar ke WhatsApp jika masih kurang jelas.

**US-26 — Membaca kebijakan pengiriman** · **Must**
Sebagai pembeli di luar kota, saya ingin tahu cara dan estimasi waktu pengiriman, sehingga saya tidak ragu memesan.
*Acceptance criteria:*
- Halaman menjelaskan wilayah layanan, kurir yang dipakai, estimasi waktu proses roasting hingga barang dikirim, dan cara ongkir dihitung. `[ASUMSI]` Seluruh isi kebijakan pengiriman belum ditetapkan resmi; usulan awal: kurir reguler nasional, proses 1–2 hari kerja setelah pembayaran, ongkir ditanggung pembeli dan dihitung saat konfirmasi WhatsApp. Wajib dikonfirmasi owner sebelum tayang.
- Halaman menyebut bahwa pembayaran Fase 1 dikonfirmasi lewat WhatsApp, bukan di website.

**US-27 — Menemukan kontak resmi dengan mudah** · **Must**
Sebagai pengunjung, saya ingin menemukan kontak resmi di mana pun saya berada di website, sehingga saya bisa langsung menghubungi.
*Acceptance criteria:*
- Nomor WhatsApp, akun Instagram, dan toko Shopee tampil di footer setiap halaman.
- Tersedia tombol WhatsApp yang mudah dijangkau di layar HP tanpa menghalangi isi halaman.

**US-28 — Melihat kesegaran produk** · **Could**
Sebagai home brewer, saya ingin tahu kapan kopi di-roasting atau seberapa segar produk yang saya beli, sehingga saya yakin membeli kopi segar.
*Acceptance criteria:*
- Halaman produk menyampaikan kebijakan kesegaran (misalnya di-roasting sesuai pesanan). `[ASUMSI]` Kebijakan roast-to-order belum dikonfirmasi; jika tidak berlaku, story ini diturunkan menjadi kalimat umum tentang kesegaran tanpa janji tanggal.
- Tidak menampilkan tanggal roasting spesifik per SKU di Fase 1.

### Epik 6 — Pengelolaan Mandiri dan Pengukuran

**US-29 — Mengubah harga dan produk tanpa developer** · **Must**
Sebagai owner, saya ingin mengubah harga, menambah, atau menonaktifkan produk sendiri, sehingga katalog selalu akurat tanpa menunggu developer.
*Acceptance criteria:*
- Seluruh data produk berada di satu berkas sumber di repositori sesuai keputusan CEO.
- Tersedia panduan langkah demi langkah dalam Bahasa Indonesia untuk mengubah harga, menambah produk baru, dan menonaktifkan produk.
- Perubahan tayang di situs tanpa perlu menulis kode selain menyunting data.
- Waktu yang dibutuhkan owner untuk satu perubahan harga tidak lebih dari 15 menit.

**US-30 — Menandai produk sedang kosong** · **Should**
Sebagai owner, saya ingin menandai produk yang sedang habis, sehingga pembeli tidak memesan barang yang tidak ada dan saya tidak perlu menjelaskan berulang.
*Acceptance criteria:*
- Produk berstatus habis tetap tampil di katalog dengan label jelas.
- Tombol pesan pada produk habis diganti menjadi "Tanya ketersediaan".

**US-31 — Melihat data pengunjung dan klik pesan** · **Must**
Sebagai owner, saya ingin mengetahui berapa orang mengunjungi katalog dan berapa yang menekan tombol pesan, sehingga saya bisa mengukur pencapaian target bisnis.
*Acceptance criteria:*
- Analitik mencatat kunjungan halaman dan klik tombol WhatsApp maupun Shopee.
- Data dapat dilihat per produk sehingga terlihat produk mana yang paling diminati.
- Pengukuran ini mendukung perhitungan G-01, G-03, dan G-04.

**US-32 — Ditemukan di Google untuk kata kunci kopi lokal** · **Must**
Sebagai owner, saya ingin website muncul di pencarian Google untuk kata kunci kopi lokal, sehingga saya mendapat pembeli baru tanpa iklan.
*Acceptance criteria:*
- Setiap halaman produk memiliki judul dan deskripsi unik yang memuat nama daerah asal.
- Situs menyediakan sitemap dan dapat diindeks mesin pencari.
- Tautan yang dibagikan di WhatsApp dan Instagram menampilkan pratinjau berisi judul, deskripsi, dan gambar.
- Kata kunci prioritas: kopi Papua, kopi Kupang, kopi Gayo, biji kopi roasted, houseblend kopi per kg.

**US-33 — Berbagi tautan produk secara spesifik** · **Should**
Sebagai owner maupun pembeli, saya ingin membagikan tautan satu produk tertentu, sehingga penerima langsung melihat produk yang dimaksud.
*Acceptance criteria:*
- Setiap produk memiliki URL permanen yang mudah dibaca.
- URL tetap sama meskipun urutan katalog berubah.

### 5.1 Ringkasan Prioritas MoSCoW

| Prioritas | Story | Jumlah |
|---|---|---|
| **Must** | US-01, US-02, US-03, US-06, US-07, US-08, US-10, US-11, US-12, US-14, US-15, US-16, US-17, US-18, US-20, US-23, US-25, US-26, US-27, US-29, US-31, US-32 | 22 |
| **Should** | US-04, US-09, US-13, US-19, US-21, US-22, US-24, US-30, US-33 | 9 |
| **Could** | US-05, US-28 | 2 |
| **Won't (fase 1)** | Lihat bagian 9 — Out of Scope | — |

Aturan bisnis: rilis Fase 1 tidak boleh diumumkan sebelum seluruh **Must** selesai. Jika waktu menipis, yang dikorbankan lebih dulu adalah **Could**, lalu **Should**, tanpa mengurangi **Must**.

---

## 6. Kebutuhan Konten per Halaman

| Halaman | Tujuan bisnis | Isi wajib | Isi opsional | Prioritas |
|---|---|---|---|---|
| **Beranda** | Menjelaskan brand dalam satu layar dan mengarahkan ke katalog | Tagline "Pilih rasa, temukan asalnya, nikmati setiap momen."; kalimat positioning; tombol utama ke katalog; sorotan single origin Signature; blok singkat untuk kedai (houseblend per kg); kontak resmi | Cuplikan cerita brand; kutipan pelanggan `[ASUMSI]` hanya jika testimoni asli tersedia | Must |
| **Katalog** | Menjadi etalase lengkap | Seluruh produk dengan nama, kategori, tier, harga, foto; filter kategori dan tier; ajakan pesan | Pencarian; pengurutan harga | Must |
| **Detail Single Origin** | Membenarkan harga premium dan mendorong ke WhatsApp | Nama; daerah asal; proses, ketinggian, varietas (jika ada di brand brief); catatan rasa; ukuran 200 gr; harga 1 pack dan 3 pack; pilihan giling; tombol pesan WhatsApp; tautan Shopee; tautan ke cara seduh | Rekomendasi metode seduh; produk terkait | Must |
| **Houseblend (B2B)** | Melayani segmen kedai | Penjelasan lini BOLD, BRIGHT, Full Robusta; komposisi dan catatan rasa; tabel rasio dan harga per kg lengkap; input jumlah kg; CTA konsultasi/sampel | Panduan memilih blend menurut menu kedai | Must |
| **Cerita Kami (Tentang)** | Membangun kepercayaan | Asal-usul brand; alasan fokus Indonesia Timur dan Nusantara; cara memilih petani/origin; kanal resmi | Foto proses roasting; profil singkat pemilik | Must |
| **Cara Seduh** | Mengurangi pertanyaan berulang dan meningkatkan kepuasan pasca-beli | Minimal tiga metode dengan rasio, gilingan, suhu, langkah; rekomendasi produk per metode | Video pendek; tips penyimpanan biji | Should |
| **FAQ** | Memangkas waktu owner menjawab | Cara pesan; pembayaran; pengiriman dan ongkir; kesegaran; pilihan gilingan; order per kg untuk kedai; order jumlah banyak; kemitraan reseller | Pertanyaan tentang perbedaan Arabica dan Robusta | Must |
| **Kebijakan Pengiriman** | Menghilangkan keraguan pembeli luar kota | Wilayah layanan; kurir; estimasi proses dan waktu kirim; cara hitung ongkir; kebijakan barang rusak dalam pengiriman | Estimasi waktu per zona | Must |
| **Kontak** | Menjadi pintu masuk semua percakapan | WhatsApp 087777939567; Instagram @Titikasalkopi; Shopee Titikasalkopi; jam operasional balasan `[ASUMSI]`; blok pesanan jumlah banyak; blok kemitraan reseller | Peta lokasi `[ASUMSI]` alamat workshop belum ditentukan untuk dipublikasikan | Must |
| **Keranjang** | Menutup transaksi ke WhatsApp | Daftar item dengan varian, jumlah, harga; total; tombol pesan via WhatsApp; alternatif Shopee; catatan bahwa ongkir dihitung saat konfirmasi | Kolom catatan tambahan untuk penjual | Must |

### 6.1 Prinsip penulisan konten

- Bahasa Indonesia, sapaan sopan dan hangat, tidak kaku dan tidak berlebihan.
- Istilah kopi teknis (natural anaerob, washed, MASL) boleh dipakai, tetapi harus disertai penjelasan singkat agar Persona C tetap paham.
- Tidak boleh ada klaim yang tidak bisa dibuktikan: sertifikasi, penghargaan, jumlah pelanggan, atau kapasitas produksi.
- Semua harga dan nama produk mengikuti `00-brand-brief.md` persis. Jika ada perbedaan, brand brief yang menang.

---

## 7. Kebutuhan Non-Fungsional dari Sisi Bisnis

| Kode | Kebutuhan | Alasan bisnis | Ukuran keberhasilan |
|---|---|---|---|
| NF-01 | **Cepat di jaringan seluler Indonesia** | Sebagian besar pengunjung datang dari Instagram lewat HP dengan sinyal tidak stabil. Halaman lambat berarti calon pembeli hilang sebelum melihat harga. | Halaman utama dan katalog terasa siap dipakai dalam waktu wajar pada koneksi 4G lemah; halaman tidak "melompat" saat gambar dimuat; ukuran gambar dioptimasi. |
| NF-02 | **Rapi dan nyaman di layar HP** | Mayoritas trafik dari HP. Tabel harga houseblend adalah titik paling rawan berantakan. | Semua halaman terbaca tanpa perlu menggeser ke samping; tabel rasio–harga tetap terbaca di layar sempit; tombol cukup besar untuk ditekan dengan jempol. |
| NF-03 | **Mudah diperbarui sendiri oleh owner** | Harga kopi bisa berubah mengikuti harga green bean; owner tidak boleh bergantung pada developer. | Owner mampu mengubah harga dan menambah produk mengikuti panduan tertulis dalam ≤ 15 menit tanpa bantuan. |
| NF-04 | **Ditemukan di Google untuk kata kunci kopi lokal** | Satu-satunya sumber pertumbuhan tanpa biaya iklan. | Minimal 3 kata kunci target masuk halaman 1 dalam 6 bulan; seluruh halaman produk terindeks. |
| NF-05 | **Tampil rapi saat tautan dibagikan** | Tautan paling sering dibagikan lewat WhatsApp dan Instagram Story. | Pratinjau tautan menampilkan judul, deskripsi, dan gambar yang benar di WhatsApp. |
| NF-06 | **Selalu bisa diakses** | Website adalah alamat resmi brand; tidak boleh mati saat calon pembeli membukanya. | Tidak ada gangguan berarti; jika ada masalah, owner mendapat pemberitahuan. |
| NF-07 | **Konsisten dengan identitas brand** | Website harus terasa satu keluarga dengan kemasan dan feed Instagram. | Palet dan tipografi mengikuti brand brief: cream sebagai dasar, hijau sebagai primary, keluarga cokelat-rust untuk produk, gold hanya aksen. |
| NF-08 | **Akurasi harga mutlak** | Salah harga di web berarti kerugian langsung atau hilangnya kepercayaan. | Harga di website selalu identik dengan brand brief; ada proses pemeriksaan sebelum setiap perubahan tayang. |
| NF-09 | **Dapat dipakai orang yang tidak akrab teknologi** | Persona C dan sebagian Persona B bukan pengguna aktif e-commerce. | Tidak ada langkah wajib membuat akun, login, atau mengisi formulir panjang untuk memesan. |
| NF-10 | **Aman dan tepercaya** | Website menyandang nama brand dan domain resmi. | Situs berjalan di HTTPS pada domain titikasalkopi.id; tidak mengumpulkan data pribadi lebih dari yang diperlukan. |
| NF-11 | **Data pribadi seperlunya** | Fase 1 tidak menyimpan data pelanggan di server; semua percakapan terjadi di WhatsApp. | Website tidak menyimpan nama, alamat, atau nomor telepon pembeli. |

---

## 8. Di Luar Ruang Lingkup Fase 1 (Out of Scope)

Hal-hal berikut **tidak dikerjakan** di Fase 1. Ditulis eksplisit agar ruang lingkup tidak melebar. Semua bisa dipertimbangkan ulang di Fase 2 setelah target bagian 2 tercapai.

| # | Tidak termasuk | Alasan |
|---|---|---|
| O-01 | Payment gateway, pembayaran online, dan konfirmasi pembayaran otomatis | Keputusan CEO. Volume belum membenarkan biaya dan kerumitan; pembayaran tetap lewat WhatsApp dan Shopee. |
| O-02 | Akun pengguna, login, dan riwayat pesanan | Menambah hambatan bagi pembeli dan tidak dibutuhkan untuk checkout via WhatsApp. |
| O-03 | Sistem manajemen stok real-time | Stok dikelola manual oleh owner; cukup penanda "sedang kosong" (US-30). |
| O-04 | CMS eksternal atau dashboard admin | Keputusan CEO: data produk cukup satu berkas sumber di repositori. |
| O-05 | Program loyalitas, poin, dan voucher | Fitur spekulatif; dilarang oleh keputusan CEO. |
| O-06 | Langganan kopi bulanan (subscription) | Fitur spekulatif; operasional belum siap. |
| O-07 | Multi-mata uang dan penjualan ekspor | Pasar Fase 1 adalah Indonesia. |
| O-08 | Situs dwibahasa (Inggris) | Bahasa utama situs adalah Bahasa Indonesia. |
| O-09 | Kalkulator ongkir otomatis dan integrasi kurir | Ongkir dihitung manual saat konfirmasi WhatsApp. |
| O-10 | Ulasan dan rating produk dari pembeli | Belum ada mekanisme verifikasi pembeli; berisiko diisi ulasan palsu. |
| O-11 | Blog atau artikel berkala | Menuntut komitmen produksi konten yang belum ada. Halaman "Cara Seduh" sudah cukup untuk kebutuhan SEO awal. |
| O-12 | Live chat di website selain WhatsApp | Menduplikasi kanal dan menambah beban balasan owner. |
| O-13 | Katalog harga khusus reseller yang tampil publik | Harga kemitraan bersifat negosiasi dan tidak boleh terlihat pembeli ritel. |
| O-14 | Produk hampers atau gift box sebagai SKU tersendiri | Belum ada SKU resmi di brand brief; Fase 1 hanya menyediakan jalur permintaan penawaran. |
| O-15 | Integrasi otomatis dengan Shopee (sinkronisasi stok/harga) | Cukup tautan manual ke toko Shopee. |
| O-16 | Aplikasi seluler | Website mobile-first sudah menjawab kebutuhan. |
| O-17 | Newsletter dan pengumpulan alamat email | Menambah kewajiban pengelolaan data pribadi tanpa manfaat jelas di Fase 1. |
| O-18 | Fitur langganan roasting terjadwal untuk kedai | Operasional roasting belum siap berkomitmen jadwal tetap. |

---

## 9. Asumsi dan Risiko Bisnis

### 9.1 Asumsi

| # | Asumsi | Dampak jika salah | Cara memvalidasi |
|---|---|---|---|
| A-01 | `[ASUMSI]` Owner sanggup membalas WhatsApp dalam waktu wajar pada jam kerja. | Traffic dari website terbuang karena chat tidak dibalas. | Sepakati jam operasional balasan dan tampilkan di halaman kontak. |
| A-02 | `[ASUMSI]` Kebijakan pengiriman (kurir, wilayah, estimasi waktu, siapa menanggung ongkir) akan ditetapkan owner sebelum website tayang. | Halaman kebijakan pengiriman tidak bisa tayang; kepercayaan pembeli luar kota berkurang. | Rapat singkat dengan owner untuk memutuskan dan menuliskannya. |
| A-03 | `[ASUMSI]` Foto produk yang layak tersedia untuk seluruh produk di katalog. | Katalog terlihat kosong dan tidak meyakinkan; konversi turun. | Inventarisasi aset foto di `assets/`; jadwalkan pemotretan untuk yang kurang. |
| A-04 | `[ASUMSI]` Harga pada brand brief berlaku minimal 6 bulan ke depan. | Harga di web usang dan menimbulkan sengketa dengan pembeli. | Tetapkan siklus peninjauan harga; pastikan proses update mudah (US-29). |
| A-05 | `[ASUMSI]` Stok single origin Signature (Oelbiteno, Abmisibil, Sabin, Pyramid) tersedia berkelanjutan. | Produk unggulan sering kosong; pengunjung kecewa. | Konfirmasi kesiapan pasokan; sediakan penanda "sedang kosong". |
| A-06 | `[ASUMSI]` Owner bersedia dan mampu menyunting berkas data produk mengikuti panduan tertulis. | NF-03 gagal; ketergantungan pada developer berlanjut. | Sesi latihan singkat dan uji coba: owner mengubah satu harga sendiri sebelum rilis. |
| A-07 | `[ASUMSI]` Instagram tetap menjadi sumber trafik awal utama sampai SEO tumbuh. | Website sepi pengunjung di bulan-bulan awal. | Pasang tautan website di bio Instagram dan sebutkan di setiap unggahan. |
| A-08 | `[ASUMSI]` Nomor WhatsApp 087777939567 dipakai untuk bisnis dan sanggup menampung kenaikan chat. | Chat menumpuk dan tercampur dengan pesan pribadi. | Pertimbangkan WhatsApp Business dengan pesan otomatis dan katalog. |
| A-09 | `[ASUMSI]` Detail origin yang belum lengkap di brand brief (Oelbiteno, Pyramid, Palimping, Kerinci) akan dilengkapi owner. | Halaman detail terasa timpang antar produk. | Minta owner melengkapi proses, ketinggian, dan varietas; sampai itu tersedia, kolom dikosongkan, bukan dikarang. |
| A-10 | `[ASUMSI]` Parameter resep pada halaman cara seduh akan disediakan owner/roaster. | Halaman cara seduh tidak bisa tayang atau berisi resep yang tidak sesuai profil produk. | Kumpulkan resep dari owner sebelum penulisan konten. |
| A-11 | `[ASUMSI]` Domain titikasalkopi.id sudah dimiliki atau akan didaftarkan sebelum rilis. | Rilis tertunda. | Konfirmasi status domain ke owner sejak awal. |

### 9.2 Risiko

| # | Risiko | Kemungkinan | Dampak | Mitigasi |
|---|---|---|---|---|
| R-01 | Website tayang tetapi tidak ada yang mengunjungi karena SEO butuh waktu. | Tinggi | Sedang | Dorong trafik awal dari Instagram dan broadcast WhatsApp; ukur bulanan; jangan menilai kegagalan sebelum bulan ke-3. |
| R-02 | Harga di website tidak sinkron dengan harga yang diberikan owner lewat chat. | Sedang | Tinggi | Jadikan website satu-satunya rujukan harga; owner mengirim tautan alih-alih mengetik harga; periksa setelah setiap perubahan. |
| R-03 | Chat yang masuk meningkat melebihi kemampuan owner membalas. | Sedang | Tinggi | FAQ yang kuat untuk menyaring pertanyaan dasar; balasan otomatis WhatsApp Business; siapkan rencana penambahan admin bila G-01 tercapai. |
| R-04 | Pesan WhatsApp otomatis dari keranjang tidak terkirim atau terpotong pada sebagian perangkat. | Sedang | Tinggi | Uji pada beberapa perangkat dan versi WhatsApp; batasi panjang pesan; sediakan tautan Shopee sebagai jalur cadangan. |
| R-05 | Pengunjung menganggap website bisa membayar langsung, lalu kecewa karena diarahkan ke WhatsApp. | Sedang | Sedang | Jelaskan alur pemesanan sejak halaman produk dan keranjang: pesanan dikonfirmasi lewat WhatsApp. |
| R-06 | Stok single origin habis padahal masih tampil di katalog. | Sedang | Sedang | Penanda "sedang kosong" (US-30) dan kebiasaan owner memperbaruinya. |
| R-07 | Segmen kedai membandingkan harga per kg dengan pesaing lalu menawar di bawah harga resmi. | Tinggi | Sedang | Perkuat pembeda pada konten: asal biji, proses, konsistensi roasting, dan layanan konsultasi blend, bukan bersaing di harga. |
| R-08 | Owner tidak sempat memperbarui konten sehingga website menjadi usang. | Sedang | Tinggi | Proses update sesederhana mungkin (NF-03); tetapkan pengingat peninjauan katalog bulanan. |
| R-09 | Ruang lingkup melebar karena permintaan fitur baru di tengah pengerjaan. | Tinggi | Sedang | Daftar out of scope pada bagian 8 mengikat; permintaan baru masuk antrean Fase 2. |
| R-10 | Kualitas foto produk tidak setara sehingga katalog terlihat tidak profesional. | Sedang | Sedang | Standarkan gaya foto; gunakan placeholder bergaya brand bila foto belum siap. |
| R-11 | Pesaing menyalin daftar harga dari website. | Tinggi | Rendah | Diterima sebagai konsekuensi transparansi; pembeda tetap pada cerita origin dan layanan, bukan kerahasiaan harga. |
| R-12 | Pembeli mengeluhkan kopi rusak atau salah kirim tanpa jalur penanganan yang jelas. | Rendah | Sedang | `[ASUMSI]` Tetapkan kebijakan penanganan keluhan sederhana dan cantumkan di halaman kebijakan pengiriman. |

---

## 10. Catatan Penutup untuk Business Analyst

1. Seluruh nama produk, harga, dan detail origin harus diambil persis dari `docs/00-brand-brief.md`. Dokumen ini tidak memperkenalkan produk, harga, atau lokasi baru.
2. Setiap butir bertanda `[ASUMSI]` harus dikonfirmasi ke Product Owner dan diubah statusnya menjadi kebutuhan pasti atau dikeluarkan dari ruang lingkup sebelum BRD disetujui.
3. Prioritas MoSCoW pada bagian 5 adalah keputusan bisnis. Perubahan prioritas harus disetujui Product Owner, bukan diputuskan sepihak saat penyusunan BRD atau implementasi.
4. Ukuran keberhasilan Fase 1 adalah angka pada bagian 2. BRD sebaiknya menautkan setiap kebutuhan fungsional ke tujuan bisnis yang didukungnya.
