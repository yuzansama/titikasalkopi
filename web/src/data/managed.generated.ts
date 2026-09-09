/**
 * DIHASILKAN OTOMATIS — JANGAN DISUNTING TANGAN (KD-08).
 *
 * Ditulis ulang seluruhnya oleh `node scripts/sync-katalog.mjs`, yang membaca
 * Google Sheet milik owner. Suntingan tangan akan hilang pada sinkronisasi
 * berikutnya tanpa peringatan.
 *
 * Isinya SATU-SATUNYA sumber untuk harga, stok, dan lini 100 gram. Tidak ada
 * nilai cadangan di berkas lain, dan itu disengaja: dua sumber kebenaran untuk
 * harga berarti suatu hari situs menayangkan angka yang tidak seorang pun
 * merasa menuliskannya.
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
  /** Status jual per slug produk 200 gr dan lini houseblend. */
  stok: Readonly<Record<string, ProductStatus>>;
  /** Lini Katalog Kopi 100 gram, urut sesuai poster owner. */
  picks: readonly { slug: string; name: string; price: number }[];
};

export const managedCatalog: ManagedCatalog = {
  syncedAt: "2026-09-09",

  harga: {
    "single.signature.pack1": 140_000,
    "single.signature.pack3": 392_000,
    "single.signature.mini1": 85_000,
    "single.reguler.pack1": 125_000,
    "single.reguler.pack3": 352_000,
    "single.reguler.mini1": 70_000,

    "houseblend.bold-70-30": 215_000,
    "houseblend.bold-70-30.half": 120_000,
    "houseblend.bold-60-40": 205_000,
    "houseblend.bold-60-40.half": 115_000,
    "houseblend.bold-50-50": 200_000,
    "houseblend.bold-50-50.half": 110_000,
    "houseblend.bold-40-60": 195_000,
    "houseblend.bold-40-60.half": 105_000,
    "houseblend.bold-30-70": 190_000,
    "houseblend.bold-30-70.half": 100_000,
    "houseblend.bold-20-80": 185_000,
    "houseblend.bold-20-80.half": 95_000,
    "houseblend.bright-signature": 280_000,
    "houseblend.bright-signature.half": 150_000,
    "houseblend.bright-reguler": 240_000,
    "houseblend.bright-reguler.half": 130_000,
    "houseblend.full-robusta": 180_000,
    "houseblend.full-robusta.half": 100_000,
  },

  stok: {
    oelbiteno: "available",
    abmisibil: "available",
    sabin: "available",
    pyramid: "available",
    palimping: "available",
    kerinci: "available",
    "pondok-baru": "available",
    sindoro: "available",
    bold: "available",
    bright: "available",
    "full-robusta": "available",
  },

  picks: [
    { slug: "bali-kintamani", name: "Bali Kintamani", price: 80_000 },
    { slug: "gayo", name: "Gayo", price: 80_000 },
    { slug: "bali-peach", name: "Bali Peach", price: 110_000 },
    { slug: "gayo-lecie", name: "Gayo Lecie", price: 120_000 },
    { slug: "panama", name: "Panama", price: 270_000 },
    { slug: "kenya", name: "Kenya", price: 195_000 },
    { slug: "luwak", name: "Luwak", price: 140_000 },
    { slug: "kerinci-100", name: "Kerinci", price: 85_000 },
    { slug: "ciwidey", name: "Ciwidey", price: 85_000 },
    { slug: "telomoyo", name: "Telomoyo", price: 65_000 },
    { slug: "gedong-songo", name: "Gedong Songo", price: 75_000 },
    { slug: "sumbing", name: "Sumbing", price: 85_000 },
    { slug: "halu-banana-anaerob", name: "Halu Banana Anaerob", price: 90_000 },
    { slug: "merbabu", name: "Merbabu", price: 85_000 },
    { slug: "merapi", name: "Merapi", price: 75_000 },
    { slug: "argopuro", name: "Argopuro", price: 90_000 },
    { slug: "situjuah", name: "Situjuah", price: 80_000 },
    { slug: "lawu", name: "Lawu", price: 65_000 },
  ],
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
