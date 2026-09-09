import Link from "next/link";
import { CARD, FOCUS_RING } from "@/components/ui/styles";
import { priceFrom, pricePerKgFrom, productHref } from "@/data/catalog";
import type { Product } from "@/data/types";
import { formatIDR, formatPricePerKg, unitLabel } from "@/lib/format";
import { ProductMedia } from "./product-media";

/**
 * Kartu produk untuk grid katalog dan sorotan beranda (FR-02, FR-03, FR-12).
 * Server Component murni — nol JavaScript.
 *
 * Seluruh kartu dibungkus satu tautan (`stretched link` lewat `::after`)
 * sehingga hanya ada SATU target fokus per kartu; ini yang menjaga urutan tab
 * tetap pendek dan terbaca (NFR-07).
 */
export function ProductCard({
  product,
  sizes,
  priority = false,
}: {
  product: Product;
  sizes: string;
  priority?: boolean;
}) {
  const perKg = pricePerKgFrom(product);
  const cheapest = product.variants.reduce((min, variant) =>
    variant.unitPrice < min.unitPrice ? variant : min,
  );

  return (
    <article className={`group relative flex flex-col overflow-hidden ${CARD}`}>
      <ProductMedia product={product} sizes={sizes} priority={priority} />

      {/* FR-14 — penanda stok kosong dari sheet owner. Ditumpuk di atas foto
          supaya terbaca sebelum pembeli menimbang harganya. */}
      {product.status === "out-of-stock" ? (
        <p className="absolute left-3 top-3 z-10 rounded-full bg-coffee px-3 py-1 font-heading text-xs font-semibold uppercase tracking-[0.12em] text-cream">
          Stok kosong
        </p>
      ) : null}

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg font-semibold text-primary">
          <Link
            href={productHref(product)}
            className={`rounded-sm after:absolute after:inset-0 after:content-[''] ${FOCUS_RING}`}
          >
            {product.name}
          </Link>
        </h3>

        {product.origin ? (
          <p className="mt-1 text-sm text-olive">
            {[product.origin.place, product.origin.region, product.origin.province]
              .filter(Boolean)
              .join(", ")}
          </p>
        ) : null}

        <p className="mt-auto pt-4 text-primary">
          <span className="text-sm text-olive">Mulai dari </span>
          <span className="font-semibold text-coffee">
            {perKg !== null
              ? formatPricePerKg(perKg)
              : formatIDR(priceFrom(product))}
          </span>
          {perKg === null ? (
            <span className="text-sm text-olive"> {unitLabel(cheapest.unit)}</span>
          ) : null}
        </p>

        {/* D-12 — baris harga paket 3 pack dan pil "Hemat" sengaja TIDAK ada di
            kartu; keduanya pindah ke halaman produk. Penghematannya tetap
            dihitung bundleSaving() dan tampil menempel pada opsi varian di sana,
            jadi hilangnya di sini bukan bug yang perlu "dikembalikan". */}
      </div>
    </article>
  );
}
