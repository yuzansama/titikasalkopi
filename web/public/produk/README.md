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

1. Kompres foto ke **WebP kualitas 75–80, sisi terpanjang 1200 px, ≤ 150 KB**
   (NFR-03, Bagian 9.3 dokumen arsitektur).
2. Simpan sebagai `web/public/produk/<slug>.webp`.
3. Di `web/src/data/products.ts`, impor foto secara statis lalu isi medan
   `image` produk terkait:

   ```ts
   import pondokBaruPhoto from "../../public/produk/pondok-baru.webp";
   // ...
   image: {
     src: pondokBaruPhoto,
     alt: "Kemasan 200 gr kopi Pondok Baru dari Bener Meriah, Aceh",
   },
   ```

   Impor statis dipakai supaya Next tahu lebar dan tinggi asli saat build dan
   menuliskannya ke HTML tanpa intervensi FE (ADR-06).
4. `alt` wajib deskriptif dalam Bahasa Indonesia dan **tidak boleh sekadar
   mengulang nama produk** — validator V-14 menggagalkan build bila diulang.
5. Placeholder `.svg` yang sudah digantikan boleh dihapus.

`image: null` adalah keadaan yang sah dan lolos validator; UI memakai
`<ProductPlaceholder />` atau berkas placeholder di folder ini.
