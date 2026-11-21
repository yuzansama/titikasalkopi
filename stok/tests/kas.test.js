import assert from "node:assert/strict";
import { test } from "node:test";
import { bertanda, hitungKas } from "../src/lib.js";

const data = {
  pemodal: [{ nama: "A", modal: 500000 }, { nama: "B", modal: 500000 }],
  penjualan: [{ uang_diterima: 300000 }, { uang_diterima: 200000 }],
  setoran: [{ nama: "A", jumlah: 500000 }, { nama: "B", jumlah: 300000 }],
  belanja: [
    { item: "Kopi X", sumber: "Inv1", kategori: "Kopi", batch: "0", jumlah: 400000, dibayar_oleh: "A", dibebankan_ke: "Bersama" },
    { item: "Kopi pribadi", sumber: "Inv1", kategori: "Kopi", batch: "0", jumlah: 100000, dibayar_oleh: "B", dibebankan_ke: "B" },
    { item: "Sealer", sumber: "Shopee", kategori: "Peralatan & kemasan", batch: null, jumlah: 150000, dibayar_oleh: "Kas", dibebankan_ke: "Bersama" },
    { item: "Batal", kategori: "Kopi", batch: "2", jumlah: 999, dibayar_oleh: "Kas", dibebankan_ke: "Bersama", masuk_hitungan: false },
  ],
  pengembalian: [{ nama: "A", jumlah: 100000 }],
  po: [{ batch: "0", kg: 1, status: "Habis terjual" }],
};

test("hitungKas: rumus /kas", () => {
  const k = hitungKas(data);
  assert.equal(k.jual, 500000);
  assert.equal(k.usaha, 550000); // 400rb + 150rb, tanpa kopi pribadi dan baris tidak dihitung
  // uang di tangan = setoran 800rb + jual 500rb − belanja dari Kas 150rb − dikembalikan 100rb
  assert.equal(k.uang, 1050000);
  const A = k.rekap.find((r) => r.nama === "A");
  const B = k.rekap.find((r) => r.nama === "B");
  // A: keluar 500rb setor + 400rb talangan − wajib 500rb − kembali 100rb = +300rb belum balik
  assert.equal(A.selisih, 300000);
  assert.equal(A.status, "Belum dikembalikan");
  // B: keluar 300rb + 100rb talangan (kopi pribadinya) − wajib 600rb = −200rb kurang setor
  assert.equal(B.selisih, -200000);
  assert.equal(B.status, "Kurang setor");
  assert.equal(k.saldo, 1050000 + 200000 - 300000);
  assert.equal(k.pribadi, 100000);
  assert.equal(k.kopi1, 400000);
  assert.equal(k.untungKotor1, 100000);
  assert.equal(k.po[0].belanja, 500000);
  assert.equal(k.modalTotal, 1000000);
});

test("bertanda", () => {
  assert.equal(bertanda(1500), "+Rp1.500");
  assert.equal(bertanda(-1500), "−Rp1.500");
  assert.equal(bertanda(0), "Rp0");
});
