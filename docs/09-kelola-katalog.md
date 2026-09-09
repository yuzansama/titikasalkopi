# Mengelola Katalog Sendiri — Harga, Stok, dan Lini 100 Gram

Tanggal: 8 September 2026. Menutup permintaan CEO "buatkan agar katalog mudah di-manage". Keputusannya tercatat sebagai KD-08 pada `00b-ceo-decisions.md`.

Bagian 1 sampai 5 untuk **owner**. Bagian 6 dan 7 untuk yang memelihara situs.

---

## 1. Apa yang bisa Anda ubah sendiri

Semua yang berupa **angka dan status** — yaitu hampir semua suntingan rutin:

| Bisa Anda ubah sendiri | Tetap lewat developer |
|---|---|
| Harga 100 gr, 1 pack, dan 3 pack, tier Signature dan Reguler | Asal desa, wilayah, provinsi |
| Kesembilan harga houseblend, per kg maupun per 0,5 kg | Proses, ketinggian, varietas |
| Status jual 11 produk (ada / kosong) | Catatan rasa |
| Seluruh lini 100 gram: tambah, hapus, ubah nama dan harga | Foto produk |

Batasnya bukan teknis. Kolom di sebelah kanan adalah **klaim tentang produk**, bukan angka, dan situs ini dibayar di muka lewat transfer — klaim yang salah merusak kepercayaan pada seluruh katalog, termasuk yang benar.

---

## 2. Menyiapkan tiga tab

Di spreadsheet yang **sama** dengan buku order, tambahkan tiga tab. Nama tab harus persis, huruf kecil semua.

### Tab `harga`

Dua kolom. `kunci` tidak boleh diubah — itu nama yang dikenali kode. Yang Anda ubah hanya kolom `harga`.

| kunci | keterangan | harga |
|---|---|---|
| single.signature.pack1 | Signature, 1 pack 200 gr | 140000 |
| single.signature.pack3 | Signature, 3 pack | 392000 |
| single.signature.mini1 | Signature, 1 kemasan 100 gr | 85000 |
| single.reguler.pack1 | Reguler, 1 pack 200 gr | 125000 |
| single.reguler.pack3 | Reguler, 3 pack | 352000 |
| single.reguler.mini1 | Reguler, 1 kemasan 100 gr | 70000 |
| houseblend.bold-70-30 | BOLD 70:30 per kg | 215000 |
| houseblend.bold-70-30.half | BOLD 70:30 per 0,5 kg | 120000 |
| houseblend.bold-60-40 | BOLD 60:40 per kg | 205000 |
| houseblend.bold-60-40.half | BOLD 60:40 per 0,5 kg | 115000 |
| houseblend.bold-50-50 | BOLD 50:50 per kg | 200000 |
| houseblend.bold-50-50.half | BOLD 50:50 per 0,5 kg | 110000 |
| houseblend.bold-40-60 | BOLD 40:60 per kg | 195000 |
| houseblend.bold-40-60.half | BOLD 40:60 per 0,5 kg | 105000 |
| houseblend.bold-30-70 | BOLD 30:70 per kg | 190000 |
| houseblend.bold-30-70.half | BOLD 30:70 per 0,5 kg | 100000 |
| houseblend.bold-20-80 | BOLD 20:80 per kg | 185000 |
| houseblend.bold-20-80.half | BOLD 20:80 per 0,5 kg | 95000 |
| houseblend.bright-signature | BRIGHT Signature per kg | 280000 |
| houseblend.bright-signature.half | BRIGHT Signature per 0,5 kg | 150000 |
| houseblend.bright-reguler | BRIGHT Reguler per kg | 240000 |
| houseblend.bright-reguler.half | BRIGHT Reguler per 0,5 kg | 130000 |
| houseblend.full-robusta | Full Robusta per kg | 180000 |
| houseblend.full-robusta.half | Full Robusta per 0,5 kg | 100000 |

Kolom `keterangan` untuk Anda sendiri; isinya diabaikan sistem. Kedua puluh empat baris **wajib ada** — satu saja hilang, sinkronisasi membatalkan diri.

Harga boleh ditulis `125000`, `125.000`, atau `Rp125.000`. Ketiganya dibaca sama.

**Harga 0,5 kg sekarang ditulis sendiri**, pada kunci berakhiran `.half`. Sebelumnya ia dihitung sebagai setengah harga per kg; bisnis plan "Kopi from heart" membatalkan itu, karena kemasan kecil membawa marginnya sendiri (BOLD 70:30 dijual Rp120.000 per 0,5 kg, bukan Rp107.500).

Dua batas dijaga sistem, dan melanggarnya menggagalkan build:

- Dua kemasan 0,5 kg **wajib lebih mahal** daripada satu kilogram. Kalau tidak, pembeli memesan dua kemasan kecil dan membayar kurang dari satu kilogram utuh.
- Satu kemasan 0,5 kg **wajib lebih murah** daripada satu kilogram penuh. Kalau tidak, kemasan yang lebih besar tampil lebih murah di halaman yang sama.

Begitu pula kemasan 100 gr: ia wajib lebih murah daripada kemasan 200 gr.

### Tab `stok`

| slug | status |
|---|---|
| oelbiteno | available |
| abmisibil | available |
| sabin | available |
| pyramid | available |
| palimping | available |
| kerinci | available |
| pondok-baru | available |
| sindoro | available |
| bold | available |
| bright | available |
| full-robusta | available |

Hanya dua nilai yang diterima: `available` dan `out-of-stock`. Kesebelas baris wajib ada.

### Tab `katalog100`

| slug | nama | harga | status |
|---|---|---|---|
| bali-kintamani | Bali Kintamani | 80000 | available |
| gayo | Gayo | 80000 | available |
| kerinci-100 | Kerinci | 85000 | available |
| … | | | |

Aturannya:

- **`slug` harus unik dan tidak boleh sama dengan slug di tab `stok`.** Kalau bertabrakan, keranjang akan menampilkan barang dan harga yang berbeda dari yang ditambahkan pengunjung. Sinkronisasi menolak, dan menyarankan akhiran `-100`.
- `slug` huruf kecil, angka, dan tanda hubung saja. Tanpa spasi.
- `status` `out-of-stock` **menyembunyikan** barisnya dari situs tanpa menghapusnya dari sheet. Ini cara menarik kopi sementara.
- **Urutan baris di sheet menjadi urutan di situs.** Susun sesuai poster Anda.
- Menambah kopi = tambah baris. Menghapus = hapus baris.

---

## 3. Menerbitkan perubahan

Setelah menyunting sheet:

1. Buka repositori di GitHub, tab **Actions**.
2. Pilih **"Sync katalog dari Google Sheet"** di daftar kiri.
3. Tekan **Run workflow**.

Sekitar dua menit. Bila ada perubahan, sistem menyimpannya lalu menerbitkan ulang situs sendiri. Bila tidak ada yang berubah, ia berhenti dan mengatakan begitu.

Ada juga jadwal otomatis setiap hari pukul **01.00 WIB**, jadi suntingan yang lupa Anda terbitkan tetap tayang keesokan harinya.

---

## 4. Kalau sinkronisasi gagal

Ia **sengaja** gagal daripada menerbitkan sesuatu yang meragukan. Selama gagal, **situs tetap menayangkan katalog terakhir yang benar** — tidak ada yang rusak di sisi pembeli.

Buka run yang merah di Actions dan baca pesannya. Semuanya ditulis lengkap, bukan kode error:

| Pesan | Artinya |
|---|---|
| `Tab "harga" tidak ditemukan` | Nama tab salah ketik, atau tabnya belum dibuat |
| `Harga "houseblend.bold-70-30" tidak ada` | Barisnya terhapus dari tab `harga` |
| `di luar batas wajar` | Jumlah nolnya salah. Sistem menolak di bawah Rp10.000 dan di atas Rp5.000.000 |
| `tidak dikenali kode` | `kunci` salah ketik. Perbaiki, jangan tambah baris baru |
| `bentrok dengan produk 200 gram` | Slug di `katalog100` sama dengan slug di `stok` |
| `tidak menghasilkan satu baris pun` | Tab `katalog100` kosong, atau nama kolomnya salah |

Betulkan sheet, lalu tekan Run workflow lagi.

Batas Rp10.000–Rp5.000.000 itu bukan aturan bisnis, melainkan jaring pengaman terhadap salah ketik. Satu nol kelebihan mengubah Rp125.000 menjadi Rp1.250.000, dan satu nol kurang menjadikannya Rp12.500 — keduanya angka yang sah secara teknis, dan keduanya akan tayang tanpa ada yang menahan.

---

## 5. Wajib dilakukan sekali sebelum semua ini bekerja

Skrip Apps Script sudah bertambah kemampuan membaca katalog, jadi versi yang terpasang sekarang belum bisa melayaninya:

1. Buat ketiga tab di Bagian 2, lengkap dengan isinya.
2. Buka **Extensions > Apps Script**, tempel ulang seluruh isi `ops/order-tracker.gs`.
3. Jalankan `selfCheck`.
4. **Deploy > Manage deployments > Edit > Version: New version.** URL tidak berubah, jadi tidak ada yang perlu disentuh di sisi situs.

Sampai langkah ini selesai, sinkronisasi akan gagal dengan pesan "Tab tidak ditemukan" — dan itu memang perilaku yang benar.

---

## 6. Bagaimana ini bekerja

```
Google Sheet  --(Apps Script ?katalog=1)-->  sync-katalog.mjs
     |                                              |
     |                                              v
     |                              src/data/managed.generated.ts
     |                                              |
     |                                     commit + push
     |                                              |
     |                                              v
     +--------------------------------->  pages.yml membangun situs
```

Sheet adalah **permukaan sunting**. Repositori tetap **catatannya**: setiap perubahan harga masuk riwayat git dengan tanggal dan isinya, dan situs yang tayang selalu dibangun dari berkas yang ter-commit, bukan dari panggilan langsung ke sheet saat pengunjung membuka halaman.

Itu keputusan yang disengaja. Mengambil harga saat halaman dibuka berarti sheet yang mati atau lambat menjadi halaman produk tanpa harga, dan seluruh situs berhenti bisa di-cache. Harga adalah data paling kritis di sini; ia harus statis, tervalidasi, dan punya riwayat.

`managed.generated.ts` adalah **satu-satunya** sumber harga, stok, dan lini 100 gram. Tidak ada nilai cadangan di berkas lain — dua sumber kebenaran untuk harga berarti suatu hari situs menayangkan angka yang tidak seorang pun merasa menuliskannya.

---

## 7. Lapis pengaman

Empat, berurutan. Satu saja lolos tidak cukup untuk menerbitkan harga yang salah.

1. **Apps Script** hanya mengeluarkan baris yang bentuknya benar. Tab yang tidak ada dikembalikan sebagai `null`, sengaja dibedakan dari tab kosong.
2. **`validateCatalogPayload()`** menolak tab hilang, harga hilang, harga di luar batas wajar, kunci tak dikenal, slug bentrok, dan daftar 100 gram kosong. Gagal berarti **tidak ada berkas yang disentuh**.
3. **Validator katalog** (`assertCatalogValid`, `assertPicksValid`) berjalan saat modul dievaluasi, sehingga data rusak menggagalkan build alih-alih tayang.
4. **Workflow** menjalankan `tsc` dan tiga skrip pemeriksaan sebelum commit. Katalog yang tidak lolos tidak pernah masuk repositori.

Selain itu `managedPrice()` **melempar** bila kuncinya hilang, bukan mengembalikan 0. Katalog tanpa harga bukan keadaan yang boleh tayang: nol akan tampil sebagai "Rp0" di halaman produk dan ikut ke pesan WhatsApp sebagai penawaran sungguhan.
