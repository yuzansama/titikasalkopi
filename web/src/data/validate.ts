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

import type { Product, Tier, Variant } from "./types";

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const VALID_TIERS: readonly Tier[] = ["signature", "reguler"];

/** Hitungan pagar dari brand brief (V-15). */
export const EXPECTED_SINGLE_ORIGIN_COUNT = 8;
export const EXPECTED_HOUSEBLEND_LINE_COUNT = 3;
export const EXPECTED_HOUSEBLEND_VARIANT_COUNT = 18;

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

      /* ---------------- V-05 harga kemasan 1 kg kelipatan Rp1.000 ----------
         Bukan aturan bisnis, melainkan jaring pengaman ketikan: harga kemasan
         besar yang berakhiran angka ganjil hampir selalu salah ketik, dan pada
         katalog ini semuanya bulat ribuan. */
      if (variant.unit === "kg" && variant.unitPrice % 1000 !== 0) {
        report(
          slug,
          `${where} punya \`unitPrice\` = ${variant.unitPrice} yang tidak habis dibagi 1.000. Harga kemasan 1 kg wajib kelipatan Rp1.000 (ADR-05).`,
          "V-05",
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
      /* ---------------- V-06 pasangan ukuran kemasan houseblend ----------
         Sejak 9 September 2026 setiap rasio dijual dalam dua ukuran, dan
         keduanya punya harga tersimpan sendiri. Yang dulu dijamin aritmetika
         (`harga 0,5 kg == harga per kg / 2`) sekarang harus dijamin di sini.

         Dua batas, dan keduanya melindungi hal yang berbeda:

         - Dua kemasan 0,5 kg wajib LEBIH MAHAL daripada satu kemasan 1 kg.
           Kalau tidak, kemasan besar kehilangan alasan untuk ada, dan pembeli
           yang menghitung akan selalu memesan yang kecil.
         - Satu kemasan 0,5 kg wajib LEBIH MURAH daripada kemasan 1 kg. Kalau
           tidak, halaman yang sama menawarkan kemasan lebih kecil dengan harga
           lebih tinggi, dan pembeli wajar menyimpulkan situsnya salah harga. */
      const groups = new Map<string, Variant[]>();
      for (const variant of product.variants) {
        if (!variant.groupId) continue;
        groups.set(variant.groupId, [
          ...(groups.get(variant.groupId) ?? []),
          variant,
        ]);
      }
      for (const [groupId, variants] of groups) {
        const kg = variants.find((v) => v.unit === "kg");
        const halfKg = variants.find((v) => v.unit === "half-kg");
        if (!kg || !halfKg || variants.length !== 2) {
          report(
            slug,
            `kelompok ukuran "${groupId}" wajib berisi tepat satu kemasan 1 kg dan satu kemasan 0,5 kg; ditemukan ${variants.length} varian.`,
            "V-06",
          );
          continue;
        }
        if (halfKg.unitPrice * 2 <= kg.unitPrice) {
          report(
            slug,
            `pada "${groupId}", dua kemasan 0,5 kg berharga ${halfKg.unitPrice * 2} — tidak lebih mahal daripada satu kemasan 1 kg (${kg.unitPrice}). Kemasan 1 kg jadi tidak punya alasan untuk ada.`,
            "V-06",
          );
        }
        if (halfKg.unitPrice >= kg.unitPrice) {
          report(
            slug,
            `pada "${groupId}", kemasan 0,5 kg berharga ${halfKg.unitPrice} — tidak lebih murah daripada kemasan 1 kg (${kg.unitPrice}).`,
            "V-06",
          );
        }
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

      /* ---------------- V-10b kemasan mini 100 gr ----------------
         Opsional: lembar "Product" tidak memberi Sindoro kemasan mini. Tetapi
         bila ada, ia wajib lebih murah dari kemasan 200 gr — kalau tidak,
         halaman produk menawarkan kemasan lebih kecil dengan harga lebih
         tinggi, dan pengunjung wajar menyimpulkan situsnya salah harga. */
      const minis = product.variants.filter((v) => v.unit === "gram-100");
      if (minis.length > 1) {
        report(
          slug,
          `ditemukan ${minis.length} varian kemasan 100 gr; satu produk hanya boleh punya satu.`,
          "V-10",
        );
      }
      if (minis[0] && packs[0] && minis[0].unitPrice >= packs[0].unitPrice) {
        report(
          slug,
          `kemasan 100 gr berharga ${minis[0].unitPrice}, tidak lebih murah dari kemasan 200 gr (${packs[0].unitPrice}).`,
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

/**
 * V-20 — lini Katalog Kopi 100 gram (KD-07).
 *
 * Lini ini tidak melewati `assertCatalogValid` karena ia bukan `Product`, jadi
 * invariannya diperiksa di sini. Yang paling berbahaya adalah slug bertabrakan
 * dengan produk: `cartCatalogIndex` dirakit dari kedua daftar, dan yang belakangan
 * menang secara diam-diam — pengunjung akan menambahkan satu barang lalu melihat
 * barang lain beserta harga lain di keranjang.
 */
export function assertPicksValid(
  picks: readonly { slug: string; name: string; price: number }[],
  productSlugs: readonly string[],
): void {
  const errors: string[] = [];
  const taken = new Set(productSlugs);
  const seen = new Set<string>();

  for (const pick of picks) {
    if (!SLUG_PATTERN.test(pick.slug)) {
      errors.push(`[V-20] ${pick.slug}: bentuk slug tidak sah.`);
    }
    if (seen.has(pick.slug)) {
      errors.push(`[V-20] ${pick.slug}: slug ganda di dalam lini 100 gram.`);
    }
    seen.add(pick.slug);

    if (taken.has(pick.slug)) {
      errors.push(
        `[V-20] ${pick.slug}: slug bentrok dengan produk 200 gram. ` +
          `Keranjang akan menampilkan barang dan harga yang salah.`,
      );
    }
    if (!isNonEmptyString(pick.name)) {
      errors.push(`[V-20] ${pick.slug}: nama kosong.`);
    }
    if (!Number.isInteger(pick.price) || pick.price <= 0) {
      errors.push(
        `[V-20] ${pick.slug}: harga wajib bilangan bulat positif (BR-03).`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      ["Katalog Kopi 100 gram tidak sah:", ...errors.map((e) => `  ${e}`)].join(
        "\n",
      ),
    );
  }
}
