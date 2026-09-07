import { SectionHeading } from "@/components/ui/container";
import type { Product } from "@/data/types";
import { ProductGrid } from "./product-grid";

/**
 * Penutup halaman detail: produk lain yang masuk akal ditawarkan berikutnya
 * (FR-02, FR-03).
 *
 * Kenapa ada. Halaman detail sebelumnya berhenti di tengah layar besar dan
 * menyisakan ±400 px ruang kosong tepat setelah pembeli mengambil keputusan —
 * tidak ada satu pun langkah lanjutan di sana.
 *
 * Server Component murni dan sengaja MEMAKAI ULANG `ProductGrid`/`ProductCard`
 * apa adanya: nol JavaScript tambahan (NFR-03, D-04 menyisakan margin sangat
 * tipis), dan kartu di sini berperilaku persis sama dengan kartu di /katalog.
 *
 * Daftar produknya dipilih `relatedProducts()` di `@/data/catalog`; berkas ini
 * tidak memilih, tidak mengurutkan, dan tidak menghitung apa pun.
 */
export function RelatedProducts({
  id,
  title,
  lead,
  products,
}: {
  id: string;
  title: string;
  lead?: string;
  products: readonly Product[];
}) {
  if (products.length === 0) return null;

  return (
    <section
      className="mt-12 border-t border-primary/10 pt-10"
      aria-labelledby={id}
    >
      <SectionHeading id={id} title={title} lead={lead} />
      <div className="mt-6">
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
