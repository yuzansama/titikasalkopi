/**
 * Pemeriksaan gerbang sinkronisasi katalog (KD-08).
 *
 *   node scripts/check-sync-katalog.mjs
 *
 * `validateCatalogPayload()` adalah satu-satunya hal yang berdiri antara isi
 * spreadsheet dan harga yang tayang ke pembeli. Kalau ia meloloskan data yang
 * salah, situs mengiklankan angka yang keliru atas nama brand — dan tidak ada
 * gerbang lain di belakangnya.
 *
 * Karena itu yang diuji di sini bukan "jalur bahagia" melainkan setiap cara
 * spreadsheet bisa rusak: tab hilang, tab kosong, salah ketik nol, slug
 * bentrok, kolom salah nama.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { check, summary } from "./_ts-load.mjs";
import { validateCatalogPayload } from "./sync-katalog.mjs";

const HARGA = {
  "single.signature.pack1": 140_000,
  "single.signature.pack3": 392_000,
  "single.signature.mini1": 85_000,
  "single.reguler.pack1": 125_000,
  "single.reguler.pack3": 352_000,
  "single.reguler.mini1": 70_000,
  "houseblend.bold-70-30": 215_000,
  "houseblend.bold-70-30.half": 120_000,
  "houseblend.bold-60-40": 205_000,
  "houseblend.bold-60-40.half": 115_000,
  "houseblend.bold-50-50": 200_000,
  "houseblend.bold-50-50.half": 110_000,
  "houseblend.bold-40-60": 195_000,
  "houseblend.bold-40-60.half": 105_000,
  "houseblend.bold-30-70": 190_000,
  "houseblend.bold-30-70.half": 100_000,
  "houseblend.bold-20-80": 185_000,
  "houseblend.bold-20-80.half": 95_000,
  "houseblend.bright-signature": 280_000,
  "houseblend.bright-signature.half": 150_000,
  "houseblend.bright-reguler": 240_000,
  "houseblend.bright-reguler.half": 130_000,
  "houseblend.full-robusta": 180_000,
  "houseblend.full-robusta.half": 100_000,
};

const STOK = {
  oelbiteno: "available",
  abmisibil: "available",
  sabin: "available",
  pyramid: "available",
  palimping: "available",
  kerinci: "available",
  "pondok-baru": "available",
  sindoro: "available",
  bold: "available",
  bright: "available",
  "full-robusta": "available",
};

const good = (overrides = {}) => ({
  harga: { ...HARGA },
  stok: { ...STOK },
  ...overrides,
});

const failsWith = (payload, pattern) => {
  const problems = validateCatalogPayload(payload);
  assert.ok(
    problems.some((problem) => pattern.test(problem)),
    `tidak ada masalah yang cocok ${pattern}. Didapat: ${JSON.stringify(problems)}`,
  );
};

check("KD-08: data sheet yang sehat diterima tanpa keluhan", () => {
  assert.deepEqual(validateCatalogPayload(good()), []);
});

/* ------------------------------------------------------------------ */
/* Tab hilang versus tab kosong                                        */
/* ------------------------------------------------------------------ */

check("KD-08: tab yang hilang ditolak, satu per satu", () => {
  failsWith(good({ harga: null }), /Tab "harga" tidak ditemukan/);
  failsWith(good({ stok: null }), /Tab "stok" tidak ditemukan/);
});

check("KD-08: tab tambahan di sheet diabaikan, bukan ikut diterbitkan", () => {
  // Seluruh produk situs berasal dari `assets/brand/Kopi from heart.xlsx`.
  // Lini "Katalog Kopi 100 gram" dari poster dihapus 9 September 2026, dan
  // tab `katalog100` yang mungkin masih tertinggal di spreadsheet owner tidak
  // boleh punya efek apa pun.
  const problems = validateCatalogPayload(
    good({ picks: [{ slug: "lawu", name: "Lawu", price: 65_000 }] }),
  );
  assert.deepEqual(problems, []);
});

check("KD-08: jawaban rusak sama sekali tetap ditolak, bukan melempar", () => {
  for (const payload of [null, undefined, "teks", 42, {}]) {
    const problems = validateCatalogPayload(payload);
    assert.ok(problems.length > 0, `${JSON.stringify(payload)} lolos gerbang`);
  }
});

/* ------------------------------------------------------------------ */
/* Harga — tempat kesalahan paling mahal                               */
/* ------------------------------------------------------------------ */

check("KD-08: harga yang hilang ditolak, bukan diisi nol", () => {
  const payload = good();
  delete payload.harga["houseblend.bold-70-30"];
  failsWith(payload, /houseblend\.bold-70-30" tidak ada/);
});

check("KD-08: salah ketik jumlah nol tertangkap di kedua arah", () => {
  // Rp1.250.000 dan Rp12.500 sama-sama bilangan bulat positif yang sah, jadi
  // pemeriksaan bilangan bulat saja tidak akan pernah melihat keduanya.
  failsWith(
    good({ harga: { ...HARGA, "single.signature.pack1": 1_250 } }),
    /di luar batas wajar/,
  );
  failsWith(
    good({ harga: { ...HARGA, "single.signature.pack1": 12_500_000 } }),
    /di luar batas wajar/,
  );
});

check("KD-08: harga pecahan, nol, dan negatif ditolak (BR-03)", () => {
  for (const price of [125_000.5, 0, -125_000]) {
    failsWith(
      good({ harga: { ...HARGA, "single.reguler.pack1": price } }),
      /di luar batas wajar/,
    );
  }
});

check("KD-08: kunci harga yang salah ketik dilaporkan, bukan diabaikan", () => {
  // Diabaikan diam-diam berarti owner mengubah harga, melihat sinkronisasi
  // sukses, dan situs tetap menayangkan angka lama.
  failsWith(
    good({ harga: { ...HARGA, "houseblend.bold-70-31": 210_000 } }),
    /tidak dikenali kode/,
  );
});

/* ------------------------------------------------------------------ */
/* Stok                                                                */
/* ------------------------------------------------------------------ */

check("KD-08: status stok yang hilang atau tidak dikenal ditolak", () => {
  const missing = good();
  delete missing.stok.abmisibil;
  failsWith(missing, /Status stok "abmisibil" tidak ada/);

  failsWith(
    good({ stok: { ...STOK, abmisibil: "habis" } }),
    /hanya boleh available atau out-of-stock/,
  );
});

check("KD-08: setiap managedPrice() di products.ts punya kunci wajib", () => {
  // Kunci yang dipakai kode tetapi tidak diwajibkan skrip akan lolos
  // sinkronisasi lalu MENGGAGALKAN BUILD — gagal di tempat yang salah, jauh
  // dari sebabnya.
  const products = readFileSync(
    join(import.meta.dirname, "..", "src", "data", "products.ts"),
    "utf8",
  );
  const used = [...products.matchAll(/managedPrice\("([^"]+)"\)/g)].map((m) => m[1]);
  assert.ok(used.length >= 13, `hanya ${used.length} managedPrice ditemukan`);

  const sync = readFileSync(
    join(import.meta.dirname, "sync-katalog.mjs"),
    "utf8",
  );
  const missing = used.filter((key) => !sync.includes(`"${key}"`));
  assert.deepEqual(
    missing,
    [],
    `kunci dipakai products.ts tapi tidak diwajibkan sync: ${missing.join(", ")}`,
  );
});

check("KD-08: berkas hasil sinkronisasi menyatakan dirinya tidak boleh disunting", () => {
  const generated = readFileSync(
    join(import.meta.dirname, "..", "src", "data", "managed.generated.ts"),
    "utf8",
  );
  assert.ok(
    /JANGAN DISUNTING TANGAN/.test(generated),
    "peringatan hilang; suntingan tangan akan lenyap tanpa jejak",
  );
});

summary("Sinkronisasi katalog");
