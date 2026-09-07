import type { Metadata } from "next";
import { Barlow_Condensed, Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { StickyWhatsApp } from "@/components/layout/sticky-whatsapp";
import { cartCatalogIndex } from "@/data/catalog";
import { AnalyticsProvider } from "@/features/analytics/analytics-provider";
import { CartBadge } from "@/features/cart/cart-badge";
import { CartProvider } from "@/features/cart/cart-provider";
import { catalogValidKeys } from "@/features/cart/cart-selectors";
import { ReplyHoursStatus } from "@/features/contact/reply-hours-status";
import { FOCUS_RING } from "@/components/ui/styles";
import { site, siteOrigin } from "@/lib/site";
import "./globals.css";

/*
  Font (Bagian 9.2 arsitektur). Tiga keluarga adalah pos pengeluaran terbesar
  setelah JavaScript, jadi bobotnya dibatasi pada yang benar-benar dipakai:
  tanpa subset `latin-ext` (situs berbahasa Indonesia), dua bobot untuk sans,
  dua untuk condensed, satu untuk display. `next/font/google` meng-host sendiri
  berkasnya sehingga tidak ada permintaan ke fonts.gstatic.com di jalur kritis.
*/

/* Body sans-serif reguler */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  preload: true,
});

/* Heading sans-serif tebal condensed */
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  preload: true,
});

/* Serif display untuk nama kategori dan h1 — ada di jalur LCP beranda */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  // Asal saja, tanpa basePath — lihat catatan `siteOrigin` di src/lib/site.ts.
  metadataBase: new URL(siteOrigin),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: site.name,
    title: site.name,
    description: site.description,
    url: site.url,
  },
  // FR-48: verifikasi Google Search Console lewat metadata, bukan berkas HTML
  // yang mudah tertinggal saat refactor. Kosong di luar produksi.
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

/**
 * Daftar "slug::variantId" yang sah, diturunkan dari katalog build-time.
 * Dihitung di Server Component supaya `CartProvider` bisa memangkas baris basi
 * tanpa pernah mengimpor `@/data/*` dari sisi klien (Bagian 6.3).
 */
const validKeys = catalogValidKeys(cartCatalogIndex);

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={site.lang}
      className={`${jakarta.variable} ${barlowCondensed.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-base text-primary">
        <CartProvider validKeys={validKeys}>
          {/* Lewati navigasi — syarat WCAG 2.4.1, terlihat hanya saat difokus. */}
          <a
            href="#konten"
            className={`sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-cream ${FOCUS_RING}`}
          >
            Lewati ke konten utama
          </a>

          <SiteHeader cartSlot={<CartBadge />} />

          <main id="konten" className="flex-1 pb-24 lg:pb-0">
            {children}
          </main>

          <SiteFooter replyHoursSlot={<ReplyHoursStatus tone="dark" />} />
          <StickyWhatsApp />
          <AnalyticsProvider />
        </CartProvider>
      </body>
    </html>
  );
}
