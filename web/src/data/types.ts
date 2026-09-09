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
 * Satuan pesan sebuah varian. SELURUHNYA menghitung KEMASAN, dan `qty` selalu
 * berarti "berapa kemasan" — tidak pernah berat, tidak pernah tarif.
 * - "pack"    : 1 kemasan 200 gr           -> qty = jumlah kemasan
 * - "paket"   : 1 bundel berisi 3 x 200 gr -> qty = jumlah bundel (BR-12, D-01)
 * - "kg"      : 1 kemasan 1 kg houseblend  -> qty = jumlah kemasan
 * - "half-kg" : 1 kemasan 0,5 kg houseblend -> qty = jumlah kemasan
 * - "gram-100": 1 kemasan 100 gr           -> qty = jumlah kemasan (KD-07)
 *
 * `gram-100` melayani lini Katalog Kopi 100 gram, yang berharga PER BIJI dan
 * karena itu tidak memakai `Tier` maupun `Product` sama sekali. Lihat
 * `src/data/picks.ts`.
 *
 * PERUBAHAN 9 September 2026: "half-kg" dahulu berarti "satuan 0,5 kg" dengan
 * `qty` sebagai jumlah satuan berat, dan harganya turunan dari tarif per kg.
 * Lembar `Product` bisnis plan menyatakan houseblend dijual dalam dua UKURAN
 * KEMASAN, 1 kg dan 0,5 kg, masing-masing berharga sendiri. Sejak itu tidak ada
 * lagi tarif yang tidak bisa dibeli: setiap angka yang tampil adalah harga satu
 * kemasan yang benar-benar ada.
 */
export type OrderUnit = "pack" | "paket" | "kg" | "half-kg" | "gram-100";

export type Variant = {
  /** Stabil dan permanen; dipakai sebagai kunci baris keranjang. */
  id: string;
  /** Label siap tampil, mis. "3 pack (200 gr)" atau "60% Arabica : 40% Robusta". */
  label: string;
  unit: OrderUnit;
  /**
   * Harga SATU kemasan, bilangan bulat. Ini SELALU angka yang ditagih untuk
   * satu `qty`, sehingga `qty * unitPrice` selalu sama dengan subtotal baris.
   *
   * Tidak ada medan harga kedua di sini, dan itu disengaja. Sebelum 9 September
   * 2026 varian houseblend juga membawa `pricePerKg`, dan antarmuka menampilkan
   * tarif itu di sebelah subtotal yang dihitung dari `unitPrice`. Begitu kedua
   * angka berhenti berhubungan secara aritmetika, pesan yang diterima pembeli
   * berbunyi "5 kg x Rp205.000/kg" di atas "Subtotal: Rp1.150.000". Satu harga
   * per varian membuat kesalahan itu tidak bisa ditulis lagi.
   */
  unitPrice: PriceIDR;
  /**
   * Menandai varian-varian yang merupakan UKURAN BERBEDA dari barang yang sama,
   * mis. `bold-60-40` untuk kemasan 1 kg dan 0,5 kg rasio itu. Dipakai tabel
   * rasio untuk menyusun satu baris per rasio, dan dipakai validator V-06 untuk
   * memasangkan kedua ukuran sebelum memeriksa kewajaran harganya.
   */
  groupId?: string;
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
  /**
   * true bila owner menandai produknya kosong SETELAH baris ini masuk
   * keranjang (FR-14).
   *
   * Baris seperti ini tidak dibuang. Menghilangkannya diam-diam membuat
   * pembeli mengira keranjangnya rusak, dan keranjang bertahan tujuh hari
   * sehingga jendelanya nyata. Yang dilakukan: barisnya tetap tampil dengan
   * penanda, TIDAK ikut subtotal, dan TIDAK ikut ke pesan WhatsApp maupun ke
   * buku order — pesanan yang tidak bisa dipenuhi tidak boleh terkirim.
   */
  soldOut: boolean;
  /** qty * unitPrice, bilangan bulat. Selalu dapat direkonstruksi pembaca. */
  lineTotal: PriceIDR;
  /** "/produk/abmisibil" atau "/houseblend/bold". */
  href: string;
};

export type ResolvedCart = {
  lines: ResolvedCartLine[];
  /**
   * Baris yang benar-benar bisa dipesan. Inilah yang dikirim ke WhatsApp dan
   * ke buku order — bukan `lines`, yang juga memuat baris berstatus kosong.
   */
  orderableLines: ResolvedCartLine[];
  /** Jumlah satuan pesan yang bisa dipesan; angka untuk badge header (FR-17). */
  itemCount: number;
  /** Subtotal produk yang bisa dipesan, BELUM termasuk ongkir (BR-18). */
  subtotal: PriceIDR;
  note: string;
  /** Baris yang dibuang karena produk/varian tidak lagi ada di katalog. */
  droppedCount: number;
  /** Baris yang masih tampil tetapi stoknya habis (FR-14). */
  soldOutCount: number;
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
  /**
   * Status jual dari sheet owner (FR-14, KD-08). WAJIB ikut ke sini: tanpa
   * medan ini keranjang tidak punya cara mengetahui bahwa sebuah barang sudah
   * ditandai kosong, dan barang itu ikut terkirim sebagai pesanan sungguhan.
   */
  status: ProductStatus;
  variants: Array<{
    id: string;
    label: string;
    unit: OrderUnit;
    unitPrice: PriceIDR;
    groupId?: string;
    minQty: number;
    step: number;
  }>;
};

export type CartCatalogIndex = Record<string, CartCatalogEntry>;
