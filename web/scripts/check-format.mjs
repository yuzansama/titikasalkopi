/**
 * Pemeriksaan format tampilan — BR-02, BR-03, FR-21 (QA).
 *
 * Jalankan dari folder `web/`:  node scripts/check-format.mjs
 *
 * Kenapa berkas ini ada. Sampai revisi integrator, `src/lib/format.ts` memakai
 * `Intl` currency yang menyisipkan U+00A0 setelah "Rp", dan satu-satunya jejak
 * defek itu adalah komentar di `scripts/check-whatsapp.mjs` yang justru
 * MENORMALKAN NBSP sebelum menguji. Akibatnya 64 pemeriksaan bisa hijau
 * sementara BR-02 tetap dilanggar di seluruh situs.
 *
 * Pemeriksaan di bawah menguji titik kodenya, bukan tampilannya, sehingga
 * regresi spasi apa pun — NBSP, spasi biasa, narrow no-break space —
 * menghentikan gerbang. Tidak ada dependensi baru (ADR-14).
 */

import assert from "node:assert/strict";
import { check, loadTs, summary } from "./_ts-load.mjs";

const format = await loadTs("src/lib/format.ts");
const {
  formatIDR,
  formatPricePerKg,
  formatTotalWeight,
  formatQuantity,
  unitLabel,
  formatNumber,
} = format;

/** Seluruh titik kode yang dianggap "spasi" oleh Unicode, plus NBSP eksplisit. */
const ANY_SPACE = /[\s    ]/;

console.log("Pemeriksaan format — BR-02 rupiah tanpa spasi\n");

/* ---------------------------------------------------------------- */
/* BR-02 — awalan Rp tanpa spasi                                     */
/* ---------------------------------------------------------------- */

check("BR-02: formatIDR(210000) tepat 'Rp210.000'", () => {
  assert.equal(formatIDR(210000), "Rp210.000");
});

check("BR-02: tidak ada titik kode spasi apa pun di hasil formatIDR", () => {
  for (const amount of [0, 500, 87500, 97500, 110000, 125000, 210000, 1350000]) {
    const text = formatIDR(amount);
    assert.ok(
      !ANY_SPACE.test(text),
      `formatIDR(${amount}) = ${JSON.stringify(text)} memuat spasi`,
    );
  }
});

check("BR-02: karakter setelah 'Rp' selalu digit, bukan U+00A0", () => {
  for (const amount of [1, 1000, 210000]) {
    const codePoint = formatIDR(amount).codePointAt(2);
    assert.ok(
      codePoint >= 48 && codePoint <= 57,
      `titik kode ke-3 = ${codePoint} (harus digit 48..57)`,
    );
  }
});

check("BR-02: pemisah ribuan titik, tanpa desimal", () => {
  assert.equal(formatIDR(1000), "Rp1.000");
  assert.equal(formatIDR(1350000), "Rp1.350.000");
  assert.equal(formatIDR(0), "Rp0");
});

check("BR-03: harga 0,5 kg berkelipatan Rp2.500 tetap utuh, tidak dibulatkan", () => {
  assert.equal(formatIDR(97500), "Rp97.500");
  assert.equal(formatIDR(92500), "Rp92.500");
  assert.equal(formatIDR(87500), "Rp87.500");
});

check("BR-02: sufiks /kg menempel tanpa spasi", () => {
  assert.equal(formatPricePerKg(200000), "Rp200.000/kg");
  assert.ok(!ANY_SPACE.test(formatPricePerKg(175000)));
});

/* ---------------------------------------------------------------- */
/* Berat total, dengan koma desimal Indonesia                        */
/* ---------------------------------------------------------------- */

check("berat total dihitung dari jumlah kemasan, dengan koma Indonesia", () => {
  assert.equal(formatTotalWeight(1, "half-kg"), "0,5 kg");
  assert.equal(formatTotalWeight(2, "half-kg"), "1 kg");
  assert.equal(formatTotalWeight(3, "half-kg"), "1,5 kg");
  assert.equal(formatTotalWeight(1, "kg"), "1 kg");
  assert.equal(formatTotalWeight(5, "kg"), "5 kg");
  // Kemasan yang beratnya bukan urusan pembeli tidak menghasilkan berat total.
  assert.equal(formatTotalWeight(2, "pack"), null);
  assert.equal(formatTotalWeight(2, "gram-100"), null);
});

check("tidak ada titik desimal gaya Inggris pada berat total", () => {
  for (let packs = 1; packs <= 99; packs += 1) {
    const text = formatTotalWeight(packs, "half-kg");
    assert.ok(!text.includes("."), `${packs} -> ${text} memakai titik desimal`);
  }
});

/**
 * BRD 11.2 — kuantitas SELALU menghitung kemasan.
 *
 * Ini yang berubah pada 9 September 2026, dan alasannya bukan gaya penulisan.
 * Selama houseblend ditulis sebagai berat ("1,5 kg") di sebelah harga satu
 * kemasan, pembeli yang mengalikan keduanya mendapat angka yang bukan
 * tagihannya. Angka di kiri "x" wajib angka yang sama dengan yang dikalikan
 * kode.
 */
check("BRD 11.2: formatQuantity selalu menghitung kemasan, bukan berat", () => {
  assert.equal(formatQuantity(2, "pack"), "2 pack");
  assert.equal(formatQuantity(1, "paket"), "1 paket (3 pack)");
  assert.equal(formatQuantity(1, "kg"), "1 kemasan 1 kg");
  assert.equal(formatQuantity(5, "kg"), "5 kemasan 1 kg");
  assert.equal(formatQuantity(1, "half-kg"), "1 kemasan 0,5 kg");
  assert.equal(formatQuantity(3, "half-kg"), "3 kemasan 0,5 kg");
  assert.equal(formatQuantity(3, "gram-100"), "3 x 100 gr");
});

check("kuantitas houseblend tidak pernah terbaca sebagai berat", () => {
  // "1,5 kg" di posisi kuantitas adalah bentuk yang melahirkan cacat harga
  // 9 September 2026. Angka pengali dan berat total tidak boleh tertukar.
  for (const packs of [1, 2, 3, 10]) {
    for (const unit of ["kg", "half-kg"]) {
      assert.ok(
        formatQuantity(packs, unit).startsWith(`${packs} kemasan`),
        `${packs} ${unit} -> ${formatQuantity(packs, unit)}`,
      );
    }
  }
});

check("label satuan menyebut kemasan yang dihargai", () => {
  assert.equal(unitLabel("pack"), "per pack 200 gr");
  assert.equal(unitLabel("paket"), "per paket 3 pack");
  assert.equal(unitLabel("kg"), "per kemasan 1 kg");
  assert.equal(unitLabel("half-kg"), "per kemasan 0,5 kg");
  assert.equal(unitLabel("gram-100"), "per 100 gr");
});

check("formatNumber memakai pemisah ribuan Indonesia (MASL)", () => {
  assert.equal(formatNumber(1900), "1.900");
  assert.equal(formatNumber(1400), "1.400");
});

/* ---------------------------------------------------------------- */
/* Regresi silang: harga di pesan WhatsApp ikut bersih               */
/* ---------------------------------------------------------------- */

const message = await loadTs("src/lib/whatsapp/message.ts");
const catalog = await loadTs("src/data/catalog.ts");
const selectors = await loadTs("src/features/cart/cart-selectors.ts");

check("BR-02 hulu ke hilir: pesan WhatsApp tidak memuat 'Rp' diikuti spasi", () => {
  const index = catalog.cartCatalogIndex;
  const items = Object.values(index).flatMap((entry) =>
    entry.variants.map((variant) => ({
      slug: entry.slug,
      variantId: variant.id,
      qty: 3,
    })),
  );
  const cart = selectors.resolveCart(items, "", index);
  const built = message.buildOrderMessage({
    orderCode: "TAK-260907-4KP2",
    lines: cart.lines,
    subtotal: cart.subtotal,
    note: "",
    sourceUrl: "https://titikasalkopi.id/keranjang",
  });
  assert.ok(
    !/Rp[\s  ]/.test(built.text),
    "pesan memuat 'Rp' yang diikuti spasi",
  );
  assert.ok(
    !built.url.includes("%C2%A0"),
    "URL wa.me memuat NBSP terkode (%C2%A0)",
  );
});

summary("Format");
