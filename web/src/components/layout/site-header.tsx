import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/lib/site";
import { FOCUS_RING } from "@/components/ui/styles";

/**
 * Header situs. Server Component murni.
 *
 * Badge keranjang diterima lewat prop `cartSlot`, bukan diimpor: aturan
 * ketergantungan nomor 2 melarang `components/` mengenal `features/`.
 * `layout.tsx` yang merakit keduanya (FR-17, ADR-10).
 *
 * Navigasi sengaja berupa satu baris tautan yang bisa digeser pada layar
 * sempit, BUKAN menu hamburger: menu hamburger menuntut state, jebakan fokus,
 * dan `aria-expanded` — semuanya JavaScript tambahan untuk lima tautan
 * (ADR-10, NFR-03). Semua tautan selalu terlihat dan selalu dapat difokus.
 */

const NAV = [
  { href: "/katalog", label: "Katalog" },
  { href: "/houseblend", label: "Houseblend" },
  { href: "/cerita-kami", label: "Cerita Kami" },
  { href: "/kontak", label: "Kontak" },
] as const;

export function SiteHeader({ cartSlot }: { cartSlot: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 border-b border-primary/10 bg-base/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-5 py-3 sm:px-6">
        <Link
          href="/"
          className={`shrink-0 rounded-sm ${FOCUS_RING}`}
        >
          <span className="font-display text-lg font-semibold leading-tight text-primary sm:text-xl">
            {site.name}
          </span>
          <span className="sr-only">— beranda</span>
        </Link>

        <nav aria-label="Navigasi utama" className="ml-auto min-w-0">
          <ul className="flex items-center gap-1 overflow-x-auto">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-md px-2.5 text-[0.95rem] text-primary hover:text-rust sm:px-3 ${FOCUS_RING}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {cartSlot}
      </div>
    </header>
  );
}
