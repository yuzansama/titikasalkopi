import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { bacaKas, buatSql, petakanRincian } from "../scripts/impor-kas.mjs";

const peta = (r) => Object.fromEntries(petakanRincian(r).map((i) => [i.kode, i.jumlah]));

test("nama lama dipetakan ke BOLD/BRIGHT", () => {
  assert.deepEqual(peta("Full Arabica 200g x2"), { "bright-200g": 2 });
  assert.deepEqual(peta("Full Arabica 100g x1, 200g x1"), { "bright-100g": 1, "bright-200g": 1 });
  assert.deepEqual(peta("1 Arabica 200g, 2 Robusta 100g, 1 Arabica 100g"), {
    "bright-200g": 1, "bold-100g": 2, "bright-100g": 1,
  });
  assert.deepEqual(peta("Full arabica 100g + blend 100g"), { "bright-100g": 1, "bold-100g": 1 });
  assert.deepEqual(peta("Houseblend 100g x2, 200g x1"), { "bold-100g": 2, "bold-200g": 1 });
});

test("yang bukan 4 varian tidak dipetakan", () => {
  assert.deepEqual(peta("Kopi"), {});
  assert.deepEqual(peta("Tanpa keterangan"), {});
  assert.deepEqual(
    peta("Houseblend 70-30 Beans Temanggung 1kg (230rb), Houseblend Bold Robusta 100g (45rb), Giling (10rb)"),
    { "bold-100g": 1 },
  );
  assert.deepEqual(peta("Single Origin Papua 200g (135rb)"), {});
});

test("SQL impor: bisa diulang, satu transaksi, semua uang /kas masuk", () => {
  const kas = bacaKas(readFileSync(new URL("../../web/public/kas/index.html", import.meta.url), "utf8"));
  const { sql, laporan } = buatSql(kas);
  assert.match(sql, /^begin;\ndelete from public\.penjualan where impor;/);
  assert.match(sql, /commit;$/);
  assert.equal(laporan.length, kas.penjualan.length);
  assert.equal(
    laporan.reduce((s, l) => s + l.total, 0),
    kas.penjualan.reduce((s, p) => s + p.total, 0),
  );
  assert.equal((sql.match(/, true\) returning id into pid;/g) ?? []).length, kas.penjualan.length);
});

test("tanda kutip di rincian tidak merusak SQL", () => {
  const { sql } = buatSql({ penjualan: [{ no: "1", tanggal: "2026-11-01", rincian: "Kopi O'Brien", total: 1, metode: "x", catatan: "" }] });
  assert.match(sql, /Kopi O''Brien/);
});
