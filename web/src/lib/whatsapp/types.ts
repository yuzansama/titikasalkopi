/**
 * Kontrak payload generator pesan WhatsApp (Bagian 5.5 arsitektur).
 *
 * Tidak pernah dikirim ke server — bentuknya tetap dikontrakkan supaya
 * generator pesan, komponen tombol, dan analitik bicara tentang hal yang sama
 * (ADR-03, ADR-11).
 *
 * Impor `@/data/types` di berkas ini bersifat TYPE-ONLY sehingga nol byte
 * katalog masuk bundel klien (Bagian 8 docs/05-backend.md).
 */

import type { OrderUnit, PriceIDR, ResolvedCartLine } from "@/data/types";

/** Pola: TAK-YYMMDD-XXXX (FR-24). */
export type OrderCode = string;

/** FR-22, FR-23, FR-24 — pesan checkout dari keranjang. */
export type OrderInquiryPayload = {
  orderCode: OrderCode;
  lines: readonly ResolvedCartLine[];
  subtotal: PriceIDR;
  /** Sudah melewati `sanitizeNote()` dan dipangkas 200 karakter. */
  note: string;
  /** URL halaman asal; menjadi penanda sumber di badan pesan (FR-24). */
  sourceUrl: string;
};

/** FR-38 — "Tanya produk ini". Tanpa kode order, karena belum ada pesanan. */
export type AskInquiryPayload = {
  productName: string;
  categoryLabel: string;
  variantLabel: string;
  unit: OrderUnit;
  /** Harga satu kemasan. Tidak ada harga kedua: lihat catatan pada `Variant`. */
  unitPrice: PriceIDR;
  sourceUrl: string;
};

/** FR-30 (Fase 1b) — CTA konsultasi blend untuk segmen kedai. */
export type B2BInquiryPayload = {
  /** Nama lini houseblend yang sedang dibuka, mis. "Houseblend BOLD". */
  lineName: string;
  sourceUrl: string;
};

export type WhatsAppMessage = {
  /** Teks mentah sebelum pengodean. Dipakai juga untuk pratinjau saat diuji. */
  text: string;
  /** URL siap buka: https://wa.me/6287777939567?text=... */
  url: string;
  /** Panjang setelah `encodeURIComponent` — angka yang diuji NFR-15. */
  encodedLength: number;
  /** true bila rincian diringkas agar muat dalam batas 1.500 karakter. */
  truncated: boolean;
  /** Kosong untuk pesan tanya produk dan B2B. */
  orderCode: OrderCode;
};
