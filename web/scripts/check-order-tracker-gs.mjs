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
  return { ...api, values, rows: () => values.slice(1) };
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
  assert.deepEqual(result, { ok: true, duplicate: true });

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

check("FR-51: sheet kosong menjawab tidak ketemu, bukan melempar", () => {
  const gs = makeScript(HEADERS, []);
  assert.deepEqual(
    parse(gs.doGet({ parameter: { code: "TAK-260908-K7Q2", last4: "9567" } })),
    { found: false },
  );
});

summary("Apps Script buku order");
