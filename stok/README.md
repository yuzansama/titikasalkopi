# Stok Titik Asal Kopi

Web app stok dan penjualan untuk tim Titik Asal Kopi. Tayang di
https://stok-titikasalkopi.vercel.app (project Vercel terpisah dari web toko, root directory `stok`).

- **PIC Gudang** scan QR kemasan untuk mencatat barang masuk, dan melihat stok.
- **PIC Sales** scan QR atau catat manual kopi yang terjual, beserta uang yang diterima.
- **Owner** melihat penjualan harian, total uang masuk, stok sisa, peringatan pesan ulang;
  mencetak label QR; mengatur tim, harga, dan batas stok.

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
