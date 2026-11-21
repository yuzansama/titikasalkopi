import { products } from "@/data/catalog";
import type { Product, Variant } from "@/data/types";

/**
 * Kode QR kemasan: satu QR untuk satu varian (satu jenis kopi + satu ukuran).
 *
 * Isi QR adalah URL `/q/<kode>`, dengan `<kode>` = `Variant.id`. Id varian
 * sudah dijanjikan stabil dan permanen (lihat `Variant.id`), dan itu syarat
 * mutlak di sini: kode yang sudah tercetak di stiker tidak bisa ditarik lagi.
 * Mengganti id varian berarti setiap stiker lama berakhir di halaman 404.
 *
 * Dua pembaca memakai URL yang sama:
 * - Pembeli yang memindai dengan kamera biasa membuka halaman terima kasih
 *   `/q/<kode>` di situs ini.
 * - Aplikasi stok memindai URL yang sama dan memakai `<kode>` untuk mencatat
 *   barang masuk atau terjual.
 *
 * Bundel (`packsPerUnit` > 1, mis. 3 x 200 gr) tidak mendapat QR. Stiker
 * ditempel per bungkus, jadi bundel terdiri atas beberapa bungkus yang
 * masing-masing sudah punya QR ukurannya sendiri.
 */
export type QrEntry = {
  code: string;
  product: Product;
  variant: Variant;
};

export const qrEntries: QrEntry[] = products.flatMap((product) =>
  product.variants
    .filter((variant) => (variant.packsPerUnit ?? 1) === 1)
    .map((variant) => ({ code: variant.id, product, variant })),
);

const qrIndex = new Map(qrEntries.map((entry) => [entry.code, entry]));

export function findQrEntry(code: string): QrEntry | undefined {
  return qrIndex.get(code);
}

/** Path relatif yang dikodekan ke dalam QR. */
export function qrPath(code: string): string {
  return `/q/${code}`;
}
