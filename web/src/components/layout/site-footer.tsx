import Link from "next/link";
import type { ReactNode } from "react";
import {
  InstagramIcon,
  ShopeeIcon,
  WhatsAppIcon,
} from "@/components/icons/icons";
import { FOCUS_RING_INVERSE } from "@/components/ui/styles";
import { instagram, shopee, site, waLink, whatsapp } from "@/lib/site";

/**
 * Footer situs (FR-35). Server Component murni.
 *
 * Kanal resmi tampil di seluruh halaman. Status jam balas diterima lewat prop
 * `replyHoursSlot` karena ia Client Component milik `features/` dan
 * `components/` dilarang mengenal `features/` (aturan ketergantungan nomor 2).
 *
 * Kontras: seluruh blok berlatar hijau primary, sehingga teks memakai cream
 * (14,74:1, lulus) dan indikator fokus memakai cream pula — rust di atas hijau
 * hanya 2,57:1 dan pasangan itu dilarang sepenuhnya (Bagian 11.3).
 */

const PAGES = [
  { href: "/katalog", label: "Katalog" },
  { href: "/houseblend", label: "Houseblend" },
  { href: "/cerita-kami", label: "Cerita Kami" },
  { href: "/kontak", label: "Kontak" },
  { href: "/keranjang", label: "Keranjang" },
  { href: "/lacak", label: "Lacak pesanan" },
] as const;

const linkClass = `inline-flex min-h-11 items-center gap-2 rounded-md text-cream underline-offset-4 hover:underline ${FOCUS_RING_INVERSE}`;

export function SiteFooter({ replyHoursSlot }: { replyHoursSlot: ReactNode }) {
  return (
    <footer className="mt-16 bg-primary text-cream">
      <div className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10 sm:px-6 lg:pb-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="font-display text-xl font-semibold">{site.name}</p>
            <p className="mt-2 max-w-xs text-[0.95rem] text-cream/80">
              {site.tagline}
            </p>
          </div>

          <nav aria-label="Navigasi footer">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.2em]">
              Halaman
            </h2>
            <ul className="mt-2">
              {PAGES.map((page) => (
                <li key={page.href}>
                  <Link href={page.href} className={linkClass}>
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.2em]">
              Kanal resmi
            </h2>
            <ul className="mt-2">
              <li>
                <a
                  href={waLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  <WhatsAppIcon />
                  WhatsApp {whatsapp.display}
                </a>
              </li>
              <li>
                <a
                  href={instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  <InstagramIcon />
                  Instagram {instagram.handle}
                </a>
              </li>
              <li>
                <a
                  href={shopee.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  <ShopeeIcon />
                  Shopee {shopee.handle}
                </a>
              </li>
            </ul>
            <div className="mt-3">{replyHoursSlot}</div>
          </div>
        </div>

        {/* D-13 — baris ini dipendekkan menjadi hak cipta saja. Kalimat
            "Pemesanan diselesaikan lewat WhatsApp; pembayaran tidak dilakukan
            di website ini." dibuang dari sini karena footer tayang di SETIAP
            halaman, sehingga kalimat itu terbaca puluhan kali oleh pembeli yang
            belum memesan. Ia tetap hidup di /kontak: langkah ke-4 `OrderSteps`
            ("Pembayaran tidak dilakukan di website ini.") dan catatan coffee di
            bawahnya. Jangan kembalikan ke sini tanpa mencabut D-13. */}
        <p className="mt-10 border-t border-cream/20 pt-6 text-sm text-cream/80">
          © {site.name} — {site.domain}.
        </p>
      </div>
    </footer>
  );
}
