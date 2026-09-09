/**
 * Pemeriksaan lini Katalog Kopi 100 gram (KD-07).
 *
 *   node scripts/check-picks.mjs
 *
 * Lini ini tidak memakai tipe `Product`, jadi ia tidak ikut terjaga oleh
 * `assertCatalogValid` maupun oleh pemeriksaan katalog yang sudah ada. Yang
 * dijaga di sini adalah hal-hal yang gagalnya SUNYI: slug bertabrakan sehingga
 * keranjang menampilkan barang lain, harga yang menyimpang dari poster owner,
 * dan satuan baru yang lupa dirender di salah satu tempat.
 */

import assert from "node:assert/strict";
import { check, loadTs, summary } from "./_ts-load.mjs";

const picksModule = await loadTs("src/data/picks.ts");
const format = await loadTs("src/lib/format.ts");
const validate = await loadTs("src/data/validate.ts");
const catalog = await loadTs("src/data/catalog.ts");

const { coffeePicks, PICK_GRAMS, pickVariantId } = picksModule;

/**
 * Poster owner, 8 September 2026, disalin ulang secara terpisah dari
 * `picks.ts`, DIKURANGI satu baris.
 *
 * Kerinci dihapus dari lini ini pada 9 September 2026 atas keputusan owner.
 * Sejak single origin punya kemasan mini 100 gram, kedua lini menjual Kerinci
 * dalam ukuran yang sama dengan harga berbeda — Rp70.000 dan Rp85.000 — pada
 * satu halaman katalog. Pada toko yang dibayar di muka lewat transfer, dua
 * harga untuk satu barang terbaca sebagai kesalahan atau itikad buruk. Yang
 * dipertahankan adalah versi single origin, karena ia punya halaman produk
 * dan data asal; baris poster hanya punya nama dan harga.
 *
 * Sengaja diketik ulang alih-alih diimpor: pemeriksaan yang membandingkan data
 * dengan dirinya sendiri selalu lulus. Ini satu-satunya salinan kedua dari
 * angka yang benar-benar dijanjikan ke pembeli, jadi salah ketik di `picks.ts`
 * akan terlihat di sini, bukan di halaman katalog yang sudah tayang.
 */
const POSTER = [
  ["Bali Kintamani", 80_000],
  ["Gayo", 80_000],
  ["Bali Peach", 110_000],
  ["Gayo Lecie", 120_000],
  ["Panama", 270_000],
  ["Kenya", 195_000],
  ["Luwak", 140_000],
  ["Ciwidey", 85_000],
  ["Telomoyo", 65_000],
  ["Gedong Songo", 75_000],
  ["Sumbing", 85_000],
  ["Halu Banana Anaerob", 90_000],
  ["Merbabu", 85_000],
  ["Merapi", 75_000],
  ["Argopuro", 90_000],
  ["Situjuah", 80_000],
  ["Lawu", 65_000],
];

check("KD-07: seluruh 17 baris poster tayang, dengan nama dan harga persis", () => {
  assert.equal(coffeePicks.length, POSTER.length, "jumlah biji berbeda dari poster");
  const actual = coffeePicks.map((pick) => [pick.name, pick.price]);
  assert.deepEqual(actual, POSTER);
});

check("KD-07: urutannya mengikuti poster, bukan diurutkan ulang", () => {
  // Owner menyusun posternya sendiri. Mengurutkan ulang diam-diam membuat
  // daftar cetak dan daftar web tidak lagi bisa dibandingkan baris per baris.
  assert.equal(coffeePicks[0].name, "Bali Kintamani");
  assert.equal(coffeePicks[coffeePicks.length - 1].name, "Lawu");
});

check("BR-03/ADR-05: seluruh harga bilangan bulat positif", () => {
  for (const pick of coffeePicks) {
    assert.ok(
      Number.isInteger(pick.price) && pick.price > 0,
      `${pick.slug}: harga ${pick.price} bukan bilangan bulat positif`,
    );
  }
});

check("KD-07: slug unik di dalam lini", () => {
  const slugs = coffeePicks.map((pick) => pick.slug);
  assert.deepEqual(
    slugs.filter((slug, i) => slugs.indexOf(slug) !== i),
    [],
  );
});

check("KD-07: slug tidak bertabrakan dengan produk 200 gram", () => {
  // Kegagalan yang paling sunyi dari semuanya: `cartCatalogIndex` dirakit dari
  // kedua daftar, dan pada tabrakan yang belakangan menang tanpa suara.
  // Pengunjung menambahkan satu barang lalu melihat barang lain di keranjang.
  const productSlugs = [
    "oelbiteno",
    "abmisibil",
    "sabin",
    "pyramid",
    "palimping",
    "kerinci",
    "pondok-baru",
    "bold",
    "bright",
    "full-robusta",
  ];
  const collisions = coffeePicks
    .map((pick) => pick.slug)
    .filter((slug) => productSlugs.includes(slug));
  assert.deepEqual(
    collisions,
    [],
    `slug bentrok: ${collisions.join(", ")}`,
  );
});

check("0.5: tidak ada nama kopi yang dijual di kedua lini sekaligus", () => {
  /* Sampai 8 September 2026 Kerinci hidup di kedua lini, dan itu bisa
     dijelaskan: beratnya berbeda, 200 gr terhadap 100 gr. Kemasan mini
     single origin yang masuk 9 September menghapus penjelasan itu — kedua
     lini menjual Kerinci dalam ukuran YANG SAMA, Rp70.000 dan Rp85.000, pada
     satu halaman katalog.

     Owner memutuskan mempertahankan versi single origin dan menghapus baris
     posternya. Pemeriksaan ini berjalan di alur sinkronisasi katalog, jadi ia
     juga menahan baris itu kembali masuk lewat sheet tanpa disadari. */
  const productNames = new Set(
    catalog.singleOriginProducts.map((product) => product.name.toLowerCase()),
  );
  const clashes = coffeePicks
    .filter((pick) => productNames.has(pick.name.trim().toLowerCase()))
    .map((pick) => pick.name);
  assert.deepEqual(
    clashes,
    [],
    `nama berikut dijual di kedua lini: ${clashes.join(", ")}. ` +
      `Pembeli melihat dua harga untuk berat yang sama.`,
  );
});

check("KD-07: validator menolak slug yang bentrok dengan produk", () => {
  assert.throws(
    () => validate.assertPicksValid([{ slug: "kerinci", name: "X", price: 1000 }], ["kerinci"]),
    /bentrok/,
  );
});

check("KD-07: validator menolak harga pecahan maupun nol", () => {
  for (const price of [0, -1, 1500.5]) {
    assert.throws(
      () => validate.assertPicksValid([{ slug: "x", name: "X", price }], []),
      /bilangan bulat positif/,
      `harga ${price} lolos validator`,
    );
  }
});

check("KD-07: satuan gram-100 dirender di kuantitas dan label harga", () => {
  // Satuan baru yang lupa ditangani akan jatuh sebagai `undefined` di pesan
  // WhatsApp — tepat di tempat pembeli membaca apa yang ia pesan.
  assert.equal(format.formatQuantity(1, "gram-100"), "1 x 100 gr");
  assert.equal(format.formatQuantity(3, "gram-100"), "3 x 100 gr");
  assert.equal(format.unitLabel("gram-100"), "per 100 gr");
});

check("KD-07: kuantitas 100 gr tidak pernah terbaca sebagai kemasan 200 gr", () => {
  // "2 x 100 gr" dan "200 gr" adalah barang berbeda dengan harga berbeda.
  assert.ok(!format.formatQuantity(2, "gram-100").includes("200 gr"));
});

check("KD-07: id varian diturunkan dari slug, bukan diketik terpisah", () => {
  for (const pick of coffeePicks) {
    assert.equal(pickVariantId(pick.slug), `${pick.slug}-gram100`);
  }
  assert.equal(PICK_GRAMS, 100);
});

summary("Katalog Kopi 100 gram");
