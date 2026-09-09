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
const { managedCatalog } = await loadTs("src/data/managed.generated.ts");

const { cartReducer, EMPTY_CART, lineKey, MAX_NOTE_LENGTH, MAX_QTY_PER_LINE } =
  reducer;
const { parseStoredCart, CART_TTL_MS } = storage;
const { resolveCart, catalogValidKeys } = selectors;

console.log("Pemeriksaan keranjang — reducer, penyimpanan, resolusi harga\n");

/* ---------------------------------------------------------------- */
/* Harga: INVARIAN, bukan nilai                                       */
/*                                                                    */
/* Berkas ini dijalankan workflow sinkronisasi katalog SEBELUM ia      */
/* meng-commit harga baru dari sheet owner. Karena itu ia TIDAK BOLEH  */
/* memuat satu pun harga sebagai angka harfiah: owner mengubah harga   */
/* di sheet, pemeriksaan menolak, dan fitur "owner urus harga sendiri" */
/* memblokir dirinya sendiri.                                         */
/*                                                                    */
/* Yang dijaga di sini adalah hubungan antar angka, yang tetap benar   */
/* berapa pun harganya. Ini juga pelajaran 9 September 2026: cacat     */
/* harga hari itu lolos justru karena pemeriksaannya berisi nilai      */
/* harfiah, lalu nilai itu diperbarui agar cocok dengan keluaran yang  */
/* salah. Invarian tidak bisa "diperbarui agar cocok".                 */
/* ---------------------------------------------------------------- */

const houseblendVariants = catalog.houseblendProducts.flatMap((p) => p.variants);

check("katalog memuat 18 varian houseblend: 9 rasio x 2 ukuran kemasan", () => {
  assert.equal(houseblendVariants.length, 18);
  const kg = houseblendVariants.filter((v) => v.unit === "kg");
  const half = houseblendVariants.filter((v) => v.unit === "half-kg");
  assert.equal(kg.length, 9);
  assert.equal(half.length, 9);
});

check("setiap varian houseblend punya TEPAT SATU harga", () => {
  // Medan `pricePerKg` dihapus 9 September 2026. Selama ia ada, antarmuka
  // menampilkan satu angka dan menagih angka lain. Pemeriksaan ini menahannya
  // agar tidak pernah kembali lewat pintu belakang.
  for (const variant of houseblendVariants) {
    assert.equal(
      variant.pricePerKg,
      undefined,
      `${variant.id} membawa harga kedua; satu varian hanya boleh punya satu harga`,
    );
    assert.ok(Number.isInteger(variant.unitPrice) && variant.unitPrice > 0);
  }
});

check("kedua ukuran kemasan setiap rasio saling masuk akal", () => {
  for (const product of catalog.houseblendProducts) {
    const groups = catalog.houseblendSizeGroups(product);
    assert.ok(groups.length > 0, `${product.slug} tidak punya kelompok ukuran`);
    for (const group of groups) {
      // Kemasan kecil lebih murah daripada kemasan besar...
      assert.ok(
        group.halfKg.unitPrice < group.kg.unitPrice,
        `${group.id}: kemasan 0,5 kg tidak lebih murah daripada kemasan 1 kg`,
      );
      // ...tetapi dua kemasan kecil lebih mahal daripada satu kemasan besar,
      // kalau tidak kemasan 1 kg kehilangan alasan untuk ada.
      assert.ok(
        group.halfKg.unitPrice * 2 > group.kg.unitPrice,
        `${group.id}: dua kemasan 0,5 kg tidak lebih mahal daripada satu kemasan 1 kg`,
      );
      assert.ok(catalog.packSaving(group) > 0);
    }
  }
});

/**
 * Batas kewajaran harga PER GRAM, per jenis kemasan.
 *
 * Ini bukan aturan bisnis dan bukan daftar harga: ia jaring pengaman terhadap
 * salah ketik nol, yang tetap bekerja ketika owner mengubah harga. Satu nol
 * kelebihan menggeser harga per gram sepuluh kali lipat dan pasti keluar dari
 * pitanya; kenaikan harga yang wajar tidak.
 *
 * Pitanya dibedakan per jenis kemasan karena harga per gram memang berbeda
 * jauh antar lini: houseblend robusta curah Rp180/gram, sementara Panama pada
 * lini 100 gram Rp2.700/gram. Satu pita untuk semuanya akan terlalu longgar
 * untuk menangkap apa pun.
 *
 * TINJAU ULANG bila lini produk baru masuk dengan struktur harga yang berbeda.
 */
const GRAMS_PER_UNIT = {
  pack: 200,
  paket: 600,
  kg: 1000,
  "half-kg": 500,
  "gram-100": 100,
};
const PRICE_PER_GRAM_BAND = {
  pack: [400, 1200],
  paket: [400, 1200],
  kg: [120, 400],
  "half-kg": [150, 500],
  "gram-100": [400, 3500],
};

check("harga per gram setiap varian berada di pita wajar jenis kemasannya", () => {
  for (const entry of Object.values(catalog.cartCatalogIndex)) {
    for (const variant of entry.variants) {
      const grams = GRAMS_PER_UNIT[variant.unit];
      const [min, max] = PRICE_PER_GRAM_BAND[variant.unit];
      assert.ok(grams, `satuan "${variant.unit}" belum punya berat`);
      const perGram = variant.unitPrice / grams;
      assert.ok(
        perGram >= min && perGram <= max,
        `${entry.slug}/${variant.id}: Rp${variant.unitPrice} untuk ${grams} gram ` +
          `= Rp${perGram.toFixed(0)}/gram, di luar pita Rp${min}-Rp${max}. ` +
          `Periksa jumlah nolnya.`,
      );
    }
  }
});

check("BR-10: paket 3 pack selalu lebih murah daripada 3 x harga satuan", () => {
  for (const product of catalog.singleOriginProducts) {
    const saving = catalog.bundleSaving(product);
    assert.ok(saving !== null, `${product.slug} tidak punya paket 3 pack`);
    assert.ok(saving > 0, `${product.slug}: penghematan paket ${saving}`);
  }
});

check("kemasan mini 100 gr: tujuh biji punya, Sindoro tidak", () => {
  const withMini = catalog.singleOriginProducts.filter((product) =>
    product.variants.some((variant) => variant.unit === "gram-100"),
  );
  assert.equal(withMini.length, 7);
  assert.equal(
    catalog
      .findSingleOriginBySlug("sindoro")
      .variants.some((variant) => variant.unit === "gram-100"),
    false,
  );
  // Kemasan kecil lebih mahal per gram, tetapi lebih murah per kemasan (BR-09
  // tetap berlaku: harga ditentukan tier, bukan biji).
  for (const product of withMini) {
    const mini = product.variants.find((v) => v.unit === "gram-100");
    const pack = product.variants.find((v) => v.unit === "pack");
    assert.ok(mini.unitPrice < pack.unitPrice, `${product.slug}: mini >= 200 gr`);
    assert.ok(mini.unitPrice * 2 > pack.unitPrice, `${product.slug}: mini terlalu murah`);
  }
});

/* ---------------------------------------------------------------- */
/* FR-14 — status stok yang benar-benar berpengaruh                   */
/* ---------------------------------------------------------------- */

check("FR-14: setiap produk membawa status yang dikenal", () => {
  for (const product of catalog.products) {
    assert.ok(
      product.status === "available" || product.status === "out-of-stock",
      `${product.slug} berstatus "${product.status}"`,
    );
  }
});

/**
 * DEF-15 — barang yang ditandai kosong TIDAK boleh ikut terkirim.
 *
 * Perbaikan pertama FR-14 hanya menahan penambahan BARU: halaman produk
 * menolak, tetapi keranjang yang sudah berisi barang itu tetap menghitungnya,
 * memasukkannya ke pesan WhatsApp, dan lewat KD-06 menuliskannya sebagai baris
 * pesanan sungguhan di buku order. Keranjang bertahan tujuh hari, jadi jendela
 * antara owner menandai kosong dan pembeli menekan kirim bukan teoretis.
 *
 * Diuji dengan indeks buatan, bukan dengan mengubah katalog sungguhan: yang
 * diperiksa adalah PERILAKUNYA saat ada barang kosong, dan itu harus benar
 * berapa pun isi tab stok hari ini.
 */
check("DEF-15: baris berstok kosong tetap tampil tetapi tidak ikut dipesan", () => {
  const index = {
    ada: {
      slug: "ada",
      name: "Kopi Ada",
      categoryLabel: "Single Origin, Reguler",
      href: "/produk/ada",
      status: "available",
      variants: [
        { id: "ada-pack1", label: "1 pack", unit: "pack", unitPrice: 100_000, minQty: 1, step: 1 },
      ],
    },
    habis: {
      slug: "habis",
      name: "Kopi Habis",
      categoryLabel: "Single Origin, Reguler",
      href: "/produk/habis",
      status: "out-of-stock",
      variants: [
        { id: "habis-pack1", label: "1 pack", unit: "pack", unitPrice: 200_000, minQty: 1, step: 1 },
      ],
    },
  };

  const cart = resolveCart(
    [
      { slug: "ada", variantId: "ada-pack1", qty: 2 },
      { slug: "habis", variantId: "habis-pack1", qty: 3 },
    ],
    "",
    index,
  );

  // Tetap tampil — dibuang diam-diam membuat pembeli mengira keranjang rusak.
  assert.equal(cart.lines.length, 2);
  assert.equal(cart.droppedCount, 0);
  assert.equal(cart.soldOutCount, 1);
  assert.equal(cart.lines.find((l) => l.slug === "habis").soldOut, true);
  assert.equal(cart.lines.find((l) => l.slug === "ada").soldOut, false);

  // Tetapi tidak ikut dihitung, dan tidak ikut dikirim.
  assert.equal(cart.orderableLines.length, 1);
  assert.equal(cart.orderableLines[0].slug, "ada");
  assert.equal(cart.subtotal, 200_000, "barang kosong ikut subtotal");
  assert.equal(cart.itemCount, 2, "barang kosong ikut jumlah item");
});

check("DEF-15: keranjang yang isinya kosong semua tidak bisa dipesan", () => {
  const index = {
    habis: {
      slug: "habis",
      name: "Kopi Habis",
      categoryLabel: "Single Origin, Reguler",
      href: "/produk/habis",
      status: "out-of-stock",
      variants: [
        { id: "habis-pack1", label: "1 pack", unit: "pack", unitPrice: 200_000, minQty: 1, step: 1 },
      ],
    },
  };
  const cart = resolveCart([{ slug: "habis", variantId: "habis-pack1", qty: 1 }], "", index);
  // Tombol pesan menonaktifkan diri saat daftar yang dikirim kosong, jadi
  // inilah yang menahan checkout — tanpa cabang khusus di komponennya.
  assert.equal(cart.orderableLines.length, 0);
  assert.equal(cart.subtotal, 0);
});

check("DEF-15: setiap entri indeks keranjang membawa status", () => {
  // Medan inilah yang hilang dan membuat kebocoran itu mungkin. Kalau ia
  // hilang lagi, `soldOut` diam-diam menjadi false untuk semua barang.
  for (const entry of Object.values(catalog.cartCatalogIndex)) {
    assert.ok(
      entry.status === "available" || entry.status === "out-of-stock",
      `entri "${entry.slug}" tidak membawa status`,
    );
  }
});

check("FR-14: status owner sampai ke produk, bukan berhenti di data", () => {
  // Sampai 9 September 2026 `status` mengalir ke `Product` lalu tidak dibaca
  // satu komponen pun: owner menandai kosong di sheet, memercayainya, dan situs
  // tetap menerima pesanan. Pemeriksaan ini menjaga rantainya tetap tersambung
  // dari sheet sampai ke tipe yang dipakai UI.
  const managed = catalog.products.map((product) => product.slug);
  for (const slug of Object.keys(managedCatalog.stok)) {
    assert.ok(
      managed.includes(slug),
      `slug "${slug}" ada di tab stok tetapi bukan produk mana pun`,
    );
  }
  for (const product of catalog.products) {
    assert.equal(
      product.status,
      managedCatalog.stok[product.slug] ?? "available",
      `${product.slug}: status di katalog tidak sama dengan tab stok`,
    );
  }
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
  assert.equal(resolved.subtotal, resolved.lines[0].lineTotal);
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

/**
 * INVARIAN UANG — pemeriksaan yang seharusnya ada sejak awal.
 *
 * Cacat 9 September 2026 lolos karena setiap pemeriksaan menegaskan sebuah
 * NILAI ("subtotal 1.150.000"), dan nilai itu diperbarui agar cocok dengan
 * keluaran yang sudah salah. Yang berikut ini menegaskan HUBUNGANNYA: berapa
 * pun harganya, jumlah kemasan dikalikan harga satu kemasan wajib sama dengan
 * subtotal baris, dan jumlah seluruh baris wajib sama dengan subtotal pesanan.
 *
 * Dijalankan atas keranjang campuran yang memuat setiap jenis kemasan yang
 * dijual situs, karena di situlah satuan bisa tertukar diam-diam.
 */
check("qty x harga satuan == subtotal baris, dan jumlah baris == subtotal pesanan", () => {
  const oneOfEachUnit = [];
  const seenUnits = new Set();
  for (const entry of Object.values(index)) {
    for (const variant of entry.variants) {
      if (seenUnits.has(variant.unit)) continue;
      seenUnits.add(variant.unit);
      oneOfEachUnit.push({ slug: entry.slug, variantId: variant.id, qty: 3 });
    }
  }
  assert.equal(seenUnits.size, 5, "belum semua jenis kemasan terwakili");

  const resolved = resolveCart(oneOfEachUnit, "", index);
  assert.equal(resolved.lines.length, oneOfEachUnit.length);

  let expected = 0;
  for (const line of resolved.lines) {
    assert.equal(
      line.lineTotal,
      line.qty * line.unitPrice,
      `${line.slug}/${line.variantId}: subtotal baris tidak sama dengan qty x harga satuan`,
    );
    assert.ok(Number.isInteger(line.lineTotal));
    expected += line.lineTotal;
  }
  assert.equal(resolved.subtotal, expected);
  assert.equal(
    resolved.itemCount,
    oneOfEachUnit.reduce((total, item) => total + item.qty, 0),
  );
});

check("tidak ada baris keranjang yang membawa harga kedua", () => {
  // `pricePerKg` dihapus dari `ResolvedCartLine` 9 September 2026. Selama ia
  // ada, keranjang menampilkan tarif di sebelah total yang dihitung dari harga
  // lain, dan pembeli yang mengalikan mendapat angka yang bukan tagihannya.
  const all = Object.values(index).flatMap((entry) =>
    entry.variants.map((variant) => ({
      slug: entry.slug,
      variantId: variant.id,
      qty: 2,
    })),
  );
  for (const line of resolveCart(all, "", index).lines) {
    assert.equal(line.pricePerKg, undefined, `${line.variantId} membawa harga kedua`);
  }
});

/**
 * Angkanya sengaja tetap eksplisit, bukan diturunkan dari `index` — kalau
 * dihitung dari data yang sedang diuji, katalog yang menyusut diam-diam akan
 * tetap lulus.
 *
 *   41 varian produk single origin dan houseblend
 *     (7 biji x 3 kemasan + Sindoro tanpa mini x 2 = 23,
 *      ditambah 9 rasio houseblend x 2 ukuran kemasan = 18)
 * + 17 varian lini Katalog Kopi 100 gram (KD-07; Kerinci dihapus 9 Sep 2026)
 */
const EXPECTED_PRODUCT_VARIANTS = 41;
const EXPECTED_PICK_VARIANTS = 17;
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
