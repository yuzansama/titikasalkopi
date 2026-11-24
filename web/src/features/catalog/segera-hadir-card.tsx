import Image from "next/image";
import Link from "next/link";
import { CARD, FOCUS_RING } from "@/components/ui/styles";
import type { SegeraHadir } from "@/data/segera-hadir";

/** Kartu kopi yang segera hadir, dipakai di beranda dan katalog. */
export function SegeraHadirCard({ kopi }: { kopi: SegeraHadir }) {
  return (
    <Link
      href={`/segera-hadir/${kopi.slug}`}
      className={`${CARD} flex items-center gap-4 p-4 hover:ring-primary/30 sm:gap-5 sm:p-5 ${FOCUS_RING}`}
    >
      <span className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-md sm:w-24">
        <Image src={kopi.image.src} alt="" aria-hidden="true" fill sizes="96px" className="object-cover" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-sm font-semibold uppercase tracking-[0.2em] text-rust">
          Segera hadir
        </span>
        <span className="mt-1 block font-display text-xl font-semibold text-primary">
          {kopi.name}, {kopi.wilayah}
        </span>
        <span className="mt-1 block text-sm text-olive">{kopi.ringkas}</span>
      </span>
      <span className="hidden shrink-0 font-semibold text-rust underline underline-offset-4 sm:inline">
        Lihat
      </span>
    </Link>
  );
}
