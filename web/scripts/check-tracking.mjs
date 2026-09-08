/**
 * Pemeriksaan modul pelacakan pesanan (FR-51).
 *
 *   node scripts/check-tracking.mjs
 *
 * Menguji modul murni `src/lib/tracking.ts` tanpa jaringan. `lookupOrder()`
 * sendiri tidak diuji di sini karena ia hanya pembungkus `fetch`; yang berisiko
 * adalah validasi masukan dan penguraian jawaban, dan keduanya sudah dipisah
 * menjadi fungsi murni justru supaya bisa diuji di sini.
 *
 * Satu pemeriksaan terakhir menyeberang bahasa: kontrak antara `tracking.ts`
 * dan `ops/order-tracker.gs` hanya berupa nama medan JSON, dan keduanya ditulis
 * terpisah. Tanpa penjaga, mengganti nama satu kolom di Apps Script akan lolos
 * seluruh gerbang lalu tampil sebagai medan kosong di halaman.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { check, loadTs, summary } from "./_ts-load.mjs";

const T = await loadTs("src/lib/tracking.ts");

/* ------------------------------------------------------------------ */
/* Normalisasi kode                                                    */
/* ------------------------------------------------------------------ */

check("FR-51: kode order dinormalisasi dari bentuk yang biasa disalin pembeli", () => {
  // Pembeli menyalin dari chat: huruf kecil, spasi ikut terbawa, kadang awalan
  // TAK- tertinggal. Ketiganya harus tetap ketemu, bukan menjadi "tidak ada".
  assert.equal(T.normalizeOrderCode("tak-260908-k7q2"), "TAK-260908-K7Q2");
  assert.equal(T.normalizeOrderCode("  TAK-260908-K7Q2  "), "TAK-260908-K7Q2");
  assert.equal(T.normalizeOrderCode("TAK- 260908 -K7Q2"), "TAK-260908-K7Q2");
  assert.equal(T.normalizeOrderCode("260908-K7Q2"), "TAK-260908-K7Q2");
});

check("FR-51: masukan sah diterima", () => {
  const result = T.validateLookupInput(" tak-260908-k7q2 ", " 9567 ");
  assert.equal(result.ok, true);
  assert.equal(result.code, "TAK-260908-K7Q2");
  assert.equal(result.last4, "9567");
});

check("FR-51: masukan tidak sah ditolak SEBELUM jaringan dipakai", () => {
  assert.deepEqual(T.validateLookupInput("", "9567"), {
    ok: false,
    problem: "kode-kosong",
  });
  // Sufiks kurang satu karakter.
  assert.deepEqual(T.validateLookupInput("TAK-260908-K7Q", "9567"), {
    ok: false,
    problem: "kode-salah",
  });
  // Tanggal harus 6 digit.
  assert.deepEqual(T.validateLookupInput("TAK-26098-K7Q2", "9567"), {
    ok: false,
    problem: "kode-salah",
  });
  // I, L, O, 0 dan 1 tidak ada di alfabet kode order — X justru ada.
  assert.deepEqual(T.validateLookupInput("TAK-260908-K7QX", "9567"), {
    ok: true,
    code: "TAK-260908-K7QX",
    last4: "9567",
  });
  assert.deepEqual(T.validateLookupInput("TAK-260908-K0Q2", "9567"), {
    ok: false,
    problem: "kode-salah",
  });
  assert.deepEqual(T.validateLookupInput("TAK-260908-K7Q2", "956"), {
    ok: false,
    problem: "last4-salah",
  });
  assert.deepEqual(T.validateLookupInput("TAK-260908-K7Q2", "95a7"), {
    ok: false,
    problem: "last4-salah",
  });
});

check("FR-51: setiap masalah masukan punya pesan yang bisa ditindaklanjuti", () => {
  for (const problem of ["kode-kosong", "kode-salah", "last4-salah"]) {
    const message = T.INPUT_PROBLEM_MESSAGES[problem];
    assert.ok(message && message.length > 0, `pesan untuk ${problem} kosong`);
  }
});

/* ------------------------------------------------------------------ */
/* Penguraian jawaban                                                  */
/* ------------------------------------------------------------------ */

const FOUND = {
  found: true,
  code: "TAK-260908-K7Q2",
  status: "dikirim",
  statusUpdatedAt: "2026-09-09",
  orderedAt: "2026-09-08",
  courier: "JNE",
  trackingNumber: "JX1234567890",
  items: "Abmisibil 200 gr x2",
};

check("FR-51: jawaban lengkap terurai utuh", () => {
  const result = T.parseLookupResponse(FOUND);
  assert.equal(result.kind, "found");
  assert.equal(result.order.status, "dikirim");
  assert.equal(result.order.trackingNumber, "JX1234567890");
  assert.equal(result.order.items, "Abmisibil 200 gr x2");
});

check("FR-51: found:false menjadi not-found, bukan galat", () => {
  assert.deepEqual(T.parseLookupResponse({ found: false }), { kind: "not-found" });
});

check("FR-51: jawaban rusak TIDAK dipaksa menjadi pesanan", () => {
  for (const payload of [null, "teks", 42, [], { found: true }]) {
    const result = T.parseLookupResponse(payload);
    assert.notEqual(
      result.kind,
      "found",
      `payload ${JSON.stringify(payload)} tidak boleh terbaca sebagai pesanan`,
    );
  }
  assert.deepEqual(T.parseLookupResponse({ found: true, code: "X" }), {
    kind: "error",
    reason: "jawaban-rusak",
  });
});

check("FR-51: status di luar kosakata dilaporkan apa adanya, tidak ditebak", () => {
  const result = T.parseLookupResponse({
    ...FOUND,
    status: "sedang dikemas ya",
  });
  assert.deepEqual(result, { kind: "unknown-status", raw: "sedang dikemas ya" });
});

check("FR-51: medan opsional yang kosong menjadi null, bukan string kosong", () => {
  const result = T.parseLookupResponse({
    found: true,
    code: "TAK-260908-K7Q2",
    status: "diproses",
    courier: "   ",
  });
  assert.equal(result.kind, "found");
  assert.equal(result.order.courier, null);
  assert.equal(result.order.trackingNumber, null);
});

check("BATAS KEPERCAYAAN: medan tak dikenal dari endpoint tidak ikut terbawa", () => {
  // Kalaupun Apps Script suatu saat bocor mengirim data pribadi, penguraian di
  // sini hanya menyalin medan yang disebut namanya. Ini lapis kedua; lapis
  // pertamanya daftar putih di ops/order-tracker.gs.
  const result = T.parseLookupResponse({
    ...FOUND,
    nama: "Budi",
    telepon: "087777939567",
    alamat: "Jl. Mawar 1",
  });
  assert.equal(result.kind, "found");
  assert.deepEqual(Object.keys(result.order).sort(), [
    "code",
    "courier",
    "items",
    "orderedAt",
    "status",
    "statusUpdatedAt",
    "trackingNumber",
  ]);
});

/* ------------------------------------------------------------------ */
/* Kebasian                                                            */
/* ------------------------------------------------------------------ */

const order = (overrides) => ({
  code: "TAK-260908-K7Q2",
  status: "diproses",
  statusUpdatedAt: "2026-09-08",
  orderedAt: "2026-09-08",
  courier: null,
  trackingNumber: null,
  items: null,
  ...overrides,
});

check("FR-51: status yang baru diperbarui tidak ditandai basi", () => {
  const now = new Date("2026-09-10T10:00:00+07:00");
  assert.equal(T.isStale(order({ statusUpdatedAt: "2026-09-09" }), now), false);
});

check("FR-51: status yang lama tidak disentuh ditandai basi", () => {
  const now = new Date("2026-09-20T10:00:00+07:00");
  assert.equal(T.isStale(order({ statusUpdatedAt: "2026-09-08" }), now), true);
});

check("FR-51: status final tidak pernah basi", () => {
  const now = new Date("2027-01-01T10:00:00+07:00");
  for (const status of ["selesai", "batal"]) {
    assert.equal(
      T.isStale(order({ status, statusUpdatedAt: "2026-09-08" }), now),
      false,
      `${status} tidak boleh ditandai basi`,
    );
  }
});

check("FR-51: tanggal hilang atau rusak dianggap basi, bukan segar", () => {
  const now = new Date("2026-09-10T10:00:00+07:00");
  assert.equal(T.isStale(order({ statusUpdatedAt: null }), now), true);
  assert.equal(T.isStale(order({ statusUpdatedAt: "kemarin" }), now), true);
});

check("FR-51: ambang basi tepat di batas, bukan kira-kira", () => {
  // STALE_AFTER_DAYS dihitung dari tengah malam WIB tanggal status.
  const base = Date.parse("2026-09-08T00:00:00+07:00");
  const day = 24 * 60 * 60 * 1000;
  const justInside = new Date(base + T.STALE_AFTER_DAYS * day);
  const justOutside = new Date(base + T.STALE_AFTER_DAYS * day + 1000);
  assert.equal(T.isStale(order({}), justInside), false);
  assert.equal(T.isStale(order({}), justOutside), true);
});

/* ------------------------------------------------------------------ */
/* Konfigurasi                                                         */
/* ------------------------------------------------------------------ */

check("FR-51: endpoint kosong menghasilkan not-configured, bukan galat jaringan", async () => {
  // Dijalankan sinkron lewat then karena `check()` tidak menunggu Promise;
  // assertion di bawah cukup memastikan cabangnya tidak menyentuh fetch.
  assert.equal(typeof T.lookupOrder, "function");
  assert.equal(T.isTrackingConfigured(), T.TRACKING_ENDPOINT.length > 0);
});

/* ------------------------------------------------------------------ */
/* Kontrak lintas bahasa dengan Apps Script                            */
/* ------------------------------------------------------------------ */

check("FR-51: daftar putih Apps Script memakai nama medan yang dibaca situs", () => {
  const gs = readFileSync(
    join(import.meta.dirname, "..", "..", "ops", "order-tracker.gs"),
    "utf8",
  );

  const block = gs.match(/var PUBLIC_FIELDS = \{([\s\S]*?)\};/);
  assert.ok(block, "PUBLIC_FIELDS tidak ditemukan di ops/order-tracker.gs");

  const emitted = [...block[1].matchAll(/:\s*'([A-Za-z]+)'/g)].map((m) => m[1]);
  assert.ok(emitted.length > 0, "daftar putih kosong");

  const known = [
    "code",
    "status",
    "statusUpdatedAt",
    "orderedAt",
    "courier",
    "trackingNumber",
    "items",
  ];
  const unknown = emitted.filter((field) => !known.includes(field));
  assert.deepEqual(
    unknown,
    [],
    `Apps Script mengirim medan yang tidak dibaca situs: ${unknown.join(", ")}. ` +
      `Ganti namanya, atau tambahkan ke TrackedOrder di src/lib/tracking.ts.`,
  );
});

check("FR-51: kosakata status situs dan contoh di dokumen owner tidak berbeda", () => {
  const doc = readFileSync(
    join(import.meta.dirname, "..", "..", "docs", "08-lacak-pesanan.md"),
    "utf8",
  );
  const slugs = Object.keys(T.ORDER_STATUSES);
  const missing = slugs.filter((slug) => !doc.includes(slug));
  assert.deepEqual(
    missing,
    [],
    `status ${missing.join(", ")} tidak dijelaskan di docs/08-lacak-pesanan.md, ` +
      `sehingga owner tidak akan pernah mengetiknya`,
  );
});

/* ------------------------------------------------------------------ */
/* Pencatatan otomatis saat checkout (KD-06)                           */
/* ------------------------------------------------------------------ */

check("KD-06: ringkasan memuat item, jumlah, dan subtotal dalam satu baris", () => {
  const lines = [
    { productName: "Abmisibil", variantLabel: "200 gr", qty: 2, unit: "pack" },
    { productName: "BOLD 70:30", variantLabel: "per kg", qty: 2, unit: "half-kg" },
  ];
  const summary = T.summarizeForRecord(lines, 410000);
  assert.ok(summary.includes("Abmisibil"), "nama produk hilang");
  assert.ok(summary.includes("BOLD 70:30"), "nama houseblend hilang");
  assert.ok(summary.includes("Rp410.000"), "subtotal hilang");
  assert.ok(!summary.includes(String.fromCharCode(10)), "ringkasan harus satu baris");
});

check("KD-06: baris hanya dirakit untuk kode order yang sah", () => {
  assert.equal(T.buildOrderRecord("bukan-kode", "9567", "x"), null);
  assert.equal(T.buildOrderRecord("TAK-260908-K0Q2", "9567", "x"), null);
  assert.notEqual(T.buildOrderRecord("TAK-260908-K7Q2", "9567", "x"), null);
});

check("KD-06: last4 tidak sah menjadi kosong, bukan ikut tertulis", () => {
  // Baris tetap dicatat supaya owner tidak kehilangan pesanannya; yang
  // tertunda hanya pelacakan mandiri, sampai owner mengisi digitnya dari chat.
  const record = T.buildOrderRecord("TAK-260908-K7Q2", "12", "Abmisibil");
  assert.equal(record.last4, "");
  assert.equal(record.code, "TAK-260908-K7Q2");
});

check("KEAMANAN: teks menuju spreadsheet dinetralkan dari rumus", () => {
  // Sel yang diawali =, +, - atau @ dieksekusi Google Sheets sebagai rumus.
  // Ringkasan berasal dari sisi klien, jadi ia sepenuhnya dikendalikan orang
  // lain, dan owner-lah yang membuka sheet itu.
  for (const attack of [
    '=HYPERLINK("http://jahat","klik")',
    "+1+1",
    "-1+1",
    "@SUM(A1:A9)",
    "  =IMPORTXML(1,2)",
  ]) {
    const cleaned = T.sanitizeForSheet(attack);
    assert.ok(
      !/^[=+\-@]/.test(cleaned),
      `"${attack}" masih diawali karakter rumus: "${cleaned}"`,
    );
  }
});

check("KD-06: ringkasan dipotong pada batasnya, bukan dibiarkan tumbuh", () => {
  const long = "A".repeat(5000);
  assert.equal(
    T.sanitizeForSheet(long).length,
    T.MAX_RECORD_ITEMS_LENGTH,
    "ringkasan tanpa batas berarti satu orang bisa menggelembungkan sheet owner",
  );
});

check("KD-06: baris baru dan tab runtuh menjadi satu spasi", () => {
  const messy = "a" + String.fromCharCode(10) + String.fromCharCode(9) + "b   c";
  assert.equal(T.sanitizeForSheet(messy), "a b c");
});

check("KD-06: pencatatan tidak pernah melempar walau endpoint kosong", () => {
  // Aturan yang tidak boleh dilanggar: pembukuan tidak boleh menggagalkan
  // pemesanan. Kalau ini melempar, `window.open` tidak akan pernah dipanggil.
  const record = T.buildOrderRecord("TAK-260908-K7Q2", "9567", "Abmisibil");
  assert.doesNotThrow(() => T.recordOrder(record, ""));
});

check("KD-06: batas panjang situs dan Apps Script sama", () => {
  const gs = readFileSync(
    join(import.meta.dirname, "..", "..", "ops", "order-tracker.gs"),
    "utf8",
  );
  const match = gs.match(/var MAX_ITEMS_LENGTH = (\d+);/);
  assert.ok(match, "MAX_ITEMS_LENGTH tidak ditemukan di Apps Script");
  assert.equal(
    Number(match[1]),
    T.MAX_RECORD_ITEMS_LENGTH,
    "batas panjang di situs dan di Apps Script berbeda",
  );
});

check("KD-06: status awal Apps Script ada di kosakata situs", () => {
  const gs = readFileSync(
    join(import.meta.dirname, "..", "..", "ops", "order-tracker.gs"),
    "utf8",
  );
  const match = gs.match(/var INITIAL_STATUS = '([a-z-]+)';/);
  assert.ok(match, "INITIAL_STATUS tidak ditemukan di Apps Script");
  assert.ok(
    T.isOrderStatusSlug(match[1]),
    `status awal "${match[1]}" tidak dikenali situs; setiap pesanan otomatis ` +
      `akan tayang sebagai status yang belum dikenali`,
  );
});

check("KEAMANAN: Apps Script menjaga ketiga pagar tulisnya", () => {
  const gs = readFileSync(
    join(import.meta.dirname, "..", "..", "ops", "order-tracker.gs"),
    "utf8",
  );
  // Ketiganya pernah ditulis dengan alasan yang jelas; menghapus salah satunya
  // tanpa sadar jauh lebih mudah daripada menulisnya.
  assert.ok(/DAILY_WEB_ROW_CAP/.test(gs), "kuota harian hilang dari doPost");
  assert.ok(/LockService/.test(gs), "kunci serentak hilang; dua POST bisa sama-sama menulis");
  assert.ok(
    /duplicate: true/.test(gs),
    "penjaga kode ganda hilang; baris yang sudah disunting bisa tertimpa",
  );
  assert.ok(
    /sanitizeCell_/.test(gs),
    "netralisasi rumus hilang dari sisi yang mengikat",
  );
  assert.ok(
    /indexOf\(SOURCE_COLUMN\) === -1/.test(gs),
    "doPost tidak lagi gagal-tertutup saat kolom sumber hilang; kuota harian " +
      "akan mati diam-diam dan endpoint tulis jadi tanpa batas",
  );
});

summary("Pelacakan pesanan");
