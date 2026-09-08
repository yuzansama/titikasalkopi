/**
 * Titik Asal Kopi — LAPIS KATALOG TURUNAN (ADR-02).
 *
 * SELURUH aplikasi membaca dari berkas ini, tidak pernah dari `products.ts`.
 * Tugasnya tiga:
 *   1. Menyusun `Product[]` seragam dari lapis penulisan.
 *   2. Menghitung seluruh harga turunan (0,5 kg, harga mulai, penghematan
 *      bundling) — tidak ada satu pun yang disimpan sebagai data (D-02, BR-10).
 *   3. Memanggil `assertCatalogValid()` saat modul dievaluasi, sehingga data
 *      rusak MENGGAGALKAN BUILD, bukan tayang (FR-43, ADR-09).
 *
 * Berkas ini satu-satunya yang boleh mengimpor `./products` (ADR-02,
 * ditegakkan lint rule di eslint.config.mjs).
 *
 * PERINGATAN untuk FE: berkas ini menarik seluruh katalog beserta validator.
 * Ia hanya boleh diimpor dari Server Component. Client Component menerima data
 * yang sudah di-resolve sebagai props (aturan ketergantungan nomor 4).
 */

import { coffeePicks, PICK_GRAMS, pickVariantId } from "./picks";
import {
  HOUSEBLEND_MIN_HALF_KG_UNITS,
  HOUSEBLEND_STEP_HALF_KG_UNITS,
  SINGLE_ORIGIN_PACKS_PER_BUNDLE,
  SINGLE_ORIGIN_PACK_GRAMS,
  houseblendBold,
  houseblendBright,
  houseblendFullRobusta,
  houseblendLines as houseblendLineSource,
  singleOriginBeans,
  singleOriginPricing,
  type HouseblendLine,
  type SingleOriginBean,
} from "./products";
import type {
  CartCatalogEntry,
  CartCatalogIndex,
  HouseblendLineSlug,
  PriceIDR,
  Product,
  Tier,
  Variant,
} from "./types";
import { assertCatalogValid, assertPicksValid } from "./validate";

/* ------------------------------------------------------------------ */
/* Konstanta tampilan yang diturunkan dari data                        */
/* ------------------------------------------------------------------ */

/** Rasio aspek gambar produk (ADR-06, Bagian 9.3). Dikunci di wrapper FE. */
export const PRODUCT_IMAGE_ASPECT_RATIO = "4 / 5";
export const PRODUCT_IMAGE_WIDTH = 800;
export const PRODUCT_IMAGE_HEIGHT = 1000;

/** Satu kg = dua satuan pesan houseblend (D-02). */
export const HALF_KG_UNITS_PER_KG = 2;

export const TIER_LABEL: Record<Tier, string> = {
  signature: "Signature",
  reguler: "Reguler",
};

/**
 * Placeholder SVG bergaya brand di `public/produk/<slug>.svg`.
 * Dipakai selama foto asli belum tersedia (R-13, FR-12). Bukan `Product.image`
 * karena ia bukan foto produk — `image` tetap `null` sampai foto asli masuk.
 */
export function placeholderImagePath(slug: string): string {
  // basePath TIDAK ditambahkan otomatis oleh next/image saat `unoptimized`,
  // sehingga pada ekspor GitHub Pages seluruh gambar produk menjadi 404.
  // Kosong pada target Vercel, jadi path produksi tidak berubah.
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/produk/${slug}.svg`;
}

/* ------------------------------------------------------------------ */
/* Turunan harga — dihitung, tidak pernah disimpan                     */
/* ------------------------------------------------------------------ */

/** Harga 0,5 kg SELALU turunan dari pricePerKg (D-02). */
export function halfKgPrice(pricePerKg: PriceIDR): PriceIDR {
  // Dijamin bilangan bulat oleh validator V-05: pricePerKg % 1000 === 0.
  return pricePerKg / 2;
}

/** Harga terendah antar varian; dipakai kartu katalog "mulai dari" (BRD 10.2). */
export function priceFrom(product: Product): PriceIDR {
  return Math.min(...product.variants.map((v) => v.unitPrice));
}

/** Harga per kg terendah pada satu lini houseblend. null untuk single origin. */
export function pricePerKgFrom(product: Product): PriceIDR | null {
  const perKg = product.variants
    .map((v) => v.pricePerKg)
    .filter((price): price is PriceIDR => typeof price === "number");
  return perKg.length > 0 ? Math.min(...perKg) : null;
}

/**
 * Penghematan bundling 3 pack (BR-10). WAJIB dihitung, tidak boleh ditulis
 * sebagai angka di konten: Signature Rp25.000, Reguler Rp20.000.
 */
export function bundleSaving(product: Product): PriceIDR | null {
  const single = product.variants.find((v) => v.unit === "pack");
  const bundle = bundleVariant(product);
  if (!single || !bundle || !bundle.packsPerUnit) return null;
  return single.unitPrice * bundle.packsPerUnit - bundle.unitPrice;
}

/**
 * Varian paket 3 pack, bila produk punya. `null` untuk houseblend — lini
 * houseblend memang tidak menawarkan bundling (D-01, BR-10).
 *
 * Ada supaya kartu katalog bisa menampilkan HARGA paketnya tanpa ikut
 * menghitung uang sendiri: harga tetap dibaca dari varian, penghematan tetap
 * dari `bundleSaving()`.
 */
export function bundleVariant(product: Product): Variant | null {
  return product.variants.find((v) => v.unit === "paket") ?? null;
}

/** Subtotal satu baris: perkalian dua bilangan bulat, tanpa cabang (ADR-05). */
export function lineTotal(variant: Variant, qty: number): PriceIDR {
  return variant.unitPrice * qty;
}

/** Konversi satuan pesan ke kilogram — HANYA untuk tampilan (ADR-05). */
export function halfKgUnitsToKg(halfKgUnits: number): number {
  return halfKgUnits / HALF_KG_UNITS_PER_KG;
}

/* ------------------------------------------------------------------ */
/* Penyusunan varian                                                   */
/* ------------------------------------------------------------------ */

function singleOriginVariants(bean: SingleOriginBean): Variant[] {
  const pricing = singleOriginPricing[bean.tier];
  return [
    {
      id: `${bean.slug}-pack1`,
      label: `1 pack (${SINGLE_ORIGIN_PACK_GRAMS} gr)`,
      unit: "pack",
      unitPrice: pricing.pack1,
      packsPerUnit: 1,
      minQty: 1,
      step: 1,
    },
    {
      id: `${bean.slug}-pack3`,
      label: `${SINGLE_ORIGIN_PACKS_PER_BUNDLE} pack (${SINGLE_ORIGIN_PACKS_PER_BUNDLE} x ${SINGLE_ORIGIN_PACK_GRAMS} gr)`,
      unit: "paket",
      unitPrice: pricing.pack3,
      packsPerUnit: SINGLE_ORIGIN_PACKS_PER_BUNDLE,
      minQty: 1,
      step: 1,
    },
  ];
}

/** Varian houseblend: satuan pesan 0,5 kg, harga selalu turunan pricePerKg (D-02). */
function halfKgVariant(id: string, label: string, pricePerKg: PriceIDR): Variant {
  return {
    id,
    label,
    unit: "half-kg",
    unitPrice: halfKgPrice(pricePerKg),
    pricePerKg,
    minQty: HOUSEBLEND_MIN_HALF_KG_UNITS,
    step: HOUSEBLEND_STEP_HALF_KG_UNITS,
  };
}

function houseblendVariants(slug: HouseblendLineSlug): Variant[] {
  switch (slug) {
    case "bold":
      return houseblendBold.map((ratio) =>
        halfKgVariant(ratio.id, ratio.label, ratio.pricePerKg),
      );
    case "bright":
      return houseblendBright.map((variant) =>
        halfKgVariant(variant.id, variant.label, variant.pricePerKg),
      );
    case "full-robusta":
      return [
        halfKgVariant(
          houseblendFullRobusta.id,
          houseblendFullRobusta.label,
          houseblendFullRobusta.pricePerKg,
        ),
      ];
  }
}

/* ------------------------------------------------------------------ */
/* Penyusunan salinan teks — dirakit dari fakta brief, tidak dikarang  */
/* ------------------------------------------------------------------ */

function beanOriginPhrase(bean: SingleOriginBean): string {
  return [bean.origin, bean.region, bean.province].filter(Boolean).join(", ");
}

function beanFactList(bean: SingleOriginBean): string[] {
  return [
    bean.process ? `proses ${bean.process}` : null,
    bean.processedBy ? `diproses oleh ${bean.processedBy}` : null,
    bean.altitudeMasl ? `${bean.altitudeMasl} MASL` : null,
    bean.varietals ? bean.varietals.join(" & ") : null,
  ].filter((fact): fact is string => fact !== null);
}

function beanSummary(bean: SingleOriginBean): string {
  const facts = beanFactList(bean);
  const factPart = facts.length > 0 ? ` ${facts.join(", ")}.` : "";
  return `${bean.name} — single origin ${TIER_LABEL[bean.tier]} dari ${beanOriginPhrase(bean)}.${factPart} Kemasan ${SINGLE_ORIGIN_PACK_GRAMS} gr.`;
}

function beanDescription(bean: SingleOriginBean): string {
  const facts = beanFactList(bean);
  const factSentence =
    facts.length > 0
      ? ` Yang kami ketahui tentang biji ini: ${facts.join(", ")}.`
      : "";
  return `${bean.name} berasal dari ${beanOriginPhrase(bean)} dan masuk tier ${TIER_LABEL[bean.tier]}.${factSentence} Tersedia dalam kemasan ${SINGLE_ORIGIN_PACK_GRAMS} gr, satuan maupun paket ${SINGLE_ORIGIN_PACKS_PER_BUNDLE} pack dari origin yang sama.`;
}

/* ------------------------------------------------------------------ */
/* Katalog seragam                                                     */
/* ------------------------------------------------------------------ */

function toSingleOriginProduct(bean: SingleOriginBean): Product {
  return {
    slug: bean.slug,
    name: bean.name,
    category: "single-origin",
    tier: bean.tier,
    origin: {
      place: bean.origin,
      region: bean.region,
      province: bean.province,
      process: bean.process,
      processedBy: bean.processedBy ?? null,
      altitudeMasl: bean.altitudeMasl,
      varietals: bean.varietals,
    },
    summary: beanSummary(bean),
    description: beanDescription(bean),
    tastingNotes: bean.tastingNotes,
    variants: singleOriginVariants(bean),
    image: bean.image,
    status: bean.status,
    searchTerms: bean.searchTerms,
  };
}

function toHouseblendProduct(line: HouseblendLine): Product {
  return {
    slug: line.slug,
    name: line.name,
    category: "houseblend",
    line: line.slug,
    summary: line.summary,
    description: line.description,
    tastingNotes: line.tastingNotes,
    variants: houseblendVariants(line.slug),
    image: line.image,
    status: line.status,
    searchTerms: line.searchTerms,
  };
}

/** Tujuh produk single origin, urutan tampil = urutan di products.ts. */
export const singleOriginProducts: Product[] =
  singleOriginBeans.map(toSingleOriginProduct);

/** Tiga lini houseblend sebagai produk seragam. */
export const houseblendProducts: Product[] =
  houseblendLineSource.map(toHouseblendProduct);

/**
 * Alias untuk rute `/houseblend/[line]` dan sitemap. Isinya sama persis dengan
 * `houseblendProducts`; namanya dibedakan supaya pemanggilnya terbaca jelas.
 */
export const houseblendLines: Product[] = houseblendProducts;

/** Seluruh katalog dalam satu bentuk seragam. Sepuluh produk pada Fase 1a. */
export const products: Product[] = [
  ...singleOriginProducts,
  ...houseblendProducts,
];

/* GERBANG BUILD (ADR-09, FR-43).
   Dievaluasi saat modul dimuat. Setiap rute statis mengimpor berkas ini, jadi
   `next build` pasti menjalankannya dan data rusak menghentikan build. */
assertCatalogValid(products);
// Dijalankan saat modul dievaluasi, sama seperti validator produk: data lini
// 100 gram yang rusak MENGGAGALKAN BUILD, bukan tayang (FR-43, ADR-09).
assertPicksValid(
  coffeePicks,
  products.map((product) => product.slug),
);

/* ------------------------------------------------------------------ */
/* Query / lookup                                                      */
/* ------------------------------------------------------------------ */

const productIndex: ReadonlyMap<string, Product> = new Map(
  products.map((product) => [product.slug, product]),
);

export function findProductBySlug(slug: string): Product | undefined {
  return productIndex.get(slug);
}

export function findSingleOriginBySlug(slug: string): Product | undefined {
  const product = productIndex.get(slug);
  return product?.category === "single-origin" ? product : undefined;
}

export function findHouseblendLineBySlug(slug: string): Product | undefined {
  const product = productIndex.get(slug);
  return product?.category === "houseblend" ? product : undefined;
}

export function findVariant(
  product: Product,
  variantId: string,
): Variant | undefined {
  return product.variants.find((variant) => variant.id === variantId);
}

/** Varian bawaan sebuah produk: yang termurah, agar harga tampil ramah (FR-11). */
export function defaultVariant(product: Product): Variant {
  return product.variants.reduce((cheapest, variant) =>
    variant.unitPrice < cheapest.unitPrice ? variant : cheapest,
  );
}

/**
 * Produk lain yang relevan untuk ditawarkan di akhir halaman detail (FR-02).
 *
 * Aturan urutan: tier yang SAMA lebih dulu supaya harga tetap koheren, lalu
 * ditambal dari tier lain sampai `limit` — Reguler hanya punya dua saudara
 * setier, dan bagian yang nyaris kosong lebih buruk daripada bagian yang
 * campur tier. Houseblend memakai dua lini sisanya apa adanya.
 *
 * Murni penyusunan ulang katalog: tidak ada fakta atau harga baru di sini.
 */
export function relatedProducts(product: Product, limit = 4): Product[] {
  if (product.category === "houseblend") {
    return houseblendProducts.filter((other) => other.slug !== product.slug);
  }
  const others = singleOriginProducts.filter(
    (other) => other.slug !== product.slug,
  );
  return [
    ...others.filter((other) => other.tier === product.tier),
    ...others.filter((other) => other.tier !== product.tier),
  ].slice(0, limit);
}

export function productsByTier(tier: Tier): Product[] {
  return singleOriginProducts.filter((product) => product.tier === tier);
}

/** Empat origin Signature untuk sorotan beranda (rute 1 pada Bagian 3.2). */
export const featuredSignature: Product[] = productsByTier("signature");

/** Kelompok siap render untuk `/katalog` (rute 2). */
export const catalogGroups: Array<{
  id: "single-origin-signature" | "single-origin-reguler" | "houseblend";
  title: string;
  subtitle: string;
  products: Product[];
}> = [
  {
    id: "single-origin-signature",
    title: "Single Origin — Signature",
    subtitle: "Indonesia Timur: Kupang dan Papua",
    products: productsByTier("signature"),
  },
  {
    id: "single-origin-reguler",
    title: "Single Origin — Reguler",
    subtitle: "Pilihan Nusantara: Sumatera dan Jawa",
    products: productsByTier("reguler"),
  },
  {
    id: "houseblend",
    title: "Houseblend",
    subtitle: "Dijual per kilogram, pemesanan mulai 0,5 kg",
    products: houseblendProducts,
  },
];

/* ------------------------------------------------------------------ */
/* Label dan tautan                                                    */
/* ------------------------------------------------------------------ */

/** "Single Origin, Signature" | "Houseblend BOLD" (Bagian 5.4). */
export function categoryLabel(product: Product): string {
  if (product.category === "single-origin" && product.tier) {
    return `Single Origin, ${TIER_LABEL[product.tier]}`;
  }
  return product.name;
}

/** Path kanonis sebuah produk. Dipakai sitemap, JSON-LD, dan keranjang. */
export function productHref(product: Product): string {
  return product.category === "single-origin"
    ? `/produk/${product.slug}`
    : `/houseblend/${product.slug}`;
}

/** Komposisi lini houseblend apa adanya dari brand brief (FR-27). */
export function houseblendComposition(slug: HouseblendLineSlug): string {
  const line = houseblendLineSource.find((item) => item.slug === slug);
  return line ? line.composition : "";
}

/** Seluruh path publik yang perlu masuk sitemap (FR-45). `/keranjang` tidak. */
export function productPaths(): string[] {
  return products.map(productHref);
}

/* ------------------------------------------------------------------ */
/* Indeks untuk keranjang                                              */
/* ------------------------------------------------------------------ */

/**
 * Bentuk katalog yang diserialkan Server Component `/keranjang` lalu dikirim
 * sebagai props ke Client Component. Ini yang membuat keranjang bisa
 * me-resolve harga TERKINI (ADR-04, NFR-12) tanpa Client Component pernah
 * mengimpor `@/data/*` (aturan ketergantungan nomor 4, NFR-03).
 *
 * Sengaja ramping: hanya medan yang benar-benar dipakai baris keranjang.
 */
export const PICK_CATEGORY_LABEL = "Katalog Kopi 100 gr";

/**
 * Entri keranjang untuk lini Katalog Kopi 100 gram (KD-07).
 *
 * Dirakit langsung menjadi `CartCatalogEntry`, tanpa melewati `Product`: lini
 * ini tidak punya data asal, dan `Product.origin` mewajibkan `province`. Lihat
 * catatan panjang di `src/data/picks.ts`.
 *
 * `href` menunjuk seksi di halaman katalog, bukan halaman produk tersendiri —
 * karena memang belum ada yang layak ditulis di halaman seperti itu.
 */
export const pickCartEntries: readonly CartCatalogEntry[] = coffeePicks.map(
  (pick) => ({
    slug: pick.slug,
    name: pick.name,
    categoryLabel: PICK_CATEGORY_LABEL,
    href: "/katalog#katalog-100-gram",
    variants: [
      {
        id: pickVariantId(pick.slug),
        label: `${PICK_GRAMS} gr`,
        unit: "gram-100" as const,
        unitPrice: pick.price,
        minQty: 1,
        step: 1,
      },
    ],
  }),
);

export const cartCatalogIndex: CartCatalogIndex = Object.fromEntries(
  [
    ...pickCartEntries.map(
      (entry): [string, CartCatalogEntry] => [entry.slug, entry],
    ),
    ...products.map((product): [string, CartCatalogEntry] => [
    product.slug,
    {
      slug: product.slug,
      name: product.name,
      categoryLabel: categoryLabel(product),
      href: productHref(product),
      variants: product.variants.map((variant) => ({
        id: variant.id,
        label: variant.label,
        unit: variant.unit,
        unitPrice: variant.unitPrice,
        ...(variant.pricePerKg !== undefined
          ? { pricePerKg: variant.pricePerKg }
          : {}),
        minQty: variant.minQty,
        step: variant.step,
      })),
    },
  ]),
  ],
);
