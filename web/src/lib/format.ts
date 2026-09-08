/**
 * Format tampilan angka. Fungsi murni, bebas React, bebas katalog.
 *
 * Aturan yang mengikat (BR-03, ADR-05): berkas ini hanya MEMFORMAT. Ia tidak
 * pernah membulatkan, tidak pernah menghitung ulang harga, dan tidak pernah
 * menerima pecahan uang. Seluruh aritmetika uang terjadi di `@/data/catalog`
 * dengan bilangan bulat.
 */

import type { OrderUnit } from "@/data/types";

/**
 * Format integer rupiah menjadi string tampilan, mis. 210000 -> "Rp210.000".
 *
 * `Intl` locale id-ID menyisipkan U+00A0 (spasi tanpa pemutus) antara "Rp" dan
 * angka. BR-02 menuntut tanpa spasi, dan spasi itu ikut terbawa ke pesan
 * WhatsApp, jadi dibuang di sini — satu-satunya tempat rupiah diformat.
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/[\s ]/g, "");
}

/** Harga per kilogram, mis. 200000 -> "Rp200.000/kg". */
export function formatPricePerKg(pricePerKg: number): string {
  return `${formatIDR(pricePerKg)}/kg`;
}

/**
 * Konversi satuan pesan houseblend ke teks kilogram (D-02).
 * Konversi ke kilogram HANYA terjadi di sini — saat menampilkan, tidak pernah
 * saat menghitung (ADR-05).
 *
 * 1 -> "0,5 kg" | 2 -> "1 kg" | 5 -> "2,5 kg" | 10 -> "5 kg"
 */
export function formatKgFromHalfUnits(halfKgUnits: number): string {
  const kg = halfKgUnits / 2;
  const text = Number.isInteger(kg) ? String(kg) : kg.toFixed(1).replace(".", ",");
  return `${text} kg`;
}

/**
 * Kuantitas siap tampil sesuai satuan pesan varian.
 * - pack    : 2 -> "2 pack"
 * - paket   : 2 -> "2 paket (3 pack)"
 * - half-kg : 5 -> "2,5 kg"
 * - gram-100: 2 -> "2 x 100 gr"
 */
export function formatQuantity(qty: number, unit: OrderUnit): string {
  switch (unit) {
    case "pack":
      return `${qty} pack`;
    case "paket":
      return `${qty} paket (3 pack)`;
    case "half-kg":
      return formatKgFromHalfUnits(qty);
    // Ditulis "2 x 100 gr", bukan "200 gr", supaya tidak pernah tertukar
    // dengan kemasan 200 gram lini single origin yang harganya berbeda.
    case "gram-100":
      return `${qty} x 100 gr`;
  }
}

/** Label satuan tunggal untuk teks harga, mis. "per pack", "per 0,5 kg". */
export function unitLabel(unit: OrderUnit): string {
  switch (unit) {
    case "pack":
      return "per pack 200 gr";
    case "paket":
      return "per paket 3 pack";
    case "half-kg":
      return "per 0,5 kg";
    case "gram-100":
      return "per 100 gr";
  }
}

/** Bilangan bulat dengan pemisah ribuan Indonesia, mis. 1900 -> "1.900". */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}
