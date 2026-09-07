import type { Product } from "@/data/types";
import { ProductCard } from "./product-card";

/**
 * Grid kartu produk. Dua kolom sejak layar HP supaya jumlah scroll wajar,
 * melebar ke tiga dan empat kolom di layar besar (NFR-05).
 *
 * `priority` hanya untuk dua kartu pertama, yaitu kandidat LCP; lebih dari itu
 * justru memperlambat karena gambar berebut bandwidth (Bagian 9.3 aturan 4).
 */
export function ProductGrid({
  products,
  priorityCount = 0,
}: {
  products: readonly Product[];
  priorityCount?: number;
}) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.slug} className="flex">
          <div className="flex w-full">
            <ProductCard
              product={product}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
              priority={index < priorityCount}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
