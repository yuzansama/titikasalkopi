/**
 * Titik Asal Kopi — KONTRAK TIPE KATALOG.
 *
 * Sumber: docs/03-architecture.md Bagian 5.2 dan 5.4.
 * Status: DIBEKUKAN pada akhir hari pertama (Bagian 8.3). Perubahan bentuk
 * apa pun di berkas ini langsung merusak build FE, jadi wajib diumumkan lebih
 * dulu ke tim, bukan di-commit diam-diam.
 *
 * Aturan yang mengikat seluruh tipe di bawah:
 * 1. Harga melekat pada VARIAN, tidak pernah pada produk (BRD 10.2).
 * 2. Satu produk wajib punya minimal satu varian (BR-04), ditegakkan validator.
 * 3. Uang dan kuantitas selalu bilangan bulat (BR-03, ADR-05).
 * 4. Medan yang tidak disebut brand brief bernilai `null` — jangan dikarang (FR-07).
 */

/** Rupiah penuh, bilangan bulat. Tidak pernah pecahan (BR-03, ADR-05). */
export type PriceIDR = number;

/**
 * Tier harga SINGLE ORIGIN saja.
 * Pada lini BRIGHT, "Signature"/"Reguler" adalah NAMA VARIAN, bukan tier —
 * lihat BR-15 dan pemeriksaan V-07 pada validator.
 */
export type Tier = "signature" | "reguler";

export type ProductCategory = "single-origin" | "houseblend";

export type HouseblendLineSlug = "bold" | "bright" | "full-robusta";

export type ProductStatus = "available" | "out-of-stock";

/**
 * Satuan pesan sebuah varian.
 * - "pack"    : 1 kemasan 200 gr           -> qty = jumlah pack
 * - "paket"   : 1 bundel berisi 3 x 200 gr -> qty = jumlah paket (BR-12, D-01)
 * - "half-kg" : 0,5 kg houseblend          -> qty = halfKgUnits (D-02)
 */
export type OrderUnit = "pack" | "paket" | "half-kg";

export type Variant = {
  /** Stabil dan permanen; dipakai sebagai kunci baris keranjang. */
  id: string;
  /** Label siap tampil, mis. "3 pack (200 gr)" atau "60% Arabica : 40% Robusta". */
  label: string;
  unit: OrderUnit;
  /** Harga SATU satuan pesan, bilangan bulat. Untuk half-kg = pricePerKg / 2. */
  unitPrice: PriceIDR;
  /**
   * Hanya untuk unit "half-kg": harga per kg — satu-satunya angka yang benar-benar
   * tersimpan di products.ts. `unitPrice` di atas SELALU turunan darinya (D-02).
   */
  pricePerKg?: PriceIDR;
  /** Jumlah kemasan 200 gr di dalam satu satuan pesan. 1 untuk pack, 3 untuk paket. */
  packsPerUnit?: number;
  /** Selalu 1 pada Fase 1. Disediakan agar konfigurator tidak menghardcode angka. */
  minQty: number;
  step: number;
};

export type Origin = {
  /** Desa atau lokasi spesifik bila disebut brief, selain itu null. */
  place: string | null;
  /** Wilayah lebih luas, mis. "Pegunungan Bintang". TANPA provinsi. */
  region: string;
  /** Provinsi, mis. "Papua". Dipakai metadata SEO (FR-44). */
  province: string;
  process: string | null;
  processedBy: string | null;
  altitudeMasl: number | null;
  varietals: string[] | null;
};

export type ProductImage = {
  /** Hasil impor statis next/image; membawa width dan height (ADR-06). */
  src: import("next/image").StaticImageData;
  /** Alt deskriptif wajib, Bahasa Indonesia (NFR-07). */
  alt: string;
};

export type Product = {
  /** Slug URL permanen (FR-09). Pola: ^[a-z0-9]+(-[a-z0-9]+)*$ */
  slug: string;
  name: string;
  category: ProductCategory;
  /** Hanya single-origin. WAJIB undefined untuk houseblend (BR-15). */
  tier?: Tier;
  /** Hanya houseblend. */
  line?: HouseblendLineSlug;
  /** Hanya single-origin. */
  origin?: Origin;
  /** Satu kalimat untuk kartu katalog dan meta description. */
  summary: string;
  /** Paragraf untuk halaman detail. Untuk houseblend memuat komposisi (FR-27). */
  description: string;
  /** Label pendek, bukan paragraf (FR-10). null bila brief tidak menyebut. */
  tastingNotes: string[] | null;
  /** Minimal satu (BR-04). Urutan sesuai urutan tampil. */
  variants: Variant[];
  /** null diperbolehkan; UI memakai ProductPlaceholder (FR-12, R-13). */
  image: ProductImage | null;
  /** Medan disediakan sejak 1a; UI-nya baru dipakai 1b (FR-14). */
  status: ProductStatus;
  /**
   * Kata kunci pemasaran untuk metadata, BUKAN klaim atribut origin.
   * Contoh Pondok Baru: ["kopi Gayo", "kopi Aceh", "kopi Bener Meriah"].
   */
  searchTerms: string[];
};

/* ------------------------------------------------------------------ */
/* Tipe keranjang (Bagian 5.4)                                         */
/* ------------------------------------------------------------------ */
/* Bentuknya dibekukan di sini supaya BE dan FE bicara tentang hal yang
   sama. Implementasi reducer, storage, dan selector milik FE di
   src/features/cart/. */

/** YANG DIPERSISTENSIKAN. Sengaja tanpa harga dan tanpa nama (ADR-04). */
export type CartItem = {
  slug: string;
  variantId: string;
  /** Bilangan bulat jumlah satuan pesan. Untuk houseblend ini adalah halfKgUnits. */
  qty: number;
};

export type CartState = {
  items: CartItem[];
  /** Catatan pembeli, maksimal 200 karakter (FR-23). */
  note: string;
  /** Epoch ms sentuhan terakhir; dasar kedaluwarsa 7 hari (FR-20). */
  updatedAt: number;
  /** false sampai localStorage selesai dibaca. Kunci anti hydration mismatch. */
  hydrated: boolean;
};

/** HASIL RESOLVE saat render. Tidak pernah disimpan. */
export type ResolvedCartLine = {
  slug: string;
  variantId: string;
  qty: number;
  productName: string;
  /** "Single Origin, Signature" | "Houseblend BOLD" */
  categoryLabel: string;
  variantLabel: string;
  unit: OrderUnit;
  /** Harga TERKINI dari katalog, bukan snapshot (ADR-04, NFR-12). */
  unitPrice: PriceIDR;
  /** Hanya houseblend, untuk tampilan "x Rp200.000/kg". */
  pricePerKg?: PriceIDR;
  /** qty * unitPrice, bilangan bulat. */
  lineTotal: PriceIDR;
  /** "/produk/abmisibil" atau "/houseblend/bold". */
  href: string;
};

export type ResolvedCart = {
  lines: ResolvedCartLine[];
  /** Jumlah satuan pesan seluruh baris; angka untuk badge header (FR-17). */
  itemCount: number;
  /** Subtotal produk, BELUM termasuk ongkir (BR-18). */
  subtotal: PriceIDR;
  note: string;
  /** Baris yang dibuang karena produk/varian tidak lagi ada di katalog. */
  droppedCount: number;
};

/**
 * Indeks katalog yang diserialkan Server Component lalu dikirim sebagai props
 * ke Client Component keranjang. Ini yang membuat aturan ketergantungan nomor 4
 * ("use client" dilarang mengimpor @/data/*) tetap bisa ditegakkan.
 */
export type CartCatalogEntry = {
  slug: string;
  name: string;
  categoryLabel: string;
  href: string;
  variants: Array<{
    id: string;
    label: string;
    unit: OrderUnit;
    unitPrice: PriceIDR;
    pricePerKg?: PriceIDR;
    minQty: number;
    step: number;
  }>;
};

export type CartCatalogIndex = Record<string, CartCatalogEntry>;
