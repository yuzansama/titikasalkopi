import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cukupHari, esc, kodeDariScan, parseRupiah, perluPesan, pesanUndangan, qrUrl, ringkasPenjualan, rupiah, saranKode,
} from "../src/lib.js";

test("QR berisi URL vercel.app /q/<kode>", () => {
  assert.equal(qrUrl("bold-100g"), "https://titikasalkopi.vercel.app/q/bold-100g");
});

test("kodeDariScan membaca URL QR, dari host mana pun", () => {
  assert.equal(kodeDariScan("https://titikasalkopi.vercel.app/q/bold-100g"), "bold-100g");
  assert.equal(kodeDariScan("https://titikasalkopi.id/q/bright-200g/"), "bright-200g");
  assert.equal(kodeDariScan("  bold-200g "), "bold-200g");
});

test("kodeDariScan menolak teks lain", () => {
  for (const t of [
    "https://titikasalkopi.vercel.app/katalog",
    "https://evil.test/q/../admin",
    "https://x.test/q/BOLD-100G",
    "Halo dunia",
    "<script>",
    "",
    null,
    "https://x.test/q/" + "a".repeat(41),
  ]) {
    assert.equal(kodeDariScan(t), null, String(t));
  }
});

test("rupiah dan parseRupiah saling balik", () => {
  assert.equal(rupiah(45000), "Rp45.000");
  assert.equal(rupiah(1250000), "Rp1.250.000");
  assert.equal(parseRupiah("Rp45.000"), 45000);
  assert.equal(parseRupiah("155000"), 155000);
  assert.equal(parseRupiah("Rp"), null);
  assert.equal(parseRupiah(rupiah(610000)), 610000);
});

test("ringkasPenjualan: uang diterima terpisah dari harga katalog", () => {
  const hariIni = new Date();
  const kemarin = new Date(Date.now() - 86400000 * 2);
  const jual = [
    { waktu: hariIni.toISOString(), uang_diterima: 150000, penjualan_item: [
      { kode_varian: "bold-100g", jumlah: 1, harga_satuan: 45000 },
      { kode_varian: "bright-100g", jumlah: 2, harga_satuan: 55000 },
    ] },
    { waktu: kemarin.toISOString(), uang_diterima: 80000, penjualan_item: [
      { kode_varian: "bold-200g", jumlah: 1, harga_satuan: 80000 },
    ] },
  ];
  const semua = ringkasPenjualan(jual);
  assert.equal(semua.uang, 230000);
  assert.equal(semua.bungkus, 4);
  assert.equal(semua.nilai, 235000);
  const awal = new Date(); awal.setHours(0, 0, 0, 0);
  const hari = ringkasPenjualan(jual, awal);
  assert.equal(hari.uang, 150000);
  assert.equal(hari.perVarian.get("bright-100g").bungkus, 2);
  assert.equal(hari.perVarian.get("bright-100g").nilai, 110000);
  assert.equal(hari.perVarian.has("bold-200g"), false);
});

test("cukupHari dan perluPesan", () => {
  assert.equal(cukupHari(7, 56, 14), 1); // 4/hari
  assert.equal(cukupHari(24, 42, 14), 8); // 3/hari
  assert.equal(cukupHari(10, 0, 14), null);
  assert.equal(perluPesan({ aktif: true, stok: 10, batas_min: 10 }), true);
  assert.equal(perluPesan({ aktif: true, stok: 11, batas_min: 10 }), false);
  assert.equal(perluPesan({ aktif: false, stok: 0, batas_min: 10 }), false);
});

test("saranKode mengikuti pola id varian web", () => {
  assert.equal(saranKode("BOLD", "100 gr"), "bold-100g");
  assert.equal(saranKode("Bright", "1 kg"), "bright-1kg");
  assert.equal(saranKode("Full Robusta", "200 gram"), "full-robusta-200g");
});

test("esc menetralkan HTML", () => {
  assert.equal(esc(`<img src=x onerror="a">&'`), "&lt;img src=x onerror=&quot;a&quot;&gt;&amp;&#39;");
});

test("pesan undangan memuat kode, peran, dan alamat app", () => {
  const p = pesanUndangan({ nama: "Rina", peran: "sales", kode: "K7QM-4XPA", appUrl: "https://stok.test" });
  assert.match(p, /PIC Sales/);
  assert.match(p, /K7QM-4XPA/);
  assert.match(p, /https:\/\/stok\.test/);
});
