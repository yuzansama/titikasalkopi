/**
 * Menjalankan `ops/order-tracker.gs` yang SUNGGUHAN di Node, dengan global
 * Google distub (KD-06).
 *
 *   node scripts/check-order-tracker-gs.mjs
 *
 * Kenapa ini ada. Berkas itu satu-satunya bagian sistem yang MENULIS ke buku
 * order owner, dan satu-satunya yang tidak berjalan di repositori ini — ia
 * hidup di dalam Google. Sampai sekarang ia hanya bisa diperiksa dengan
 * membaca, dan pemeriksaan yang bergantung pada mata manusia adalah persis
 * yang gagal ketika seseorang menghapus satu baris pagar karena terlihat tidak
 * terpakai.
 *
 * Yang distub hanya permukaan Apps Script yang benar-benar dipakai: sheet di
 * memori, kunci, pemformat tanggal, dan pembungkus keluaran. Logikanya sendiri
 * — kuota, netralisasi rumus, penjaga kode ganda, daftar putih — dieksekusi
 * apa adanya dari berkas yang akan ditempel owner.
 *
 * ADR-14: nol dependensi baru. Berkas `.gs` dimuat sebagai teks lalu dievaluasi
 * di dalam satu fungsi, bukan lewat pemuat modul.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { check, summary } from "./_ts-load.mjs";

const GS_PATH = join(import.meta.dirname, "..", "..", "ops", "order-tracker.gs");
const source = readFileSync(GS_PATH, "utf8");

const HEADERS = [
  "kode",
  "tanggal_pesan",
  "last4",
  "status",
  "tanggal_status",
  "kurir",
  "resi",
  "ringkasan",
  "sumber",
  "catatan_internal",
];

/**
 * Membuat satu dunia Apps Script baru berisi sheet di memori, lalu
 * mengembalikan `doGet`, `doPost`, dan barisnya supaya bisa diperiksa.
 *
 * @param {string[]} headers baris judul
 * @param {any[][]} rows isi awal
 */
function makeScript(headers = HEADERS, rows = []) {
  const values = [headers.slice(), ...rows.map((row) => row.slice())];
  const cache = new Map();

  const sheet = {
    getDataRange: () => ({ getValues: () => values }),
    appendRow: (row) => values.push(row.slice()),
  };

  const globals = {
    SpreadsheetApp: {
      getActive: () => ({
        getSheetByName: (name) => (name === "pesanan" ? sheet : null),
      }),
    },
    CacheService: {
      getScriptCache: () => ({
        get: (key) => (cache.has(key) ? cache.get(key) : null),
        put: (key, value) => cache.set(key, String(value)),
      }),
    },
    LockService: {
      getScriptLock: () => ({ waitLock: () => true, releaseLock: () => {} }),
    },
    Utilities: {
      // Cukup untuk pola yang dipakai berkasnya: yyyy-MM-dd di WIB.
      formatDate: (date) => {
        const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000);
        return wib.toISOString().slice(0, 10);
      },
    },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: (text) => ({
        setMimeType: () => ({ getContent: () => text }),
      }),
    },
    console,
  };

  const names = Object.keys(globals);
  const factory = new Function(
    ...names,
    `${source}\nreturn { doGet, doPost, normalizeCode, sanitizeCell_ };`,
  );
  const api = factory(...names.map((name) => globals[name]));
  return { ...api, values, cache, rows: () => values.slice(1) };
}

const body = (payload) => ({ postData: { contents: JSON.stringify(payload) } });
const parse = (response) => JSON.parse(response.getContent());
const today = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
const col = (name) => HEADERS.indexOf(name);

/* ------------------------------------------------------------------ */
/* Menulis                                                             */
/* ------------------------------------------------------------------ */

check("KD-06: pesanan sah menghasilkan satu baris lengkap ber-sumber web", () => {
  const gs = makeScript();
  const result = parse(
    gs.doPost(
      body({ code: "TAK-260908-K7Q2", last4: "9567", items: "Abmisibil x2" }),
    ),
  );
  assert.deepEqual(result, { ok: true });

  const rows = gs.rows();
  assert.equal(rows.length, 1, "harus tepat satu baris");
  const row = rows[0];
  assert.equal(row[col("kode")], "TAK-260908-K7Q2");
  assert.equal(row[col("last4")], "9567");
  assert.equal(row[col("status")], "menunggu-konfirmasi");
  assert.equal(row[col("tanggal_pesan")], today);
  assert.equal(row[col("tanggal_status")], today);
  assert.equal(row[col("ringkasan")], "Abmisibil x2");
  assert.equal(row[col("sumber")], "web");
  assert.equal(row[col("catatan_internal")], "", "kolom milik owner harus kosong");
});

check("KD-06: kode yang sudah ada TIDAK PERNAH ditimpa", () => {
  // Ini yang melindungi baris yang sudah disunting owner: tanpa penjaga ini,
  // siapa pun bisa mengembalikan pesanan "dikirim" menjadi "menunggu".
  const gs = makeScript(HEADERS, [
    ["TAK-260908-K7Q2", "2026-09-01", "9567", "dikirim", "2026-09-02", "JNE", "JX1", "lama", "web", "sudah transfer"],
  ]);
  const result = parse(
    gs.doPost(body({ code: "TAK-260908-K7Q2", last4: "0000", items: "baru" })),
  );
  assert.deepEqual(result, { ok: true }, "kode lama harus dijawab persis seperti kode baru");

  const rows = gs.rows();
  assert.equal(rows.length, 1, "tidak boleh menambah baris");
  assert.equal(rows[0][col("status")], "dikirim", "status lama tertimpa");
  assert.equal(rows[0][col("resi")], "JX1", "resi lama hilang");
});

check("KEAMANAN: kuota harian menutup endpoint setelah batasnya", () => {
  const gs = makeScript();
  const codes = [];
  for (let i = 0; i < 55; i += 1) {
    // Sufiks memakai alfabet kode order yang sah.
    const suffix = `K7Q${"ABCDEFGHJKMNPQRSTUVWXYZ23456789"[i % 31]}`;
    codes.push(`TAK-2609${String(10 + (i % 20)).padStart(2, "0")}-${suffix}`);
  }
  const unique = [...new Set(codes)];
  let accepted = 0;
  let capped = 0;
  for (const code of unique) {
    const result = parse(gs.doPost(body({ code, last4: "9567", items: "x" })));
    if (result.ok) accepted += 1;
    if (result.capped) capped += 1;
  }
  assert.equal(accepted, 50, `diterima ${accepted}, seharusnya berhenti di 50`);
  assert.ok(capped > 0, "kuota tidak pernah menolak apa pun");
  assert.equal(gs.rows().length, 50);
});

check("Bot Telegram: source telegram dicatat ber-sumber telegram, nilai lain jadi web", () => {
  const gs = makeScript();
  gs.doPost(body({ code: "TAK-261124-K7Q2", last4: "9567", items: "x", source: "telegram" }));
  gs.doPost(body({ code: "TAK-261124-K7Q3", last4: "", items: "x", source: "=jahat" }));
  assert.deepEqual(gs.rows().map((row) => row[col("sumber")]), ["telegram", "web"]);
});

check("Bot Telegram: kuota telegram terpisah dari kuota web", () => {
  const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const webRows = Array.from({ length: 50 }, (_, i) => [
    `TAK-261124-W${A[i % 31]}${A[Math.floor(i / 31)]}B`, today, "", "menunggu-konfirmasi", today, "", "", "x", "web", "",
  ]);
  const gs = makeScript(HEADERS, webRows);
  // Jatah web habis, tetapi bot tetap bisa mencatat sampai jatahnya sendiri.
  let accepted = 0;
  for (let i = 0; i < 25; i += 1) {
    const result = parse(gs.doPost(body({ code: `TAK-261124-T${A[i]}QB`, last4: "", items: "x", source: "telegram" })));
    if (result.ok) accepted += 1;
  }
  assert.equal(accepted, 20, `telegram diterima ${accepted}, seharusnya berhenti di 20`);
  assert.deepEqual(parse(gs.doPost(body({ code: "TAK-261124-ZZZZ", last4: "", items: "x" }))), { ok: false, capped: true });
});

check("KEAMANAN: doPost tidak membedakan kode nyata dari kode karangan", () => {
  // Audit 22 Nov 2026. Bila jawabannya berbeda, doPost menjadi alat untuk
  // memastikan kode order mana yang ada, lalu last4-nya tinggal ditebak.
  const nyata = "TAK-260908-K7Q2";
  const karangan = "TAK-260908-K7QA";
  const gs = makeScript(HEADERS, [
    ["TAK-260908-K7Q2", "2026-09-01", "9567", "dikirim", "2026-09-02", "JNE", "JX1", "lama", "", ""],
  ]);
  assert.equal(
    gs.doPost(body({ code: nyata, last4: "1111", items: "x" })).getContent(),
    gs.doPost(body({ code: karangan, last4: "1111", items: "x" })).getContent(),
  );

  // Sesudah kuota habis pun tidak boleh ada beda: kuota diperiksa lebih dulu.
  const penuh = makeScript(HEADERS, [
    ["TAK-260908-K7Q2", "2026-09-01", "9567", "dikirim", "2026-09-02", "JNE", "JX1", "lama", "", ""],
    ...Array.from({ length: 50 }, (_, i) => [
      `TAK-260909-A${"ABCDEFGHJKMNPQRSTUVWXYZ23456789"[i % 31]}${"ABCDEFGHJK"[Math.floor(i / 31)]}B`,
      today, "", "menunggu-konfirmasi", today, "", "", "x", "web", "",
    ]),
  ]);
  assert.equal(
    penuh.doPost(body({ code: nyata, last4: "1111", items: "x" })).getContent(),
    penuh.doPost(body({ code: karangan, last4: "1111", items: "x" })).getContent(),
  );
});

check("KEAMANAN: rumus dari luar tidak pernah masuk sel apa adanya", () => {
  const gs = makeScript();
  gs.doPost(
    body({
      code: "TAK-260908-K7Q2",
      last4: "9567",
      items: '=HYPERLINK("http://jahat","Klik untuk hadiah")',
    }),
  );
  const written = gs.rows()[0][col("ringkasan")];
  assert.ok(
    !/^[=+\-@]/.test(written),
    `sel ditulis sebagai rumus: "${written}" — ia akan berjalan saat owner ` +
      `membuka buku ordernya sendiri`,
  );
});

check("KEAMANAN: gagal TERTUTUP bila kolom sumber tidak ada", () => {
  // Tanpa kolom itu kuota harian tidak punya apa pun untuk dihitung, jadi
  // pagarnya mati tanpa suara. Berhenti mencatat lebih baik daripada menulis
  // tanpa batas.
  const withoutSource = HEADERS.filter((h) => h !== "sumber");
  const gs = makeScript(withoutSource, []);
  const result = parse(
    gs.doPost(body({ code: "TAK-260908-K7Q2", last4: "9567", items: "x" })),
  );
  assert.deepEqual(result, { ok: false });
  assert.equal(gs.rows().length, 0);
});

check("KD-06: masukan tidak sah ditolak tanpa menulis apa pun", () => {
  const gs = makeScript();
  for (const payload of [
    {},
    { code: "bukan-kode" },
    { code: "TAK-260908-K0Q2", last4: "9567" }, // 0 di luar alfabet
    { code: "TAK-26098-K7Q2", last4: "9567" }, // tanggal 5 digit
  ]) {
    parse(gs.doPost(body(payload)));
  }
  assert.equal(gs.rows().length, 0, "ada baris tertulis dari masukan tidak sah");
});

check("KD-06: last4 tidak sah tetap mencatat pesanannya, dengan kolom kosong", () => {
  const gs = makeScript();
  parse(gs.doPost(body({ code: "TAK-260908-K7Q2", last4: "12", items: "x" })));
  const rows = gs.rows();
  assert.equal(rows.length, 1, "pesanan tidak boleh hilang karena digitnya salah");
  assert.equal(rows[0][col("last4")], "");
});

check("KD-06: ringkasan sepanjang apa pun dipotong sebelum masuk sheet", () => {
  const gs = makeScript();
  gs.doPost(
    body({ code: "TAK-260908-K7Q2", last4: "9567", items: "A".repeat(5000) }),
  );
  assert.equal(String(gs.rows()[0][col("ringkasan")]).length, 200);
});

check("KD-06: urutan kolom sheet tidak memengaruhi isi baris", () => {
  // Owner bebas memindahkan kolom. Baris dirakit dari baris judul, bukan dari
  // urutan yang diasumsikan.
  const shuffled = ["sumber", "ringkasan", "kode", "status", "last4", "tanggal_pesan", "tanggal_status"];
  const gs = makeScript(shuffled, []);
  gs.doPost(body({ code: "TAK-260908-K7Q2", last4: "9567", items: "Abmisibil" }));
  const row = gs.rows()[0];
  assert.equal(row[shuffled.indexOf("kode")], "TAK-260908-K7Q2");
  assert.equal(row[shuffled.indexOf("sumber")], "web");
  assert.equal(row[shuffled.indexOf("ringkasan")], "Abmisibil");
});

/* ------------------------------------------------------------------ */
/* Membaca                                                             */
/* ------------------------------------------------------------------ */

const SEEDED = [
  ["TAK-260908-K7Q2", "2026-09-08", "9567", "dikirim", "2026-09-09", "JNE", "JX1234567890", "Abmisibil x2", "web", "sudah transfer"],
];

check("FR-51: pencarian yang cocok mengembalikan kolom daftar putih saja", () => {
  const gs = makeScript(HEADERS, SEEDED);
  const result = parse(
    gs.doGet({ parameter: { code: "TAK-260908-K7Q2", last4: "9567" } }),
  );
  assert.equal(result.found, true);
  assert.equal(result.trackingNumber, "JX1234567890");
  assert.equal(result.status, "dikirim");
});

check("BATAS KEPERCAYAAN: kolom internal tidak pernah ikut terkirim", () => {
  const gs = makeScript(HEADERS, SEEDED);
  const result = parse(
    gs.doGet({ parameter: { code: "TAK-260908-K7Q2", last4: "9567" } }),
  );
  const serialized = JSON.stringify(result);
  assert.ok(!serialized.includes("sudah transfer"), "catatan_internal bocor");
  assert.ok(!serialized.includes("web"), "kolom sumber bocor ke pembeli");
  assert.ok(!serialized.includes("9567"), "last4 dikirim balik ke penanya");
});

check("KEAMANAN: kode salah dan last4 salah menjawab byte yang sama", () => {
  // Kalau keduanya berbeda, endpoint menjadi alat menebak: pastikan sebuah
  // kode nyata, lalu telusuri 10.000 kemungkinan empat digit.
  const gs = makeScript(HEADERS, SEEDED);
  const wrongLast4 = gs
    .doGet({ parameter: { code: "TAK-260908-K7Q2", last4: "0000" } })
    .getContent();
  const wrongCode = gs
    .doGet({ parameter: { code: "TAK-260908-K7QA", last4: "9567" } })
    .getContent();
  assert.equal(wrongLast4, '{"found":false}');
  assert.equal(wrongCode, wrongLast4);
});

check("FR-51: last4 yang kehilangan nol di depan tetap cocok", () => {
  // Google membaca "0567" sebagai angka 567. Tanpa penambalan, setiap pembeli
  // bernomor berakhiran nol tidak akan pernah bisa melacak.
  const gs = makeScript(HEADERS, [
    ["TAK-260908-K7Q2", "2026-09-08", 567, "diproses", "2026-09-08", "", "", "x", "web", ""],
  ]);
  const result = parse(
    gs.doGet({ parameter: { code: "TAK-260908-K7Q2", last4: "0567" } }),
  );
  assert.equal(result.found, true);
});

check("KEAMANAN: last4 tidak bisa ditebak habis — kode dikunci setelah 10 gagal", () => {
  // Audit 22 Nov 2026. Tanpa batas, 10.000 kemungkinan last4 untuk satu kode
  // bisa dicoba semua.
  const gs = makeScript(HEADERS, SEEDED);
  const cari = (code, last4) => parse(gs.doGet({ parameter: { code, last4 } }));
  for (let i = 0; i < 10; i += 1) {
    assert.deepEqual(cari("TAK-260908-K7Q2", String(1000 + i)), { found: false });
  }
  assert.deepEqual(
    cari("TAK-260908-K7Q2", "9567"),
    { found: false },
    "last4 benar masih diterima setelah 10 tebakan salah",
  );
  // Kode lain tidak ikut terkunci.
  const lain = makeScript(HEADERS, SEEDED);
  assert.equal(parse(lain.doGet({ parameter: { code: "TAK-260908-K7Q2", last4: "9567" } })).found, true);
});

check("KEAMANAN: penguncian berlaku juga untuk kode yang tidak ada", () => {
  // Kalau hanya kode nyata yang terkunci, penguncian itu sendiri jadi penanda.
  const gs = makeScript(HEADERS, SEEDED);
  for (let i = 0; i < 10; i += 1) {
    gs.doGet({ parameter: { code: "TAK-260908-K7QA", last4: String(1000 + i) } });
  }
  assert.equal(gs.cache.get("lacak-gagal:TAK-260908-K7QA"), "10");
  assert.equal(gs.cache.get("lacak-gagal:TAK-260908-K7Q2") ?? null, null);
});

check("KEAMANAN: pembeli yang salah ketik beberapa kali tetap bisa melacak", () => {
  const gs = makeScript(HEADERS, SEEDED);
  for (let i = 0; i < 9; i += 1) {
    gs.doGet({ parameter: { code: "TAK-260908-K7Q2", last4: String(1000 + i) } });
  }
  assert.equal(parse(gs.doGet({ parameter: { code: "TAK-260908-K7Q2", last4: "9567" } })).found, true);
});

check("FR-51: sheet kosong menjawab tidak ketemu, bukan melempar", () => {
  const gs = makeScript(HEADERS, []);
  assert.deepEqual(
    parse(gs.doGet({ parameter: { code: "TAK-260908-K7Q2", last4: "9567" } })),
    { found: false },
  );
});

summary("Apps Script buku order");
