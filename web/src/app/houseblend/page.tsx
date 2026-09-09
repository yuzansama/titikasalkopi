import Link from "next/link";
import { Container, SectionHeading } from "@/components/ui/container";
import { buttonClass, CARD, FOCUS_RING_INVERSE } from "@/components/ui/styles";
import {
  houseblendComposition,
  houseblendProducts,
  houseblendSizeGroups,
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
 * FR-08, FR-27, FR-28 — penjelasan tiga lini dan tabel gabungan sembilan rasio
 * beserta harga kedua ukuran kemasannya.
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
          Tiga lini blend untuk kedai dan rumah. Setiap rasio tersedia dalam dua
          ukuran kemasan, 1 kg dan 0,5 kg. Kemasan 1 kg lebih hemat per gramnya;
          harga keduanya tertulis apa adanya di tabel di bawah.
        </p>

        {/* FR-27 — karakter dan komposisi tiap lini */}
        <section className="mt-10" aria-labelledby="lini">
          <SectionHeading id="lini" title="Tiga lini dan komposisinya" />
          <ul className="mt-6 grid gap-4 lg:grid-cols-3">
            {houseblendProducts.map((line) => (
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
                <p className="mt-3 flex-1 text-[0.95rem] text-olive">
                  {line.description}
                </p>
                <p className="mt-4">
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

        {/* FR-28 — tabel gabungan sembilan varian */}
        <section className="mt-12" aria-labelledby="tabel-harga">
          <SectionHeading
            id="tabel-harga"
            title="Seluruh varian dan harganya"
            lead="Geser tabel ke samping bila layar Anda sempit."
          />
          <div className="mt-6 overflow-x-auto rounded-lg border-l-2 border-gold">
            <table className="w-full min-w-[26rem] border-collapse text-left">
              <caption className="sr-only">
                Daftar sembilan rasio houseblend beserta harga kemasan 1 kg dan
                kemasan 0,5 kg
              </caption>
              <thead>
                <tr className="border-b border-primary/20">
                  <th scope="col" className="px-3 py-2 text-sm font-semibold">
                    Lini
                  </th>
                  <th scope="col" className="px-3 py-2 text-sm font-semibold">
                    Rasio
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-right text-sm font-semibold"
                  >
                    Kemasan 1 kg
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-right text-sm font-semibold"
                  >
                    Kemasan 0,5 kg
                  </th>
                </tr>
              </thead>
              <tbody>
                {houseblendProducts.flatMap((line) =>
                  houseblendSizeGroups(line).map((group) => (
                    <tr
                      key={group.id}
                      className="border-b border-primary/10 last:border-0"
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-sm text-olive">
                        {line.name}
                      </td>
                      <th
                        scope="row"
                        className="px-3 py-2 text-left font-normal text-primary"
                      >
                        {group.label}
                      </th>
                      <td className="whitespace-nowrap px-3 py-2 text-right text-coffee">
                        {formatIDR(group.kg.unitPrice)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right text-olive">
                        {formatIDR(group.halfKg.unitPrice)}
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
            Butuh bantuan memilih rasio yang cocok dengan mesin dan menu Anda?
            Ceritakan kebutuhannya lewat WhatsApp — kami bantu bandingkan lini
            dan rasionya.
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
