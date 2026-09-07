# Draf Catatan Rasa — Tujuh Single Origin

**Status: DRAF. BELUM TAYANG DI SITUS.** Menunggu koreksi pemilik.

Tanggal: 7 September 2026. Disiapkan atas permintaan owner, untuk dikoreksi.

## Kenapa ini belum dipasang

Catatan rasa adalah klaim produk, bukan elemen desain. Begitu tayang, pembeli memilih berdasarkan itu dan membayar di muka lewat transfer. Kalau "jeruk manis" ternyata tidak ada, yang rusak bukan cuma satu transaksi — yang rusak kepercayaan pada seluruh katalog, termasuk produk yang catatan rasanya benar.

Karena itu draf ini disimpan di dokumen, bukan di `products.ts`. Wiring ke situs memakan waktu lima menit dan bisa dilakukan kapan saja setelah Anda mencoret dan membetulkan.

## Dasar penyusunan, dan batasnya

Yang dipakai hanya fakta yang benar-benar tercatat di `docs/00-brand-brief.md`: wilayah, ketinggian, proses, dan varietal. Dari situ disusun profil yang **lazim** untuk kombinasi tersebut.

Yang TIDAK dipakai, karena tidak ada: hasil cupping lot ini, skor SCA, catatan roaster, umpan balik pembeli. Tidak ada satu pun catatan di bawah yang berasal dari mencicipi kopi yang sebenarnya.

Karena itu setiap baris diberi tingkat keyakinan:

- **Sedang** — proses dan varietal diketahui, jadi arah profilnya cukup dapat diperkirakan.
- **Rendah** — hanya wilayah yang diketahui. Ini tebakan berdasar kelaziman daerah, dan paling mungkin meleset.

## Draf

### Signature — Indonesia Timur

| Origin | Yang diketahui | Usulan catatan rasa | Keyakinan |
|---|---|---|---|
| **Sabin** | Peg. Bintang, Papua · Washed · 1.900 MASL · Arabica Typica | gula aren · jeruk manis · floral | **Sedang** |
| **Abmisibil** | Peg. Bintang, Papua · Natural Anaerob · 1.900 MASL · Bourbon & Typica | beri hitam · anggur merah · cokelat hitam | **Sedang** |
| **Pyramid** | Perabaga, Jayawijaya, Papua | cokelat susu · almond · karamel | **Rendah** |
| **Oelbiteno** | Desa Oelbiteno, Kupang, NTT | cokelat gelap · rempah · tembakau manis | **Rendah** |

**Sabin.** Typica yang dicuci di ketinggian 1.900 meter hampir selalu bersih dan terang — itu gunanya proses washed. Manis gula aren dan keasaman jeruk adalah kombinasi paling lazim untuk Papua washed. Unsur floral ditambahkan karena Typica di ketinggian itu sering memberikannya, tetapi ini bagian yang paling layak dicoret bila Anda tidak menemukannya.

**Abmisibil.** Natural anaerob adalah proses yang paling menonjolkan buah dan fermentasi. Beri hitam dan kesan anggur merah adalah tanda khasnya. Ini satu-satunya kopi di katalog yang profilnya paling mudah ditebak, justru karena prosesnya sangat menentukan rasa. Kalau ada satu yang layak langsung tayang, ini kandidatnya.

**Pyramid.** Hanya lokasi yang diketahui — tidak ada proses, ketinggian, maupun varietal di data. Usulan ini murni memakai kelaziman Papua dataran tinggi. Perlakukan sebagai tempat kosong, bukan rekomendasi.

**Oelbiteno.** Arabika NTT umumnya bertubuh tebal dengan keasaman rendah dan kesan rempah. Tetapi NTT sangat beragam antar desa, dan Oelbiteno tidak punya catatan proses sama sekali. Keyakinan rendah.

### Reguler — Pilihan Nusantara

| Origin | Yang diketahui | Usulan catatan rasa | Keyakinan |
|---|---|---|---|
| **Pondok Baru** | Bener Meriah, Aceh · Natural Classic · 1.400 MASL · Bourbon, Ateng Super | buah kering · cokelat · rempah manis | **Sedang** |
| **Kerinci** | Peg. Kerinci, Jambi | lemon · herbal · gula merah | **Rendah** |
| **Palimping** | Desa Palimping, Garut, Jawa Barat | jeruk keprok · gula merah · floral | **Rendah** |

**Pondok Baru.** Natural pada Ateng Super di dataran Gayo lazimnya memberi manis buah kering dan kesan rempah, dengan tubuh tebal. Proses dan varietal diketahui, jadi arahnya cukup aman.

**Kerinci.** Kopi Kerinci sering digambarkan bertubuh sirup dengan kesan herbal dan keasaman lemon. Tanpa data proses, ini tetap tebakan wilayah.

**Palimping.** Garut termasuk kawasan Preanger yang dikenal dengan keasaman jeruk dan manis gula merah. Sama seperti di atas: tidak ada data proses.

## Cara mengoreksi

Cukup coret dan tulis ulang langsung di tabel ini, atau kirim pesan berisi nama origin dan tiga catatan yang benar. Format yang dipakai situs adalah tiga kata atau frasa pendek per produk, sama seperti houseblend yang sudah tayang (`choco · almond · caramel` untuk BOLD, `raisin · orange · lemon zest` untuk BRIGHT).

Bila sebuah origin belum pernah di-cupping, **biarkan kosong**. Kartu produk sudah menangani `tastingNotes: null` dengan rapi — tidak ada yang rusak, hanya tidak ada blok catatan rasa. Itu jauh lebih baik daripada menayangkan tebakan.

## Saat sudah dikoreksi

Isi `tastingNotes` pada setiap blok di `web/src/data/products.ts`, misalnya:

```ts
tastingNotes: ["Gula aren", "Jeruk manis", "Floral"],
```

Validator sudah menerima `null` maupun larik, jadi origin yang belum siap boleh tetap kosong sementara yang lain tayang. Setelah itu build ulang dan catatan rasa muncul di kartu katalog dan halaman produk, persis seperti houseblend sekarang.
