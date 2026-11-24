# Kontrak pemesanan: web → bot Telegram

Untuk developer bot Telegram Titik Asal Kopi. Dokumen ini menjelaskan cara web
(https://titikasalkopi.vercel.app) menerima pesanan, supaya bot bisa meniru alurnya.
Tujuannya: pesanan dari web dan dari bot memakai **kode order, isi pesan, harga, dan
buku order yang sama**, dan keduanya bisa dilacak di `/lacak`.

Sumber kebenaran ada di repo `yuzansama/titikasalkopi`. Kalau dokumen ini berbeda dengan
kodenya, **kodenya yang benar**. Berkas yang dirujuk ditulis di setiap bagian.

Ditulis 24 Nov 2026.

---

## 1. Alur pembeli di web

1. **Pilih kopi dan ukuran**, lalu masukkan ke keranjang. Keranjang tersimpan di browser
   7 hari.
2. **Periksa keranjang**:
   - atur jumlah;
   - tulis **catatan** opsional, maksimal 200 karakter (gilingan, kota tujuan);
   - isi **4 digit terakhir nomor WhatsApp** pembeli. Ini opsional, dipakai untuk melacak.
3. **Tekan "Pesan via WhatsApp"**. Web lalu:
   1. membuat **kode order** (bagian 3);
   2. **mencatat** pesanan ke buku order (Google Sheet) lewat Apps Script (bagian 5).
      Sekali kirim, tidak ditunggu, gagal pun diabaikan;
   3. membuka **WhatsApp** toko dengan pesan yang sudah terisi (bagian 4).
4. **Pembeli menekan kirim di WhatsApp.** Ongkir, total akhir, dan pembayaran dibereskan
   lewat chat. **Tidak ada pembayaran di web.**
5. Owner mengubah **status** di sheet; pembeli melacak di `/lacak` dengan kode order dan
   4 digit (bagian 6).

Berkas: `web/src/features/whatsapp/whatsapp-order-button.tsx`,
`web/src/features/contact/order-steps.tsx`.

---

## 2. Katalog dan harga

**Jangan menulis harga di kode bot.** Harga dan stok diatur owner di Google Sheet dan bisa
dibaca dari Apps Script yang sama dengan buku order:

```
GET <ENDPOINT>?katalog=1
→ { "harga": { "<kunci>": <rupiah>, ... }, "stok": { "<slug>": "available" | "out-of-stock", ... } }
```

`harga` atau `stok` bernilai `null` berarti tab-nya tidak ada di sheet: anggap katalog tidak
tersedia, jangan anggap kosong.

**Yang sedang dijual** (harga per 24 Nov 2026; tetap baca dari `?katalog=1`):

| Kopi | Ukuran | Kunci harga | Harga | Id varian (kode QR) |
|---|---|---|---|---|
| Houseblend BOLD | 100 gr | `houseblend.bold.mini1` | Rp45.000 | `bold-100g` |
| Houseblend BOLD | 200 gr | `houseblend.bold.pack1` | Rp80.000 | `bold-200g` |
| Houseblend BOLD | 1 kg | `houseblend.bold.kg.promo` (ditagih); `houseblend.bold.kg` (harga coret) | Rp300.000 (coret Rp320.000) | `bold-1kg` |
| Houseblend BRIGHT | 100 gr | `houseblend.bright.mini1` | Rp55.000 | `bright-100g` |
| Houseblend BRIGHT | 200 gr | `houseblend.bright.pack1` | Rp95.000 | `bright-200g` |
| Houseblend BRIGHT | 1 kg | `houseblend.bright.kg.promo` (ditagih); `houseblend.bright.kg` (harga coret) | Rp380.000 (coret Rp400.000) | `bright-1kg` |

- **Single origin dan Full Robusta sedang kosong** (`out-of-stock`). Jangan dijual sampai
  `stok` bilang `available`.
- **Solok segera hadir, belum dijual.** Belum ada harga, proses, ketinggian, varietas, atau
  catatan rasa. Jangan menyebut data lot apa pun. Jangan memakai nama Indikasi Geografis
  ("Kopi Arabika Sumatera Minang Solok") atau "Solok Radjo" (lihat riset owner).
- Catatan rasa yang boleh disebut: BOLD = choco, almond, caramel; BRIGHT = raisin, orange,
  lemon zest. Jangan mengarang catatan rasa lain.

Berkas: `web/src/data/products.ts`, `web/src/data/catalog.ts`, `docs/09-kelola-katalog.md`,
`ops/order-tracker.gs` (`readCatalog_`).

---

## 3. Kode order

Format: **`TAK-YYMMDD-XXXX`**, misalnya `TAK-261124-K7Q2`.

- `YYMMDD` = tanggal hari ini di **WIB** (Asia/Jakarta).
- `XXXX` = 4 karakter **acak** dari alfabet `ABCDEFGHJKMNPQRSTUVWXYZ23456789`. Tanpa 0, O, 1,
  I, dan L karena kode ini sering disalin manual.
- Pakai generator acak kriptografis (`secrets` di Python, `crypto.getRandomValues` di JS).
  **Jangan** memakai nomor urut.
- **Satu checkout = satu kode baru.** Jangan dipakai ulang.
- Pola untuk validasi: `^TAK-\d{6}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$`.

Berkas: `web/src/lib/whatsapp/order-code.ts`.

---

## 4. Isi pesan pesanan

Web mengirim teks ini ke WhatsApp toko (`https://wa.me/6285121559488?text=...`). Bot sebaiknya
menghasilkan teks yang sama, supaya owner membaca satu format saja.

```
Halo Titik Asal Kopi, saya ingin memesan:

Kode order: TAK-261124-K7Q2

1. Houseblend BOLD (Houseblend BOLD)
   Varian: Kemasan 200 gr
   Jumlah: 2 pack x Rp80.000
   Subtotal: Rp160.000

2. Houseblend BRIGHT (Houseblend BRIGHT)
   Varian: Kemasan 100 gr
   Jumlah: 1 x 100 gr x Rp55.000
   Subtotal: Rp55.000

Subtotal pesanan: Rp215.000
(Belum termasuk ongkos kirim. Total akhir dikonfirmasi lewat chat.)

Catatan: giling untuk V60

Dikirim dari titikasalkopi.id
https://titikasalkopi.vercel.app/keranjang
```

Aturannya:

- **Label di dalam kurung:** untuk houseblend berisi nama produknya; untuk single origin
  berisi `Single Origin, <tier>`.
- **Baris jumlah** mengikuti satuan kemasan, ditulis sebagai jumlah kemasan, bukan berat:

  | Kemasan | Format | Contoh |
  |---|---|---|
  | 100 gr | `<n> x 100 gr` | `1 x 100 gr` |
  | 200 gr | `<n> pack` | `2 pack` |
  | 1 kg | `<n> kemasan 1 kg` | `1 kemasan 1 kg` |
  | 0,5 kg | `<n> kemasan 0,5 kg` | `1 kemasan 0,5 kg` |
  | paket 3 pack | `<n> paket (3 pack)` | `1 paket (3 pack)` |

- **Uang** ditulis `Rp` + titik ribuan, tanpa desimal: `Rp1.250.000`.
- **Catatan pembeli:** buang karakter kontrol, buang setiap baris yang diawali `Kode order:`
  atau `Dikirim dari` (supaya pembeli tidak bisa memalsukan penanda), gabungkan baris
  dengan spasi, rapikan spasi ganda, lalu potong menjadi 200 karakter. Baris `Catatan:` hanya
  muncul bila catatannya tidak kosong.
- **Baris penanda sumber:** web menulis `Dikirim dari titikasalkopi.id` + URL halamannya.
  Untuk bot, sarannya `Dikirim dari bot Telegram`, supaya owner tahu asal pesanan.
- Teks yang sudah di-encode dibatasi **1.500 karakter**. Kalau lebih, web meringkas rincian
  per baris, lalu memotong catatan, lalu membatasi jumlah item dan menambahkan
  `(+N item lainnya — rinciannya saya kirim menyusul.)`.

Berkas: `web/src/lib/whatsapp/message.ts`, `web/src/lib/whatsapp/sanitize.ts`,
`web/src/lib/format.ts`.

---

## 5. Mencatat ke buku order

```
POST <ENDPOINT>
Content-Type: text/plain;charset=UTF-8

{"code":"TAK-261124-K7Q2","last4":"9567","items":"Houseblend BOLD Kemasan 200 gr x2 pack; Houseblend BRIGHT Kemasan 100 gr x1 x 100 gr = Rp215.000"}
```

- **`code`**: kode order dari bagian 3. Kode yang tidak sesuai pola ditolak tanpa menulis apa pun.
- **`last4`**: 4 digit terakhir WhatsApp pembeli, persis `^\d{4}$`, atau string kosong. Tanpa
  `last4`, pesanan tetap tercatat, tetapi tidak bisa dilacak sampai owner mengisinya.
- **`items`**: satu baris `"<produk> <varian> x<jumlah>; ... = Rp<subtotal>"`. Spasi dirapikan,
  karakter `= + - @` di awal dibuang (supaya tidak dieksekusi sebagai rumus Sheets), lalu
  dipotong 200 karakter. Apps Script menetralkan lagi di sisinya.

**Balasan:**

| Balasan | Arti |
|---|---|
| `{"ok":true}` | Tercatat, **atau** kode itu sudah ada. Keduanya sengaja dijawab sama. Kode yang sudah ada tidak pernah ditimpa. |
| `{"ok":false,"capped":true}` | Kuota harian 50 baris otomatis habis. |
| `{"ok":false}` | Masukan tidak sah, atau sheet belum siap. |

**Aturan wajib:**

1. **Pencatatan tidak boleh menunda atau menggagalkan pesanan.** Kirim sekali, jangan menunggu
   balasan, dan abaikan kegagalannya. Kalau endpoint mati, pembeli tetap harus bisa memesan.
2. **Jangan mengirim ulang** untuk kode yang sama. Pengiriman ganda memang aman, tapi membuang
   kuota.
3. **Jangan mengirim data pribadi** di `items` (nama, alamat, nomor lengkap). Kolom itu dibaca
   owner, dan `items` ditampilkan ke pembeli di `/lacak`.

**Perubahan yang dibutuhkan bot, belum dikerjakan:**
Apps Script sekarang menulis kolom `sumber` = `web` untuk **setiap** baris otomatis, dan kuota
harian hanya menghitung baris `web`. Supaya pesanan bot bisa dibedakan dan punya kuota
sendiri, `ops/order-tracker.gs` perlu menerima medan `source` (`web` atau `telegram`).
Ubah di repo lewat PR (berkas itu dijaga `web/scripts/check-order-tracker-gs.mjs`), lalu owner
menempel ulang skripnya dan deploy versi baru. **Jangan** mengubah skrip langsung di editor
Google tanpa memperbarui repo.

**`<ENDPOINT>`:** nilai `NEXT_PUBLIC_TRACKING_ENDPOINT` di `.github/workflows/pages.yml`
(URL Web App Apps Script yang berakhiran `/exec`). URL ini memang publik. Keamanannya ada di
validasi skrip, bukan di kerahasiaan URL.

Berkas: `web/src/lib/tracking.ts` (`summarizeForRecord`, `buildOrderRecord`, `recordOrder`),
`ops/order-tracker.gs` (`doPost`), `docs/08-lacak-pesanan.md`.

---

## 6. Status dan pelacakan

Owner mengetik salah satu status ini di kolom `status` sheet:

| Slug di sheet | Tampil ke pembeli |
|---|---|
| `menunggu-konfirmasi` | Menunggu konfirmasi (status awal setiap baris otomatis) |
| `menunggu-pembayaran` | Menunggu pembayaran |
| `diproses` | Sedang disiapkan |
| `dikirim` | Dalam pengiriman (beserta kurir dan resi) |
| `selesai` | Selesai |
| `batal` | Dibatalkan |

Kalau bot juga menyediakan "lacak pesanan":

```
GET <ENDPOINT>?code=TAK-261124-K7Q2&last4=9567
→ {"found":true,"code":...,"status":...,"statusUpdatedAt":...,"orderedAt":...,"courier":...,"trackingNumber":...,"items":...}
→ {"found":false}
```

- Kode salah dan 4 digit salah sengaja dijawab **sama persis** (`{"found":false}`). Bot juga
  harus menampilkan satu pesan yang sama untuk keduanya, jangan "kode benar, digit salah".
- **Satu kode terkunci 6 jam setelah 10 kali salah**, dan selama itu jawabannya selalu
  `{"found":false}`. Jangan membuat bot mencoba ulang otomatis.
- Jangan pernah menampilkan balik `last4` ke pengguna.

Berkas: `web/src/lib/tracking.ts` (`ORDER_STATUSES`, `lookupOrder`), `ops/order-tracker.gs`
(`doGet`), `docs/14-audit-keamanan-2026-11-22.md`.

---

## 7. Kontak resmi

| Kanal | Nilai yang dipakai web |
|---|---|
| WhatsApp toko | **0851-2155-9488** (`https://wa.me/6285121559488`) |
| Instagram | **@titikasalkopi** (huruf kecil) |
| Shopee | Titikasalkopi |
| Jam balas | Setiap hari, 08.00–21.00 WIB |

Kartu origin cetak lama memakai nomor 0877-7793-9567. Web dan riset Solok memakai
0851-2155-9488. **Tanyakan owner nomor mana yang benar** sebelum dipakai di bot.

Berkas: `web/src/lib/site.ts`.

---

## 8. Ringkasan: yang harus sama

- [ ] Harga dan stok dibaca dari `?katalog=1`, bukan ditulis di kode bot.
- [ ] Kode order `TAK-YYMMDD-XXXX`, acak, tanggal WIB, satu per checkout.
- [ ] Teks pesan mengikuti bagian 4 (format jumlah, `Rp`, keterangan ongkir, catatan ≤200).
- [ ] Pencatatan ke buku order: POST `{code,last4,items}`, sekali kirim, tidak menghambat pesanan.
- [ ] `source: "telegram"` setelah Apps Script diperbarui (bagian 5).
- [ ] Pelacakan: satu pesan "tidak ketemu", tidak ada percobaan ulang otomatis.
- [ ] Tidak ada pembayaran di bot. Ongkir dan total akhir dikonfirmasi lewat chat.
- [ ] Solok hanya "segera hadir". Tanpa data lot, tanpa nama Indikasi Geografis, tanpa "Solok Radjo".
