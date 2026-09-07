import { Container } from "@/components/ui/container";
import { cartCatalogIndex } from "@/data/catalog";
import { CartView } from "@/features/cart/cart-view";
import { OrderSteps } from "@/features/contact/order-steps";
import { keranjangMetadata } from "@/lib/seo";

/* ADR-01 */
export const dynamic = "error";

/** `keranjangMetadata()` sudah menyetel `robots: { index: false }`. */
export const metadata = keranjangMetadata();

/**
 * FR-17…FR-26 — halaman keranjang.
 *
 * Server Component ini hanya merakit: ia mengirim `cartCatalogIndex` (indeks
 * katalog build-time) sebagai props supaya `CartView` dapat me-resolve harga
 * TERKINI tanpa pernah mengimpor `@/data/*` dari sisi klien (ADR-04, NFR-03).
 * Blok "Cara pesan" dikirim sebagai props Server Component sehingga isinya
 * tidak ikut ke bundel klien (Bagian 9.4).
 */
export default function KeranjangPage() {
  return (
    <Container className="py-8 sm:py-10">
      <h1 className="font-display text-3xl font-semibold text-primary sm:text-4xl">
        Keranjang
      </h1>
      <p className="mt-2 max-w-2xl text-olive">
        Periksa pesanan Anda, lalu kirim lewat WhatsApp. Harga di bawah adalah
        harga katalog terbaru dan belum termasuk ongkos kirim.
      </p>

      <CartView index={cartCatalogIndex} orderSteps={<OrderSteps />} />
    </Container>
  );
}
