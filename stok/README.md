# Stok Titik Asal Kopi

Web app stok dan penjualan untuk tim Titik Asal Kopi. Tayang di
https://stok-titikasalkopi.vercel.app (project Vercel terpisah dari web toko, root directory `stok`).

- **PIC Gudang** scan QR kemasan untuk mencatat barang masuk, dan melihat stok.
- **PIC Sales** scan QR atau catat manual kopi yang terjual, beserta uang yang diterima.
- **Owner** melihat penjualan harian, total uang masuk, stok sisa, peringatan pesan ulang;
  mencetak label QR; mengatur tim, harga, dan batas stok; dan mengurus **Kas**.

## Kas

Menu Kas hanya untuk owner (owner = pemodal; undang pemodal lain sebagai Owner). Isinya
belanja, setoran modal, pengembalian talangan, daftar pemodal, dan daftar PO. Penjualan
diambil otomatis dari app. Rumusnya sama dengan halaman /kas lama (`hitungKas()` di
`src/lib.js`):

- uang di tangan = setoran + penjualan − belanja dibayar dari Kas − talangan yang sudah dikembalikan;
- posisi pemodal = (setoran + talangan) − (modal + kopi pribadi) − dikembalikan
  (plus = talangan belum balik, minus = kurang setor);
- saldo usaha = uang di tangan + total kurang setor − total talangan belum balik.

Halaman /kas di web toko sudah dihapus (isinya terbuka untuk umum) setelah datanya diimpor
dan setiap angka utamanya dicocokkan dengan layar Kas.

## QR kemasan

Satu QR untuk satu varian (jenis + ukuran). Isinya `https://titikasalkopi.vercel.app/q/<kode>`,
dengan `<kode>` = id varian di katalog web (`web/src/data/qr.ts`), mis. `bold-100g`.
Dipindai kamera biasa, QR membuka halaman terima kasih di web toko. Dipindai dari app ini,
kode yang sama mencatat stok. Kode yang sudah tercetak tidak boleh diganti.

## Akses dan data

Data ada di Supabase (project `stok-titikasalkopi`, region Singapura). Hak akses per peran
ditegakkan di database lewat Row Level Security dan fungsi `security definer`:
lihat `supabase/schema.sql`. Akun baru tidak bisa melihat apa pun sampai memakai kode undangan
dari owner (sekali pakai, berlaku 7 hari). Login memakai email + password; tidak ada email
yang dikirim, jadi tidak butuh SMTP.

Mengubah skema: edit `supabase/schema.sql` (ditulis supaya aman dijalankan ulang), jalankan di
SQL editor Supabase, lalu jalankan `supabase/test_rls.sql` — ia menguji setiap peran dan selalu
di-ROLLBACK.

## Data lama dari /kas

Penjualan dan kas sebelum app dipakai diimpor dari halaman /kas lama. Halamannya sudah
dihapus; untuk menjalankan ulang, ambil dari riwayat git:

```bash
git show 3e2dd65:web/public/kas/index.html > /tmp/kas.html
node scripts/impor-kas.mjs /tmp/kas.html > impor.sql   # laporan pemetaan tampil di layar
```

Jalankan `impor.sql` di SQL editor Supabase. Bisa diulang: semua baris `impor = true` dihapus
dulu, data yang dicatat lewat app tidak tersentuh. Untuk tiap varian, stok awal impor = jumlah
yang terjual di /kas, jadi stok setelah impor tepat 0. Nama lama dipetakan lewat harga
(Arabica/Full Arabica = BRIGHT, Blend/Houseblend/Robusta = BOLD) dan single origin lewat namanya
("Papua" = Sabin); rincian yang tidak dikenali (1 kg, "Kopi") hanya diimpor uangnya.

## Pengembangan

```bash
cp .env.example .env.local   # isi URL dan publishable key Supabase
npm install
npm run dev
```

Uji:

```bash
npm run test:unit
npm run build && npx vite preview --port 4173 &
SUPABASE_ACCESS_TOKEN=... VIDEO_DIR=... npm run test:e2e
```

`test:e2e` memakai database sungguhan: ia membuat akun owner, gudang, dan sales uji
(`@example.com`), menjalankan alur scan dengan kamera palsu, lalu menghapus semuanya.
`VIDEO_DIR` berisi `bold-200g.y4m` dan `bright-100g.y4m`: video yang menampilkan QR kemasan.
`vite preview` memakai header CSP yang sama dengan `vercel.json`, jadi pelanggaran CSP ikut
tertangkap sebagai error console.
