import Image from "next/image";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/icons/icons";
import { Container } from "@/components/ui/container";
import { buttonClass, CARD } from "@/components/ui/styles";
import { findSegeraHadir } from "@/data/segera-hadir";
import { breadcrumbJsonLd, segeraHadirMetadata } from "@/lib/seo";
import { site, waLink } from "@/lib/site";

/* ADR-01 */
export const dynamic = "error";

const kopi = findSegeraHadir("solok")!;

export const metadata = segeraHadirMetadata(kopi);

/** Halaman "segera hadir" untuk single origin Solok. Isi: src/data/segera-hadir.ts. */
export default function SolokSegeraHadirPage() {
  const kabari = waLink(
    `Halo ${site.name}, kabari saya saat kopi ${kopi.name} tersedia ya.`,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: breadcrumbJsonLd([
            { name: "Beranda", path: "/" },
            { name: "Katalog", path: "/katalog" },
            { name: `${kopi.name} (segera hadir)`, path: `/segera-hadir/${kopi.slug}` },
          ]),
        }}
      />
      <Container className="py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-base">
            <Image
              src={kopi.image.src}
              alt={kopi.image.alt}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>

          <div>
            <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-rust">
              Segera hadir · Single origin
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-primary sm:text-5xl">
              {kopi.name}
            </h1>
            <p className="mt-1 text-lg text-olive">{kopi.wilayah} · Arabika</p>
            <p className="mt-5 max-w-prose text-primary">
              {kopi.ringkas} Proses, ketinggian kebun, varietas, dan catatan rasanya
              kami umumkan saat kopinya siap dijual.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={kabari}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("primary", "lg", "w-full sm:w-auto")}
              >
                <WhatsAppIcon />
                Kabari saya saat tersedia
              </a>
              <Link href="/katalog" className={buttonClass("outline", "lg", "w-full sm:w-auto")}>
                Lihat kopi yang tersedia
              </Link>
            </div>

            <section aria-labelledby="kawasan" className={`${CARD} mt-8 p-5 sm:p-6`}>
              <h2 id="kawasan" className="font-display text-xl font-semibold text-primary">
                {kopi.judulKawasan}
              </h2>
              <p className="mt-1 text-sm text-olive">
                Gambaran kawasannya, bukan data lot kami.
              </p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-[10rem_1fr]">
                {kopi.faktaKawasan.map((f) => (
                  <div key={f.label} className="contents">
                    <dt className="text-sm font-semibold text-primary">{f.label}</dt>
                    <dd className="text-sm text-olive">{f.isi}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs text-olive">
                Sumber:{" "}
                {kopi.sumber.map((s) => (
                  <a
                    key={s.url}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    {s.label}
                  </a>
                ))}
              </p>
            </section>
          </div>
        </div>
      </Container>
    </>
  );
}
