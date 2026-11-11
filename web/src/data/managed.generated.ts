/**
 * DIHASILKAN OTOMATIS — JANGAN DISUNTING TANGAN (KD-08).
 *
 * Ditulis ulang seluruhnya oleh `node scripts/sync-katalog.mjs`, yang membaca
 * Google Sheet milik owner. Suntingan tangan akan hilang pada sinkronisasi
 * berikutnya tanpa peringatan.
 *
 * Isinya SATU-SATUNYA sumber untuk harga dan stok. Tidak ada nilai cadangan di
 * berkas lain, dan itu disengaja: dua sumber kebenaran untuk harga berarti
 * suatu hari situs menayangkan angka yang tidak seorang pun merasa
 * menuliskannya.
 *
 * Yang TIDAK ada di sini, dan tetap ditulis tangan di `products.ts`: asal,
 * proses, ketinggian, varietas, catatan rasa, dan foto. Semuanya klaim produk
 * atau aset, bukan angka, dan jarang berubah.
 *
 * Cara mengubah isinya ada di `docs/09-kelola-katalog.md`.
 */

import type { ProductStatus } from "./types";

export type ManagedCatalog = {
  /** Tanggal sinkronisasi terakhir, YYYY-MM-DD WIB. Hanya untuk jejak. */
  syncedAt: string;
  /** Seluruh harga situs, dalam rupiah bulat. Kunci dijelaskan di doc. */
  harga: Readonly<Record<string, number>>;
  /** Status jual per slug single origin dan lini houseblend. */
  stok: Readonly<Record<string, ProductStatus>>;
};

export const managedCatalog: ManagedCatalog = {
  syncedAt: "2026-11-11",

  harga: {
    "single.signature.pack1": 140_000,
    "single.signature.pack3": 392_000,
    "single.signature.mini1": 85_000,
    "single.reguler.pack1": 125_000,
    "single.reguler.pack3": 352_000,
    "single.reguler.mini1": 70_000,

    "houseblend.bold.mini1": 45_000,
    "houseblend.bold.pack1": 80_000,
    "houseblend.bold.kg": 320_000,
    "houseblend.bold.kg.promo": 300_000,
    "houseblend.bright.mini1": 55_000,
    "houseblend.bright.pack1": 95_000,
    "houseblend.bright.kg": 400_000,
    "houseblend.bright.kg.promo": 380_000,
    "houseblend.full-robusta": 180_000,
    "houseblend.full-robusta.half": 100_000,
  },

  stok: {
    oelbiteno: "out-of-stock",
    abmisibil: "out-of-stock",
    sabin: "out-of-stock",
    pyramid: "out-of-stock",
    palimping: "out-of-stock",
    kerinci: "out-of-stock",
    "pondok-baru": "out-of-stock",
    sindoro: "out-of-stock",
    bold: "available",
    bright: "available",
    "full-robusta": "out-of-stock",
  },

};

/**
 * Harga wajib. Melempar bila kuncinya hilang, alih-alih mengembalikan 0.
 *
 * Katalog tanpa harga bukan keadaan yang boleh tayang: nol akan tampil sebagai
 * "Rp0" di halaman produk dan ikut ke pesan WhatsApp sebagai penawaran nyata.
 * Melempar di sini menggagalkan build, dan situs lama tetap tayang.
 */
export function managedPrice(key: string): number {
  const value = managedCatalog.harga[key];
  if (typeof value !== "number") {
    throw new Error(
      `Harga "${key}" tidak ada di managed.generated.ts. ` +
        `Jalankan sync-katalog, atau periksa tab "harga" di sheet.`,
    );
  }
  return value;
}

/** Status jual. Default "available" bila slug belum pernah dicantumkan. */
export function managedStatus(slug: string): ProductStatus {
  return managedCatalog.stok[slug] ?? "available";
}
