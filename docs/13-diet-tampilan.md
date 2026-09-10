# Diet tampilan — situs terlalu banyak kata

**Disusun:** 9 September 2026 · **Penyusun:** CEO
**Pemicu:** owner menilai situs terlalu banyak kata, dengan acuan <https://store.anomalicoffee.com/>
**Peserta diskusi:** Designer, Frontend, Copywriter, QA, Business Analyst
**Status:** keputusan D-10 sampai D-13 di bawah mengikat; pelaksanaannya belum dimulai

---

## 0. Ringkasan satu halaman

Owner benar, dan angkanya membuktikannya. Beranda memuat **467 kata terlihat** dan `/houseblend` **468**. Kerangka header dan footer sendiri sudah menyumbang ±100 kata, jadi isi beranda ±367 kata sebelum pengunjung melihat harga pertama yang bisa dia bandingkan. Enam belas rute berplafon bersama-sama memuat 5.300 kata; sesudah pemangkasan 3.729, turun 30%.

Tetapi diagnosisnya bukan "kalimatnya terlalu panjang". Diagnosisnya:

> **Kita menulis banyak kata karena gambar kita belum mengerjakan bagiannya.**

Dari sebelas produk, **lima punya foto** (Abmisibil, Sabin, Pondok Baru, Bold, Bright) dan **enam masih memakai placeholder SVG** (`web/public/produk/*.svg`): Oelbiteno, Pyramid, Palimping, Kerinci, Full Robusta, Sindoro. Yang punya foto pun hanya punya **satu** — acuan kita membawa rata-rata lima foto per produk. Teks lalu mengambil alih pekerjaan yang seharusnya dikerjakan gambar. Anomali menempuh jalan sebaliknya: foto mengerjakan hampir seluruh persuasi, teks tinggal nama dan harga.

Karena itu rencana ini punya dua jalur yang berjalan bersamaan, dan **jalur foto adalah yang menentukan**:

| Jalur | Pemilik | Menahan apa |
|---|---|---|
| A — foto produk | Owner | Hasil akhir. Enam kartu tanpa foto di grid yang sama membuat pemangkasan teks terlihat kosong, bukan bersih. |
| B — diet kata dan struktur | Developer | Bisa jalan sekarang, tidak menunggu jalur A. |

Jalur B tetap dikerjakan lebih dulu supaya begitu foto datang, tempatnya sudah rapi dan tidak perlu dirombak dua kali.

---

## 1. Apa yang benar-benar kami pelajari dari store.anomalicoffee.com

Jujur soal metodenya, supaya tidak ada yang mengutip dokumen ini melebihi buktinya.

Situs itu adalah aplikasi Laravel + Inertia; seluruh isi halaman dirakit di browser. HTML yang dikirim server **tidak memuat satu kata pun teks pemasaran** — hanya kerangka aplikasi. Jadi kami **tidak** bisa mengutip salinan teks beranda mereka kata per kata, dan tidak ada satu pun kutipan dari sana di dokumen ini.

Yang bisa kami baca langsung dari data yang mereka kirim:

**a. Peta halaman mereka** (dari daftar rute yang tertanam di halaman):
`/catalog`, `/catalog/{slug}`, `/about-us`, `/contact-us`, `/store-locator`, `/blogs`, `/how-to-order`, `/shipping-information`, `/faq`, `/privacy-policy`, `/cart`, `/checkout`.

Perhatikan pembagiannya: **halaman jualan sedikit, halaman penjelasan banyak — dan halaman penjelasan itu dipisah, tidak ditumpuk ke beranda.** Cara pesan, ongkos kirim, dan FAQ masing-masing punya alamat sendiri. Situs kita menaruh "Cara pesan" langsung di beranda.

**b. Bentuk data produk mereka** (dari data katalog yang dikirim ke browser). Satu produk membawa: `name`, `price`, `images[]` (rata-rata **5 foto** per produk, format `.webp`), `categories[]`, `weight`, dimensi kirim, `stock`, dan `desc`.

Dan `desc` itulah temuan yang paling tajam. Untuk produk "Anomali Coffee Drip Box Collection", isi lengkap deskripsinya adalah:

```
Anomali Coffee Drip Box Collection
```

Deskripsinya **adalah namanya sendiri**. Nol kalimat pemasaran, lima foto. Itu bukan kelalaian mereka; itu pilihan: beban meyakinkan pembeli diletakkan pada foto dan harga.

**c. Yang tidak boleh kita tiru mentah-mentah.** Mereka punya keranjang, checkout, Midtrans, dan Biteship di dalam situs. Kita tidak, dan tidak sedang ke sana — pesanan kita selesai di WhatsApp (D-06). Membandingkan alur beli mereka dengan alur beli kita akan menyesatkan. Yang kita ambil hanya satu hal: **rasio gambar terhadap kata.**

---

## 2. Angka kita hari ini

> **Dikoreksi 9 September 2026, setelah pemangkasan dikerjakan.** Tabel pertama pada bagian ini diukur dari folder `out/` yang kebetulan masih ada di disk — dan folder itu **basi**: ia dibangun sebelum lini poster 100 gram dicabut `D-09`. Karena itu ia melaporkan `/katalog` 774 kata, padahal kode yang sama menghasilkan 331. Angka yang salah itu sempat masuk ke plafon `D-11`, membuat plafon `/katalog` (420) berada di ATAS keadaan sebelum dipangkas — plafon yang tidak pernah bisa dilanggar bukan plafon. Keduanya sudah diukur ulang dari build bersih dan plafonnya diturunkan. Tabel lama tidak disimpan karena ia tidak pernah menggambarkan kode mana pun; yang di bawah ini menggantikannya.

Diukur dari build bersih kode sebelum pemangkasan (`web/out/**/*.html`, seluruh tag dibuang, teks `sr-only` tidak dihitung karena ia tidak terlihat):

| Halaman | Sebelum | Sesudah | Plafon |
|---|---:|---:|---:|
| `/houseblend` | 468 | 240 | 300 |
| `/` (beranda) | 467 | 173 | 220 |
| `/cerita-kami` | 344 | 241 | 260 |
| `/produk/pondok-baru` | 339 | 267 | 280 |
| `/produk/sabin` | 333 | 255 | 280 |
| `/katalog` | 331 | 227 | 280 |
| `/produk/abmisibil` | 329 | 252 | 280 |
| `/produk/oelbiteno` | 306 | 223 | 280 |
| `/produk/pyramid` | 305 | 222 | 280 |
| `/produk/palimping` | 305 | 228 | 280 |
| `/produk/kerinci` | 302 | 225 | 280 |
| `/houseblend/bold` | 297 | 272 | 300 |
| `/kontak` | 292 | 251 | 260 |
| `/produk/sindoro` | 289 | 212 | 280 |
| `/houseblend/full-robusta` | 258 | 231 | 300 |
| `/houseblend/bright` | 234 | 210 | 300 |

Total 5300 kata menjadi 3729 pada enam belas rute berplafon — **turun 30%**. Kerangka header dan footer menyumbang ±100 kata dari setiap baris itu.

Tiga hal yang terbaca dari tabel ini:

1. **`/houseblend` ternyata pelanggar terbesar, bukan `/katalog`.** Angka basi menyembunyikannya. Halaman itu memuat deskripsi panjang ketiga lini secara utuh, padahal masing-masing sudah punya halaman sendiri.
2. **Beranda mengulang katalog.** Ia memuat sorotan Signature, tiga lini houseblend, dan tiga kartu "mulai dari" — tiga cara mengatakan hal yang sama sebelum pengunjung sempat mengklik apa pun.
3. **`/keranjang` yang paling sedikit katanya, dan tidak ada yang mengeluhkannya.** Halaman yang isinya jelas tidak butuh dijelaskan.

## 3. Diskusi lintas peran

### Designer

Kartu produk kita memuat lima blok teks: label kategori, nama, baris asal, deretan pil catatan rasa, harga "mulai dari", lalu baris paket 3 pack beserta pil "Hemat". Di layar HP dua kolom, itu tumpukan yang tingginya mengalahkan gambarnya sendiri.

Label kategori pada kartu **selalu mengulang judul seksi di atasnya** — di `/katalog` setiap kartu berada tepat di bawah heading yang sudah menyebut kategorinya. Itu 11 pengulangan.

Catatan rasa dan paket 3 pack adalah informasi keputusan, bukan informasi pemindaian. Tempatnya di halaman produk, bukan di grid.

Usulan kartu: **gambar besar → nama → asal → harga.** Titik.

Soal hero beranda: tiga kartu `PriceStat` (masing-masing istilah + harga + keterangan) berjumlah ±55 kata dan mengabarkan tiga harga "mulai dari" sebelum ada satu pun produk terlihat. Itu daftar harga, bukan hero.

### Frontend

Secara teknis semua pemangkasan ini murah, dan sebagian besar justru **menghapus kode**, bukan menambah. Tidak ada dependensi baru, tidak ada komponen baru.

Satu catatan penting: memangkas isi kartu **menurunkan** ukuran HTML tiap rute, jadi gerbang bundle 190 KB (D-04) tidak terancam. Sebaliknya, jalur foto **akan** menambah berat halaman secara serius — sebelas produk × beberapa foto. Itu perlu anggarannya sendiri, dan `next/image` sudah dipasang dengan rasio 4:5 terkunci di wrapper, sehingga mengganti placeholder dengan foto asli tidak menggeser tata letak sama sekali (CLS tetap terjaga).

Satu hal yang saya minta ditulis sebagai aturan, bukan niat: **anggaran kata per rute, dengan gerbang otomatis.** Kita sudah punya pelajarannya. Plafon bundle disepakati sejak awal, tidak ada yang menjaganya, dan situs melewatinya diam-diam sampai gerbang dibuat 9 September. Anggaran kata akan mengalami nasib yang persis sama kalau hanya jadi kalimat di dokumen.

### Copywriter

Yang harus dipangkas bukan "kalimat yang jelek", melainkan **kalimat yang menjelaskan apa yang sudah terlihat**. Contoh dari halaman produk:

> "Hanya keterangan yang kami ketahui yang ditampilkan. Detail lain dapat ditanyakan lewat WhatsApp."

Kalimat itu menjelaskan kebijakan editorial kita kepada pembeli yang tidak menanyakannya. Aturannya sendiri (FR-07) tetap berlaku dan tetap ditegakkan kode; yang dihapus hanya pengumumannya.

Satu peringatan keras dari saya. `cerita-kami` **tidak boleh dipangkas dengan cara mengarang gantinya**. Halaman itu ditulis dengan batasan yang mengikat: tanpa klaim sertifikasi, penghargaan, jumlah pelanggan, tahun berdiri, maupun cerita pendiri, karena tidak satu pun ada di brand brief. Memangkasnya artinya **membuang kalimat**, bukan menukarnya dengan kalimat yang lebih pendek dan lebih berani tapi tidak berdasar. Sisakan alinea yang benar-benar menjawab "kenapa Indonesia Timur", buang sisanya.

Kalimat hak cipta di footer juga menjelaskan mekanisme pembayaran di setiap halaman. Sekali di `/kontak` cukup.

### QA

Tiga permintaan, dan saya akan menolak PR yang tidak memenuhinya.

1. **Angka penghematan tidak boleh hilang dari alur, hanya berpindah.** Paket 3 pack dan penghematan kemasan 1 kg adalah aritmetika yang dihitung `bundleSaving()` dan `packSaving()`, bukan teks. Kalau kartu berhenti menampilkannya, halaman produk **wajib** tetap menampilkannya, dan pemeriksaan yang ada harus tetap hijau tanpa disunting. Kita sudah pernah kena persis di titik ini: 9 September pemeriksaan diubah agar mengesahkan keluaran yang salah. Tidak lagi.

2. **Penanda "Stok kosong" tidak ikut dipangkas.** Ia menempel di foto pada kartu dan diulang di panel pesan pada halaman produk. Keduanya tetap.

3. **Gerbang anggaran kata harus dibuktikan dengan cara dijatuhkan lebih dulu.** Naikkan sementara jumlah kata satu halaman melewati plafon, pastikan CI merah, baru turunkan lagi. Gerbang yang tidak pernah dilihat merah adalah gerbang yang belum tentu ada.

### Business Analyst

Perhatikan bahwa memangkas kartu memindahkan informasi harga paket ke satu klik lebih dalam. Itu keputusan bisnis, bukan keputusan estetika: 3 pack adalah alat menaikkan nilai transaksi.

Saya menerimanya dengan satu syarat: **penghematan tetap tampil di halaman produk pada opsi variannya**, bukan hanya sebagai paragraf. Di situlah pembeli benar-benar memilih.

Dan setelah analitik menyala (masih menunggu owner), ini termasuk yang wajib dibaca: apakah rasio kunjungan katalog → halaman produk turun setelah kartu dipangkas. Kalau turun tajam, kembalikan satu baris harga paket ke kartu. Kita tidak sedang menebak selamanya; kita sedang menunda sampai ada angkanya.

---

## 4. Keputusan CEO

### D-10 — Foto produk adalah prasyarat, bukan pelengkap

Situs ini tidak akan pernah terlihat seperti acuan selama enam dari sebelas produknya digambar oleh placeholder. Butir 9 pada `docs/12-tugas-owner.md` menyebut foto "tidak memblokir rilis". **Itu dicabut.** Foto produk naik status menjadi **item penahan rilis**, sejajar dengan domain dan analitik.

Spesifikasi minimum yang dibutuhkan developer, supaya owner tidak memotret dua kali:

- **Wajib:** 1 foto untuk enam produk yang belum punya — Oelbiteno, Pyramid, Palimping, Kerinci, Full Robusta, Sindoro. Ini yang menahan.
- **Sangat dianjurkan, sesudahnya:** 2 foto tambahan untuk kesebelas produk (biji dan satu foto suasana seduh). Lima produk yang sudah berfoto pun baru punya satu.
- Rasio **4:5 tegak**, sisi terpendek minimal 1000 px.
- Latar polos dan konsisten untuk foto pertama setiap produk — grid katalog hanya terlihat rapi kalau latar sebelas kartunya seragam.
- Kirim apa adanya dari kamera atau HP; konversi ke `.webp` dan pengecilan dikerjakan developer.
- Setiap foto butuh satu kalimat teks alternatif dari owner, karena hanya owner yang tahu isi fotonya.

Sampai foto tiba, placeholder tetap tayang. Menunda seluruh diet kata sampai foto datang justru merugikan: pekerjaan jalur B tidak bergantung padanya.

### D-11 — Anggaran kata per rute, ditegakkan CI

Plafon **kata terlihat** per halaman, diukur dari HTML hasil build, kerangka header dan footer ikut dihitung:

| Rute | Plafon | Sebelum | Sesudah |
|---|---:|---:|---:|
| `/` | 220 | 467 | 173 |
| `/katalog` | 280 | 331 | 227 |
| `/houseblend` | 300 | 468 | 240 |
| `/houseblend/[line]` | 300 | 234–297 | 210–272 |
| `/produk/[slug]` | 280 | 289–339 | 212–267 |
| `/cerita-kami` | 260 | 344 | 241 |
| `/kontak` | 260 | 292 | 251 |

Plafon `/` dan `/katalog` diturunkan dari 260 dan 420 pada 9 September 2026, setelah ketahuan keduanya diturunkan dari build basi dan `/katalog` 420 justru berada di atas keadaan sebelum dipangkas.

Teks `sr-only` tidak ikut dihitung. Ia tidak terlihat, jadi ia bukan bagian dari beban baca yang dikeluhkan — dan menghitungnya akan membuat plafon ini menekan siapa pun untuk menghapus keterangan pembaca layar demi angka yang lebih kecil. `RatioTable` menaruh satu keterangan per sel harga karena "Rp215.000" saja tidak memberi tahu apa yang sedang dipilih; plafon tidak boleh menghukum kalimat itu.

Ditegakkan `web/scripts/check-copy-budget.mjs`, dipasang di `check-all.mjs`, tanpa dependensi baru (ADR-14). Plafon boleh dinaikkan, tetapi **hanya lewat perubahan berkas keputusan ini** — bukan dengan menyunting skripnya agar hijau. Aturan itu yang dilanggar pada cacat harga 9 September, dan ia tidak akan dilanggar lagi.

### D-12 — Isi kartu produk dibekukan pada empat unsur

Kartu produk di grid mana pun memuat, dan hanya memuat: **gambar, nama, baris asal, harga "mulai dari"** — ditambah penanda "Stok kosong" bila berlaku.

Yang keluar dari kartu, dan pindah ke halaman produk: label kategori, pil catatan rasa, baris harga paket 3 pack beserta pil "Hemat".

Penghematan tidak boleh berhenti dihitung. Ia tetap dihitung `bundleSaving()` dan `packSaving()`, tetap tampil menempel pada opsi varian di halaman produk, dan pemeriksaan yang menjaganya tidak boleh disunting agar lewat.

Peninjauan ulang: setelah analitik berjalan dua minggu, baca rasio katalog → halaman produk. Kalau turun lebih dari seperlima, satu baris harga paket boleh kembali ke kartu.

### D-13 — Beranda menjual, halaman lain menjelaskan

Beranda dipangkas menjadi tiga blok: **hero, sorotan produk, satu ajakan memesan.**

Yang keluar dari beranda:

- Tiga kartu `PriceStat` di hero. Harga sudah hidup di kartu produk dan di `/katalog`.
- Blok "Cara pesan" beserta langkah-langkahnya. Ia pindah utuh ke `/kontak`, mengikuti pemisahan yang dipakai acuan.
- Salah satu dari dua blok sorotan. Beranda memajang **Signature saja**; tiga lini houseblend diwakili satu tautan.

Yang tetap: tagline, satu kalimat deskripsi, dua tombol.

Kalimat pembayaran di footer dipendekkan menjadi baris hak cipta saja. Pernyataan "pembayaran tidak dilakukan di website ini" tetap ada — utuh, di `/kontak` dan di panel pesan halaman produk, yaitu dua tempat pembeli benar-benar mengambil keputusan.

---

## 5. Langkah perbaikan

Urutannya sengaja: yang paling banyak memangkas kata dikerjakan lebih dulu, dan gerbangnya dibuat **sebelum** pemangkasan, supaya gerbang itu terlihat merah dulu — itu satu-satunya bukti bahwa ia bekerja.

### Sprint C-0 — Pasang gerbangnya dulu · ½ hari · Developer

| # | Pekerjaan | Selesai bila |
|---|---|---|
| C-0.1 | `scripts/check-copy-budget.mjs`: hitung kata terlihat tiap `out/**/*.html`, bandingkan dengan tabel D-11 | Dijalankan sekarang, **merah** untuk tujuh rute |
| C-0.2 | Daftarkan di `check-all.mjs` | `npm run verify && node scripts/check-all.mjs` merah, bukan hijau |

Gerbang merah di akhir C-0 adalah hasil yang benar. Jangan diperbaiki dengan menaikkan plafon.

### Sprint C-1 — Kartu produk · 1 hari · Developer + Designer

| # | Pekerjaan | Berkas |
|---|---|---|
| C-1.1 | Buang label kategori, pil catatan rasa, dan baris 3 pack dari kartu | `features/catalog/product-card.tsx` |
| C-1.2 | Pastikan penghematan 3 pack tetap menempel pada opsi varian halaman produk | `features/catalog/product-detail.tsx` |
| C-1.3 | Jalankan ulang seluruh pemeriksaan **tanpa menyunting satu pun berkas pemeriksaan** | `scripts/check-all.mjs` |

Perkiraan: `/katalog` turun ±180 kata, beranda ±60 kata.

### Sprint C-2 — Beranda dan halaman panjang · 1 hari · Developer + Copywriter

| # | Pekerjaan | Berkas |
|---|---|---|
| C-2.1 | Hapus tiga kartu `PriceStat` dari hero | `app/page.tsx` |
| C-2.2 | Pindahkan blok "Cara pesan" ke `/kontak` | `app/page.tsx`, `app/kontak/page.tsx` |
| C-2.3 | Beranda memajang sorotan Signature saja; houseblend jadi satu tautan | `app/page.tsx` |
| C-2.4 | Buang kalimat yang menjelaskan kebijakan editorial dari halaman produk | `features/catalog/product-detail.tsx` |
| C-2.5 | Pangkas `cerita-kami` dengan **membuang** alinea, bukan menukarnya | `app/cerita-kami/page.tsx` |
| C-2.6 | Pendekkan baris hak cipta footer | `components/layout/site-footer.tsx` |

Selesai bila seluruh rute di bawah plafon D-11 dan gerbang C-0 berubah **hijau tanpa plafonnya disentuh**.

### Sprint C-3 — Foto · menunggu owner · Owner, lalu Developer

| # | Pekerjaan | Pemilik |
|---|---|---|
| C-3.1 | Potret enam produk yang belum berfoto, sesuai spesifikasi D-10 | Owner |
| C-3.2 | Tulis satu kalimat teks alternatif per foto | Owner |
| C-3.3 | Konversi `.webp`, pasang, hapus placeholder produk yang sudah berfoto | Developer |
| C-3.4 | Ukur ulang bundle dan bobot halaman; foto tidak boleh menembus gerbang mana pun | Developer |

---

## 6. Rencana deployment

Situs ini **tidak** memakai deployment manual, dan tidak akan mulai memakainya. Semuanya sudah lewat CI; yang dibutuhkan hanyalah disiplin memakainya menurut urutan.

### Yang sudah ada, dan tetap dipakai apa adanya

- `.github/workflows/preview.yml` — berjalan pada setiap pull request. Membangun ekspor statis **persis seperti produksi**, menjalankan seluruh suite pemeriksaan, lalu mengunggah hasilnya sebagai artefak. Tidak menerbitkan apa pun. Robots-nya `Disallow: /`, jadi kalaupun bocor ke publik ia tidak bisa terindeks.
- `.github/workflows/pages.yml` — berjalan pada setiap push ke `main`. Membangun, memeriksa, lalu menerbitkan ke GitHub Pages. **Merge ke `main` sama dengan terbit.**

### Alur untuk seluruh sprint C

1. Satu branch per sprint: `chore/copy-budget-gate`, `feat/kartu-produk-ringkas`, `feat/beranda-ringkas`, `feat/foto-produk`. Satu sprint satu PR — bukan satu PR besar, supaya kalau ada yang harus dibatalkan yang dibatalkan hanya bagian itu.
2. Buka PR. Tunggu `preview.yml` hijau. PR merah tidak dibahas.
3. Unduh artefak pratinjau, lalu dari `web/`: `npm run preview`. **Buka di HP sungguhan, bukan hanya di simulator browser.** Diet ini soal kepadatan visual, dan kepadatan visual hanya jujur di layar sungguhan.
4. Review isi: Designer untuk C-1, Copywriter untuk C-2, QA untuk semuanya. QA memegang hak veto atas pemeriksaan yang disunting.
5. Merge ke `main`. `pages.yml` menerbitkan sendiri.
6. Setelah terbit, buka <https://yuzansama.github.io/titikasalkopi/>, muat paksa, dan periksa lima hal: kartu katalog, hero beranda, satu halaman produk, penanda stok kosong, dan tombol WhatsApp benar-benar membuka WhatsApp dari HP.

### Urutan terbit, dan mengapa demikian

C-0 dan C-1 boleh terbit bersamaan; keduanya perubahan berpagar dan kecil. **C-2 terbit sendirian**, karena ia yang mengubah beranda — halaman yang paling banyak dilihat dan paling sulit dinilai dari diff. C-3 terbit setelah keenam foto lengkap, bukan sebagian — grid yang campur foto dan placeholder justru makin terlihat timpang setiap satu placeholder berkurang.

### Pembatalan

Seluruh perubahan sprint C hanya menyentuh tampilan dan teks; tidak ada data, harga, maupun endpoint yang berubah. Membatalkan berarti `git revert` commit merge-nya lalu push ke `main`; `pages.yml` menerbitkan ulang versi sebelumnya dalam satu putaran build. Tidak ada migrasi, tidak ada status yang perlu dipulihkan.

Yang **tidak** boleh dibatalkan dengan cara itu: gerbang C-0. Kalau gerbang anggaran kata mengganggu, jalan keluarnya menaikkan plafon di D-11 lewat PR yang terlihat, bukan mencabut gerbangnya.

### Pindah domain, kelak

Tidak termasuk sprint C, tapi ditulis di sini supaya tidak ada yang mencarinya di tempat lain. Saat `titikasalkopi.id` sudah dimiliki dan diarahkan ke Pages, yang berubah hanya dua baris env di `pages.yml`: `NEXT_PUBLIC_SITE_ORIGIN` menjadi `https://titikasalkopi.id` dan `BASE_PATH` dikosongkan. Keduanya wajib berubah **dalam satu commit yang sama** — canonical dan basePath yang tidak sepakat akan mengarahkan Google ke alamat yang salah. Verifikasi Search Console dibuat setelahnya, karena ia harus dibuat di bawah origin final.

---

## 7. Risiko

| Risiko | Penanganan |
|---|---|
| Kartu yang lebih ringkas menurunkan minat pada paket 3 pack | Dibaca dari analitik setelah dua minggu; D-12 sudah menetapkan syarat mengembalikannya |
| Halaman jadi terasa kosong, bukan bersih | Persis itu sebabnya D-10 menjadikan enam foto sisa sebagai prasyarat. Kalau foto tertunda lama, tahan C-2 di branch dan terbitkan C-1 saja |
| Anggaran kata dipakai sebagai alasan membuang informasi yang wajib | Plafon di D-11 dipilih di atas kebutuhan minimum tiap halaman; yang wajib (harga, stok, kanal resmi) tidak pernah menjadi kandidat pemangkasan |
| Gerbang baru menambah waktu CI | Ia membaca HTML yang sudah dibangun untuk pemeriksaan lain. Tambahan waktunya di bawah satu detik |
