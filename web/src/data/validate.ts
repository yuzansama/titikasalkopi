/**
 * Titik Asal Kopi — VALIDASI DATA SAAT BUILD (FR-43, ADR-09).
 *
 * `assertCatalogValid()` dipanggil di lingkup modul `src/data/catalog.ts`.
 * Karena setiap rute statis mengimpor `catalog.ts`, modul ini pasti dievaluasi
 * di Node saat `next build`, sehingga `throw` di sini MENGGAGALKAN BUILD.
 * Tidak ada jalur build yang bisa melewatinya.
 *
 * Tanpa dependensi baru: tidak ada Zod, tidak ada Ajv, tidak ada skrip prebuild
 * terpisah (ADR-09, ADR-14).
 *
 * Daftar pemeriksaan V-01..V-15 mengikuti docs/03-architecture.md Bagian 5.6.
 * Pesan galat berbahasa Indonesia dan selalu menyebut slug produk beserta
 * medan yang bermasalah, karena pembacanya adalah owner atau BA yang
 * mendampinginya (BA-06, R-14).
 */

import type { Product, Tier } from "./types";

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const VALID_TIERS: readonly Tier[] = ["signature", "reguler"];

/** Hitungan pagar dari brand brief (V-15). */
export const EXPECTED_SINGLE_ORIGIN_COUNT = 7;
export const EXPECTED_HOUSEBLEND_LINE_COUNT = 3;
export const EXPECTED_HOUSEBLEND_VARIANT_COUNT = 9;

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Memeriksa seluruh katalog dan melempar satu Error berisi SELURUH pelanggaran
 * yang ditemukan, bukan hanya yang pertama. Owner jadi bisa memperbaiki semua
 * kesalahan dalam satu kali sunting, bukan satu build per kesalahan.
 */
export function assertCatalogValid(products: Product[]): void {
  const errors: string[] = [];
  const report = (slug: string, message: string, rule: string) => {
    errors.push(`[${rule}] ${slug}: ${message}`);
  };

  /* ---------------- V-01 slug unik di seluruh katalog ---------------- */
  const seenSlugs = new Set<string>();
  for (const product of products) {
    if (seenSlugs.has(product.slug)) {
      report(product.slug, "slug ganda di dalam katalog.", "V-01");
    }
    seenSlugs.add(product.slug);
  }

  for (const product of products) {
    const slug = product.slug;

    /* ---------------- V-02 bentuk slug ---------------- */
    if (!isNonEmptyString(slug) || !SLUG_PATTERN.test(slug)) {
      report(
        String(slug),
        "slug harus huruf kecil, angka, dan tanda hubung saja (pola ^[a-z0-9]+(-[a-z0-9]+)*$).",
        "V-02",
      );
    }

    /* ---------------- medan wajib produk ---------------- */
    if (!isNonEmptyString(product.name)) {
      report(slug, "medan `name` wajib diisi.", "V-03");
    }
    if (!isNonEmptyString(product.summary)) {
      report(slug, "medan `summary` wajib diisi (dipakai meta description, FR-44).", "V-03");
    }
    if (!isNonEmptyString(product.description)) {
      report(slug, "medan `description` wajib diisi.", "V-03");
    }
    if (product.status !== "available" && product.status !== "out-of-stock") {
      report(
        slug,
        `medan \`status\` bernilai "${String(product.status)}"; hanya "available" atau "out-of-stock" yang dikenal.`,
        "V-03",
      );
    }

    /* ---------------- V-03 minimal satu varian ---------------- */
    if (!Array.isArray(product.variants) || product.variants.length === 0) {
      report(
        slug,
        "produk tidak punya varian sama sekali; produk tanpa varian berarti produk tanpa harga (BR-04).",
        "V-03",
      );
      continue; // pemeriksaan varian berikutnya tidak relevan
    }

    /* ---------------- V-13 id varian unik dalam satu produk ---------------- */
    const seenVariantIds = new Set<string>();
    for (const variant of product.variants) {
      if (!isNonEmptyString(variant.id)) {
        report(slug, "ada varian tanpa `id`.", "V-13");
        continue;
      }
      if (seenVariantIds.has(variant.id)) {
        report(slug, `id varian "${variant.id}" muncul lebih dari sekali.`, "V-13");
      }
      seenVariantIds.add(variant.id);
    }

    for (const variant of product.variants) {
      const where = `varian "${variant.id}"`;

      if (!isNonEmptyString(variant.label)) {
        report(slug, `${where} tidak punya \`label\`.`, "V-04");
      }

      /* ---------------- V-04 harga bilangan bulat > 0 ---------------- */
      if (!isPositiveInteger(variant.unitPrice)) {
        report(
          slug,
          `${where} punya \`unitPrice\` = ${String(variant.unitPrice)}. Harga wajib bilangan bulat rupiah lebih besar dari nol (BR-03).`,
          "V-04",
        );
      }

      if (variant.unit === "half-kg") {
        if (!isPositiveInteger(variant.pricePerKg)) {
          report(
            slug,
            `${where} bersatuan half-kg tetapi \`pricePerKg\` = ${String(variant.pricePerKg)}. Harga per kg wajib bilangan bulat rupiah lebih besar dari nol (D-02).`,
            "V-04",
          );
        } else {
          /* ---------------- V-05 pricePerKg habis dibagi 1000 ---------------- */
          if (variant.pricePerKg % 1000 !== 0) {
            report(
              slug,
              `${where} punya \`pricePerKg\` = ${variant.pricePerKg} yang tidak habis dibagi 1.000. Harga per kg wajib kelipatan Rp1.000 supaya harga 0,5 kg pasti bilangan bulat (D-02, ADR-05).`,
              "V-05",
            );
          }
          /* ---------------- V-06 unitPrice = pricePerKg / 2 ---------------- */
          if (variant.unitPrice !== variant.pricePerKg / 2) {
            report(
              slug,
              `${where} punya \`unitPrice\` = ${variant.unitPrice}, seharusnya tepat setengah dari \`pricePerKg\` = ${variant.pricePerKg}, yaitu ${variant.pricePerKg / 2} (D-02).`,
              "V-06",
            );
          }
        }
      } else if (variant.pricePerKg !== undefined) {
        report(
          slug,
          `${where} bersatuan "${variant.unit}" tetapi mengisi \`pricePerKg\`. Medan itu hanya untuk satuan half-kg.`,
          "V-04",
        );
      }

      if (!isPositiveInteger(variant.minQty) || !isPositiveInteger(variant.step)) {
        report(
          slug,
          `${where} punya \`minQty\`/\`step\` yang bukan bilangan bulat positif; kuantitas selalu bilangan bulat satuan pesan (ADR-05).`,
          "V-04",
        );
      }
    }

    /* ---------------- V-07 / V-08 / V-09 tier dan line ---------------- */
    if (product.category === "single-origin") {
      if (product.tier === undefined) {
        report(slug, "single origin wajib punya `tier` (BR-09).", "V-07");
      } else if (!VALID_TIERS.includes(product.tier)) {
        report(
          slug,
          `\`tier\` bernilai "${String(product.tier)}"; hanya "signature" atau "reguler" yang dikenal.`,
          "V-09",
        );
      }
      if (product.line !== undefined) {
        report(
          slug,
          "single origin tidak boleh punya `line`; `line` hanya milik houseblend (BR-15).",
          "V-08",
        );
      }
      if (product.origin === undefined) {
        report(slug, "single origin wajib punya `origin` (FR-07).", "V-07");
      } else {
        if (!isNonEmptyString(product.origin.region)) {
          report(slug, "`origin.region` wajib diisi.", "V-07");
        }
        if (!isNonEmptyString(product.origin.province)) {
          report(
            slug,
            "`origin.province` wajib diisi; metadata SEO merakit judul dari sana (FR-44).",
            "V-07",
          );
        }
      }
    } else if (product.category === "houseblend") {
      if (product.tier !== undefined) {
        report(
          slug,
          'houseblend tidak boleh punya `tier`. Pada lini BRIGHT, "Signature" dan "Reguler" adalah nama varian, bukan tier (BR-15).',
          "V-07",
        );
      }
      if (product.line === undefined) {
        report(slug, "houseblend wajib punya `line`.", "V-08");
      }
      if (product.origin !== undefined) {
        report(
          slug,
          "houseblend adalah campuran dan tidak merujuk satu origin (BRD 10.1).",
          "V-08",
        );
      }
    } else {
      report(
        slug,
        `\`category\` bernilai "${String(product.category)}"; hanya "single-origin" atau "houseblend" yang dikenal.`,
        "V-09",
      );
    }

    /* ---------------- V-10 struktur varian single origin ---------------- */
    if (product.category === "single-origin") {
      const packs = product.variants.filter((v) => v.unit === "pack");
      const bundles = product.variants.filter((v) => v.unit === "paket");
      if (packs.length !== 1 || bundles.length !== 1) {
        report(
          slug,
          `single origin wajib punya tepat satu varian "pack" dan satu varian "paket"; ditemukan ${packs.length} pack dan ${bundles.length} paket (BR-08, BR-11, D-01).`,
          "V-10",
        );
      }
      if (packs[0] && packs[0].packsPerUnit !== 1) {
        report(
          slug,
          `varian "${packs[0].id}" bersatuan pack wajib \`packsPerUnit\` = 1, bukan ${String(packs[0].packsPerUnit)}.`,
          "V-10",
        );
      }
      if (bundles[0] && bundles[0].packsPerUnit !== 3) {
        report(
          slug,
          `varian "${bundles[0].id}" bersatuan paket wajib \`packsPerUnit\` = 3 (D-01: satu paket berisi tiga kemasan dari origin yang sama), bukan ${String(bundles[0].packsPerUnit)}.`,
          "V-10",
        );
      }

      /* ---------------- V-12 penghematan bundling positif ---------------- */
      if (packs[0] && bundles[0] && bundles[0].packsPerUnit) {
        const saving =
          packs[0].unitPrice * bundles[0].packsPerUnit - bundles[0].unitPrice;
        if (!(saving > 0)) {
          report(
            slug,
            `penghematan paket 3 pack bernilai ${saving}; seharusnya positif. Harga paket wajib lebih murah dari 3 x harga satuan (BR-10).`,
            "V-12",
          );
        }
      }
    }

    /* ---------------- V-14 alt gambar ---------------- */
    if (product.image !== null) {
      if (!isNonEmptyString(product.image.alt)) {
        report(slug, "`image.alt` wajib diisi bila ada foto (NFR-07).", "V-14");
      } else if (
        product.image.alt.trim().toLowerCase() === product.name.trim().toLowerCase()
      ) {
        report(
          slug,
          "`image.alt` tidak boleh sekadar mengulang nama produk; tulis deskripsi yang berguna bagi pembaca layar (NFR-07).",
          "V-14",
        );
      }
    }
  }

  /* ---------------- V-11 harga single origin seragam per tier ---------------- */
  const tierPriceIndex = new Map<string, { slug: string; price: number }>();
  for (const product of products) {
    if (product.category !== "single-origin" || product.tier === undefined) continue;
    for (const variant of product.variants) {
      const key = `${product.tier}:${variant.unit}`;
      const seen = tierPriceIndex.get(key);
      if (!seen) {
        tierPriceIndex.set(key, { slug: product.slug, price: variant.unitPrice });
      } else if (seen.price !== variant.unitPrice) {
        report(
          product.slug,
          `harga ${variant.unit} = ${variant.unitPrice} berbeda dari "${seen.slug}" yang bertier sama (${product.tier}) dengan harga ${seen.price}. Harga single origin ditentukan tier, bukan biji (BR-09).`,
          "V-11",
        );
      }
    }
  }

  /* ---------------- V-15 pagar hitungan katalog ---------------- */
  const singleOriginCount = products.filter(
    (p) => p.category === "single-origin",
  ).length;
  const houseblendProducts = products.filter((p) => p.category === "houseblend");
  const houseblendVariantCount = houseblendProducts.reduce(
    (total, p) => total + p.variants.length,
    0,
  );

  if (singleOriginCount !== EXPECTED_SINGLE_ORIGIN_COUNT) {
    errors.push(
      `[V-15] katalog: jumlah single origin ${singleOriginCount}, seharusnya ${EXPECTED_SINGLE_ORIGIN_COUNT} sesuai brand brief. Bila memang menambah atau menghapus produk, ubah juga EXPECTED_SINGLE_ORIGIN_COUNT di src/data/validate.ts.`,
    );
  }
  if (houseblendProducts.length !== EXPECTED_HOUSEBLEND_LINE_COUNT) {
    errors.push(
      `[V-15] katalog: jumlah lini houseblend ${houseblendProducts.length}, seharusnya ${EXPECTED_HOUSEBLEND_LINE_COUNT} sesuai brand brief.`,
    );
  }
  if (houseblendVariantCount !== EXPECTED_HOUSEBLEND_VARIANT_COUNT) {
    errors.push(
      `[V-15] katalog: jumlah varian houseblend ${houseblendVariantCount}, seharusnya ${EXPECTED_HOUSEBLEND_VARIANT_COUNT} (6 rasio BOLD + 2 BRIGHT + 1 Full Robusta).`,
    );
  }

  if (errors.length > 0) {
    throw new Error(
      [
        "",
        "==================================================================",
        " VALIDASI KATALOG GAGAL (FR-43) — build dihentikan.",
        ` Ditemukan ${errors.length} masalah pada data produk.`,
        " Perbaiki di web/src/data/products.ts lalu build ulang.",
        " Panduan lengkap: docs/05-backend.md",
        "==================================================================",
        ...errors.map((message, index) => ` ${index + 1}. ${message}`),
        "==================================================================",
        "",
      ].join("\n"),
    );
  }
}
