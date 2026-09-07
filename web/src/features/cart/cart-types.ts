/**
 * Tipe keranjang. Bentuknya DIBEKUKAN oleh BE di `src/data/types.ts`
 * (Bagian 5.4 arsitektur); berkas ini hanya meneruskannya supaya seluruh
 * modul keranjang mengimpor dari satu tempat yang dekat dengan kodenya.
 *
 * `export type` dihapus saat kompilasi, jadi tidak ada satu byte pun katalog
 * yang ikut ke bundel klien (aturan ketergantungan nomor 4, NFR-03).
 */

export type {
  CartCatalogEntry,
  CartCatalogIndex,
  CartItem,
  CartState,
  ResolvedCart,
  ResolvedCartLine,
} from "@/data/types";
