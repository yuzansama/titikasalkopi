# `public/produk/` — gambar produk

## Isi folder ini sekarang: PLACEHOLDER, bukan foto

Sepuluh berkas `.svg` di folder ini adalah **placeholder sementara bergaya
brand**, bukan foto produk. Dibuat supaya FE bisa membangun layout nyata tanpa
menunggu sesi foto (R-13: foto tidak boleh menahan rilis).

- Ukuran: `800 × 1000` px, rasio **4:5** — sama persis dengan rasio foto asli
  nanti, sehingga mengganti placeholder dengan foto tidak menggeser layout
  (NFR-02, CLS ≤ 0,05).
- Palet: hanya warna resmi dari `docs/00-brand-brief.md`.
- Nama berkas = slug produk, mis. `pondok-baru.svg`, `bold.svg`.
- Isi yang tampak: tanda kata "TITIK ASAL KOPI", ikon biji, label tier
  (mis. `SINGLE ORIGIN · SIGNATURE`), dan nama produk. **Tidak ada** baris
  keterangan "foto produk menyusul" — kartu ini berdiri sebagai kartu brand
  yang disengaja. Di grid katalog ia berdampingan dengan foto asli, dan
  keterangan seperti itu membuat toko terbaca belum siap tepat di halaman
  tempat pembeli memutuskan. Jangan menambahkannya kembali.

Path-nya dibaca lewat `placeholderImagePath(slug)` di `src/data/catalog.ts`.

## Mengganti dengan foto asli

Sembilan produk sudah memakai gambar asli dan tidak lagi membaca folder ini:
`abmisibil`, `sabin`, `pondok-baru`, `bold`, `bright`, lalu `oelbiteno`,
`pyramid`, `palimping`, dan `kerinci`. Berkasnya ada di
`web/src/images/produk/` — bukan di `public/` — supaya ikut hashing dan
caching aset Next lewat impor statis (ADR-06).

Yang masih placeholder tinggal **dua**: `sindoro` dan `full-robusta`. Keduanya
tidak punya artwork di aset mana pun — poster origin hanya memuat tujuh nama
dan Sindoro bukan salah satunya, sementara lembar houseblend hanya memotret
BOLD dan BRIGHT.

> **Utang mutu yang disengaja, 10 September 2026.** Empat gambar terakhir
> (`oelbiteno`, `pyramid`, `palimping`, `kerinci`) BUKAN berasal dari kartu
> origin tersendiri seperti lima yang pertama. Ia dipotong dari ubin kecil pada
> poster `assets/brand/WhatsApp Image 2026-09-07 at 14.10.57.jpeg`, yang area
> bebas teksnya hanya ±115×145 px, lalu diperbesar ke 560×700 — sekitar empat
> kali. Hasilnya lembek dibanding tetangganya di grid yang sama, dan itu
> diketahui saat dipasang: owner memilih memakai yang ada lebih dulu daripada
> menunggu berkas desain. Aturan "jangan memperbesar melebihi ukuran asli" di
> bawah dilanggar SEKALI di sini, dengan sadar, dan bukan preseden.
>
> Penggantinya: minta kartu origin Oelbiteno, Pyramid, Palimping, dan Kerinci
> ke pembuat desain, dalam format yang sama dengan Abmisibil, Sabin, dan Pondok
> Baru (±1400×1120). Begitu berkas itu ada, ganti keempatnya dan hapus catatan
> ini.

1. Kompres gambar ke rasio **4:5** dan **≤ 120 KB** (NFR-03 membatasi 150 KB
   per gambar; 120 KB memberi ruang aman). Jangan memperbesar melebihi ukuran
   asli — hasilnya lembek dan tetap memakan bita.
2. Simpan sebagai `web/src/images/produk/<slug>.jpg`.
3. Di `web/src/data/products.ts`, impor secara statis lalu isi medan `image`:

   ```ts
   import pondokBaruArtwork from "@/images/produk/pondok-baru.jpg";
   // ...
   image: {
     src: pondokBaruArtwork,
     alt: "Ilustrasi lanskap dataran tinggi Bener Meriah, Aceh: harimau berjalan di antara kebun kopi berbuah merah.",
   },
   ```

   Impor statis dipakai supaya Next tahu lebar dan tinggi asli saat build dan
   menuliskannya ke HTML tanpa intervensi FE (ADR-06). `scripts/_ts-load.mjs`
   mengenali impor gambar ini dan menggantinya dengan stub saat pemeriksaan.
4. `alt` wajib deskriptif dalam Bahasa Indonesia, menggambarkan APA YANG BENAR
   TERLIHAT, dan **tidak boleh sekadar mengulang nama produk** — validator V-14
   menggagalkan build bila diulang. Gambar origin di repositori ini adalah
   ILUSTRASI lanskap, bukan foto kemasan; alt-nya harus mengatakan begitu.
5. Placeholder `.svg` yang sudah digantikan boleh dihapus.

`image: null` adalah keadaan yang sah dan lolos validator; UI memakai
`<ProductPlaceholder />` atau berkas placeholder di folder ini. Lima produk
masih memakainya: `oelbiteno`, `pyramid`, `palimping`, `kerinci` (thumbnail
poster katalog terlalu kecil untuk potongan 4:5 tanpa teks) dan `full-robusta`
(tidak ada gambar yang jujur mewakilinya).
