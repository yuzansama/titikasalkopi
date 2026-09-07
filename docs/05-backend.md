# 05 — Dokumen Backend / Platform
## Titik Asal Kopi — Website titikasalkopi.id (Fase 1a)

---

## 0. Kendali Dokumen

| Atribut | Isi |
|---|---|
| Judul | Dokumen Backend / Platform — Website titikasalkopi.id Fase 1a |
| Versi | 1.0 |
| Tanggal | 7 September 2026 |
| Penulis | BE / Platform Developer |
| Status | **Kontrak dibekukan** — FE boleh mulai |
| Dokumen sumber | `docs/00-brand-brief.md`, `docs/00b-ceo-decisions.md`, `docs/02-BRD.md`, `docs/03-architecture.md` |
| Basis kode | `web/` — Next.js 16.3.4 (App Router), React 19.2.8, TypeScript 5, Tailwind CSS v4 |

**Status verifikasi terakhir** (dijalankan di `web/`):

| Perintah | Hasil |
|---|---|
| `npx tsc --noEmit` | lulus, tanpa keluaran |
| `npx eslint .` | lulus, tanpa keluaran |
| `npm run build` | lulus — 4 rute terbangun (`/`, `/_not-found`, `/robots.txt`, `/sitemap.xml`); 12 rute sisanya menunggu `page.tsx` milik FE |
| Uji gerbang validasi | data sengaja dirusak → build **gagal** dengan 3 pesan berbahasa Indonesia, lalu dipulihkan (bukti di Bagian 4.3) |

---

## 1. Ringkasan: apa yang dibangun

Fase 1 tidak punya server aplikasi (ADR-03). Karena itu "backend" di sini berarti **lapisan data dan seluruh permukaan yang dihasilkan build**. Yang dikerjakan:

1. **Kontrak tipe dibekukan** — `src/data/types.ts`.
2. **Katalog dua lapis (ADR-02)** — lapis penulisan `src/data/products.ts` (disunting owner) dan lapis turunan `src/data/catalog.ts` (dibaca seluruh aplikasi).
3. **Gerbang validasi build (FR-43, ADR-09)** — `src/data/validate.ts`, 15 aturan, nol dependensi baru, tidak bisa dilewati.
4. **Perakit metadata dan JSON-LD** — `src/lib/seo.ts`.
5. **Kontrak event GA4** — `src/lib/analytics.ts`, no-op tanpa measurement ID, aman saat SSG.
6. **`sitemap.xml` dan `robots.txt`** — `src/app/sitemap.ts`, `src/app/robots.ts`.
7. **Header keamanan dan konfigurasi gambar** — `next.config.ts`.
8. **Aturan ketergantungan sebagai lint rule** — `eslint.config.mjs`.
9. **Placeholder gambar produk** — 10 berkas SVG di `web/public/produk/`.
10. **Format tampilan angka** — `src/lib/format.ts`.

Nol dependensi runtime baru ditambahkan (ADR-14). `package.json` tetap berisi `next`, `react`, `react-dom`.

---

## 2. Berkas yang dibuat dan diubah

| Berkas | Status | Isi |
|---|---|---|
| `web/src/data/types.ts` | **baru** | Kontrak tipe Bagian 5 arsitektur — dibekukan |
| `web/src/data/products.ts` | diubah (aditif) | Lapis penulisan; tambahan medan K-01…K-08; `beanPrice()` dihapus (K-09) |
| `web/src/data/catalog.ts` | **baru** | Lapis turunan, seluruh query dan harga terhitung |
| `web/src/data/validate.ts` | **baru** | V-01…V-15, gerbang build |
| `web/src/lib/format.ts` | diubah | Ditambah format kg, kuantitas, harga per kg |
| `web/src/lib/seo.ts` | **baru** | Metadata per rute + JSON-LD |
| `web/src/lib/analytics.ts` | **baru** | 10 fungsi event GA4 bertipe |
| `web/src/app/sitemap.ts` | **baru** | 15 URL |
| `web/src/app/robots.ts` | **baru** | Sadar `VERCEL_ENV` |
| `web/next.config.ts` | diubah | CSP + 5 header keamanan + `images.formats` |
| `web/eslint.config.mjs` | diubah | Aturan ketergantungan Bagian 4.3 |
| `web/package.json` | diubah | Skrip `lint`, `typecheck`, `verify`. Dependensi tidak berubah |
| `web/public/produk/*.svg` | **baru** | 10 placeholder 800×1000 (4:5) |
| `web/public/produk/README.md` | **baru** | Cara mengganti placeholder dengan foto asli |

**Tidak disentuh** (milik FE): `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/components/**`, `src/features/**`, `src/lib/whatsapp/**`, `src/lib/reply-hours.ts`. Termasuk tombol WhatsApp `bg-gold` pada beranda yang gagal WCAG AA (kontras 3,88:1) — itu perbaikan milik FE, sengaja dibiarkan.

---

## 3. Kontrak beku yang wajib dipakai FE

Semua di bawah ini sudah ada di repositori dan sudah lulus build. FE cukup mengimpor.

### 3.1 Tipe — `@/data/types`

```ts
import type {
  PriceIDR, Tier, ProductCategory, HouseblendLineSlug, ProductStatus,
  OrderUnit, Variant, Origin, ProductImage, Product,
  CartItem, CartState, ResolvedCartLine, ResolvedCart,
  CartCatalogEntry, CartCatalogIndex,
} from "@/data/types";
```

`@/data/types` **boleh** diimpor dari mana saja, termasuk `components/` dan `lib/`, karena impor tipe dihapus saat kompilasi dan tidak menambah satu byte pun ke bundel klien. Yang dilarang adalah `@/data/catalog` dan `@/data/products`.

Bentuk lengkap tiap tipe ada di berkasnya, sudah berkomentar. Yang paling penting diingat:

- `Variant.unitPrice` = harga **satu satuan pesan**, bilangan bulat rupiah.
- `Variant.unit` = `"pack"` | `"paket"` | `"half-kg"`.
- Untuk houseblend, `unit === "half-kg"`, `unitPrice === pricePerKg / 2`, dan **kuantitas keranjang adalah `halfKgUnits`** — nilai 1 berarti 0,5 kg, nilai 5 berarti 2,5 kg (D-02, ADR-05).
- Subtotal baris **selalu** `qty * unitPrice`. Tidak ada cabang per kategori.

### 3.2 Katalog — `@/data/catalog`

> **HANYA dari Server Component.** Berkas dengan `"use client"` dilarang mengimpornya (aturan ketergantungan nomor 4, NFR-03). Client Component menerima data sebagai props.

**Data**

```ts
import {
  products,               // Product[] — 10 produk (7 single origin + 3 lini houseblend)
  singleOriginProducts,   // Product[] — 7
  houseblendProducts,     // Product[] — 3
  houseblendLines,        // Product[] — alias houseblendProducts, untuk /houseblend/[line]
  featuredSignature,      // Product[] — 4 origin Signature, untuk beranda
  catalogGroups,          // 3 kelompok siap render untuk /katalog
  cartCatalogIndex,       // CartCatalogIndex — dikirim sebagai props ke keranjang
} from "@/data/catalog";
```

**Fungsi**

```ts
findProductBySlug(slug: string): Product | undefined
findSingleOriginBySlug(slug: string): Product | undefined
findHouseblendLineBySlug(slug: string): Product | undefined
findVariant(product: Product, variantId: string): Variant | undefined
defaultVariant(product: Product): Variant          // varian termurah
productsByTier(tier: Tier): Product[]

priceFrom(product: Product): PriceIDR              // harga "mulai dari"
pricePerKgFrom(product: Product): PriceIDR | null  // null untuk single origin
halfKgPrice(pricePerKg: PriceIDR): PriceIDR        // D-02
bundleSaving(product: Product): PriceIDR | null    // BR-10, WAJIB dipakai
lineTotal(variant: Variant, qty: number): PriceIDR
halfKgUnitsToKg(halfKgUnits: number): number       // hanya untuk tampilan

categoryLabel(product: Product): string            // "Single Origin, Signature"
productHref(product: Product): string              // "/produk/abmisibil"
houseblendComposition(slug: HouseblendLineSlug): string
productPaths(): string[]
placeholderImagePath(slug: string): string         // "/produk/abmisibil.svg"
```

**Konstanta**

```ts
PRODUCT_IMAGE_ASPECT_RATIO  // "4 / 5"
PRODUCT_IMAGE_WIDTH         // 800
PRODUCT_IMAGE_HEIGHT        // 1000
HALF_KG_UNITS_PER_KG        // 2
TIER_LABEL                  // { signature: "Signature", reguler: "Reguler" }
```

Angka penghematan bundling **tidak boleh ditulis di konten**. Panggil `bundleSaving(product)`; hasilnya Rp25.000 untuk Signature dan Rp20.000 untuk Reguler, dihitung dari harga resmi (BR-10, D-01).

### 3.3 Format — `@/lib/format`

```ts
formatIDR(amount: number): string                     // 210000 -> "Rp210.000"
formatPricePerKg(pricePerKg: number): string          // 200000 -> "Rp200.000/kg"
formatKgFromHalfUnits(halfKgUnits: number): string    // 1 -> "0,5 kg" | 5 -> "2,5 kg"
formatQuantity(qty: number, unit: OrderUnit): string  // 2,"paket" -> "2 paket (3 pack)"
unitLabel(unit: OrderUnit): string                    // "per 0,5 kg"
formatNumber(value: number): string                   // 1900 -> "1.900"
```

`formatKgFromHalfUnits` adalah **satu-satunya** tempat pembagian dengan 2 boleh terjadi di sisi tampilan. Jangan menghitung kilogram di komponen.

### 3.4 Metadata dan JSON-LD — `@/lib/seo`

Isi metadata wewenang BE, berkas `page.tsx` milik FE. Protokolnya: FE menulis satu baris delegasi, lalu tidak pernah menyentuhnya lagi (Bagian 8.3 arsitektur).

**Halaman statis — satu baris:**

```ts
import { katalogMetadata } from "@/lib/seo";
export const metadata = katalogMetadata();
```

| Rute | Fungsi |
|---|---|
| `/` | `homeMetadata()` |
| `/katalog` | `katalogMetadata()` |
| `/houseblend` | `houseblendIndexMetadata()` |
| `/cerita-kami` | `ceritaKamiMetadata()` |
| `/kontak` | `kontakMetadata()` |
| `/keranjang` | `keranjangMetadata()` — sudah `robots: { index: false }` |
| `not-found.tsx` | `notFoundMetadata()` |

**Halaman berparameter — `/produk/[slug]` dan `/houseblend/[line]`:**

```ts
export async function generateMetadata({ params }: PageProps<"/produk/[slug]">) {
  const { slug } = await params;              // Next 16: params adalah Promise
  const product = findProductBySlug(slug);
  return product ? buildProductMetadata(product) : {};
}
```

`buildProductMetadata(product: Product): Metadata` melayani kedua rute; bentuk produknya sudah seragam.

**JSON-LD** — semuanya mengembalikan **string siap pakai**:

```ts
productJsonLd(product: Product): string
organizationJsonLd(): string
breadcrumbJsonLd(trail: Array<{ name: string; path: string }>): string
productBreadcrumbTrail(product: Product): BreadcrumbTrail   // jejak siap pakai
```

Pemakaian (satu-satunya `dangerouslySetInnerHTML` yang diizinkan, Bagian 12.2):

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: productJsonLd(product) }}
/>
```

`<` sudah di-escape menjadi `<` di dalam `safeJson()`, sehingga string data tidak bisa menutup tag `<script>` lebih awal.

**Builder umum** bila FE butuh halaman baru: `buildPageMetadata({ title, description, path, keywords?, noIndex?, image? })`.

### 3.5 Analitik — `@/lib/analytics`

```ts
trackViewItemList(itemListName: string): void
trackViewItem({ productId, itemCategory, itemVariant }): void
trackSelectVariant({ productId, variant }): void
trackAddToCart({ productId, itemVariant, quantity, value }): void
trackViewCart({ cartValue, cartItems }): void
trackWhatsAppOrder({ orderCode, cartValue, cartItems, sourcePage }): void
trackWhatsAppAsk({ productId, variant, sourcePage }): void
trackWhatsAppB2B({ line, sourcePage }): void
trackShopeeClick({ productId?, sourcePage }): void
trackException(description: string): void
```

Pendukung untuk `analytics-provider.tsx` milik FE:

```ts
GA_MEASUREMENT_ID: string        // process.env.NEXT_PUBLIC_GA_ID ?? ""
GA_CONFIG_PARAMS                 // anonymize_ip, allow_google_signals: false, dst.
ANALYTICS_OPTOUT_KEY             // "tak.analytics.optout"
isAnalyticsConfigured(): boolean
isAnalyticsEnabled(): boolean
isAnalyticsOptedOut(): boolean
setAnalyticsOptOut(optOut: boolean): void
loadGtag(): void                 // menyuntikkan gtag.js satu kali, aman dipanggil berulang
```

Jaminan berkas ini: **no-op** bila `NEXT_PUBLIC_GA_ID` kosong, **aman di server** (setiap fungsi memeriksa `typeof window` sehingga SSG tidak pernah crash), dan **tidak pernah melempar** (analitik tidak boleh merusak alur beli).

Komponen **tidak boleh** memanggil `gtag()` langsung. Butuh event baru? Minta ke BE.

### 3.6 Konstanta brand — `@/lib/site`

Tidak diubah. Tetap `site`, `whatsapp`, `instagram`, `shopee`, `socials`, `waLink(message?)`.

---

## 4. Data dan validasi

### 4.1 Dua lapis (ADR-02)

```
src/data/products.ts   ← LAPIS PENULISAN. Disunting owner. Satu-satunya tempat angka harga.
        ↓ (hanya catalog.ts yang boleh mengimpor ini — ditegakkan lint rule)
src/data/catalog.ts    ← LAPIS TURUNAN. Dibaca seluruh aplikasi.
```

Katalog Fase 1a: **10 produk** — 7 single origin (masing-masing 2 varian: 1 pack dan 3 pack) dan 3 lini houseblend (6 + 2 + 1 = 9 varian half-kg). Total 23 varian.

### 4.2 Aturan D-02 yang ditegakkan secara struktural

`pricePerKg` adalah **satu-satunya** angka harga houseblend yang tersimpan. Harga 0,5 kg tidak pernah ditulis sebagai data; ia dihitung `halfKgPrice(pricePerKg) = pricePerKg / 2` saat penyusunan varian. Kesembilan hasilnya sesuai tabel D-02:

| Varian | per kg (tersimpan) | per 0,5 kg (dihitung) |
|---|---|---|
| BOLD 70:30 | 210.000 | 105.000 |
| BOLD 60:40 | 200.000 | 100.000 |
| BOLD 50:50 | 195.000 | 97.500 |
| BOLD 40:60 | 190.000 | 95.000 |
| BOLD 30:70 | 185.000 | 92.500 |
| BOLD 20:80 | 175.000 | 87.500 |
| BRIGHT Signature | 260.000 | 130.000 |
| BRIGHT Reguler | 230.000 | 115.000 |
| Full Robusta | 175.000 | 87.500 |

Kuantitas houseblend disimpan sebagai bilangan bulat `halfKgUnits`. Konversi ke kilogram hanya terjadi saat menampilkan. Tidak ada aritmetika pecahan pada uang di mana pun di basis kode.

### 4.3 Gerbang validasi build (FR-43, ADR-09)

`assertCatalogValid(products)` dipanggil **di lingkup modul** `src/data/catalog.ts`. Setiap rute statis mengimpor `catalog.ts`, jadi modul itu pasti dievaluasi saat `next build` dan `throw`-nya menghentikan build. Tidak ada jalur build yang bisa melewatinya. Nol dependensi: tidak ada Zod, tidak ada Ajv, tidak ada skrip prebuild.

| # | Pemeriksaan | Sumber |
|---|---|---|
| V-01 | Slug unik di seluruh katalog | FR-09, FR-43 |
| V-02 | Slug cocok `^[a-z0-9]+(-[a-z0-9]+)*$` | FR-09 |
| V-03 | Setiap produk punya ≥ 1 varian; `name`, `summary`, `description`, `status` terisi | BR-04 |
| V-04 | `unitPrice`, `pricePerKg`, `minQty`, `step` bilangan bulat > 0; `pricePerKg` hanya pada varian half-kg | BR-03, BR-04 |
| V-05 | `pricePerKg % 1000 === 0` untuk seluruh varian half-kg | D-02, ADR-05 |
| V-06 | `unitPrice === pricePerKg / 2` untuk seluruh varian half-kg | D-02 |
| V-07 | `tier` dan `origin` hanya pada single origin | BR-15 |
| V-08 | `line` hanya pada houseblend; houseblend tidak boleh punya `origin` | BR-15 |
| V-09 | `tier` dan `category` bernilai yang dikenal | FR-43 |
| V-10 | Setiap single origin punya tepat satu varian `pack` (`packsPerUnit` 1) dan satu `paket` (`packsPerUnit` 3) | BR-08, D-01 |
| V-11 | Harga single origin seragam untuk seluruh biji ber-tier sama | BR-09 |
| V-12 | `bundleSaving()` positif untuk setiap single origin | BR-10 |
| V-13 | `id` varian unik dalam satu produk | FR-43 |
| V-14 | Bila `image !== null`, `alt` tidak kosong dan bukan sekadar nama produk | NFR-07 |
| V-15 | Pagar hitungan: 7 single origin, 3 lini, 9 varian houseblend | BRD Bagian 12 |

Validator mengumpulkan **seluruh** pelanggaran lalu melempar satu Error berisi daftar bernomor, supaya owner bisa memperbaiki semuanya dalam satu kali sunting.

**Bukti gerbang berfungsi.** Data sengaja dirusak (slug `kerinci` diganti menjadi `abmisibil`, dan `pricePerKg` BOLD 50:50 diubah menjadi `195_001`), lalu `npm run build` dijalankan. Keluarannya:

```
Error: Failed to collect configuration for /sitemap.xml
  [cause]: Error:
  ==================================================================
   VALIDASI KATALOG GAGAL (FR-43) — build dihentikan.
   Ditemukan 3 masalah pada data produk.
   Perbaiki di web/src/data/products.ts lalu build ulang.
   Panduan lengkap: docs/05-backend.md
  ==================================================================
   1. [V-01] abmisibil: slug ganda di dalam katalog.
   2. [V-04] bold: varian "bold-50-50" punya `unitPrice` = 97500.5. Harga wajib
      bilangan bulat rupiah lebih besar dari nol (BR-03).
   3. [V-05] bold: varian "bold-50-50" punya `pricePerKg` = 195001 yang tidak habis
      dibagi 1.000. Harga per kg wajib kelipatan Rp1.000 supaya harga 0,5 kg pasti
      bilangan bulat (D-02, ADR-05).
  ==================================================================
```

Data langsung dipulihkan dan build hijau kembali. QA dapat mengulang uji ini sebagai test case FR-43.

### 4.4 Panduan owner: mengubah katalog (FR-42)

Semua perubahan dilakukan di **satu berkas**: `web/src/data/products.ts`.

**Mengubah harga houseblend.** Cari baris `pricePerKg:` pada rasio atau varian yang dimaksud, ganti angkanya. Tulis angka polos tanpa "Rp" dan tanpa titik desimal; garis bawah sebagai pemisah ribuan boleh (`210_000` sama dengan `210000`). Harga per 0,5 kg ikut berubah sendiri — **jangan mencarinya, angka itu tidak ada di berkas mana pun**. Harga per kg wajib kelipatan Rp1.000; kalau tidak, build gagal dengan pesan V-05.

**Mengubah harga single origin.** Harga ditentukan **tier**, bukan biji. Ubah di `singleOriginPricing`: `signature` atau `reguler`, medan `pack1` atau `pack3`. Satu perubahan berlaku untuk semua biji di tier itu. Harga `pack3` wajib lebih murah dari 3 × `pack1`, kalau tidak build gagal dengan pesan V-12.

**Menambah single origin baru.** Salin satu blok di `singleOriginBeans`, lalu isi: `id` dan `slug` (huruf kecil dan tanda hubung saja), `name`, `tier`, `origin` (desa/lokasi atau `null`), `region` (tanpa provinsi), `province`, `process`, `altitudeMasl`, `varietals`, `tastingNotes`, `image: null`, `status: "available"`, `searchTerms`. **Isi `null` untuk apa pun yang tidak Anda ketahui pasti — jangan menebak** (FR-07). Lalu naikkan `EXPECTED_SINGLE_ORIGIN_COUNT` di `src/data/validate.ts` dari 7 ke 8, kalau tidak build gagal dengan pesan V-15. Pagar itu memang disengaja: ia menangkap penghapusan produk yang tidak sengaja.

**Menonaktifkan produk.** Ubah `status: "available"` menjadi `status: "out-of-stock"`. Penanda visualnya baru tayang di Fase 1b (FR-14), tetapi medannya sudah aman diisi sekarang.

**Mengganti foto.** Ikuti `web/public/produk/README.md`.

Setelah menyimpan, Vercel membangun ulang otomatis. Bila ada kesalahan ketik, **build gagal dan situs lama tetap tayang** — harga salah tidak pernah sampai ke publik. Baca pesan galat di notifikasi Vercel: nomor `[V-xx]` dan nama produk selalu disebutkan.

---

## 5. SEO

| Elemen | Implementasi |
|---|---|
| Judul unik per rute (FR-44) | 7 builder halaman statis + `buildProductMetadata()` untuk 10 halaman produk |
| Deskripsi memuat daerah asal | `product.summary` dirakit dari `origin` di `catalog.ts`, mis. "Abmisibil — single origin Signature dari Pegunungan Bintang, Papua. proses Natural Anaerob, 1900 MASL, Arabica Bourbon & Typica. Kemasan 200 gr." |
| Canonical (FR-45) | `alternates.canonical` berupa path relatif di setiap builder; `metadataBase` di `layout.tsx` mengubahnya jadi absolut ke `https://titikasalkopi.id` |
| Open Graph + Twitter Card (FR-46) | Dirakit `buildPageMetadata()`; `twitter.card = "summary_large_image"` di seluruh halaman |
| `sitemap.xml` (FR-45) | 15 URL, terverifikasi pada keluaran build. `/keranjang` **tidak** masuk |
| `robots.txt` (FR-45) | Produksi: `allow: /`, `disallow: /keranjang`, plus `sitemap` dan `host`. Non-produksi: `disallow: /` penuh, supaya URL preview tidak bersaing dengan domain asli |
| JSON-LD (FR-49, ditarik ke 1a) | `Product` + `Offer`, `Organization`, `BreadcrumbList` |

Contoh judul yang dihasilkan, cocok dengan tabel Bagian 10.1 arsitektur:

| Rute | Title |
|---|---|
| `/produk/abmisibil` | Abmisibil — Kopi Papua, Pegunungan Bintang |
| `/produk/oelbiteno` | Oelbiteno — Kopi NTT, Kupang |
| `/produk/pondok-baru` | Pondok Baru — Kopi Aceh, Bener Meriah |
| `/houseblend/bold` | Houseblend BOLD — 6 Rasio Arabica:Robusta per Kg |
| `/katalog` | Katalog Kopi — Single Origin & Houseblend per Kg |

**`LocalBusiness` sengaja tidak dibangun**, mengikuti Bagian 10.4 arsitektur: skema itu mensyaratkan alamat fisik yang bisa dikunjungi, dan brand brief tidak memuat alamat roastery. Menerbitkannya tanpa alamat menghasilkan structured data tidak valid; menerbitkannya dengan alamat karangan melanggar FR-07. Beranda memakai `Organization`. `LocalBusiness` masuk backlog dengan syarat pelunasan: owner menyediakan alamat resmi yang bersedia ditampilkan publik.

---

## 6. Tabel event GA4 (FR-47, Bagian 13.1)

| Event | Fungsi | Dipicu di | Parameter yang dikirim | KPI |
|---|---|---|---|---|
| `view_item_list` | `trackViewItemList` | `/katalog` saat dibuka | `item_list_name` | G-03 |
| `view_item` | `trackViewItem` | `/produk/[slug]`, `/houseblend/[line]` | `product_id`, `item_category`, `item_variant` | **G-03** |
| `select_variant` | `trackSelectVariant` | `VariantPicker`, `RatioTable` | `product_id`, `variant` | G-08 |
| `add_to_cart` | `trackAddToCart` | `AddToCartButton` | `product_id`, `item_variant`, `quantity`, `value`, `currency` | **G-08** |
| `view_cart` | `trackViewCart` | `/keranjang` | `cart_value`, `cart_items`, `currency` | G-03 |
| `click_whatsapp_order` | `trackWhatsAppOrder` | Tombol pesan di keranjang | `order_code`, `cart_value`, `cart_items`, `source_page`, `currency` | **G-01, G-03, G-04** — **tandai KONVERSI di GA4** |
| `click_whatsapp_ask` | `trackWhatsAppAsk` | "Tanya produk ini" (FR-38) | `product_id`, `variant`, `source_page` | **G-01, G-03** |
| `click_whatsapp_b2b` | `trackWhatsAppB2B` | CTA kedai (Fase 1b) | `line`, `source_page` | **G-01, G-07** |
| `click_shopee` | `trackShopeeClick` | Tautan Shopee mana pun (FR-25) | `product_id` (opsional), `source_page` | Pembanding kanal |
| `exception` | `trackException` | Penangkap galat global | `description` (dipotong 300 karakter), `fatal: false` | Kesehatan teknis |

Tiga aturan pemasangan yang tidak boleh dilanggar:

1. **Event klik dikirim sebelum navigasi**, tanpa `await`. Setelah WhatsApp atau Shopee mengambil alih, halaman bisa dibekukan dan event tertunda hilang.
2. **`source_page` selalu diisi `pathname`**, bukan `document.referrer`.
3. **`click_whatsapp_order` ditandai sebagai konversi di antarmuka GA4** — pekerjaan konfigurasi, bukan kode; masuk daftar periksa rilis.

Privasi (NFR-16, Bagian 12.5): `GA_CONFIG_PARAMS` mengunci `anonymize_ip: true`, `allow_google_signals: false`, `allow_ad_personalization_signals: false`. Tidak ada parameter event yang boleh memuat data yang dapat mengidentifikasi orang. `order_code` bukan data pribadi. Tautan "matikan analitik" memakai `setAnalyticsOptOut(true)`; `loadGtag()` menghormatinya dan tidak memuat skrip apa pun.

---

## 7. Keamanan dan konfigurasi build

`next.config.ts` memasang, untuk seluruh path:

| Header | Nilai |
|---|---|
| `Content-Security-Policy` | CSP statis tanpa nonce (ADR-13) — `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `form-action 'self'`, `script-src` mengizinkan `'unsafe-inline'` dan `googletagmanager.com`, `connect-src` mengizinkan domain Google Analytics, `upgrade-insecure-requests` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` (berdampingan dengan `frame-ancestors` untuk peramban lama) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` — **hanya bila `VERCEL_ENV === "production"`**, supaya localhost dan preview tidak terkunci |

Ditambah `poweredByHeader: false` dan `images.formats = ["image/avif", "image/webp"]` tanpa `remotePatterns` (seluruh gambar dari repositori, ADR-06).

`'unsafe-inline'` pada `script-src` adalah **utang teknis yang diambil sadar** (UT-03): menghapusnya menuntut nonce per-request lewat middleware, yang membatalkan sifat statis seluruh situs (ADR-01). Syarat pelunasan: begitu situs menampilkan konten dari luar repositori atau menerima input yang dipersistensikan.

---

## 8. Aturan ketergantungan sebagai lint rule

`eslint.config.mjs` menegakkan Bagian 4.3 arsitektur:

1. `src/components/**` dan `src/lib/**` dilarang mengimpor `@/data/catalog`, `@/data/products`, dan `@/features/*`.
2. Seluruh berkas kecuali `src/data/catalog.ts` dan `src/data/validate.ts` dilarang mengimpor `@/data/products` — ini yang menjaga ADR-02 tetap berlaku.

**Dua penyimpangan yang disengaja dari potongan kode di dokumen arsitektur, keduanya dicatat di komentar berkasnya:**

- **`@/data/types` tidak ikut dilarang** di `components/` dan `lib/`. Tipe dihapus saat kompilasi sehingga nol byte masuk bundel klien; melarangnya hanya akan memaksa penyalinan tipe, yang justru memecah kontrak Bagian 5.2. Yang dilarang adalah modul yang membawa **data**. Konsekuensinya `lib/seo.ts` dan `lib/format.ts` mengimpor tipe saja dan tetap bersih dari katalog — `productJsonLd()` tidak membutuhkan `priceFrom()` seperti pada contoh Bagian 10.4, karena ia memetakan `product.variants` langsung.
- **`src/app/page.tsx` untuk sementara dikecualikan** dari aturan nomor 2. Kerangka beranda bawaan masih membaca `@/data/products` langsung, dan berkas itu milik FE — BE tidak menyuntingnya. Barisnya sudah ditandai `SEMENTARA` beserta instruksi: **hapus pengecualian itu setelah `src/app/page.tsx` pindah ke `@/data/catalog`** pada commit kerangka hari pertama.

Aturan nomor 4 arsitektur (`"use client"` dilarang mengimpor `@/data/*`) tidak bisa ditegakkan ESLint dengan mudah karena bergantung pada direktif. Penegakannya lewat tinjauan kode dan pemeriksaan `First Load JS` pada daftar periksa rilis.

---

## 9. Environment variables untuk deployment

| Nama | Lingkungan | Wajib | Isi | Dipakai di |
|---|---|---|---|---|
| `NEXT_PUBLIC_GA_ID` | **Production saja** | Ya untuk FR-47 | `G-XXXXXXXXXX` dari akun GA4 brand | `src/lib/analytics.ts`, dibaca `features/analytics/analytics-provider.tsx` |
| `GOOGLE_SITE_VERIFICATION` | **Production saja** | Ya untuk FR-48 | Token verifikasi Google Search Console | `src/app/layout.tsx` (milik FE) |
| `VERCEL_ENV` | Otomatis dari Vercel | — | `production` / `preview` / `development` | `src/app/robots.ts`, `next.config.ts` |

Tiga variabel, tidak satu pun rahasia yang bernilai dicuri — konsekuensi langsung dari tidak adanya server dan tidak adanya integrasi pihak ketiga yang menulis data.

`NEXT_PUBLIC_SITE_URL` **sengaja tidak dipakai**: URL kanonis harus selalu menunjuk `https://titikasalkopi.id` bahkan dari preview, supaya tidak ada URL preview yang mengklaim dirinya kanonis. Karena itu ia konstanta repositori di `src/lib/site.ts`.

Konstanta brand — nama, domain, nomor WhatsApp, tautan Instagram dan Shopee — tetap di `src/lib/site.ts`, bukan env var, karena ia data yang berversi dan dapat ditinjau di PR.

---

## 10. Gambar produk

10 placeholder SVG di `web/public/produk/`, dinamai sesuai slug: `oelbiteno`, `abmisibil`, `sabin`, `pyramid`, `palimping`, `kerinci`, `pondok-baru`, `bold`, `bright`, `full-robusta`.

- **Bukan foto.** Ini bentuk geometris bergaya brand memakai palet resmi saja. Tidak ada foto yang dikarang.
- Ukuran `800 × 1000` px, rasio **4:5**, sama dengan rasio foto asli nanti, sehingga penggantian tidak menggeser layout (NFR-02).
- Ukuran berkas ±1,4 KB masing-masing.
- Path dibaca lewat `placeholderImagePath(slug)`.

`Product.image` **tetap `null`** untuk seluruh produk. Itu keadaan yang sah dan lolos validator (R-13: foto tidak menahan rilis). FE boleh memakai `<ProductPlaceholder />` SVG inline miliknya, atau merujuk berkas di folder ini — keduanya menempati ruang yang sama persis. Cara mengganti dengan foto asli ada di `web/public/produk/README.md`.

---

## 11. Yang sengaja TIDAK dibangun

| Hal | Alasan |
|---|---|
| `src/app/api/**`, Server Action, endpoint inquiry B2B | ADR-07, O-19, NFR-16. Seluruh inquiry lewat deeplink WhatsApp |
| Basis data, KV store, penyimpanan sesi | ADR-03. Order Inquiry hidup di `localStorage` dan berakhir di sana |
| Middleware, `/api/revalidate`, ISR | ADR-01, ADR-08, ADR-13 |
| Zod / Ajv / skrip prebuild | ADR-09. 15 pemeriksaan tulis tangan lebih murah dan tidak bisa dilewati |
| Dependensi runtime baru | ADR-14. `package.json` tetap tiga dependensi |
| `LocalBusiness` JSON-LD | Bagian 10.4: tidak ada alamat fisik. Menerbitkannya berarti mengarang |
| OG image dinamis (`ImageResponse`) | Bagian 10.5. Ditolak untuk Fase 1a |
| `src/lib/catalog.ts` | Lapis turunan berada di **`src/data/catalog.ts`** sesuai Bagian 4.1 dan peta kepemilikan Bagian 8.3. Menaruhnya di `lib/` akan melanggar aturan ketergantungan nomor 1 yang ditulis BE sendiri |
| Uji unit | Bagian 15 arsitektur menempatkannya sebagai pelengkap, bukan gerbang. Gerbangnya adalah `assertCatalogValid()` yang berjalan pada build Vercel |

**Celah yang perlu diketahui sebelum rilis:**

1. **`src/app/opengraph-image.png` belum ada.** Peta kepemilikan menempatkannya pada BE, tetapi ia aset desain 1200×630 bergaya brand — bukan sesuatu yang boleh dikarang secara terprogram tanpa mengarang identitas visual. Perlu dibuat desainer atau owner, lalu ditaruh di `src/app/opengraph-image.png`. Sampai itu ada, halaman tanpa foto produk tidak punya gambar pratinjau saat dibagikan (FR-46 belum penuh). Ini yang paling mendesak dari daftar ini.
2. **`searchTerms` belum disetujui owner** (CA-04). Isinya konservatif dan seluruhnya geografis (mis. "kopi Gayo", "kopi Papua", "kopi Kerinci") — tidak satu pun mengklaim atribut origin yang tidak ada di brand brief. Tetap perlu satu kali tinjauan owner sebelum rilis.
3. **`province` Palimping diisi "Jawa Barat".** Brand brief hanya menulis "Desa Palimping, Garut". Provinsi diisi karena `buildProductMetadata()` merakit judul dari `province` dan Garut memang berada di Jawa Barat — fakta geografis, bukan atribut kopi. Bila owner ingin format lain, ubah medannya, bukan builder-nya.
4. **`src/app/page.tsx` masih dikecualikan dari lint rule ADR-02** (lihat Bagian 8). Pengecualian itu wajib dihapus setelah FE memindahkan beranda ke `@/data/catalog`.
5. **Pesan galat validator tampil sebagai stack trace build Vercel**, bukan keluaran berformat rapi. Diterima karena pembacanya developer atau BA yang mendampingi owner (BA-06).

---

## 12. Daftar periksa serah terima ke FE

- [x] `src/data/types.ts` ada dan dibekukan — FE boleh mengimpor tipe untuk props.
- [x] `src/data/catalog.ts` ada, 10 produk tersusun, seluruh fungsi query siap.
- [x] `src/lib/seo.ts` ada — setiap `page.tsx` cukup satu baris delegasi.
- [x] `src/lib/analytics.ts` ada — 10 fungsi bertipe, no-op tanpa GA ID, aman saat SSG.
- [x] `src/lib/format.ts` ada — `formatIDR`, `formatKgFromHalfUnits`, `formatQuantity`.
- [x] `sitemap.ts` dan `robots.ts` ada dan terverifikasi pada keluaran build.
- [x] `next.config.ts` memasang CSP dan header keamanan.
- [x] `eslint.config.mjs` menegakkan aturan ketergantungan.
- [x] Placeholder gambar 4:5 tersedia untuk 10 produk.
- [x] `npx tsc --noEmit`, `npx eslint .`, dan `npm run build` lulus.
- [ ] **Milik FE**: 16 `page.tsx` beserta baris delegasi metadata, `layout.tsx` (tambahkan `verification.google`), `not-found.tsx`, komponen, keranjang, generator pesan WhatsApp, `reply-hours.ts`.
- [ ] **Milik FE**: perbaiki kontras tombol WhatsApp `bg-gold` pada beranda (3,88:1, gagal WCAG AA).
- [ ] **Milik owner/desainer**: `src/app/opengraph-image.png` dan foto produk.
