import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons/icons";
import { Container } from "@/components/ui/container";
import { buttonClass, CARD } from "@/components/ui/styles";
import { findQrEntry, qrEntries } from "@/data/qr";
import { qrMetadata } from "@/lib/seo";
import { instagram, site, waLink } from "@/lib/site";

/* ADR-01 */
export const dynamic = "error";
export const dynamicParams = false;

export function generateStaticParams(): Array<{ kode: string }> {
  return qrEntries.map((entry) => ({ kode: entry.code }));
}

export async function generateMetadata({
  params,
}: PageProps<"/q/[kode]">): Promise<Metadata> {
  const { kode } = await params;
  const entry = findQrEntry(kode);
  return entry ? qrMetadata(entry.name, entry.label, entry.code) : {};
}

/**
 * Halaman yang terbuka saat pembeli memindai QR di kemasan dengan kamera biasa.
 * Satu kode = satu varian (lihat `src/data/qr.ts`).
 */
export default async function QrThankYouPage({
  params,
}: PageProps<"/q/[kode]">) {
  const { kode } = await params;
  const entry = findQrEntry(kode);
  if (!entry) notFound();

  const reorder = waLink(
    `Halo ${site.name}, saya mau pesan lagi ${entry.name} (${entry.label}).`,
  );

  return (
    <Container width="prose" className="py-10 sm:py-14">
      <p className="font-heading text-sm font-semibold uppercase tracking-[0.14em] text-olive">
        {site.name}
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-primary sm:text-4xl">
        Terima kasih sudah memilih kopi kami
      </h1>
      <p className="mt-3 text-olive">Semoga setiap cangkirnya menemani harimu.</p>

      <section aria-labelledby="kopi-anda" className={`${CARD} mt-8 p-5 sm:p-6`}>
        <h2 id="kopi-anda" className="text-sm font-semibold text-olive">
          Kopi di tanganmu
        </h2>
        <p className="mt-2 font-heading text-2xl font-semibold uppercase tracking-wide text-rust sm:text-3xl">
          {entry.name}
        </p>
        <p className="mt-1 font-semibold text-primary">{entry.label}</p>
        {entry.tastingNotes && entry.tastingNotes.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Catatan rasa">
            {entry.tastingNotes.map((note) => (
              <li
                key={note}
                className="rounded-full bg-primary/5 px-3 py-1 text-sm font-medium text-primary"
              >
                {note}
              </li>
            ))}
          </ul>
        ) : null}
        {entry.href ? (
          <p className="mt-4">
            <Link
              href={entry.href}
              className="font-semibold text-rust underline underline-offset-4 hover:text-clay"
            >
              Tentang kopi ini
            </Link>
          </p>
        ) : null}
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          href={reorder}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("primary", "lg", "w-full sm:w-auto")}
        >
          <WhatsAppIcon />
          Pesan lagi lewat WhatsApp
        </a>
        <Link href="/katalog" className={buttonClass("outline", "lg", "w-full sm:w-auto")}>
          Lihat kopi lainnya
        </Link>
      </div>

      <p className="mt-8 flex items-center gap-2 text-sm text-olive">
        <InstagramIcon />
        <span>
          Bagikan ceritamu dan tag{" "}
          <a
            href={instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold"
          >
            {instagram.handle}
          </a>
        </span>
      </p>
    </Container>
  );
}
