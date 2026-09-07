import { Container, SectionHeading } from "@/components/ui/container";
import { catalogGroups } from "@/data/catalog";
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
          Single origin dalam kemasan 200 gr dan houseblend per kilogram. Seluruh
          harga di halaman ini adalah harga resmi; ongkos kirim dikonfirmasi
          lewat WhatsApp.
        </p>

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
