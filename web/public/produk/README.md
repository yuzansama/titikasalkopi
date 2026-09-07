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

Path-nya dibaca lewat `placeholderImagePath(slug)` di `src/data/catalog.ts`.

## Mengganti dengan foto asli

Lima produk sudah memakai gambar asli dan tidak lagi membaca folder ini:
`abmisibil`, `sabin`, `pondok-baru`, `bold`, dan `bright`. Berkasnya ada di
`web/src/images/produk/` — bukan di `public/` — supaya ikut hashing dan
caching aset Next lewat impor statis (ADR-06).

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
