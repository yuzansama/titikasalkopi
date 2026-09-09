import Link from "next/link";
import { Container, SectionHeading } from "@/components/ui/container";
import { buttonClass, CARD, FOCUS_RING } from "@/components/ui/styles";
import {
  featuredSignature,
  houseblendProducts,
  pricePerKgFrom,
  priceFrom,
  productHref,
  productsByTier,
} from "@/data/catalog";
import { ProductGrid } from "@/features/catalog/product-grid";
import { OrderSteps } from "@/features/contact/order-steps";
import { ShopeeLink } from "@/features/contact/shopee-link";
import { formatIDR, formatPricePerKg } from "@/lib/format";
import { homeMetadata, organizationJsonLd } from "@/lib/seo";
import { site, waLink } from "@/lib/site";

/* ADR-01: seluruh rute wajib statis. `error` membuat pemakaian API dinamis
   MENGGAGALKAN build, bukan diam-diam mengubah rute menjadi dinamis. */
export const dynamic = "error";

export const metadata = homeMetadata();

export default function HomePage() {
  const signatureFrom = priceFrom(productsByTier("signature")[0]);
  const regulerFrom = priceFrom(productsByTier("reguler")[0]);
  const houseblendFrom = Math.min(
    ...houseblendProducts.map((product) => pricePerKgFrom(product) ?? Infinity),
  );

  return (
    <>
      <script
        type="application/ld+json"
        // Satu-satunya pemakaian dangerouslySetInnerHTML yang diizinkan;
        // isinya sudah melewati safeJson() di lib/seo.ts (Bagian 12.2).
        dangerouslySetInnerHTML={{ __html: organizationJsonLd() }}
      />

      {/* Hero — FR-01 */}
      <section className="border-b border-primary/10 bg-surface">
        <Container className="py-12 sm:py-16">
          <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-rust">
            {site.domain}
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight text-primary sm:text-5xl">
            {site.tagline}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-olive">
            {site.description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/katalog" className={buttonClass("primary", "lg")}>
              Lihat katalog
            </Link>
            <Link href="/houseblend" className={buttonClass("outline", "lg")}>
              Houseblend per kg
            </Link>
          </div>

          <dl className="mt-10 grid gap-4 sm:grid-cols-3">
            <PriceStat
              term="Single Origin Signature"
              detail="Kupang dan Papua, kemasan 200 gr"
              value={`Mulai ${formatIDR(signatureFrom)}`}
            />
            <PriceStat
              term="Single Origin Reguler"
              detail="Pilihan Nusantara, kemasan 200 gr"
              value={`Mulai ${formatIDR(regulerFrom)}`}
            />
            <PriceStat
              term="Houseblend"
              detail="Pemesanan mulai 0,5 kg"
              value={`Mulai ${formatPricePerKg(houseblendFrom)}`}
            />
          </dl>
        </Container>
      </section>

      {/* Sorotan single origin Signature — FR-03 */}
      <Container className="py-12 sm:py-16">
        <SectionHeading
          eyebrow="Indonesia Timur"
          title="Single Origin Signature"
          lead="Empat titik asal dari Kupang dan Papua, dikemas 200 gr. Paket 3 pack berisi tiga kemasan dari origin yang sama."
        />
        <div className="mt-6">
          <ProductGrid products={featuredSignature} priorityCount={2} />
        </div>
        <p className="mt-6">
          <Link
            href="/katalog"
            className={`inline-flex min-h-11 items-center rounded-md text-rust underline underline-offset-4 ${FOCUS_RING}`}
          >
            Lihat seluruh katalog single origin
          </Link>
        </p>
      </Container>

      {/* Tiga lini houseblend — FR-08, FR-27 */}
      <section className="bg-surface">
        <Container className="py-12 sm:py-16">
          <SectionHeading
            eyebrow="Untuk kedai dan rumah"
            title="Tiga lini houseblend"
            lead="Setiap rasio tersedia dalam kemasan 1 kg dan 0,5 kg. Kemasan 1 kg lebih hemat per gramnya."
          />
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {houseblendProducts.map((line) => {
              const perKg = pricePerKgFrom(line);
              return (
                <li key={line.slug} className={`relative flex flex-col ${CARD} p-5`}>
                  <h3 className="font-display text-lg font-semibold text-primary">
                    <Link
                      href={productHref(line)}
                      className={`rounded-sm after:absolute after:inset-0 after:content-[''] ${FOCUS_RING}`}
                    >
                      {line.name}
                    </Link>
                  </h3>
                  <p className="mt-2 flex-1 text-[0.95rem] text-olive">
                    {line.summary}
                  </p>
                  {perKg !== null ? (
                    <p className="mt-4 font-semibold text-coffee">
                      Mulai {formatPricePerKg(perKg)}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      {/* Cara pesan — FR-26 */}
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <OrderSteps />
          <div className={`h-fit ${CARD} p-6`}>
            <h2 className="font-display text-xl font-semibold text-primary">
              Pesan sekarang
            </h2>
            <p className="mt-2 text-olive">
              Pesanan diselesaikan lewat WhatsApp. Tersedia juga di Shopee.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              {/*
                Tombol utama memakai bg-rust (cream di rust = 5,74:1, LULUS).
                Kerangka lama memakai bg-gold dengan label cream berukuran
                normal — 3,88:1 dan GAGAL WCAG AA; itu diperbaiki di sini
                sesuai Bagian 11.4 aturan 2.
              */}
              <a
                href={waLink(`Halo ${site.name}, saya ingin memesan kopi.`)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("primary", "lg")}
              >
                Pesan lewat WhatsApp
              </a>
              <ShopeeLink />
              <Link href="/kontak" className={buttonClass("outline", "lg")}>
                Lihat semua kanal resmi
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}

function PriceStat({
  term,
  detail,
  value,
}: {
  term: string;
  detail: string;
  value: string;
}) {
  return (
    <div className={`${CARD} p-4`}>
      <dt className="font-heading text-sm font-semibold uppercase tracking-wide text-primary">
        {term}
      </dt>
      <dd>
        <p className="mt-1 font-display text-xl font-semibold text-coffee">
          {value}
        </p>
        <p className="mt-1 text-sm text-olive">{detail}</p>
      </dd>
    </div>
  );
}
