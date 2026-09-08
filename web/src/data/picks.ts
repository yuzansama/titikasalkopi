/**
 * Katalog Kopi 100 gram (KD-07).
 *
 * Lini KEDUA, berdiri sendiri di samping tujuh single origin 200 gram. Kedua
 * lini hidup berdampingan dan tidak saling menggantikan.
 *
 * ATURAN HARGA BERBEDA DARI LINI 200 GRAM. `BR-09` menetapkan harga single
 * origin ditentukan TIER, bukan biji — hanya dua angka untuk seluruh katalog.
 * Lini ini memberi harga PER BIJI, rentang Rp65.000 sampai Rp270.000. Dua tier
 * tidak mungkin menampung 18 harga berbeda, jadi `BR-09` sengaja TIDAK berlaku
 * di sini. Itu keputusan CEO, bukan kelalaian; lihat KD-07.
 *
 * SUMBER: poster "KATALOG KOPI" yang diberikan owner pada 8 September 2026,
 * disalin apa adanya. Nama dan harga adalah SATU-SATUNYA yang diketahui.
 *
 * YANG TIDAK DIKETAHUI, dan karena itu TIDAK ADA di sini: asal desa, wilayah,
 * provinsi, proses, ketinggian, varietas, dan catatan rasa. Kolom-kolom itu
 * tidak dikosongkan karena lupa — ia tidak ada sama sekali dalam bentuk data
 * ini. Menambahkannya berarti mengarang klaim produk pada toko yang dibayar
 * di muka lewat transfer, dan itu alasan yang sama mengapa empat origin lain
 * masih bercatatan rasa `null`.
 *
 * Itu pula sebabnya lini ini TIDAK memakai tipe `Product`: `Product.origin`
 * mewajibkan `province` terisi dan merakit judul SEO dari sana. Memaksa 18 kopi
 * ini ke dalamnya menuntut 18 provinsi karangan — dan untuk Panama serta Kenya,
 * kolom itu salah secara konsep, bukan sekadar kosong.
 *
 * Begitu owner menyerahkan data asalnya, sebuah biji boleh naik menjadi
 * `Product` penuh dengan halaman sendiri. Sampai saat itu, nama dan harga saja
 * lebih jujur daripada halaman yang tampak lengkap.
 */

import { managedCatalog } from "./managed.generated";
import type { PriceIDR } from "./types";

/** Berat satu kemasan lini ini, dalam gram. */
export const PICK_GRAMS = 100;

export type CoffeePick = {
  /** Stabil dan permanen; menjadi kunci baris keranjang. */
  slug: string;
  name: string;
  /** Harga satu kemasan 100 gram. Bilangan bulat (BR-03, ADR-05). */
  price: PriceIDR;
};

/**
 * Urutan sengaja mengikuti poster, kolom kiri lalu kolom kanan, BUKAN diurutkan
 * ulang menurut harga atau abjad. Owner menyusun posternya sendiri, dan
 * mengurutkan ulang diam-diam membuat daftar cetak dan daftar web tidak lagi
 * bisa dibandingkan baris per baris.
 */
export const coffeePicks: readonly CoffeePick[] = managedCatalog.picks;

/** Id varian sebuah pick. Satu pick tepat satu varian (kemasan 100 gram). */
export const pickVariantId = (slug: string): string => `${slug}-gram100`;
