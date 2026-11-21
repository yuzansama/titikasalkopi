import assert from "node:assert/strict";
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

test("yang tidak dikenali hanya dicatat uangnya", () => {
  assert.deepEqual(peta("Kopi"), {});
  assert.deepEqual(peta("Tanpa keterangan"), {});
  assert.deepEqual(
    peta("Houseblend 70-30 Beans Temanggung 1kg (230rb), Houseblend Bold Robusta 100g (45rb), Giling (10rb)"),
    { "bold-100g": 1 },
  );
});

test("single origin dipetakan ke kode varian web", () => {
  assert.deepEqual(peta("Single Origin Papua 200g (135rb)"), { "sabin-pack1": 1 });
  assert.deepEqual(peta("Pondok Baru 100g x2, Kerinci 200g"), { "pondok-baru-mini1": 2, "kerinci-pack1": 1 });
  assert.deepEqual(peta("Single Origin 200g"), {}); // tanpa nama: tidak ditebak
});

test("stok awal impor = jumlah terjual per varian", () => {
  const { sql, stokAwal } = buatSql({
    penjualan: [
      { no: "1", tanggal: "2026-10-02", rincian: "Bold 100g x2", total: 90000, metode: "x", catatan: "" },
      { no: "2", tanggal: "2026-10-05", rincian: "Bold 100g, Sabin 200g", total: 185000, metode: "x", catatan: "" },
    ],
  });
  assert.deepEqual(stokAwal, { "bold-100g": 3, "sabin-pack1": 1 });
  assert.match(sql, /delete from public\.barang_masuk where impor;/);
  assert.match(sql, /values \('bold-100g', 3, pemilik, '2026-10-02T08:00:00\+07:00'/);
});

// /kas sudah dihapus dari web; contoh halamannya cukup memuat bagian yang dibaca skrip.
const CONTOH_HTML = `<script id="kas-data" type="application/json">${JSON.stringify({
  penjualan: [
    { no: "1", tanggal: "2026-10-02", rincian: "Bold 100g x2", total: 90000, metode: "BCA", catatan: "" },
    { no: "2", tanggal: "2026-10-03", rincian: "Kopi", total: 95000, metode: "BCA", catatan: "" },
  ],
  belanja: [
    { no: "1", item: "Sealer", sumber: "Shopee", kategori: "Peralatan & kemasan", batch: "-", qty: 1, harga: 143750,
      jumlah: 143750, dibayar_oleh: "A", dibebankan_ke: "Bersama", masuk_hitungan: "Ya", catatan: "" },
  ],
  setoran: [{ no: "1", nama: "A", jumlah: 500000, keterangan: "Setoran modal" }],
  pengembalian: [{ no: "1", nama: "A", jumlah: 143750, keterangan: "Talangan sealer" }],
  po: [{ batch: "1", kg: 3, status: "Habis terjual" }],
})}</script><script>var INVESTOR = ['A', 'B'];\n  var MODAL = 500000;</script>`;

test("bacaKas membaca kas-data, pemodal, dan modal", () => {
  const kas = bacaKas(CONTOH_HTML);
  assert.deepEqual(kas.pemodal, ["A", "B"]);
  assert.equal(kas.modal, 500000);
  assert.equal(kas.belanja.length, 1);
});

test("SQL impor kas: belanja, setoran, pengembalian, pemodal, PO", () => {
  const { sql } = buatSql(bacaKas(CONTOH_HTML));
  for (const t of ["pengembalian", "setoran", "belanja"]) assert.match(sql, new RegExp(`delete from public\\.${t} where impor;`));
  assert.match(sql, /insert into public\.pemodal \(nama, modal, urutan\) values \('B', 500000, 1\)/);
  assert.match(sql, /insert into public\.po .*values \('1', 3, 'Habis terjual', 0\)/);
  assert.match(sql, /insert into public\.belanja .*'Sealer', 'Shopee', 'Peralatan & kemasan', null, 1, 143750, 'A', 'Bersama', true, null, true, pemilik/);
  assert.match(sql, /insert into public\.setoran .*'A', 500000, 'Setoran modal', true, pemilik/);
});

test("belanja yang jumlahnya bukan qty x harga ditolak", () => {
  const kas = bacaKas(CONTOH_HTML);
  kas.belanja[0].jumlah = 1;
  assert.throws(() => buatSql(kas), /qty x harga/);
});

test("SQL impor: bisa diulang, satu transaksi, semua uang /kas masuk", () => {
  const kas = bacaKas(CONTOH_HTML);
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
