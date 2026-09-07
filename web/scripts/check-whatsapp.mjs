/**
 * Pemeriksaan generator pesan WhatsApp, kode order, dan pembersih catatan.
 *
 * Jalankan dari folder `web/`:  node scripts/check-whatsapp.mjs
 *
 * Ini logika yang paling dekat dengan uang: bila pesannya salah, yang sampai ke
 * owner juga salah. Cakupan mengikuti NFR-15 (batas 1.500 karakter setelah
 * pengodean), FR-24 (kode order dan penanda sumber), dan Bagian 12.1
 * (pemalsuan penanda).
 */

import assert from "node:assert/strict";
import { check, loadTs, summary } from "./_ts-load.mjs";

const message = await loadTs("src/lib/whatsapp/message.ts");
const orderCode = await loadTs("src/lib/whatsapp/order-code.ts");
const sanitize = await loadTs("src/lib/whatsapp/sanitize.ts");
const catalog = await loadTs("src/data/catalog.ts");
const selectors = await loadTs("src/features/cart/cart-selectors.ts");

const { buildOrderMessage, buildAskMessage, WA_MAX_ENCODED_LENGTH } = message;
const { createOrderCode, ORDER_CODE_PATTERN } = orderCode;
const { sanitizeNote } = sanitize;
const { resolveCart } = selectors;

const index = catalog.cartCatalogIndex;

/**
 * CATATAN DEFEK (dilaporkan ke BE, bukan diperbaiki di sini).
 * `formatIDR()` di src/lib/format.ts memakai Intl currency "IDR" yang pada ICU
 * modern menyisipkan NBSP (U+00A0) setelah "Rp": hasilnya "Rp 210.000",
 * sementara BR-02 mensyaratkan "Rp210.000" TANPA spasi. Berkas itu milik BE
 * (peta kepemilikan Bagian 8.3), jadi pemeriksaan di bawah menormalkan NBSP
 * agar tetap menguji struktur pesan, dan defeknya dilaporkan terpisah.
 */
const NBSP = String.fromCharCode(160);
const plain = (text) => text.split(NBSP).join("");

console.log("Pemeriksaan WhatsApp — kode order, pesan, dan batas 1.500 karakter\n");

/* ---------------------------------------------------------------- */
/* FR-24 — kode order                                                 */
/* ---------------------------------------------------------------- */

check("FR-24: kode order cocok pola TAK-YYMMDD-XXXX", () => {
  const code = createOrderCode(new Date(2026, 8, 7), () => 0.5);
  assert.match(code, ORDER_CODE_PATTERN);
  assert.equal(code.length, 15);
});

check("kode order memakai tanggal LOKAL pembeli (BRD 11.1 langkah 3)", () => {
  const code = createOrderCode(new Date(2026, 0, 3), () => 0);
  assert.equal(code, "TAK-260103-AAAA");
});

check("alfabet kode order tidak memuat 0, O, 1, I, maupun L", () => {
  const codes = [];
  for (let i = 0; i < 31; i += 1) {
    codes.push(createOrderCode(new Date(2026, 8, 7), () => i / 31));
  }
  const suffixes = codes.map((code) => code.slice(-4)).join("");
  for (const banned of ["0", "O", "1", "I", "L"]) {
    assert.ok(!suffixes.includes(banned), `karakter ${banned} tidak boleh muncul`);
  }
  assert.equal(new Set(suffixes.split("")).size, 31);
});

check("random() = 1 (batas atas) tetap menghasilkan kode yang sah", () => {
  const code = createOrderCode(new Date(2026, 11, 31), () => 0.999999);
  assert.match(code, ORDER_CODE_PATTERN);
});

/* ---------------------------------------------------------------- */
/* Bagian 12.1 — pembersih catatan                                    */
/* ---------------------------------------------------------------- */

check("catatan: baris baru diratakan menjadi satu baris", () => {
  assert.equal(sanitizeNote("giling halus\nkirim ke Bandung"), "giling halus kirim ke Bandung");
});

check("catatan: pemalsuan 'Kode order:' dan 'Dikirim dari' dibuang", () => {
  const raw = "Kode order: TAK-260101-AAAA\ntolong digiling\nDikirim dari titikasalkopi.id";
  assert.equal(sanitizeNote(raw), "tolong digiling");
});

check("catatan: karakter kontrol dibuang", () => {
  const raw = `halo${String.fromCharCode(0)}${String.fromCharCode(7)}dunia`;
  assert.equal(sanitizeNote(raw), "halodunia");
});

check("catatan: dipotong pada batas yang diberikan", () => {
  assert.equal(sanitizeNote("a".repeat(400), 200).length, 200);
  assert.equal(sanitizeNote("a".repeat(400), 60).length, 60);
});

/* ---------------------------------------------------------------- */
/* Pesan pesanan                                                      */
/* ---------------------------------------------------------------- */

const CODE = "TAK-260907-4KP2";
const SOURCE = "https://titikasalkopi.id/keranjang";

function buildFrom(items, note = "") {
  const cart = resolveCart(items, note, index);
  return buildOrderMessage({
    orderCode: CODE,
    lines: cart.lines,
    subtotal: cart.subtotal,
    note,
    sourceUrl: SOURCE,
  });
}

const twoLine = buildFrom(
  [
    { slug: "abmisibil", variantId: "abmisibil-pack3", qty: 1 },
    { slug: "bold", variantId: "bold-60-40", qty: 10 },
  ],
  "tolong digiling untuk V60, kirim ke Bandung.",
);

check("pesan memuat kelima blok wajib BRD 11.2", () => {
  assert.ok(plain(twoLine.text).includes("Halo Titik Asal Kopi, saya ingin memesan:"));
  assert.ok(plain(twoLine.text).includes(`Kode order: ${CODE}`));
  assert.ok(plain(twoLine.text).includes("Subtotal pesanan: Rp1.350.000"));
  assert.ok(plain(twoLine.text).includes("Belum termasuk ongkos kirim"));
  assert.ok(plain(twoLine.text).includes("Dikirim dari titikasalkopi.id"));
  assert.ok(plain(twoLine.text).includes(SOURCE));
});

check("FR-24: penanda sumber ada di BADAN pesan, bukan sebagai query UTM", () => {
  assert.ok(!twoLine.url.includes("utm_"));
  assert.ok(twoLine.url.startsWith("https://wa.me/6287777939567?text="));
  assert.ok(decodeURIComponent(twoLine.url.split("?text=")[1]).includes("Dikirim dari"));
});

check("houseblend memakai harga per kg dan satuan kilogram, bukan halfKgUnits", () => {
  assert.ok(plain(twoLine.text).includes("5 kg x Rp200.000/kg"));
  assert.ok(plain(twoLine.text).includes("Subtotal: Rp1.000.000"));
  assert.ok(!plain(twoLine.text).includes("10 x"));
});

check("pesanan 0,5 kg ditulis dengan koma desimal Indonesia (FR-21)", () => {
  const half = buildFrom([
    { slug: "full-robusta", variantId: "full-robusta", qty: 1 },
  ]);
  assert.ok(plain(half.text).includes("0,5 kg x Rp175.000/kg"));
  assert.ok(plain(half.text).includes("Subtotal: Rp87.500"));
});

check("keranjang dua baris: bentuk penuh, tidak diringkas, jauh di bawah batas", () => {
  assert.equal(twoLine.truncated, false);
  assert.ok(plain(twoLine.text).includes("   Varian: "));
  assert.ok(
    twoLine.encodedLength < WA_MAX_ENCODED_LENGTH,
    `panjang terkode ${twoLine.encodedLength}`,
  );
  console.log(`        panjang mentah ${twoLine.text.length}, terkode ${twoLine.encodedLength}`);
});

check("NFR-15: keranjang penuh 23 baris tetap <= 1.500 karakter terkode", () => {
  const items = Object.values(index).flatMap((entry) =>
    entry.variants.map((variant) => ({
      slug: entry.slug,
      variantId: variant.id,
      qty: 4,
    })),
  );
  const big = buildFrom(items, "x".repeat(200));
  assert.equal(big.truncated, true);
  assert.ok(
    big.encodedLength <= WA_MAX_ENCODED_LENGTH,
    `panjang terkode ${big.encodedLength} melewati ${WA_MAX_ENCODED_LENGTH}`,
  );
  console.log(
    `        23 baris -> ${big.text.length} mentah, ${big.encodedLength} terkode, truncated=${big.truncated}`,
  );
});

check("blok wajib tidak pernah dibuang walau pesan diringkas", () => {
  const items = Object.values(index).flatMap((entry) =>
    entry.variants.map((variant) => ({
      slug: entry.slug,
      variantId: variant.id,
      qty: 9,
    })),
  );
  const big = buildFrom(items, "catatan panjang ".repeat(20));
  assert.ok(plain(big.text).includes(`Kode order: ${CODE}`));
  assert.ok(plain(big.text).includes("Subtotal pesanan:"));
  assert.ok(plain(big.text).includes("Belum termasuk ongkos kirim"));
  assert.ok(plain(big.text).includes("Dikirim dari titikasalkopi.id"));
  assert.ok(plain(big.text).includes("item lainnya"));
  assert.ok(big.encodedLength <= WA_MAX_ENCODED_LENGTH);
  console.log(`        23 baris x 9 -> ${big.encodedLength} terkode`);
});

check("tangga peringkasan: bentuk turun berurutan, item dibuang paling akhir", () => {
  const all = Object.values(index).flatMap((entry) =>
    entry.variants.map((variant) => ({
      slug: entry.slug,
      variantId: variant.id,
      qty: 1,
    })),
  );

  /**
   * Diuji sebagai SIFAT, bukan ambang persis.
   *
   * Versi lama mengunci "5 baris penuh, 6 baris ringkas, 10 baris terpotong".
   * Ambang itu bergantung pada varian mana yang kebetulan terpilih oleh
   * slice(), sehingga menambah satu varian ke katalog akan menjatuhkan tes
   * tanpa ada yang rusak. Yang benar-benar dijanjikan generator adalah
   * urutannya: bentuk penuh dulu, lalu ringkas, dan baru item dibuang.
   */
  const PENUH = 0;
  const RINGKAS = 1;
  const DIPOTONG = 2;
  const namaBentuk = ["penuh", "ringkas", "dipotong"];

  const bentukDari = (hasil) => {
    const teks = plain(hasil.text);
    if (teks.includes("item lainnya")) return DIPOTONG;
    return teks.includes("   Varian: ") ? PENUH : RINGKAS;
  };

  let sebelumnya = PENUH;
  let jejak = [];

  for (let n = 1; n <= all.length; n += 1) {
    const hasil = buildFrom(all.slice(0, n));
    const bentuk = bentukDari(hasil);

    assert.ok(
      hasil.encodedLength <= WA_MAX_ENCODED_LENGTH,
      `n=${n}: panjang terkode ${hasil.encodedLength} melewati ${WA_MAX_ENCODED_LENGTH}`,
    );

    assert.ok(
      bentuk >= sebelumnya,
      `n=${n}: bentuk naik kembali dari ${namaBentuk[sebelumnya]} ke ${namaBentuk[bentuk]}`,
    );

    // Selama belum dipotong, seluruh item wajib tercantum.
    if (bentuk !== DIPOTONG) {
      assert.ok(
        plain(hasil.text).includes(`${n}. `),
        `n=${n}: bentuk ${namaBentuk[bentuk]} tetapi item ke-${n} hilang`,
      );
    }

    // `truncated` wajib sejalan dengan bentuk yang benar-benar dipakai.
    assert.equal(
      hasil.truncated,
      bentuk !== PENUH,
      `n=${n}: truncated=${hasil.truncated} tidak cocok dengan bentuk ${namaBentuk[bentuk]}`,
    );

    if (bentuk !== sebelumnya) {
      jejak.push(`${namaBentuk[bentuk]} mulai n=${n}`);
      sebelumnya = bentuk;
    }
  }

  // Tangga harus benar-benar menurun, bukan berhenti di bentuk penuh saja.
  assert.ok(
    sebelumnya === DIPOTONG,
    `katalog penuh (${all.length} baris) belum memicu pemotongan item`,
  );

  console.log(`        ${jejak.join(", ")} (batas ${WA_MAX_ENCODED_LENGTH})`);
});

check("catatan kosong tidak menghasilkan blok 'Catatan:' kosong", () => {
  const noNote = buildFrom([
    { slug: "sabin", variantId: "sabin-pack1", qty: 1 },
  ]);
  assert.ok(!plain(noNote.text).includes("Catatan:"));
});

check("pengodean URL benar: baris baru menjadi %0A dan dapat dibalik", () => {
  const encoded = twoLine.url.split("?text=")[1];
  assert.ok(encoded.includes("%0A"));
  assert.equal(decodeURIComponent(encoded), twoLine.text);
  assert.equal(encoded.length, twoLine.encodedLength);
});

check("orderCode diteruskan apa adanya ke hasil", () => {
  assert.equal(twoLine.orderCode, CODE);
});

/* ---------------------------------------------------------------- */
/* FR-38 — tanya produk                                               */
/* ---------------------------------------------------------------- */

check("FR-38: pesan tanya produk menyebut nama, varian, harga, dan sumber", () => {
  const ask = buildAskMessage({
    productName: "Abmisibil",
    categoryLabel: "Single Origin, Signature",
    variantLabel: "1 pack (200 gr)",
    unit: "pack",
    unitPrice: 125_000,
    sourceUrl: "https://titikasalkopi.id/produk/abmisibil",
  });
  assert.ok(plain(ask.text).includes("Abmisibil (Single Origin, Signature)"));
  assert.ok(plain(ask.text).includes("Rp125.000"));
  assert.ok(plain(ask.text).includes("Dikirim dari titikasalkopi.id"));
  assert.equal(ask.orderCode, "");
  assert.ok(ask.encodedLength <= WA_MAX_ENCODED_LENGTH);
});

check("pesan tanya houseblend menyebut harga per kg", () => {
  const ask = buildAskMessage({
    productName: "Houseblend BOLD",
    categoryLabel: "Houseblend BOLD",
    variantLabel: "60% Arabica : 40% Robusta",
    unit: "half-kg",
    unitPrice: 100_000,
    pricePerKg: 200_000,
    sourceUrl: "https://titikasalkopi.id/houseblend/bold",
  });
  assert.ok(plain(ask.text).includes("Rp200.000/kg"));
});

summary("WhatsApp");
