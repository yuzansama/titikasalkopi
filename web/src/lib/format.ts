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

/**
 * Harga sebuah kemasan 1 kg, mis. 215000 -> "Rp215.000/kg".
 *
 * Akhiran "/kg" hanya boleh dipakai pada kemasan 1 kg, karena di situ ia
 * memang harga satu kemasan yang dijual. Memakainya pada kemasan 0,5 kg
 * menghasilkan tarif yang tidak bisa dibeli siapa pun, dan itu persis cacat
 * yang diperbaiki pada 9 September 2026.
 */
export function formatPricePerKg(pricePerKg: number): string {
  return `${formatIDR(pricePerKg)}/kg`;
}

/**
 * Kuantitas siap tampil sesuai satuan pesan varian. Seluruhnya menghitung
 * KEMASAN, sehingga teks yang dihasilkan selalu bisa dikalikan pembaca dengan
 * harga satuan untuk mendapatkan subtotalnya.
 * - pack    : 2 -> "2 pack"
 * - paket   : 2 -> "2 paket (3 pack)"
 * - kg      : 3 -> "3 kemasan 1 kg"
 * - half-kg : 3 -> "3 kemasan 0,5 kg"
 * - gram-100: 2 -> "2 x 100 gr"
 */
export function formatQuantity(qty: number, unit: OrderUnit): string {
  switch (unit) {
    case "pack":
      return `${qty} pack`;
    case "paket":
      return `${qty} paket (3 pack)`;
    // Ditulis sebagai jumlah KEMASAN, bukan berat total. "1,5 kg" di samping
    // harga satu kemasan mengundang pembeli mengalikan keduanya dan mendapat
    // angka yang bukan subtotalnya.
    case "kg":
      return `${qty} kemasan 1 kg`;
    case "half-kg":
      return `${qty} kemasan 0,5 kg`;
    // Ditulis "2 x 100 gr", bukan "200 gr", supaya tidak pernah tertukar
    // dengan kemasan 200 gram lini single origin yang harganya berbeda.
    case "gram-100":
      return `${qty} x 100 gr`;
  }
}

/** Berat total siap tampil, mis. 3 kemasan 0,5 kg -> "1,5 kg". */
export function formatTotalWeight(qty: number, unit: OrderUnit): string | null {
  const gramsPerPack =
    unit === "kg" ? 1000 : unit === "half-kg" ? 500 : null;
  if (gramsPerPack === null) return null;
  const kg = (qty * gramsPerPack) / 1000;
  const text = Number.isInteger(kg) ? String(kg) : kg.toFixed(1).replace(".", ",");
  return `${text} kg`;
}

/** Label satuan tunggal untuk teks harga, mis. "per pack", "per 0,5 kg". */
export function unitLabel(unit: OrderUnit): string {
  switch (unit) {
    case "pack":
      return "per pack 200 gr";
    case "paket":
      return "per paket 3 pack";
    case "kg":
      return "per kemasan 1 kg";
    case "half-kg":
      return "per kemasan 0,5 kg";
    case "gram-100":
      return "per 100 gr";
  }
}

/** Bilangan bulat dengan pemisah ribuan Indonesia, mis. 1900 -> "1.900". */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}
