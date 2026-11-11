import Link from "next/link";
import { Container, SectionHeading } from "@/components/ui/container";
import { buttonClass, CARD, FOCUS_RING_INVERSE } from "@/components/ui/styles";
import {
  houseblendComposition,
  houseblendProducts,
  productHref,
} from "@/data/catalog";
import { ViewEvent } from "@/features/analytics/view-event";
import { formatIDR } from "@/lib/format";
import { breadcrumbJsonLd, houseblendIndexMetadata } from "@/lib/seo";
import { site, waLink } from "@/lib/site";

/* ADR-01 */
export const dynamic = "error";

export const metadata = houseblendIndexMetadata();

/**
 * FR-08, FR-27, FR-28 — penjelasan lini houseblend dan tabel gabungan seluruh
 * kemasan yang sedang dijual beserta harganya (sejak 11 November 2026: BOLD
 * dan BRIGHT, masing-masing 100 gr, 200 gr, dan 1 kg).
 *
 * Tabel di sini SENGAJA statis (bukan `RatioTable` interaktif): halaman ini
 * membandingkan seluruh lini, sementara pemilihan rasio dilakukan di halaman
 * lini masing-masing tempat konfigurator jumlahnya berada (FR-29). Dengan
 * begitu halaman ini nol JavaScript kecuali badge keranjang.
 */
export default function HouseblendIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: breadcrumbJsonLd([
            { name: "Beranda", path: "/" },
            { name: "Katalog", path: "/katalog" },
            { name: "Houseblend", path: "/houseblend" },
          ]),
        }}
      />
      <ViewEvent kind="list" listName="Houseblend" />

      <Container className="py-10 sm:py-14">
        <h1 className="font-display text-3xl font-semibold text-primary sm:text-4xl">
          Houseblend
        </h1>
        <p className="mt-3 max-w-2xl text-olive">
          BOLD dan BRIGHT untuk kedai dan rumah, dalam kemasan 100 gr, 200 gr,
          dan 1 kg.
        </p>

        {/* FR-27 — karakter dan komposisi tiap lini */}
        <section className="mt-10" aria-labelledby="lini">
          <SectionHeading id="lini" title="Lini dan komposisinya" />
          <ul className="mt-6 grid gap-4 lg:grid-cols-2">
            {houseblendProducts
              .filter((line) => line.status === "available")
              .map((line) => (
              <li key={line.slug} className={`flex flex-col ${CARD} p-5`}>
                <h3 className="font-display text-xl font-semibold text-primary">
                  {line.name}
                </h3>
                <p className="mt-2 text-[0.95rem] text-olive">
                  <span className="font-medium text-primary">Komposisi: </span>
                  {line.line ? houseblendComposition(line.line) : ""}
                </p>
                {line.tastingNotes && line.tastingNotes.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {line.tastingNotes.map((note) => (
                      <li
                        key={note}
                        className="rounded-full border border-gold px-2 py-0.5 text-xs text-coffee"
                      >
                        {note}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {/* D-11 — deskripsi panjang tiap lini TIDAK diulang di kartu
                    ini. Ia utuh di halaman lininya, dan kartu ini cukup
                    menyebut komposisi lalu mengantar ke sana; mengulangnya di
                    sini menghabiskan seperempat anggaran kata halaman untuk
                    kalimat yang sudah punya rumah. */}
                <p className="mt-auto pt-4">
                  <Link
                    href={productHref(line)}
                    className={buttonClass("outline", "md", "w-full")}
                  >
                    Pilih varian {line.name}
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* FR-28 — tabel gabungan seluruh kemasan yang sedang dijual. Lini
            berstok kosong tidak dicantumkan: tabel ini daftar harga, dan harga
            yang tidak bisa dibeli hanya membingungkan. */}
        <section className="mt-12" aria-labelledby="tabel-harga">
          <SectionHeading
            id="tabel-harga"
            title="Kemasan dan harganya"
            lead="Geser tabel ke samping bila layar Anda sempit."
          />
          <div className="mt-6 overflow-x-auto rounded-lg border-l-2 border-gold">
            <table className="w-full min-w-[18rem] border-collapse text-left">
              <caption className="sr-only">
                Daftar kemasan houseblend yang sedang dijual beserta harganya
              </caption>
              <thead>
                <tr className="border-b border-primary/20">
                  <th scope="col" className="px-3 py-2 text-sm font-semibold">
                    Lini
                  </th>
                  <th scope="col" className="px-3 py-2 text-sm font-semibold">
                    Kemasan
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-right text-sm font-semibold"
                  >
                    Harga
                  </th>
                </tr>
              </thead>
              <tbody>
                {houseblendProducts
                  .filter((line) => line.status === "available")
                  .flatMap((line) =>
                    line.variants.map((variant) => (
                      <tr
                        key={variant.id}
                        className="border-b border-primary/10 last:border-0"
                      >
                        <td className="whitespace-nowrap px-3 py-2 text-sm text-olive">
                          {line.name.replace(/^Houseblend /, "")}
                        </td>
                        <th
                          scope="row"
                          className="whitespace-nowrap px-3 py-2 text-left font-normal text-primary"
                        >
                          {variant.label.replace(/^Kemasan /, "")}
                        </th>
                        <td className="whitespace-nowrap px-3 py-2 text-right text-coffee">
                          {variant.compareAtPrice !== undefined ? (
                            <s className="mr-2 text-sm text-olive">
                              <span className="sr-only">Harga normal </span>
                              {formatIDR(variant.compareAtPrice)}
                            </s>
                          ) : null}
                          {formatIDR(variant.unitPrice)}
                        </td>
                      </tr>
                    )),
                  )}
              </tbody>
            </table>
          </div>
        </section>

        <section
          className="mt-12 rounded-lg bg-primary p-6 text-cream"
          aria-labelledby="kedai"
        >
          <h2 id="kedai" className="font-display text-2xl font-semibold">
            Untuk kedai
          </h2>
          <p className="mt-2 max-w-2xl text-cream/80">
            Ceritakan mesin dan menu Anda lewat WhatsApp; kami bantu memilih
            blend dan kemasannya.
          </p>
          <p className="mt-5">
            <a
              href={waLink(
                `Halo ${site.name}, saya dari kedai dan ingin berdiskusi soal houseblend per kilogram.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("outlineInverse", "lg")}
            >
              Diskusi lewat WhatsApp
            </a>
          </p>
          <p className="mt-4 text-sm text-cream/80">
            <Link
              href="/kontak"
              className={`rounded-sm underline underline-offset-4 ${FOCUS_RING_INVERSE}`}
            >
              Lihat seluruh kanal resmi dan jam balas
            </Link>
          </p>
        </section>
      </Container>
    </>
  );
}
