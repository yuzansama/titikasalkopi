# 04 — Dokumen Frontend
## Titik Asal Kopi — Website titikasalkopi.id (Fase 1a)

---

## 0. Kendali Dokumen

| Atribut | Isi |
|---|---|
| Judul | Dokumen Frontend — Website titikasalkopi.id Fase 1a |
| Versi | 1.0 |
| Tanggal | 7 September 2026 |
| Penulis | FE Developer |
| Status | 16 rute tayang, build hijau |
| Dokumen sumber | `docs/00-brand-brief.md`, `docs/00b-ceo-decisions.md`, `docs/02-BRD.md` (v1.1), `docs/03-architecture.md`, `docs/05-backend.md` |
| Basis kode | `web/` — Next.js 16.3.4 (App Router), React 19.2.8, TypeScript 5, Tailwind CSS v4 |

**Status verifikasi terakhir** (dijalankan di `web/`):

| Perintah | Hasil |
|---|---|
| `npx tsc --noEmit` | **lulus**, tanpa keluaran |
| `npx eslint .` | **lulus**, tanpa keluaran |
| `npm run build` | **lulus** — 16 rute HTML + `robots.txt` + `sitemap.xml`, seluruhnya statis |
| `node scripts/check-cart.mjs` | **31 lulus, 0 gagal** |
| `node scripts/check-whatsapp.mjs` | **21 lulus, 0 gagal** |
| `node scripts/check-reply-hours.mjs` | **12 lulus, 0 gagal** |

Nol dependensi runtime baru ditambahkan (ADR-14). `package.json` tetap berisi `next`, `react`, `react-dom` dan tidak disentuh.

---

## 1. Status rute terhadap peta Bagian 3.2 arsitektur

Keluaran `next build` memperlihatkan `○ (Static)` untuk seluruh rute tetap dan `● (SSG)` untuk kedua rute berparameter — tidak ada satu pun yang muncul sebagai `ƒ (Dynamic)`, yaitu syarat penerimaan pada Bagian 3.3.

| # | Path | Status | Berkas | Catatan |
|---|---|---|---|---|
| 1 | `/` | **Selesai** | `app/page.tsx` | `homeMetadata()`, JSON-LD `Organization`. Tombol WhatsApp `bg-gold` yang gagal AA sudah diganti `bg-rust` |
| 2 | `/katalog` | **Selesai** | `app/katalog/page.tsx` | `katalogMetadata()`, `BreadcrumbList`, event `view_item_list` |
| 3–9 | `/produk/[slug]` × 7 | **Selesai** | `app/produk/[slug]/page.tsx` | `generateStaticParams` + `dynamicParams = false`; 7 path terbangun: `oelbiteno`, `abmisibil`, `sabin`, `pyramid`, `palimping`, `kerinci`, `pondok-baru` |
| 10 | `/houseblend` | **Selesai** | `app/houseblend/page.tsx` | Tiga lini + tabel gabungan sembilan varian (FR-27, FR-28) |
| 11–13 | `/houseblend/[line]` × 3 | **Selesai** | `app/houseblend/[line]/page.tsx` | 3 path terbangun: `bold`, `bright`, `full-robusta` |
| 14 | `/cerita-kami` | **Selesai** | `app/cerita-kami/page.tsx` | Isi dibatasi fakta brief; satu `TODO(copy)` (Bagian 8) |
| 15 | `/kontak` | **Selesai** | `app/kontak/page.tsx` | Kanal resmi, jam balas D-03, blok 4 langkah |
| 16 | `/keranjang` | **Selesai** | `app/keranjang/page.tsx` | Terverifikasi `<meta name="robots" content="noindex, follow">` pada HTML hasil build |
| — | `not-found.tsx` | **Selesai** | `app/not-found.tsx` | `notFoundMetadata()`, noindex |
| — | `layout.tsx` | **Selesai** | `app/layout.tsx` | Font, provider, header, footer, `verification.google` (FR-48) |

Seluruh `page.tsx` menyatakan `export const dynamic = "error"`; kedua rute berparameter menambahkan `export const dynamicParams = false` (ADR-01).

**Baris delegasi metadata.** Sesuai protokol titik singgung nomor 1 (Bagian 8.3 arsitektur), setiap halaman menulis satu baris dan tidak pernah menyentuh isinya lagi:

```ts
export const metadata = katalogMetadata();          // halaman statis
// atau, untuk rute berparameter:
export async function generateMetadata({ params }: PageProps<"/produk/[slug]">) {
  const { slug } = await params;
  const product = findSingleOriginBySlug(slug);
  return product ? buildProductMetadata(product) : {};
}
```

Judul yang benar-benar terbit, dibaca dari HTML hasil build:

| Rute | `<title>` |
|---|---|
| `/produk/abmisibil` | `Abmisibil — Kopi Papua, Pegunungan Bintang \| Titik Asal Kopi` |
| `/houseblend/bold` | `Houseblend BOLD — 6 Rasio Arabica:Robusta per Kg \| Titik Asal Kopi` |
| `/keranjang` | `Keranjang \| Titik Asal Kopi` |

---

## 2. Inventaris komponen

Kolom "Sisi" menyatakan apakah berkas membawa direktif `"use client"`.

### 2.1 `src/components/` — presentasional, bebas domain

| Berkas | Sisi | Isi |
|---|---|---|
| `ui/styles.ts` | server | `buttonClass()`, `FOCUS_RING`, `FOCUS_RING_INVERSE`, `CARD`. Sumber tunggal aturan kontras tombol |
| `ui/container.tsx` | server | `Container`, `SectionHeading` |
| `ui/qty-stepper.tsx` | **client** | Stepper generik; nilai selalu bilangan bulat satuan pesan |
| `icons/icons.tsx` | server | Lima ikon SVG inline: WhatsApp, Instagram, Shopee, keranjang, panah |
| `layout/site-header.tsx` | server | Header + navigasi; menerima `cartSlot` sebagai prop |
| `layout/site-footer.tsx` | server | Kanal resmi (FR-35); menerima `replyHoursSlot` sebagai prop |
| `layout/sticky-whatsapp.tsx` | server | Tombol WhatsApp melayang di layar sempit (FR-37) |

`components/` tidak mengimpor `features/` maupun `data/` sama sekali — ditegakkan lint rule. Karena itu badge keranjang dan status jam balas dikirim ke header/footer sebagai **prop**, bukan diimpor; `layout.tsx` yang merakitnya.

### 2.2 `src/features/catalog/`

| Berkas | Sisi | Isi |
|---|---|---|
| `product-media.tsx` | server | Bingkai 4:5 + `next/image`; placeholder SVG bila `image === null` |
| `product-card.tsx` | server | Kartu katalog (FR-02, FR-03, FR-12) |
| `product-grid.tsx` | server | Grid 2/3/4 kolom; `priority` maksimal dua kartu pertama |
| `product-detail.tsx` | server | Halaman detail lengkap: remah roti, fakta origin, penghematan bundling, panel pembelian |
| `related-products.tsx` | server | Penutup halaman detail: origin/lini lain lewat `relatedProducts()`, memakai ulang `ProductGrid` (nol JS tambahan) |
| `purchase-panel.tsx` | **client** | Induk state varian + jumlah (lihat penyimpangan ADR-10 di Bagian 6) |
| `variant-picker.tsx` | **client** | Radio chip; harga reaktif (FR-11); varian terpilih tidak mengulang harga satuan pack, `notes` membawa penghematan 3 pack (BR-10) |
| `ratio-table.tsx` | **client** | Tabel rasio yang barisnya dapat dipilih (FR-28, FR-29) |
| `kg-configurator.tsx` | **client** | Stepper 0,5 kg + `parseKgToHalfUnits()` (FR-21, D-02) |
| `add-to-cart-button.tsx` | **client** | Dispatch `ADD_ITEM` + event `add_to_cart` (FR-16) |
| `variant-option.ts` | tipe | `VariantOption` = bentuk varian yang boleh menyeberang ke sisi klien |

### 2.3 `src/features/cart/`

| Berkas | Sisi | Isi |
|---|---|---|
| `cart-types.ts` | tipe | Meneruskan tipe beku dari `@/data/types` |
| `cart-reducer.ts` | **murni** | `cartReducer`, `EMPTY_CART`, `lineKey`, `MAX_NOTE_LENGTH` 200, `MAX_QTY_PER_LINE` 99, `MAX_LINES` 30 |
| `cart-storage.ts` | **murni + DOM** | `parseStoredCart()` (murni, dapat diuji), `readCart`, `writeCart`, `clearCart` |
| `cart-selectors.ts` | **murni** | `resolveCart()`, `catalogValidKeys()` |
| `cart-provider.tsx` | **client** | Context + `useReducer`, hydration, sinkronisasi antartab |
| `cart-badge.tsx` | **client** | Indikator jumlah di header (FR-17) |
| `cart-view.tsx` | **client** | Isi halaman keranjang (FR-18…FR-26) |
| `cart-note-field.tsx` | **client** | Catatan 200 karakter (FR-23) |

### 2.4 `src/features/whatsapp/`, `contact/`, `analytics/`

| Berkas | Sisi | Isi |
|---|---|---|
| `whatsapp/whatsapp-order-button.tsx` | **client** | Kode order, event, `window.open`, kunci 2 detik (FR-22, FR-24) |
| `whatsapp/ask-about-product-button.tsx` | **client** | "Tanya produk ini" (FR-38); tetap `<a>` asli |
| `contact/reply-hours-status.tsx` | **client** | Status jam balas (D-03, ADR-08) |
| `contact/order-steps.tsx` | server | Blok "Cara pesan dalam 4 langkah" (FR-26) |
| `contact/shopee-link.tsx` | **client** | Tautan Shopee + event `click_shopee` (FR-25) |
| `analytics/analytics-provider.tsx` | **client** | Pemuat `gtag.js` tertunda (ADR-12) |
| `analytics/view-event.tsx` | **client** | `view_item_list` dan `view_item` (FR-47) |

### 2.5 `src/lib/` milik FE

| Berkas | Isi |
|---|---|
| `reply-hours.ts` | `wibHour`, `isWithinReplyHours`, `REPLY_HOURS`, `REPLY_HOURS_LABEL`, `OUTSIDE_REPLY_HOURS_MESSAGE` |
| `whatsapp/message.ts` | `buildOrderMessage`, `buildAskMessage`, `buildB2BMessage`, `WA_MAX_ENCODED_LENGTH` |
| `whatsapp/order-code.ts` | `createOrderCode`, `ORDER_CODE_PATTERN` |
| `whatsapp/sanitize.ts` | `sanitizeNote`, `DEFAULT_NOTE_LENGTH` |
| `whatsapp/types.ts` | `OrderInquiryPayload`, `AskInquiryPayload`, `B2BInquiryPayload`, `WhatsAppMessage` |

---

## 3. Desain keranjang sebagaimana dibangun

### 3.1 Yang disimpan dan yang tidak

Kunci `localStorage`: **`tak.cart.v1`**, dengan `SCHEMA_VERSION = 1` ikut tertulis di dalam nilainya.

```jsonc
{ "v": 1, "items": [{ "slug": "abmisibil", "variantId": "abmisibil-pack3", "qty": 1 }],
  "note": "", "updatedAt": 1757232000000 }
```

Yang **tidak** disimpan: harga, nama produk, label varian. Ketiganya di-resolve ulang saat render dari `cartCatalogIndex` build-time yang dikirim halaman `/keranjang` sebagai props (ADR-04). Inilah yang membuat NFR-12 berlaku 100%: keranjang berumur enam hari tetap menampilkan harga terbaru.

Kuantitas houseblend adalah bilangan bulat `halfKgUnits` — 1 berarti 0,5 kg, 10 berarti 5 kg. Subtotal baris selalu `qty * unitPrice`, perkalian dua bilangan bulat, tanpa cabang per kategori. Tidak ada `toFixed`, tidak ada pecahan uang di mana pun (ADR-05, BR-03).

### 3.2 Penanganan data tidak normal

Seluruhnya diuji oleh `scripts/check-cart.mjs`.

| Kondisi | Perilaku | Diuji |
|---|---|---|
| `localStorage` diblokir (Safari private) | Keranjang bekerja di memori, tanpa galat yang terlihat | manual |
| JSON rusak / terpotong | Kunci dihapus, keranjang kosong, **tidak melempar** | ya |
| `v` bukan 1 (lebih tua maupun lebih baru) | Kunci dihapus, keranjang kosong | ya |
| Lewat 7 hari sejak `updatedAt` | Kunci dihapus (FR-20) | ya |
| Item bentuknya salah (`qty` pecahan, `slug` bukan string, `qty` 0, `null`) | Item itu dibuang, sisanya dipertahankan | ya |
| Slug atau `variantId` tidak ada lagi di katalog | Baris dibuang, `droppedCount` naik, pengunjung diberi tahu satu kali | ya |
| Kuota penyimpanan penuh | Penulisan gagal diam-diam; sesi berjalan tetap normal | manual |

Dua lapis membuang baris basi: `PRUNE` saat hydration (memakai `validKeys` yang diturunkan dari katalog di `layout.tsx`) dan `resolveCart()` saat render (memakai indeks penuh di `/keranjang`). Keduanya diuji.

### 3.3 Pencegahan hydration mismatch

Empat aturan Bagian 6.4 dipatuhi tanpa pengecualian:

1. `localStorage` tidak pernah dibaca saat render, termasuk di inisialisasi `useReducer`. Pembacaan hanya di `useEffect`.
2. Render pertama klien identik dengan HTML server: `EMPTY_CART` dengan `hydrated: false`.
3. Setiap komponen yang menampilkan angka keranjang menghormati `hydrated`. `CartBadge` memesan ruang badge dan hanya mengubah `visibility` (CLS nol). `CartView` menampilkan "Memuat keranjang…" sebelum hydration — **bukan** "keranjang kosong", supaya pengunjung tidak sempat melihat keadaan yang salah.
4. Tidak ada `suppressHydrationWarning` di seluruh basis kode.

Sinkronisasi antartab dipasang lewat event `storage`, sehingga dua tab terbuka tidak saling menimpa.

---

## 4. Generator pesan WhatsApp sebagaimana dibangun

### 4.1 Bentuk

`src/lib/whatsapp/message.ts` — fungsi murni, tanpa `window`, tanpa `Date.now()` implisit, tanpa state React. Waktu dan sumber keacakan disuntikkan lewat parameter (ADR-11), sehingga seluruh keluarannya deterministik saat diuji.

Lima blok yang **tidak pernah** dibuang pada tingkat peringkasan mana pun: salam, kode order, subtotal, pernyataan ongkir, penanda sumber. Diuji.

### 4.2 Kode order

`TAK-YYMMDD-XXXX`. Alfabet sufiks `ABCDEFGHJKMNPQRSTUVWXYZ23456789` — 31 karakter, sengaja tanpa `0`, `O`, `1`, `I`, `L` karena kode ini disalin tangan owner ke buku order. `YYMMDD` memakai tanggal **lokal pembeli** (BRD 11.1 langkah 3). Kode dibuat tepat sebelum tautan dibuka, satu klik satu kode, dan tidak pernah disimpan ke `localStorage`.

### 4.3 Penanda sumber, bukan UTM

`wa.me` membuang seluruh parameter query selain `text`, jadi UTM tidak akan pernah sampai ke owner. Karena itu penanda sumber ditanam di **badan pesan**:

```
Dikirim dari titikasalkopi.id
https://titikasalkopi.id/keranjang
```

Diuji: URL yang dihasilkan tidak memuat `utm_`, dan hasil `decodeURIComponent` memuat baris penanda.

### 4.4 Tangga peringkasan NFR-15 dan angka nyatanya

Batasnya 1.500 karakter **setelah** `encodeURIComponent`. Satu baris baru menjadi tiga karakter (`%0A`), jadi bentuk penuh yang lapang berbiaya besar — itulah sebabnya tangga dimulai dengan mengubah bentuk baris, bukan dengan membuang item.

| Tingkat | Bentuk baris | Maks item | Batas catatan |
|---|---|---|---|
| 1 | penuh (4 baris per item) | semua | 200 |
| 2 | ringkas (1 baris per item) | semua | 200 |
| 3 | ringkas | semua | 80 |
| 4 | ringkas | 8 | 80 |
| 5 | ringkas | 4 | 60 |

Angka terukur dari `scripts/check-whatsapp.mjs` (batas 1.500):

| Isi keranjang | Panjang terkode | Tingkat yang dipakai |
|---|---|---|
| 2 baris + catatan 44 karakter | **820** | 1 (penuh) |
| 5 baris | **1.328** | 1 (penuh) |
| 6 baris | **1.106** | 2 (ringkas, seluruh item tetap tercantum) |
| 10 baris | **1.449** | 4 (ringkas, 8 item + "(+2 item lainnya)") |
| 23 baris (seluruh katalog) × qty 4 + catatan 200 karakter | **1.014** | 4/5 |
| 23 baris × qty 9 + catatan panjang | **1.032** | 4/5 |

Semuanya di bawah 1.500. Ketika item dibatasi, pesan menyertakan baris "(+N item lainnya — rinciannya saya kirim menyusul.)" dan tautan keranjang tetap ikut, sesuai NFR-15.

### 4.5 Pembersih catatan

`sanitizeNote()` adalah gerbang terakhir sebelum teks meninggalkan situs. Ia membuang karakter kontrol, meratakan baris baru, dan **membuang baris yang menyerupai penanda sistem** (`Kode order:`, `Dikirim dari`) — tanpa itu pengunjung bisa mengetik kode order palsu ke catatan dan mencemari buku order serta menggelembungkan KPI G-01 dan G-04. Batas 200 karakter ditegakkan tiga kali: `maxLength` input, `SET_NOTE` pada reducer, dan fungsi ini.

Batas panjangnya **disuntikkan sebagai parameter**, bukan diimpor dari `@/features/cart/cart-reducer`, karena aturan ketergantungan nomor 1 melarang `lib/` mengenal `features/`. Pemanggilnya di keranjang mengirim `MAX_NOTE_LENGTH` miliknya, jadi tetap satu sumber kebenaran.

---

## 5. Keputusan aksesibilitas

### 5.1 Perbaikan pelanggaran AA yang diwariskan

Kerangka beranda lama memakai `bg-gold` dengan label cream berukuran normal — **3,88:1, gagal** ambang 4,5:1. Tombol itu sekarang `bg-rust` dengan label cream (**5,74:1, lulus**). Diverifikasi pada HTML hasil build: string `bg-gold` **tidak muncul sama sekali** di `.next/server/app/`.

### 5.2 Di mana gold dipakai dan tidak dipakai

Gold `#AC6D04` gagal untuk teks normal pada setiap latar yang mungkin (3,88:1 di cream, 4,02:1 di surface, 3,79:1 di hijau). Pemakaiannya karena itu dibatasi pada tiga tempat saja, semuanya **non-teks atau teks berukuran display**:

| Pemakaian | Kelas | Kenapa sah |
|---|---|---|
| Garis batas label catatan rasa | `border-gold` | Batas dekoratif, bukan teks; bukan satu-satunya penanda karena labelnya juga punya latar dan jarak |
| Penanda tepi geser tabel rasio dan tabel harga | `border-l-2 border-gold` | Elemen non-teks (kriteria 1.4.11); 3,88:1 melewati ambang 3:1 |
| Angka besar "1…4" pada blok Cara Pesan | `font-display text-3xl text-gold` | Teks berukuran display (≥ 24 px); ambangnya 3:1 dan dilewati. Angka itu `aria-hidden` dan diulang oleh semantik `<ol>` |

Gold **tidak** dipakai sebagai: warna teks isi, warna teks label mana pun berukuran normal, latar tombol, warna tautan, maupun indikator fokus.

### 5.3 Pasangan warna yang dipakai dan rasionya

| Pemakaian | Pasangan | Rasio | Putusan |
|---|---|---|---|
| Teks isi di seluruh halaman | hijau `#0E251F` di cream | 14,74:1 | lulus |
| Teks di dalam kartu | hijau di surface | 15,26:1 | lulus |
| Teks sekunder | olive di cream | 8,40:1 | lulus |
| Harga | coffee di cream | 7,04:1 | lulus |
| Label kategori dan tautan aksen | rust di cream | 5,74:1 | lulus |
| Tombol utama | cream di rust | 5,74:1 | lulus |
| Blok pemberitahuan (ongkir, di luar jam balas, item dibuang) | cream di coffee | 7,04:1 | lulus |
| Footer dan blok gelap | cream di hijau | 14,74:1 | lulus |
| Teks pendukung di footer | cream 80% di hijau | 9,87:1 | lulus |
| Batas kartu | `ring-primary/10` | 1,22:1 | **hiasan saja** — batas kartu juga dinyatakan oleh `bg-surface` di atas `bg-base` dan oleh jarak, sesuai izin Bagian 11.4 |

`text-primary/60` (4,20:1) **tidak dipakai di mana pun**; teks sekunder memakai `text-olive` yang 8,40:1. Pasangan hijau + rust (2,57:1) tidak dipakai dalam bentuk apa pun.

### 5.4 Indikator fokus — dua cincin, bukan satu

Arsitektur menetapkan `focus-visible:outline-rust`. Itu benar **hanya di atas latar terang**: rust di atas hijau primary hanya 2,57:1, dan pasangan itu dilarang sepenuhnya, termasuk untuk indikator fokus. Karena itu ada dua konstanta di `components/ui/styles.ts`:

- `FOCUS_RING` → `outline-rust` (5,74:1 di cream) untuk seluruh elemen berlatar terang;
- `FOCUS_RING_INVERSE` → `outline-base` (cream, 14,74:1 di hijau) untuk elemen di dalam footer dan blok gelap.

`globals.css` juga memasang `:focus-visible` global beroutline rust sebagai jaring pengaman, sehingga tidak ada elemen fokusable yang bisa kehilangan indikatornya. `outline: none` tanpa pengganti tidak dipakai sama sekali.

### 5.5 Token `--color-cream` — alias, bukan warna baru

Pada Tailwind v4 utility `text-base` ambigu: ia bisa berarti ukuran font bawaan (`--text-base`) atau warna `--color-base`. Kerangka lama memakainya untuk keduanya di berkas yang sama, yang berarti salah satu maksudnya pasti tidak tercapai. `globals.css` sekarang menambahkan **alias** `--color-cream: var(--brand-base)` — nilai hex-nya sama persis dengan `--brand-base`, jadi **tidak ada warna baru yang ditambahkan** (NFR-11 tetap terpenuhi). Setiap teks cream di atas fill gelap memakai `text-cream`; ukuran font eksplisit memakai `text-[1rem]`. Latar tetap memakai `bg-base` karena di sana tidak ada tabrakan.

### 5.6 Sisa kewajiban WCAG 2.1 AA

| Aspek | Cara dipenuhi |
|---|---|
| Navigasi papan ketik penuh | Seluruh kontrol adalah `<button>`, `<a>`, `<input>`, atau `<textarea>` asli. **Tidak ada `<div onClick>` di seluruh basis kode** |
| Pemilih varian dan baris tabel rasio | `<input type="radio">` asli yang `sr-only` di dalam `<label>` sepenuh baris; otomatis dapat difokus, dipilih dengan panah, dan terbaca sebagai grup |
| Lewati navigasi | Tautan "Lewati ke konten utama" di awal `<body>`, terlihat saat difokus (WCAG 2.4.1) |
| Landmark | `<header>`, `<nav aria-label>`, `<main id="konten">`, `<footer>` — satu dari masing-masing per halaman |
| Urutan heading | Satu `<h1>` per halaman, terverifikasi pada HTML hasil build untuk ketujuh halaman statis dan halaman produk. Tingkat tidak melompat; heading yang hanya untuk pembaca layar memakai `sr-only` |
| Teks alternatif | Foto asli memakai `image.alt` (divalidasi V-14). Placeholder memakai `alt=""` + `aria-hidden` karena ia **dekoratif** — lihat Bagian 5.7 |
| Nama tombol ikon | Setiap tombol ikon punya `<span className="sr-only">`; badge keranjang memakai `aria-live="polite"` |
| Target sentuh | `min-h-11` (44 px) pada seluruh tombol, tautan navigasi, dan tombol stepper; tombol WhatsApp melayang 56 × 56 px; jarak antar target ≥ 8 px |
| Perubahan dinamis diumumkan | `aria-live="polite"` pada: subtotal keranjang, nilai stepper, konfirmasi "ditambahkan ke keranjang", sisa karakter catatan, status jam balas, dan pemberitahuan item dibuang |
| Tanpa penggeseran horizontal | Kedua tabel dibungkus `overflow-x-auto` dengan penanda tepi gold; tidak ada lebar tetap di mana pun |
| Bahasa | `<html lang="id">`; seluruh salinan teks Bahasa Indonesia |
| Gerak | `prefers-reduced-motion` dihormati di `globals.css` |

### 5.7 Kenapa placeholder memakai `alt=""`

`Product.image` masih `null` untuk seluruh produk, jadi yang tampil adalah placeholder SVG bergaya brand dari `public/produk/<slug>.svg` lewat `placeholderImagePath()`. Placeholder itu **bukan foto produk**: ia bentuk geometris. Memberinya deskripsi seolah-olah foto ("kemasan kopi Abmisibil di atas meja kayu") berarti mengarang, yang dilarang FR-07 dan menyesatkan pemakai pembaca layar. Karena itu ia diperlakukan sebagai gambar dekoratif: `alt=""` + `aria-hidden`, sementara nama produk sudah dibacakan oleh heading tepat di sebelahnya. Begitu foto asli masuk, `product-media.tsx` otomatis beralih ke cabang `image.alt` tanpa perubahan kode.

---

## 6. Penyimpangan yang dicatat dari dokumen arsitektur

Tiga, semuanya kecil dan semuanya di sisi yang lebih ketat atau setara.

**P-01 — `features/catalog/purchase-panel.tsx` ditambahkan ke daftar Client Component.**
ADR-10 mendaftar `variant-picker`, `ratio-table`, `kg-configurator`, dan `add-to-cart-button` sebagai empat Client Component terpisah. Keempatnya berbagi satu state — varian terpilih dan jumlah — sehingga state itu tetap harus diangkat ke induk yang juga Client Component. `purchase-panel.tsx` adalah induk tersebut. Ia **tidak** memperluas batas klien melampaui keempat komponen itu: `product-detail.tsx` dan seluruh sisa halaman tetap Server Component.

**P-02 — `features/analytics/view-event.tsx` ditambahkan.**
Event `view_item_list` (FR-47, KPI G-03) dan `view_item` hanya bisa dikirim dari peramban, sementara halamannya wajib Server Component. Komponen ini tidak merender apa pun dan hanya menerima nilai primitif yang sudah di-resolve Server Component induk.

**P-03 — `sanitizeNote()` menerima batas panjang sebagai parameter.**
Bagian 12.1 arsitektur menuliskannya mengimpor `MAX_NOTE_LENGTH` dari `@/features/cart/cart-reducer`. Impor itu melanggar aturan ketergantungan nomor 1 yang ditulis dokumen yang sama (`lib/` tidak boleh mengenal `features/`) dan akan ditolak lint rule BE. Batasnya karena itu disuntikkan oleh pemanggil; tetap satu sumber kebenaran.

Selain ketiganya, daftar tertutup ADR-10 dipatuhi: tidak ada `layout.tsx`, `page.tsx`, kartu produk, tabel harga statis, header, maupun footer yang menjadi Client Component, dan **tidak satu pun berkas ber-`"use client"` mengimpor `@/data/catalog` atau `@/data/products`** (aturan ketergantungan nomor 4). Berkas klien hanya mengimpor tipe dari `@/data/types`, yang terhapus saat kompilasi.

---

## 7. Cara menjalankan pemeriksaan

Tidak ada kerangka uji dan tidak ada dependensi baru (ADR-14). Skrip pemeriksaan adalah berkas `.mjs` biasa yang dijalankan `node`, memakai `node:assert/strict`.

```bash
cd web

node scripts/check-cart.mjs          # 31 pemeriksaan
node scripts/check-whatsapp.mjs      # 21 pemeriksaan
node scripts/check-reply-hours.mjs   # 12 pemeriksaan

node scripts/check-all.mjs           # ketiganya; keluar dengan kode 1 bila ada yang gagal
```

### 7.1 Bagaimana skrip `.mjs` bisa menguji modul `.ts`

`scripts/_ts-load.mjs` mengompilasi modul yang diuji **beserta dependensi relatifnya** memakai paket `typescript` yang sudah ada sebagai devDependency — nol paket baru — lalu mengimpor hasilnya sebagai ESM dari folder sementara. Yang diuji karena itu adalah **kode produksi yang sebenarnya**, bukan salinannya.

Syaratnya satu, dan syarat itu sendiri berguna: modul yang diuji hanya boleh memakai impor **relatif** untuk nilai. Impor beralias `@/…` di modul-modul itu selalu `import type` sehingga terhapus saat kompilasi. Aturan ini yang menjaga `message.ts`, `cart-reducer.ts`, `cart-selectors.ts`, dan `reply-hours.ts` tetap murni, bebas React, dan bebas katalog.

### 7.2 Cakupan yang wajib ada, dan di mana letaknya

| Yang wajib diuji | Berkas | Nama pemeriksaan |
|---|---|---|
| Harga 0,5 kg tepat setengah untuk **kesembilan** varian houseblend | `check-cart.mjs` | sembilan baris `"<id>: <perKg> per kg -> <perHalfKg> per 0,5 kg (tepat setengah)"` |
| Keranjang membuang slug tidak dikenal tanpa melempar | `check-cart.mjs` | `"ADR-04: slug tidak dikenal dibuang tanpa melempar"` |
| Pesan tetap di bawah 1.500 karakter saat keranjang besar | `check-whatsapp.mjs` | `"NFR-15: keranjang penuh 23 baris tetap <= 1.500 karakter terkode"` |
| Format kode order | `check-whatsapp.mjs` | `"FR-24: kode order cocok pola TAK-YYMMDD-XXXX"` |
| Jam balas benar di kedua sisi batas 08.00 dan 21.00 WIB | `check-reply-hours.mjs` | enam pemeriksaan batas: 07.59.59, 08.00.00, 08.00.01, 20.59.59, 21.00.00, 21.00.01 |

Kasus batas jam balas dinyatakan sebagai instant **UTC** (08.00 WIB = 01.00 UTC, 21.00 WIB = 14.00 UTC), sehingga hasilnya tidak bergantung pada zona waktu mesin yang menjalankan skrip.

---

## 8. Defek yang dilaporkan, bukan diperbaiki

Ketiganya berada di berkas milik peran lain. Sesuai peta kepemilikan Bagian 8.3 arsitektur, FE melaporkannya alih-alih menyuntingnya.

**D-FE-01 — `formatIDR()` melanggar BR-02: ada spasi setelah "Rp". PRIORITAS TERTINGGI.**
`src/lib/format.ts` (milik BE) memakai `Intl.NumberFormat` dengan `style: "currency", currency: "IDR"`. Pada ICU modern format itu menyisipkan **NBSP (U+00A0)** setelah simbol mata uang, sehingga keluarannya `"Rp 210.000"` — sementara BR-02 mensyaratkan `"Rp210.000"` tanpa spasi, dan NFR-12 menuntut 100% kecocokan dengan brand brief. Terverifikasi:

```
> new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0,maximumFractionDigits:0}).format(210000)
"Rp 210.000"        // kode karakter: 52 70 a0 32 31 30 2e 30 30 30
```

Dampaknya menyeluruh: **setiap harga di seluruh situs dan di setiap pesan WhatsApp**. Perbaikan yang disarankan untuk BE — merakit string sendiri alih-alih memakai `style: "currency"`:

```ts
export function formatIDR(amount: number): string {
  return `Rp${new Intl.NumberFormat("id-ID").format(amount)}`;
}
```

Sampai itu diperbaiki, `scripts/check-whatsapp.mjs` menormalkan NBSP agar tetap dapat menguji struktur pesan, dan mencetak baris `CATATAN BR-02` pada setiap kali dijalankan supaya defek ini tidak hilang dari pandangan.

**D-FE-02 — `src/app/opengraph-image.png` belum ada.**
Sudah dicatat BE sebagai celah paling mendesak. Akibatnya halaman tanpa foto produk — yaitu seluruh halaman saat ini — tidak punya gambar pratinjau saat dibagikan, sehingga **FR-46 belum penuh**. Ini aset desain 1200 × 630 milik owner atau desainer; membuatnya secara terprogram berarti mengarang identitas visual.

**D-FE-03 — foto produk belum ada.**
`Product.image` masih `null` untuk kesepuluh produk. Placeholder SVG menempati ruang yang persis sama (4:5), jadi penggantian nanti tidak menggeser tata letak sama sekali (NFR-02). Tidak menahan rilis (R-13), tetapi menahan FR-12 dari terpenuhi sepenuhnya.

---

## 9. Yang belum selesai

**Fase 1b, memang di luar ruang lingkup 1a** — tidak dikerjakan dan tidak boleh dianggap kurang: FR-04, FR-05, FR-06 (pencarian dan filter katalog), FR-13 (bentuk biji dan metode seduh), FR-14 (penanda habis — medan `status` sudah ada, tinggal tampilannya), FR-15, FR-30 (CTA sampel B2B — `buildB2BMessage()` sudah ada dan siap dipakai), FR-32 sampai FR-34 (FAQ, pengiriman, cara seduh), FR-39, FR-40, FR-50.

**Berada di ruang lingkup 1a tetapi belum terverifikasi FE:**

| Hal | Status | Yang perlu dilakukan |
|---|---|---|
| NFR-04 (Lighthouse) dan NFR-01 (LCP, INP) | **belum diukur** | Butuh deployment nyata. `next build` versi 16.3.4 tidak lagi mencetak kolom `First Load JS`, jadi angka NFR-03 (≤ 150 KB JS awal) **belum bisa saya klaim** — wajib diukur di panel Network sebelum rilis |
| Pemeriksaan axe / Lighthouse Accessibility otomatis | **belum dijalankan** | Keputusan kontras, landmark, dan heading di Bagian 5 dibuat dari perhitungan arsitek dan pemeriksaan HTML hasil build, bukan dari axe |
| Penelusuran manual alur beli dengan papan ketik saja | **belum dijalankan** | Wajib sebelum rilis (NFR-07) |
| Uji kirim nyata pesan WhatsApp di tiga kombinasi perangkat | **belum dijalankan** | NFR-15 baru terbukti secara aritmetika (panjang terkode), belum secara tampilan di WhatsApp Android/iOS/Web |
| `NEXT_PUBLIC_GA_ID` dan `GOOGLE_SITE_VERIFICATION` | **belum diisi** | Kode pemanggilnya sudah terpasang dan no-op tanpa env var. Pengisian dan penandaan `click_whatsapp_order` sebagai konversi di antarmuka GA4 adalah pekerjaan konfigurasi, bukan kode |
| `searchTerms` belum disetujui owner (CA-04) | **menunggu owner** | Sudah tayang di `keywords` metadata; butuh satu kali tinjauan owner |

**Satu `TODO(copy)` yang menunggu owner:** di `src/app/cerita-kami/page.tsx`, bagian "Cara kami menuliskan asal". Bila owner ingin menceritakan proses kurasi origin — kunjungan kebun, cupping, kriteria seleksi — kalimatnya harus datang dari owner. Saya tidak menambahkannya karena brand brief tidak menyebut satu pun proses tersebut, dan FR-31 melarang klaim yang belum terbukti. Seluruh kalimat lain di halaman itu dapat ditelusuri ke brand brief atau ke isi katalog yang sudah tayang.

---

## 10. Daftar periksa serah terima

- [x] 16 rute tayang, seluruhnya statis; tidak ada rute yang muncul sebagai `ƒ (Dynamic)`
- [x] `generateStaticParams` menghasilkan 7 path produk dan 3 path lini houseblend
- [x] Satu baris delegasi metadata di setiap halaman; isi metadata tetap milik `lib/seo.ts`
- [x] JSON-LD `Product` + `Offer`, `Organization`, `BreadcrumbList` terpasang
- [x] Keranjang: persistensi berversi, kedaluwarsa 7 hari, harga di-resolve ulang, data rusak dibuang tanpa crash
- [x] Generator pesan WhatsApp murni, kode order `TAK-YYMMDD-XXXX`, penanda sumber di badan pesan, batas 1.500 karakter terjaga
- [x] Jam balas D-03 di tiga tempat: Kontak, blok checkout keranjang, footer
- [x] Sembilan event GA4 terpasang di titik yang diminta FR-47
- [x] Pelanggaran kontras `bg-gold` pada beranda **diperbaiki**; gold hanya untuk garis, ikon, dan angka display
- [x] Pengecualian `SEMENTARA` untuk `src/app/page.tsx` **dihapus** dari `eslint.config.mjs`
- [x] `npx tsc --noEmit`, `npx eslint .`, `npm run build` lulus; 64 pemeriksaan skrip lulus
- [ ] **Milik BE**: perbaiki `formatIDR()` (D-FE-01) — ini yang paling mendesak
- [ ] **Milik owner/desainer**: `src/app/opengraph-image.png`, foto produk, persetujuan `searchTerms`, salinan teks `TODO(copy)`
- [ ] **Milik QA**: Lighthouse, axe, penelusuran papan ketik, uji kirim WhatsApp nyata, pengukuran `First Load JS`
