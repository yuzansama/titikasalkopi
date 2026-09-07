import Link from "next/link";
import { Container } from "@/components/ui/container";
import { CARD, FOCUS_RING } from "@/components/ui/styles";
import {
  bundleSaving,
  bundleVariant,
  categoryLabel,
  defaultVariant,
  houseblendComposition,
  productHref,
  relatedProducts,
} from "@/data/catalog";
import type { Product } from "@/data/types";
import { formatIDR, formatNumber } from "@/lib/format";
import { ViewEvent } from "@/features/analytics/view-event";
import { AskAboutProductButton } from "@/features/whatsapp/ask-about-product-button";
import { ShopeeLink } from "@/features/contact/shopee-link";
import { PurchasePanel } from "./purchase-panel";
import { ProductMedia } from "./product-media";
import { RelatedProducts } from "./related-products";
import type { VariantOption } from "./variant-option";

/**
 * Halaman detail produk (FR-07, FR-09, FR-10, FR-11, FR-12, FR-16, FR-25, FR-38).
 * Server Component: hanya `PurchasePanel`, `AskAboutProductButton`,
 * `ShopeeLink`, dan `ViewEvent` yang ikut ke bundel klien (ADR-10).
 *
 * FR-07 ditegakkan secara struktural: daftar fakta di bawah hanya merender
 * medan yang BUKAN `null`. Tidak ada atribut origin yang dikarang, dan tidak
 * ada kalimat pemasaran yang menyiratkan atribut yang tidak ada di brand brief.
 */

function toVariantOptions(product: Product): VariantOption[] {
  return product.variants.map((variant) => ({
    id: variant.id,
    label: variant.label,
    unit: variant.unit,
    unitPrice: variant.unitPrice,
    ...(variant.pricePerKg !== undefined
      ? { pricePerKg: variant.pricePerKg }
      : {}),
    minQty: variant.minQty,
    step: variant.step,
  }));
}

function originFacts(product: Product): Array<{ label: string; value: string }> {
  const origin = product.origin;
  if (!origin) return [];
  const facts: Array<{ label: string; value: string }> = [];
  if (origin.place) facts.push({ label: "Lokasi", value: origin.place });
  facts.push({ label: "Wilayah", value: origin.region });
  facts.push({ label: "Provinsi", value: origin.province });
  if (origin.process) facts.push({ label: "Proses", value: origin.process });
  if (origin.processedBy) {
    facts.push({ label: "Diproses oleh", value: origin.processedBy });
  }
  if (origin.altitudeMasl !== null) {
    facts.push({
      label: "Ketinggian",
      value: `${formatNumber(origin.altitudeMasl)} MASL`,
    });
  }
  if (origin.varietals && origin.varietals.length > 0) {
    facts.push({ label: "Varietal", value: origin.varietals.join(", ") });
  }
  return facts;
}

export function ProductDetail({ product }: { product: Product }) {
  const variants = toVariantOptions(product);
  const facts = originFacts(product);
  const saving = bundleSaving(product);
  const bundle = bundleVariant(product);
  const cheapest = defaultVariant(product);
  /* BR-10 di titik keputusan: penghematan menempel pada opsi 3 pack itu
     sendiri, bukan hanya pada paragraf di atas. Angkanya tetap dari
     `bundleSaving()` — tidak ada uang yang dihitung ulang di FE. */
  const variantNotes =
    bundle && saving !== null
      ? { [bundle.id]: `Hemat ${formatIDR(saving)}` }
      : undefined;
  const related = relatedProducts(product);
  const isHouseblend = product.category === "houseblend";
  const composition = isHouseblend && product.line
    ? houseblendComposition(product.line)
    : null;

  return (
    <Container className="py-8 sm:py-12">
      <ViewEvent
        kind="item"
        productId={product.slug}
        itemCategory={categoryLabel(product)}
        itemVariant={cheapest.label}
      />

      <nav aria-label="Remah roti" className="text-sm text-olive">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link href="/" className={`rounded-sm hover:text-rust ${FOCUS_RING}`}>
              Beranda
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href="/katalog"
              className={`rounded-sm hover:text-rust ${FOCUS_RING}`}
            >
              Katalog
            </Link>
          </li>
          {isHouseblend ? (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href="/houseblend"
                  className={`rounded-sm hover:text-rust ${FOCUS_RING}`}
                >
                  Houseblend
                </Link>
              </li>
            </>
          ) : null}
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-primary">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div>
          <ProductMedia
            product={product}
            sizes="(max-width: 1024px) 100vw, 352px"
            priority
          />
        </div>

        <div>
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-rust">
            {categoryLabel(product)}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-primary sm:text-4xl">
            {product.name}
          </h1>

          {product.tastingNotes && product.tastingNotes.length > 0 ? (
            <>
              <h2 className="sr-only">Catatan rasa</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {product.tastingNotes.map((note) => (
                  <li
                    key={note}
                    className="rounded-full border border-gold px-3 py-1 text-sm text-coffee"
                  >
                    {note}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <p className="mt-5 max-w-prose text-primary">{product.description}</p>

          {composition ? (
            <p className="mt-4 max-w-prose text-olive">
              <span className="font-medium text-primary">Komposisi: </span>
              {composition}
            </p>
          ) : null}

          {facts.length > 0 ? (
            <section className="mt-6" aria-labelledby="asal-biji">
              <h2
                id="asal-biji"
                className="font-heading text-sm font-semibold uppercase tracking-wide text-primary"
              >
                Asal dan proses
              </h2>
              <dl className={`mt-3 divide-y divide-primary/10 ${CARD} px-4`}>
                {facts.map((fact) => (
                  <div key={fact.label} className="flex gap-4 py-2.5">
                    <dt className="w-32 shrink-0 text-sm text-olive">
                      {fact.label}
                    </dt>
                    <dd className="text-[0.95rem] text-primary">{fact.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-sm text-olive">
                Hanya keterangan yang kami ketahui yang ditampilkan. Detail lain
                dapat ditanyakan lewat WhatsApp.
              </p>
            </section>
          ) : null}

          {saving !== null ? (
            <p className="mt-6 rounded-md bg-coffee px-4 py-3 text-[0.95rem] text-cream">
              Paket 3 pack berisi tiga kemasan 200 gr dari origin yang sama dan
              hemat {formatIDR(saving)} dibanding membeli tiga pack satuan.
            </p>
          ) : null}

          <section className="mt-8" aria-labelledby="pesan-produk">
            <h2
              id="pesan-produk"
              className="font-display text-xl font-semibold text-primary"
            >
              Pesan {product.name}
            </h2>
            <div className="mt-4">
              <PurchasePanel
                slug={product.slug}
                productName={product.name}
                variants={variants}
                useRatioTable={isHouseblend && variants.length > 2}
                variantNotes={variantNotes}
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <AskAboutProductButton
                productId={product.slug}
                productName={product.name}
                categoryLabel={categoryLabel(product)}
                variantLabel={cheapest.label}
                unit={cheapest.unit}
                unitPrice={cheapest.unitPrice}
                pricePerKg={cheapest.pricePerKg}
                path={productHref(product)}
              />
              <ShopeeLink productId={product.slug} className="w-full sm:w-auto" />
            </div>
          </section>
        </div>
      </div>

      <RelatedProducts
        id="produk-lain"
        title={isHouseblend ? "Lini houseblend lainnya" : "Origin lainnya"}
        lead={
          isHouseblend
            ? "Dua lini sisanya, sama-sama dijual per kilogram dengan pemesanan mulai 0,5 kg."
            : "Origin lain dalam kemasan 200 gr, tersedia satuan maupun paket 3 pack."
        }
        products={related}
      />
    </Container>
  );
}
