import Link from "next/link";
import { CARD, FOCUS_RING } from "@/components/ui/styles";
import {
  categoryLabel,
  priceFrom,
  pricePerKgFrom,
  productHref,
} from "@/data/catalog";
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

      <div className="flex flex-1 flex-col p-4">
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.15em] text-rust">
          {categoryLabel(product)}
        </p>

        <h3 className="mt-1 font-display text-lg font-semibold text-primary">
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

        {product.tastingNotes && product.tastingNotes.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {product.tastingNotes.map((note) => (
              <li
                key={note}
                className="rounded-full border border-gold px-2 py-0.5 text-xs text-coffee"
              >
                {note}
              </li>
            ))}
          </ul>
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
      </div>
    </article>
  );
}
