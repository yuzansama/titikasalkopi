# Mengelola Katalog Sendiri — Harga dan Stok

Tanggal: 8 September 2026, diperbarui 9 September 2026. Menutup permintaan CEO "buatkan agar katalog mudah di-manage". Keputusannya tercatat sebagai KD-08 pada `00b-ceo-decisions.md`.

Bagian 1 sampai 5 untuk **owner**. Bagian 6 dan 7 untuk yang memelihara situs.

> **Perubahan 9 September 2026 — sekarang cukup DUA tab, bukan tiga.**
> Versi sebelumnya meminta Anda membuat tab ketiga bernama `katalog100` untuk
> lini "Katalog Kopi 100 gram" dari poster cetak. **Lini itu sudah dihapus dari
> situs** (KD-09) karena seluruh produk kini wajib berasal dari satu sumber:
> lembar `Product` pada `assets/brand/Kopi from heart.xlsx`. Yang perlu Anda
> siapkan hanya `harga` dan `stok`.
>
> **Kalau tab `katalog100` terlanjur Anda buat, biarkan saja.** Sistem tidak
> membacanya lagi sama sekali. Ia tidak menggagalkan sinkronisasi, tidak
> mengubah apa pun di situs, dan tidak perlu dihapus. Menghapusnya juga aman.
>
> **Jangan tertukar:** kemasan **mini 100 gr** pada single origin — Signature
> Rp85.000 dan Reguler Rp70.000 — **tetap dijual seperti biasa**. Yang hilang
> adalah lini terpisah berisi kopi-kopi poster, bukan kemasan 100 gram itu
> sendiri.

---

## 1. Apa yang bisa Anda ubah sendiri

Semua yang berupa **angka dan status** — yaitu hampir semua suntingan rutin:

| Bisa Anda ubah sendiri | Tetap lewat developer |
|---|---|
| Harga 100 gr, 1 pack, dan 3 pack, tier Signature dan Reguler | Asal desa, wilayah, provinsi |
| Kesembilan harga houseblend, per kg maupun per 0,5 kg | Proses, ketinggian, varietas |
| Status jual 11 produk (ada / kosong) | Catatan rasa |
| | Foto produk |
| | Menambah atau menghapus produk |

Baris terakhir itu memang berpindah sisi pada 9 September 2026. Daftar produknya sekarang mengikuti lembar `Product`, dan sistem menolak menerbitkan katalog yang bertambah atau berkurang satu produk pun tanpa lembar itu ikut berubah. Kalau Anda ingin menambah atau menghentikan sebuah kopi, kabari yang memelihara situs — bukan karena sulit, melainkan supaya lembar Anda dan situs tidak pernah berbeda isi.

Batasnya bukan teknis. Kolom di sebelah kanan adalah **klaim tentang produk**, bukan angka, dan situs ini dibayar di muka lewat transfer — klaim yang salah merusak kepercayaan pada seluruh katalog, termasuk yang benar.

---

## 2. Menyiapkan dua tab

Di spreadsheet yang **sama** dengan buku order, tambahkan dua tab. Nama tab harus persis, huruf kecil semua.

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

### Tidak ada tab ketiga

Sampai 8 September 2026 ada tab ketiga bernama `katalog100`, berisi lini "Katalog Kopi 100 gram" dari poster cetak Anda: satu baris per kopi, dengan nama dan harga sendiri-sendiri.

**Tab itu tidak dibaca lagi sejak 9 September 2026.** Lini poster dihapus dari situs karena seluruh produk kini berasal dari lembar `Product` pada `assets/brand/Kopi from heart.xlsx`, dan kopi-kopi poster itu tidak ada di sana. Alasan lengkapnya di `00b-ceo-decisions.md`, keputusan D-09.

Kalau tabnya masih ada di spreadsheet Anda, **biarkan**. Sistem melewatinya begitu saja: sinkronisasi tetap hijau, situs tidak berubah, dan tidak ada pesan galat. Mengubah isinya juga tidak berpengaruh pada apa pun. Menghapus tabnya sama amannya — pilih yang Anda suka.

Yang **tetap** ada adalah kemasan **mini 100 gr** pada single origin, dan harganya Anda atur dari tab `harga` di atas lewat kunci `single.signature.mini1` dan `single.reguler.mini1`. Itu hal yang berbeda dari lini poster, walaupun beratnya sama-sama 100 gram.

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
| `hanya boleh available atau out-of-stock` | Kolom `status` di tab `stok` salah ketik |
| `tidak dikenali kode` (di tab `stok`) | Ada baris `slug` yang bukan salah satu dari kesebelas produk |
| `menyimpang dari lembar Product` | Katalog bertambah atau berkurang produk, atau kemasan mini muncul pada biji yang tidak punya barisnya di lembar `Product`. Ini bukan sesuatu yang bisa disebabkan suntingan sheet — kabari yang memelihara situs |

Betulkan sheet, lalu tekan Run workflow lagi.

Batas Rp10.000–Rp5.000.000 itu bukan aturan bisnis, melainkan jaring pengaman terhadap salah ketik. Satu nol kelebihan mengubah Rp125.000 menjadi Rp1.250.000, dan satu nol kurang menjadikannya Rp12.500 — keduanya angka yang sah secara teknis, dan keduanya akan tayang tanpa ada yang menahan.

---

## 5. Wajib dilakukan sekali sebelum semua ini bekerja

Skrip Apps Script sudah bertambah kemampuan membaca katalog, jadi versi yang terpasang sekarang belum bisa melayaninya:

1. Buat kedua tab di Bagian 2 — `harga` (24 baris) dan `stok` (11 baris) — lengkap dengan isinya.
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

`managed.generated.ts` adalah **satu-satunya** sumber harga dan stok. Tidak ada nilai cadangan di berkas lain — dua sumber kebenaran untuk harga berarti suatu hari situs menayangkan angka yang tidak seorang pun merasa menuliskannya.

---

## 7. Lapis pengaman

Empat, berurutan. Satu saja lolos tidak cukup untuk menerbitkan harga yang salah.

1. **Apps Script** hanya mengeluarkan baris yang bentuknya benar. Tab yang tidak ada dikembalikan sebagai `null`, sengaja dibedakan dari tab kosong.
2. **`validateCatalogPayload()`** menolak tab hilang, harga hilang, harga di luar batas wajar, kunci tak dikenal, slug tak dikenal, dan status stok tak dikenal. Gagal berarti **tidak ada berkas yang disentuh**.
3. **Validator katalog** (`assertCatalogValid`) berjalan saat modul dievaluasi, sehingga data rusak menggagalkan build alih-alih tayang.
4. **Workflow** menjalankan `tsc` dan dua skrip pemeriksaan sebelum commit — `check-cart.mjs` dan `check-sync-katalog.mjs`. Katalog yang tidak lolos tidak pernah masuk repositori.

Lapis keempat itu memuat pagar yang paling relevan sejak KD-09: `check-cart.mjs` menyimpan **salinan daftar produk lembar `Product` yang diketik ulang dengan tangan**, dan gagal bila katalog bertambah produk, kehilangan produk, atau menumbuhkan kemasan mini pada biji yang tidak punya barisnya di lembar itu. Salinannya sengaja tidak diimpor dari data yang diuji — pemeriksaan yang membandingkan data dengan dirinya sendiri selalu lulus.

Selain itu `managedPrice()` **melempar** bila kuncinya hilang, bukan mengembalikan 0. Katalog tanpa harga bukan keadaan yang boleh tayang: nol akan tampil sebagai "Rp0" di halaman produk dan ikut ke pesan WhatsApp sebagai penawaran sungguhan.
