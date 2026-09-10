import { Container } from "@/components/ui/container";
import {
  InstagramIcon,
  ShopeeIcon,
  WhatsAppIcon,
} from "@/components/icons/icons";
import { buttonClass, CARD } from "@/components/ui/styles";
import { OrderSteps } from "@/features/contact/order-steps";
import { ReplyHoursStatus } from "@/features/contact/reply-hours-status";
import { ShippingEstimates } from "@/features/contact/shipping-estimates";
import { ShopeeLink } from "@/features/contact/shopee-link";
import { kontakMetadata } from "@/lib/seo";
import { instagram, site, waLink, whatsapp } from "@/lib/site";

/* ADR-01 */
export const dynamic = "error";

export const metadata = kontakMetadata();

/**
 * FR-26, FR-35, FR-36, FR-37 — kanal resmi, jam balas D-03, blok 4 langkah.
 *
 * Tidak ada formulir kontak di halaman ini. Itu keputusan arsitektur, bukan
 * kelalaian: O-19 dan NFR-16 melarang formulir berbasis server dan penyimpanan
 * data pembeli pada Fase 1 (ADR-07). Seluruh inquiry lewat deeplink WhatsApp.
 */
export default function KontakPage() {
  return (
    <Container className="py-10 sm:py-14">
      <h1 className="font-display text-3xl font-semibold text-primary sm:text-4xl">
        Kontak
      </h1>
      <p className="mt-3 max-w-2xl text-olive">
        Semua pesanan diselesaikan lewat WhatsApp.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="kanal-resmi">
          <h2
            id="kanal-resmi"
            className="font-display text-2xl font-semibold text-primary"
          >
            Kanal resmi
          </h2>

          {/* D-13: baris keterangan di bawah Instagram dan Shopee dibuang.
              Judul kartu, handle, dan label tombolnya sudah menyebut kanalnya;
              kalimat tambahan hanya menjelaskan apa yang sudah terlihat. */}
          <ul className="mt-5 space-y-4">
            <li className={`${CARD} p-5`}>
              <h3 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wide text-primary">
                <WhatsAppIcon />
                WhatsApp
              </h3>
              <p className="mt-2 text-lg font-semibold text-primary">
                {whatsapp.display}
              </p>
              <ReplyHoursStatus className="mt-3" />
              <p className="mt-4">
                <a
                  href={waLink(`Halo ${site.name}, saya ingin bertanya.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass("primary", "md", "w-full sm:w-auto")}
                >
                  Buka WhatsApp
                </a>
              </p>
            </li>

            <li className={`${CARD} p-5`}>
              <h3 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wide text-primary">
                <InstagramIcon />
                Instagram
              </h3>
              <p className="mt-2 text-lg font-semibold text-primary">
                {instagram.handle}
              </p>
              <p className="mt-4">
                <a
                  href={instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass("outline", "md", "w-full sm:w-auto")}
                >
                  Buka Instagram
                </a>
              </p>
            </li>

            <li className={`${CARD} p-5`}>
              <h3 className="flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wide text-primary">
                <ShopeeIcon />
                Shopee
              </h3>
              <p className="mt-4">
                <ShopeeLink className="w-full sm:w-auto" />
              </p>
            </li>
          </ul>
        </section>

        <div>
          <OrderSteps />
          {/* Ongkir adalah pertanyaan pertama yang datang lewat chat. Angkanya
              diletakkan tepat setelah alur pesan, sebelum orang mengetik. */}
          <ShippingEstimates className="mt-10" />
        </div>
      </div>
    </Container>
  );
}
