/**
 * Menarik katalog dari Google Sheet owner dan menulis ulang
 * `src/data/managed.generated.ts` (KD-08).
 *
 *   NEXT_PUBLIC_TRACKING_ENDPOINT=https://script.google.com/... \
 *     node scripts/sync-katalog.mjs
 *
 * ATURAN PALING PENTING: skrip ini GAGAL TERTUTUP. Apa pun yang tidak
 * meyakinkan — endpoint mati, jawaban rusak, tab hilang, satu harga bukan
 * bilangan bulat positif — membuatnya keluar dengan kode bukan nol TANPA
 * menyentuh berkas apa pun. Katalog yang sudah ter-commit tetap tayang.
 *
 * Alasannya bukan kehati-hatian umum. Berkas yang ditulis di sini memuat
 * SELURUH harga situs. Sinkronisasi yang setengah berhasil akan menerbitkan
 * "Rp0" pada halaman produk dan mengirimkannya ke WhatsApp sebagai penawaran
 * sungguhan. Tidak menerbitkan apa pun selalu lebih baik daripada itu.
 *
 * Tidak ada dependensi baru (ADR-14): `fetch` bawaan Node dan `fs`.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const OUT_PATH = join(import.meta.dirname, "..", "src", "data", "managed.generated.ts");

/**
 * Kunci harga yang WAJIB ada. Ini kontraknya dengan `products.ts`: setiap
 * `managedPrice()` di sana membaca salah satu kunci ini, dan yang hilang
 * menggagalkan build. Diperiksa di sini supaya kegagalannya terjadi saat
 * sinkronisasi — bukan setelah katalog rusak sudah ter-commit.
 */
const REQUIRED_PRICE_KEYS = [
  "single.signature.pack1",
  "single.signature.pack3",
  "single.signature.mini1",
  "single.reguler.pack1",
  "single.reguler.pack3",
  "single.reguler.mini1",
  // Houseblend punya dua harga per varian. Kunci polos adalah harga per kg;
  // akhiran ".half" adalah harga satu kemasan 0,5 kg, yang BUKAN setengahnya
  // (D-02 direvisi oleh lembar "Product" bisnis plan).
  "houseblend.bold-70-30",
  "houseblend.bold-70-30.half",
  "houseblend.bold-60-40",
  "houseblend.bold-60-40.half",
  "houseblend.bold-50-50",
  "houseblend.bold-50-50.half",
  "houseblend.bold-40-60",
  "houseblend.bold-40-60.half",
  "houseblend.bold-30-70",
  "houseblend.bold-30-70.half",
  "houseblend.bold-20-80",
  "houseblend.bold-20-80.half",
  "houseblend.bright-signature",
  "houseblend.bright-signature.half",
  "houseblend.bright-reguler",
  "houseblend.bright-reguler.half",
  "houseblend.full-robusta",
  "houseblend.full-robusta.half",
];

/** Slug yang wajib punya status. Produk 200 gr dan lini houseblend. */
const REQUIRED_STOCK_SLUGS = [
  "oelbiteno",
  "abmisibil",
  "sabin",
  "pyramid",
  "palimping",
  "kerinci",
  "pondok-baru",
  "sindoro",
  "bold",
  "bright",
  "full-robusta",
];

/**
 * Batas kewarasan harga, dalam rupiah.
 *
 * Bukan aturan bisnis melainkan jaring pengaman terhadap salah ketik: satu nol
 * kelebihan mengubah Rp125.000 menjadi Rp1.250.000, dan satu nol kurang
 * menjadikannya Rp12.500. Keduanya akan tayang tanpa ada yang menahan, karena
 * keduanya bilangan bulat positif yang sah.
 */
const MIN_PRICE = 10_000;
const MAX_PRICE = 5_000_000;

function isSanePrice(value) {
  return Number.isInteger(value) && value >= MIN_PRICE && value <= MAX_PRICE;
}

/**
 * Seluruh pemeriksaan atas jawaban sheet, sebagai fungsi murni.
 *
 * Dipisah dari `main()` supaya bisa diuji tanpa jaringan dan tanpa menyentuh
 * berkas — dan inilah bagian yang benar-benar berbahaya bila salah, karena ia
 * yang memutuskan apakah sebuah harga boleh tayang.
 *
 * @returns daftar masalah; kosong berarti data boleh ditulis.
 */
export function validateCatalogPayload(payload) {
  const problems = [];
  const fail = (message) => problems.push(message);

  /* ---------------- harga ---------------- */

  const harga = payload?.harga;
  if (harga === null || typeof harga !== "object") {
    // null berarti tabnya TIDAK ADA. Sengaja dibedakan dari objek kosong:
    // yang satu berarti salah nama tab, yang lain berarti owner mengosongkan
    // isinya. Keduanya ditolak, tetapi pesannya harus berbeda supaya owner
    // tahu mana yang harus dibetulkan.
    fail('Tab "harga" tidak ditemukan di spreadsheet.');
  } else {
    for (const key of REQUIRED_PRICE_KEYS) {
      const value = harga[key];
      if (value === undefined) {
        fail(`Harga "${key}" tidak ada di tab "harga".`);
      } else if (!isSanePrice(value)) {
        fail(
          `Harga "${key}" bernilai ${value} — di luar batas wajar ` +
            `Rp${MIN_PRICE.toLocaleString("id-ID")} sampai ` +
            `Rp${MAX_PRICE.toLocaleString("id-ID")}. Periksa jumlah nolnya.`,
        );
      }
    }
    for (const key of Object.keys(harga)) {
      if (!REQUIRED_PRICE_KEYS.includes(key)) {
        fail(`Kunci harga "${key}" tidak dikenali kode. Salah ketik?`);
      }
    }
  }

  /* ---------------- stok ---------------- */

  const stok = payload?.stok;
  if (stok === null || typeof stok !== "object") {
    fail('Tab "stok" tidak ditemukan di spreadsheet.');
  } else {
    for (const slug of REQUIRED_STOCK_SLUGS) {
      if (stok[slug] === undefined) {
        fail(`Status stok "${slug}" tidak ada di tab "stok".`);
      }
    }
    for (const [slug, status] of Object.entries(stok)) {
      if (!REQUIRED_STOCK_SLUGS.includes(slug)) {
        fail(`Slug "${slug}" di tab "stok" tidak dikenali kode.`);
      }
      if (status !== "available" && status !== "out-of-stock") {
        fail(`Status "${slug}" bernilai "${status}"; hanya boleh available atau out-of-stock.`);
      }
    }
  }

  return problems;
}

async function main() {
  const endpoint = process.env.NEXT_PUBLIC_TRACKING_ENDPOINT ?? "";
  if (!endpoint.startsWith("https://")) {
    console.error(
      "NEXT_PUBLIC_TRACKING_ENDPOINT belum diisi. Lihat docs/09-kelola-katalog.md.",
    );
    process.exit(1);
  }

  let payload;
  try {
    const response = await fetch(`${endpoint}?katalog=1`, {
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    payload = await response.json();
  } catch (error) {
    console.error(`Tidak bisa membaca sheet: ${error.message}`);
    console.error("Tidak ada berkas yang disentuh; katalog lama tetap tayang.");
    process.exit(1);
  }

  const problems = validateCatalogPayload(payload);
  if (problems.length > 0) {
    console.error(`Sinkronisasi DIBATALKAN — ${problems.length} masalah:\n`);
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error("\nTidak ada berkas yang disentuh; katalog lama tetap tayang.");
    process.exit(1);
  }

  const { harga, stok } = payload;

  /* ---------------- menulis ---------------- */

  const previous = readFileSync(OUT_PATH, "utf8");
  const next = render(harga, stok, previous);

  if (next === previous) {
    console.log("Katalog sudah sama dengan sheet. Tidak ada yang diubah.");
    return;
  }

  writeFileSync(OUT_PATH, next);
  console.log(
    `Katalog diperbarui: ${Object.keys(harga).length} harga, ` +
      `${Object.keys(stok).length} status stok.`,
  );
  summarizeChanges(previous, next);
}

/** Tanggal WIB, YYYY-MM-DD. Hanya untuk jejak di berkas hasil. */
function todayWib() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Menulis ulang HANYA badan datanya, dengan mempertahankan seluruh komentar
 * dan tipe di berkas hasil. Skrip yang mengarang ulang seluruh berkas akan
 * menghapus penjelasan yang justru dibaca orang berikutnya.
 */
function render(harga, stok, previous) {
  const q = (value) => JSON.stringify(value);
  const body = [
    `export const managedCatalog: ManagedCatalog = {`,
    `  syncedAt: ${q(todayWib())},`,
    ``,
    `  harga: {`,
    ...REQUIRED_PRICE_KEYS.map((key) => `    ${q(key)}: ${harga[key]},`),
    `  },`,
    ``,
    `  stok: {`,
    ...REQUIRED_STOCK_SLUGS.map((slug) => `    ${q(slug)}: ${q(stok[slug])},`),
    `  },`,
    `};`,
  ].join("\n");

  const start = previous.indexOf("export const managedCatalog");
  const end = previous.indexOf("\n};", start) + "\n};".length;
  if (start === -1 || end <= start) {
    throw new Error(
      "Bentuk managed.generated.ts tidak dikenali; batalkan dan periksa tangan.",
    );
  }
  return previous.slice(0, start) + body + previous.slice(end);
}

/** Ringkasan perubahan untuk log CI, supaya commit otomatis bisa dibaca. */
function summarizeChanges(previous, next) {
  const numbers = (text) =>
    new Map(
      [...text.matchAll(/"([a-z0-9.\-]+)": (\d+),/g)].map((m) => [m[1], m[2]]),
    );
  const before = numbers(previous);
  const after = numbers(next);
  for (const [key, value] of after) {
    const old = before.get(key);
    if (old !== undefined && old !== value) console.log(`  ${key}: ${old} -> ${value}`);
  }
}

// Hanya berjalan bila dipanggil langsung; skrip uji mengimpornya tanpa
// efek samping.
// `endsWith` tidak cukup: "check-sync-katalog.mjs" juga berakhiran begitu, dan
// mengimpornya untuk diuji justru menjalankan sinkronisasi sungguhan.
if (basename(process.argv[1] ?? "") === "sync-katalog.mjs") {
  await main();
}
