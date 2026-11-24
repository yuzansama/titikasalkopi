import Link from "next/link";
import { Container, SectionHeading } from "@/components/ui/container";
import { CARD } from "@/components/ui/styles";
import { catalogGroups } from "@/data/catalog";
import { segeraHadir } from "@/data/segera-hadir";
import { ViewEvent } from "@/features/analytics/view-event";
import { ProductGrid } from "@/features/catalog/product-grid";
import { breadcrumbJsonLd, katalogMetadata } from "@/lib/seo";

/* ADR-01 */
export const dynamic = "error";

export const metadata = katalogMetadata();

/** FR-01, FR-02, FR-03, FR-12, FR-44, FR-46. */
export default function KatalogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: breadcrumbJsonLd([
            { name: "Beranda", path: "/" },
            { name: "Katalog", path: "/katalog" },
          ]),
        }}
      />
      <ViewEvent kind="list" listName="Katalog" />

      <Container className="py-10 sm:py-14">
        <h1 className="font-display text-3xl font-semibold text-primary sm:text-4xl">
          Katalog kopi
        </h1>
        <p className="mt-3 max-w-2xl text-olive">
          Saat ini kami menjual houseblend BOLD dan BRIGHT dalam kemasan 100
          gr, 200 gr, dan 1 kg. Seluruh harga di halaman ini adalah harga
          resmi; ongkos kirim dikonfirmasi lewat WhatsApp.
        </p>

        {segeraHadir.map((kopi) => (
          <Link
            key={kopi.slug}
            href={`/segera-hadir/${kopi.slug}`}
            className={`${CARD} mt-8 flex items-center justify-between gap-4 p-5 hover:ring-primary/30`}
          >
            <span>
              <span className="block font-heading text-sm font-semibold uppercase tracking-[0.2em] text-rust">
                Segera hadir
              </span>
              <span className="mt-1 block font-display text-xl font-semibold text-primary">
                {kopi.name}, {kopi.wilayah}
              </span>
            </span>
            <span className="shrink-0 font-semibold text-rust underline underline-offset-4">Lihat</span>
          </Link>
        ))}

        {catalogGroups.map((group, index) => (
          <section key={group.id} className="mt-12" aria-labelledby={group.id}>
            <SectionHeading
              id={group.id}
              eyebrow={group.subtitle}
              title={group.title}
            />
            <div className="mt-6">
              <ProductGrid
                products={group.products}
                priorityCount={index === 0 ? 2 : 0}
              />
            </div>
          </section>
        ))}

      </Container>
    </>
  );
}
