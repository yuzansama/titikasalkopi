import Link from "next/link";
import { Container, SectionHeading } from "@/components/ui/container";
import { buttonClass, CARD, FOCUS_RING } from "@/components/ui/styles";
import { featuredSignature } from "@/data/catalog";
import { ProductGrid } from "@/features/catalog/product-grid";
import { ShopeeLink } from "@/features/contact/shopee-link";
import { homeMetadata, organizationJsonLd } from "@/lib/seo";
import { site, waLink } from "@/lib/site";

/* ADR-01: seluruh rute wajib statis. `error` membuat pemakaian API dinamis
   MENGGAGALKAN build, bukan diam-diam mengubah rute menjadi dinamis. */
export const dynamic = "error";

export const metadata = homeMetadata();

export default function HomePage() {
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

          {/* D-13: tiga kartu PriceStat dicabut dari hero. Harga sudah hidup
              di setiap kartu produk dan di /katalog, jadi mengulangnya di sini
              hanya menunda pengunjung melihat produk pertama. */}
        </Container>
      </section>

      {/* Sorotan single origin Signature — FR-03 */}
      <Container className="py-12 sm:py-16">
        <SectionHeading
          eyebrow="Indonesia Timur"
          title="Single Origin Signature"
          lead="Empat titik asal dari Kupang dan Papua, dikemas 200 gr."
        />
        <div className="mt-6">
          <ProductGrid products={featuredSignature} priorityCount={2} />
        </div>
        {/* D-13: seksi "Tiga lini houseblend" diganti satu tautan. Beranda
            memajang satu sorotan saja; lininya dijelaskan di /houseblend. */}
        <p className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-6">
          <Link
            href="/katalog"
            className={`inline-flex min-h-11 items-center rounded-md text-rust underline underline-offset-4 ${FOCUS_RING}`}
          >
            Lihat seluruh katalog single origin
          </Link>
          <Link
            href="/houseblend"
            className={`inline-flex min-h-11 items-center rounded-md text-rust underline underline-offset-4 ${FOCUS_RING}`}
          >
            Lihat tiga lini houseblend
          </Link>
        </p>
      </Container>

      {/* Ajakan memesan — FR-26 */}
      {/* D-13: <OrderSteps /> tidak lagi dipasang di beranda. Blok itu utuh di
          /kontak, dan menaruhnya di dua tempat membuat beranda menjelaskan
          alur sebelum pengunjung memilih kopinya. */}
      <Container className="py-12 sm:py-16">
        <div className={`max-w-xl ${CARD} p-6`}>
          <h2 className="font-display text-xl font-semibold text-primary">
            Pesan sekarang
          </h2>
          <p className="mt-2 text-olive">Pesanan diselesaikan lewat WhatsApp.</p>
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
      </Container>
    </>
  );
}
