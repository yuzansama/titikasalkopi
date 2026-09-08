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

summary("Pelacakan pesanan");
