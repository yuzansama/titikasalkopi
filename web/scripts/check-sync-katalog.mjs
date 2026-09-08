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
  "single.signature.pack1": 125_000,
  "single.signature.pack3": 350_000,
  "single.reguler.pack1": 110_000,
  "single.reguler.pack3": 310_000,
  "houseblend.bold-70-30": 210_000,
  "houseblend.bold-60-40": 200_000,
  "houseblend.bold-50-50": 195_000,
  "houseblend.bold-40-60": 190_000,
  "houseblend.bold-30-70": 185_000,
  "houseblend.bold-20-80": 175_000,
  "houseblend.bright-signature": 260_000,
  "houseblend.bright-reguler": 230_000,
  "houseblend.full-robusta": 175_000,
};

const STOK = {
  oelbiteno: "available",
  abmisibil: "available",
  sabin: "available",
  pyramid: "available",
  palimping: "available",
  kerinci: "available",
  "pondok-baru": "available",
  bold: "available",
  bright: "available",
  "full-robusta": "available",
};

const PICKS = [{ slug: "lawu", name: "Lawu", price: 65_000 }];

const good = (overrides = {}) => ({
  harga: { ...HARGA },
  stok: { ...STOK },
  picks: PICKS.map((p) => ({ ...p })),
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
  failsWith(good({ picks: null }), /Tab "katalog100" tidak ditemukan/);
});

check("KD-08: katalog100 kosong ditolak, bukan diterbitkan sebagai kosong", () => {
  // Daftar kosong hampir selalu berarti salah nama kolom. Menerimanya berarti
  // seluruh lini hilang dari situs tanpa seorang pun memutuskannya.
  failsWith(good({ picks: [] }), /tidak menghasilkan satu baris pun/);
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

/* ------------------------------------------------------------------ */
/* Lini 100 gram                                                       */
/* ------------------------------------------------------------------ */

check("KEAMANAN DATA: slug 100 gram yang bentrok dengan produk ditolak", () => {
  // Kegagalan paling sunyi dari semuanya: keranjang akan menampilkan barang
  // dan harga yang berbeda dari yang ditambahkan pengunjung.
  failsWith(
    good({ picks: [{ slug: "kerinci", name: "Kerinci", price: 85_000 }] }),
    /bentrok dengan produk 200 gram/,
  );
});

check("KD-08: slug 100 gram ganda ditolak", () => {
  failsWith(
    good({
      picks: [
        { slug: "lawu", name: "Lawu", price: 65_000 },
        { slug: "lawu", name: "Lawu Dua", price: 70_000 },
      ],
    }),
    /muncul dua kali/,
  );
});

check("KD-08: baris tanpa nama atau berslug tidak sah ditolak", () => {
  failsWith(
    good({ picks: [{ slug: "lawu", name: "   ", price: 65_000 }] }),
    /tidak punya nama/,
  );
  failsWith(
    good({ picks: [{ slug: "Lawu Gunung", name: "Lawu", price: 65_000 }] }),
    /tidak sah/,
  );
});

/* ------------------------------------------------------------------ */
/* Kontrak dengan kode                                                 */
/* ------------------------------------------------------------------ */

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
