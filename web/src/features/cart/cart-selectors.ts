/**
 * Resolve harga saat render (Bagian 6.5, ADR-04).
 *
 * Baris keranjang yang tersimpan hanya membawa `{ slug, variantId, qty }`.
 * Nama, label varian, dan HARGA di-resolve di sini dari indeks katalog yang
 * dikirim Server Component `/keranjang` sebagai props — sehingga Client
 * Component tidak pernah mengimpor `@/data/*` (aturan ketergantungan nomor 4).
 *
 * Baris yang slug atau variannya tidak lagi ada di katalog DIBUANG tanpa
 * melempar, dan jumlahnya dilaporkan lewat `droppedCount` supaya halaman bisa
 * memberi tahu pengunjung satu kali (perilaku wajib menurut ADR-04).
 *
 * Baris yang produknya ditandai KOSONG diperlakukan berbeda dari baris yang
 * hilang: ia tetap dikembalikan, ditandai `soldOut`, dan dikeluarkan dari
 * `orderableLines`, `subtotal`, serta `itemCount`. Membuangnya diam-diam
 * membuat pembeli mengira keranjangnya rusak; membiarkannya ikut terhitung
 * membuat ia mengirim pesanan yang tidak bisa dipenuhi — dan pesanan itu
 * langsung tertulis ke buku order (KD-06). Keranjang bertahan tujuh hari,
 * jadi jendela antara owner menandai kosong dan pembeli menekan kirim nyata.
 */

import { lineKey } from "./cart-reducer";
import type {
  CartCatalogIndex,
  CartItem,
  ResolvedCart,
  ResolvedCartLine,
} from "./cart-types";

export function resolveCart(
  items: readonly CartItem[],
  note: string,
  index: CartCatalogIndex,
): ResolvedCart {
  const lines: ResolvedCartLine[] = [];
  let dropped = 0;

  for (const item of items) {
    const entry = index[item.slug];
    const variant = entry?.variants.find((v) => v.id === item.variantId);
    if (!entry || !variant) {
      dropped += 1; // produk/varian sudah tidak ada di katalog (ADR-04)
      continue;
    }

    lines.push({
      slug: item.slug,
      variantId: item.variantId,
      qty: item.qty,
      productName: entry.name,
      categoryLabel: entry.categoryLabel,
      variantLabel: variant.label,
      unit: variant.unit,
      unitPrice: variant.unitPrice,
      soldOut: entry.status === "out-of-stock",
      // Dua bilangan bulat dikalikan. Tidak pernah ada pecahan (ADR-05, BR-03).
      lineTotal: item.qty * variant.unitPrice,
      href: entry.href,
    });
  }

  const orderableLines = lines.filter((line) => !line.soldOut);

  return {
    lines,
    orderableLines,
    itemCount: orderableLines.reduce((n, line) => n + line.qty, 0),
    subtotal: orderableLines.reduce((n, line) => n + line.lineTotal, 0),
    note,
    droppedCount: dropped,
    soldOutCount: lines.length - orderableLines.length,
  };
}

/**
 * Daftar "slug::variantId" yang sah, diturunkan dari indeks katalog.
 * Dipakai `CartProvider` untuk memangkas baris basi saat hydration; ukurannya
 * sekitar 600 byte untuk katalog Fase 1a.
 */
export function catalogValidKeys(index: CartCatalogIndex): string[] {
  const keys: string[] = [];
  for (const entry of Object.values(index)) {
    for (const variant of entry.variants) {
      keys.push(lineKey(entry.slug, variant.id));
    }
  }
  return keys;
}
