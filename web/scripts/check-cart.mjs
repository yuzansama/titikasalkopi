/**
 * Pemeriksaan reducer, penyimpanan, dan resolusi keranjang.
 *
 * Jalankan dari folder `web/`:  node scripts/check-cart.mjs
 *
 * Yang diuji di sini adalah logika yang paling mahal bila salah: uang,
 * kuantitas, dan penanganan data basi. Cakupan mengikuti daftar wajib pada
 * D-02 (catatan untuk QA) dan ADR-04.
 */

import assert from "node:assert/strict";
import { check, loadTs, summary } from "./_ts-load.mjs";

const reducer = await loadTs("src/features/cart/cart-reducer.ts");
const storage = await loadTs("src/features/cart/cart-storage.ts");
const selectors = await loadTs("src/features/cart/cart-selectors.ts");
const catalog = await loadTs("src/data/catalog.ts");

const { cartReducer, EMPTY_CART, lineKey, MAX_NOTE_LENGTH, MAX_QTY_PER_LINE } =
  reducer;
const { parseStoredCart, CART_TTL_MS } = storage;
const { resolveCart, catalogValidKeys } = selectors;

console.log("Pemeriksaan keranjang — reducer, penyimpanan, resolusi harga\n");

/* ---------------------------------------------------------------- */
/* D-02 — harga 0,5 kg tepat setengah untuk kesembilan varian        */
/* ---------------------------------------------------------------- */

const EXPECTED_HALF_KG = [
  ["bold-70-30", 210_000, 105_000],
  ["bold-60-40", 200_000, 100_000],
  ["bold-50-50", 195_000, 97_500],
  ["bold-40-60", 190_000, 95_000],
  ["bold-30-70", 185_000, 92_500],
  ["bold-20-80", 175_000, 87_500],
  ["bright-signature", 260_000, 130_000],
  ["bright-reguler", 230_000, 115_000],
  ["full-robusta", 175_000, 87_500],
];

const houseblendVariants = catalog.houseblendProducts.flatMap((p) => p.variants);

check("katalog memuat tepat sembilan varian houseblend", () => {
  assert.equal(houseblendVariants.length, 9);
});

for (const [id, perKg, perHalfKg] of EXPECTED_HALF_KG) {
  check(`${id}: ${perKg} per kg -> ${perHalfKg} per 0,5 kg (tepat setengah)`, () => {
    const variant = houseblendVariants.find((v) => v.id === id);
    assert.ok(variant, `varian ${id} tidak ditemukan di katalog`);
    assert.equal(variant.unit, "half-kg");
    assert.equal(variant.pricePerKg, perKg);
    assert.equal(variant.unitPrice, perHalfKg);
    assert.equal(variant.unitPrice * 2, variant.pricePerKg);
    assert.ok(Number.isInteger(variant.unitPrice), "harga wajib bilangan bulat");
  });
}

check("contoh FR-21: BOLD 60:40 sebanyak 5 kg = Rp1.000.000", () => {
  const variant = houseblendVariants.find((v) => v.id === "bold-60-40");
  assert.equal(10 * variant.unitPrice, 1_000_000);
});

check("contoh FR-21: BOLD 50:50 sebanyak 1,5 kg = Rp292.500", () => {
  const variant = houseblendVariants.find((v) => v.id === "bold-50-50");
  assert.equal(3 * variant.unitPrice, 292_500);
});

check("BR-10: penghematan bundling Signature Rp25.000, Reguler Rp20.000", () => {
  const signature = catalog.productsByTier("signature")[0];
  const reguler = catalog.productsByTier("reguler")[0];
  assert.equal(catalog.bundleSaving(signature), 25_000);
  assert.equal(catalog.bundleSaving(reguler), 20_000);
});

/* ---------------------------------------------------------------- */
/* Reducer                                                            */
/* ---------------------------------------------------------------- */

check("FR-16: menambah varian yang sama menambah jumlah, bukan baris baru", () => {
  let state = cartReducer(EMPTY_CART, {
    type: "ADD_ITEM",
    slug: "abmisibil",
    variantId: "abmisibil-pack1",
    qty: 2,
  });
  state = cartReducer(state, {
    type: "ADD_ITEM",
    slug: "abmisibil",
    variantId: "abmisibil-pack1",
    qty: 3,
  });
  assert.equal(state.items.length, 1);
  assert.equal(state.items[0].qty, 5);
});

check("varian berbeda pada produk sama menghasilkan dua baris", () => {
  let state = cartReducer(EMPTY_CART, {
    type: "ADD_ITEM",
    slug: "abmisibil",
    variantId: "abmisibil-pack1",
    qty: 1,
  });
  state = cartReducer(state, {
    type: "ADD_ITEM",
    slug: "abmisibil",
    variantId: "abmisibil-pack3",
    qty: 1,
  });
  assert.equal(state.items.length, 2);
});

check("kuantitas pecahan dan NaN dijepit ke bilangan bulat 1..99", () => {
  const fractional = cartReducer(EMPTY_CART, {
    type: "ADD_ITEM",
    slug: "bold",
    variantId: "bold-60-40",
    qty: 2.7,
  });
  assert.equal(fractional.items[0].qty, 2);

  const nan = cartReducer(EMPTY_CART, {
    type: "ADD_ITEM",
    slug: "bold",
    variantId: "bold-60-40",
    qty: Number.NaN,
  });
  assert.equal(nan.items[0].qty, 1);

  const huge = cartReducer(EMPTY_CART, {
    type: "ADD_ITEM",
    slug: "bold",
    variantId: "bold-60-40",
    qty: 5000,
  });
  assert.equal(huge.items[0].qty, MAX_QTY_PER_LINE);
});

check("FR-18: SET_QTY dengan nilai <= 0 menghapus baris", () => {
  const added = cartReducer(EMPTY_CART, {
    type: "ADD_ITEM",
    slug: "sabin",
    variantId: "sabin-pack1",
    qty: 2,
  });
  const removed = cartReducer(added, {
    type: "SET_QTY",
    slug: "sabin",
    variantId: "sabin-pack1",
    qty: 0,
  });
  assert.equal(removed.items.length, 0);
});

check("FR-23: catatan dipotong tepat 200 karakter", () => {
  const state = cartReducer(EMPTY_CART, {
    type: "SET_NOTE",
    note: "x".repeat(500),
  });
  assert.equal(state.note.length, MAX_NOTE_LENGTH);
});

check("PRUNE membuang baris yang kuncinya tidak ada di katalog", () => {
  let state = cartReducer(EMPTY_CART, {
    type: "ADD_ITEM",
    slug: "abmisibil",
    variantId: "abmisibil-pack1",
    qty: 1,
  });
  state = cartReducer(state, {
    type: "ADD_ITEM",
    slug: "produk-yang-sudah-dihapus",
    variantId: "varian-hantu",
    qty: 1,
  });
  const validKeys = new Set(catalogValidKeys(catalog.cartCatalogIndex));
  const pruned = cartReducer(state, { type: "PRUNE", validKeys });
  assert.equal(pruned.items.length, 1);
  assert.equal(pruned.items[0].slug, "abmisibil");
});

check("lineKey berbentuk slug::variantId", () => {
  assert.equal(lineKey("abmisibil", "abmisibil-pack3"), "abmisibil::abmisibil-pack3");
});

/* ---------------------------------------------------------------- */
/* Penyimpanan — seluruh keadaan tidak normal (Bagian 6.2)           */
/* ---------------------------------------------------------------- */

const now = Date.UTC(2026, 8, 7, 10, 0, 0);
const fresh = (items, note = "") =>
  JSON.stringify({ v: 1, items, note, updatedAt: now - 1000 });

check("localStorage kosong menghasilkan keranjang kosong", () => {
  assert.deepEqual(parseStoredCart(null, now), {
    items: [],
    note: "",
    updatedAt: 0,
  });
});

check("JSON rusak tidak melempar, menghasilkan keranjang kosong", () => {
  assert.doesNotThrow(() => parseStoredCart('{"v":1,"items":[', now));
  assert.equal(parseStoredCart('{"v":1,"items":[', now).items.length, 0);
});

check("versi skema tidak dikenal dibuang (lebih tua maupun lebih baru)", () => {
  const older = JSON.stringify({ v: 0, items: [], note: "", updatedAt: now });
  const newer = JSON.stringify({ v: 2, items: [], note: "", updatedAt: now });
  assert.equal(parseStoredCart(older, now).updatedAt, 0);
  assert.equal(parseStoredCart(newer, now).updatedAt, 0);
});

check("FR-20: keranjang lebih dari 7 hari dikosongkan", () => {
  const stale = JSON.stringify({
    v: 1,
    items: [{ slug: "abmisibil", variantId: "abmisibil-pack1", qty: 1 }],
    note: "",
    updatedAt: now - CART_TTL_MS - 1,
  });
  assert.equal(parseStoredCart(stale, now).items.length, 0);

  const justInside = JSON.stringify({
    v: 1,
    items: [{ slug: "abmisibil", variantId: "abmisibil-pack1", qty: 1 }],
    note: "",
    updatedAt: now - CART_TTL_MS + 1000,
  });
  assert.equal(parseStoredCart(justInside, now).items.length, 1);
});

check("item bentuknya salah dibuang, item sah dipertahankan", () => {
  const mixed = fresh([
    { slug: "abmisibil", variantId: "abmisibil-pack1", qty: 1 },
    { slug: "bold", variantId: "bold-60-40", qty: 1.5 },
    { slug: 42, variantId: "x", qty: 1 },
    { slug: "sabin", variantId: "sabin-pack1", qty: 0 },
    null,
  ]);
  const parsed = parseStoredCart(mixed, now);
  assert.equal(parsed.items.length, 1);
  assert.equal(parsed.items[0].slug, "abmisibil");
});

/* ---------------------------------------------------------------- */
/* Resolusi harga (ADR-04) — inti NFR-12                             */
/* ---------------------------------------------------------------- */

const index = catalog.cartCatalogIndex;

check("ADR-04: slug tidak dikenal dibuang tanpa melempar", () => {
  let resolved;
  assert.doesNotThrow(() => {
    resolved = resolveCart(
      [
        { slug: "abmisibil", variantId: "abmisibil-pack3", qty: 1 },
        { slug: "kopi-yang-tidak-ada", variantId: "apa-saja", qty: 3 },
      ],
      "",
      index,
    );
  });
  assert.equal(resolved.lines.length, 1);
  assert.equal(resolved.droppedCount, 1);
  assert.equal(resolved.subtotal, 350_000);
});

check("varianId tidak dikenal pada produk yang ada juga dibuang", () => {
  const resolved = resolveCart(
    [{ slug: "abmisibil", variantId: "varian-lama-yang-dihapus", qty: 2 }],
    "",
    index,
  );
  assert.equal(resolved.lines.length, 0);
  assert.equal(resolved.droppedCount, 1);
  assert.equal(resolved.subtotal, 0);
});

check("keranjang kosong menghasilkan subtotal 0 tanpa melempar", () => {
  const resolved = resolveCart([], "", index);
  assert.equal(resolved.itemCount, 0);
  assert.equal(resolved.subtotal, 0);
  assert.equal(resolved.droppedCount, 0);
});

check("subtotal contoh Bagian 7.4: 3 pack Abmisibil + 5 kg BOLD = Rp1.350.000", () => {
  const resolved = resolveCart(
    [
      { slug: "abmisibil", variantId: "abmisibil-pack3", qty: 1 },
      { slug: "bold", variantId: "bold-60-40", qty: 10 },
    ],
    "",
    index,
  );
  assert.equal(resolved.subtotal, 1_350_000);
  assert.equal(resolved.itemCount, 11);
  assert.equal(resolved.lines[1].pricePerKg, 200_000);
  assert.ok(Number.isInteger(resolved.subtotal));
});

/**
 * Angkanya sengaja tetap eksplisit, bukan diturunkan dari `index` — kalau
 * dihitung dari data yang sedang diuji, katalog yang menyusut diam-diam akan
 * tetap lulus.
 *
 *   23 varian produk 200 gr dan houseblend
 * + 18 varian lini Katalog Kopi 100 gram (KD-07)
 */
const EXPECTED_PRODUCT_VARIANTS = 23;
const EXPECTED_PICK_VARIANTS = 18;
const EXPECTED_VARIANT_COUNT = EXPECTED_PRODUCT_VARIANTS + EXPECTED_PICK_VARIANTS;

check("seluruh subtotal baris bilangan bulat untuk setiap varian katalog", () => {
  const items = Object.values(index).flatMap((entry) =>
    entry.variants.map((variant) => ({
      slug: entry.slug,
      variantId: variant.id,
      qty: 3,
    })),
  );
  const resolved = resolveCart(items, "", index);
  assert.equal(resolved.lines.length, EXPECTED_VARIANT_COUNT);
  for (const line of resolved.lines) {
    assert.ok(
      Number.isInteger(line.lineTotal),
      `${line.slug}/${line.variantId} menghasilkan ${line.lineTotal}`,
    );
    assert.equal(line.lineTotal, line.qty * line.unitPrice);
  }
});

check(`catalogValidKeys mencakup seluruh ${EXPECTED_VARIANT_COUNT} varian katalog`, () => {
  assert.equal(catalogValidKeys(index).length, EXPECTED_VARIANT_COUNT);
});

summary("Keranjang");
