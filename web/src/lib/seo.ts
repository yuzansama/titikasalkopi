/**
 * Titik Asal Kopi — perakit metadata dan JSON-LD (FR-44, FR-45, FR-46, FR-49).
 *
 * Kontrak dengan FE (Bagian 8.3, titik singgung nomor 1):
 * isi metadata adalah wewenang BE, tetapi `page.tsx` milik FE. Karena itu FE
 * cukup menulis SATU BARIS delegasi di setiap halaman dan tidak pernah
 * menyentuhnya lagi. Perubahan judul, deskripsi, atau OG selanjutnya dilakukan
 * di berkas ini saja.
 *
 *   // halaman statis
 *   export const metadata = katalogMetadata();
 *
 *   // halaman berparameter
 *   export async function generateMetadata({ params }: PageProps<"/produk/[slug]">) {
 *     const { slug } = await params;
 *     const product = findProductBySlug(slug);
 *     return product ? buildProductMetadata(product) : {};
 *   }
 *
 * `metadataBase` sudah tersetel di `layout.tsx`, sehingga seluruh path relatif
 * di bawah otomatis menjadi absolut ke https://titikasalkopi.id (Bagian 10.5).
 *
 * Impor dari `@/data/types` di berkas ini bersifat TYPE-ONLY: tipe dihapus saat
 * kompilasi sehingga tidak ada katalog yang ikut ke bundel klien (NFR-03).
 */

import type { Metadata } from "next";
import type { Product } from "@/data/types";
import { canonicalUrl, instagram, shopee, site, whatsapp } from "./site";

/* ------------------------------------------------------------------ */
/* Dasar                                                               */
/* ------------------------------------------------------------------ */

/** Jam balas WhatsApp (D-03). Dipakai `Organization.hoursAvailable`. */
export const REPLY_HOURS = { opens: "08:00", closes: "21:00" } as const;

const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type PageMetadataInput = {
  /** Tanpa sufiks brand; template `%s | Titik Asal Kopi` di layout menambahkannya. */
  title: string;
  description: string;
  /** Path relatif berawalan "/", mis. "/katalog". Menjadi canonical. */
  path: string;
  keywords?: string[];
  /** true untuk halaman yang tidak layak diindeks, mis. /keranjang. */
  noIndex?: boolean;
  /** URL gambar OG khusus halaman ini; kosongkan agar jatuh ke OG default root. */
  image?: { url: string; width: number; height: number; alt: string };
};

/**
 * Perakit metadata umum. Seluruh builder di bawah memanggilnya, sehingga
 * canonical, Open Graph, dan Twitter Card tidak pernah terlewat di satu rute
 * pun (FR-44, FR-45, FR-46).
 */
export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const { title, description, path, keywords, noIndex, image } = input;
  return {
    title,
    description,
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    alternates: { canonical: canonicalUrl(path) },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: site.name,
      title,
      description,
      url: canonicalUrl(path),
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image.url] } : {}),
    },
  };
}

/* ------------------------------------------------------------------ */
/* Builder per rute statis                                             */
/* ------------------------------------------------------------------ */

/** Rute 1 — `/`. Judul beranda memakai default dari layout, bukan template. */
export function homeMetadata(): Metadata {
  return {
    title: { absolute: `${site.name} — ${site.tagline}` },
    description: site.description,
    keywords: [
      "kopi single origin Indonesia",
      "houseblend kopi per kg",
      "kopi Papua",
      "kopi Kupang",
      // "kopi Gayo" ditahan sampai owner mengonfirmasi alias origin (BR-20/OQ-12).
      "biji kopi roasted",
    ],
    alternates: { canonical: canonicalUrl("/") },
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: site.name,
      title: `${site.name} — ${site.tagline}`,
      description: site.description,
      url: canonicalUrl("/"),
    },
    twitter: {
      card: "summary_large_image",
      title: `${site.name} — ${site.tagline}`,
      description: site.description,
    },
  };
}

/** Rute 2 — `/katalog`. */
export function katalogMetadata(): Metadata {
  return buildPageMetadata({
    title: "Katalog Kopi — Single Origin & Houseblend per Kg",
    description:
      "Katalog lengkap Titik Asal Kopi: single origin dari Papua, Kupang, Aceh, Garut, dan Kerinci dalam kemasan 200 gr, serta houseblend BOLD, BRIGHT, dan Full Robusta yang dijual per kilogram.",
    path: "/katalog",
    keywords: [
      "katalog kopi",
      "kopi single origin",
      "houseblend kopi per kg",
      "kopi Papua",
      "kopi Kupang",
      // "kopi Gayo" ditahan sampai owner mengonfirmasi alias origin (BR-20/OQ-12).
    ],
  });
}

/** Rute 10 — `/houseblend`. */
export function houseblendIndexMetadata(): Metadata {
  return buildPageMetadata({
    title: "Houseblend Kopi per Kg — BOLD, BRIGHT, Full Robusta",
    description:
      "Tiga lini houseblend Titik Asal Kopi untuk kedai dan rumah: BOLD dalam enam rasio Arabica:Robusta, BRIGHT full Arabica, dan Full Robusta. Dijual per kilogram, pemesanan mulai 0,5 kg.",
    path: "/houseblend",
    keywords: [
      "houseblend kopi per kg",
      "blend arabica robusta",
      "kopi kedai per kg",
      "biji kopi roasted per kg",
    ],
  });
}

/** Rute 14 — `/cerita-kami`. */
export function ceritaKamiMetadata(): Metadata {
  return buildPageMetadata({
    title: "Cerita Kami — Kopi dari Titik Terbaik Indonesia",
    description:
      "Titik Asal Kopi menghadirkan single origin dan houseblend dari titik terbaik di Indonesia, dengan fokus Indonesia Timur dan pilihan Nusantara.",
    path: "/cerita-kami",
  });
}

/** Rute 15 — `/kontak`. */
export function kontakMetadata(): Metadata {
  return buildPageMetadata({
    title: "Kontak — WhatsApp, Instagram, Shopee",
    description: `Hubungi Titik Asal Kopi lewat WhatsApp ${whatsapp.display}, Instagram ${instagram.handle}, atau Shopee ${shopee.handle}. Kami membalas setiap hari, ${REPLY_HOURS.opens}–${REPLY_HOURS.closes} WIB.`,
    path: "/kontak",
  });
}

/** Rute 16 — `/keranjang`. Tidak diindeks: tidak ada isi yang layak (Bagian 3.2). */
export function keranjangMetadata(): Metadata {
  return buildPageMetadata({
    title: "Keranjang",
    description:
      "Ringkasan pesanan Anda sebelum dikirim ke WhatsApp Titik Asal Kopi.",
    path: "/keranjang",
    noIndex: true,
  });
}

/** `not-found.tsx`. */
export function notFoundMetadata(): Metadata {
  return buildPageMetadata({
    title: "Halaman tidak ditemukan",
    description: "Halaman yang Anda cari tidak ada di titikasalkopi.id.",
    path: "/",
    noIndex: true,
  });
}

/* ------------------------------------------------------------------ */
/* Builder halaman produk                                              */
/* ------------------------------------------------------------------ */

/** Path kanonis produk. Sama dengan `productHref()` di catalog, tanpa impor data. */
function pathOf(product: Product): string {
  return product.category === "single-origin"
    ? `/produk/${product.slug}`
    : `/houseblend/${product.slug}`;
}

/**
 * Judul halaman produk sesuai contoh FR-44:
 *   "Abmisibil — Kopi Papua, Pegunungan Bintang"
 *   "Houseblend BOLD — 6 Rasio Arabica:Robusta per Kg"
 */
export function productTitle(product: Product): string {
  if (product.category === "single-origin" && product.origin) {
    return `${product.name} — Kopi ${product.origin.province}, ${product.origin.region}`;
  }
  switch (product.line) {
    case "bold":
      return `${product.name} — ${product.variants.length} Rasio Arabica:Robusta per Kg`;
    case "bright":
      return `${product.name} — Full Arabica Natural & Washed per Kg`;
    case "full-robusta":
      return `${product.name} — Kopi Robusta per Kg`;
    default:
      return `${product.name} — Kopi per Kg`;
  }
}

/**
 * Metadata halaman produk untuk `/produk/[slug]` maupun `/houseblend/[line]`.
 * Satu fungsi untuk keduanya; bentuk produknya sudah seragam di katalog.
 */
export function buildProductMetadata(product: Product): Metadata {
  const title = productTitle(product);
  return buildPageMetadata({
    title,
    description: product.summary,
    path: pathOf(product),
    keywords: product.searchTerms,
    image: product.image
      ? {
          url: product.image.src.src,
          width: product.image.src.width,
          height: product.image.src.height,
          alt: product.image.alt,
        }
      : undefined, // jatuh ke opengraph-image milik root (Bagian 10.5)
  });
}

/* ------------------------------------------------------------------ */
/* JSON-LD                                                             */
/* ------------------------------------------------------------------ */

/**
 * Escape `<` mencegah string data menutup tag <script> lebih awal (Bagian 12.2).
 * Seluruh JSON-LD di bawah mengembalikan STRING siap pakai:
 *   <script type="application/ld+json"
 *           dangerouslySetInnerHTML={{ __html: productJsonLd(product) }} />
 */
function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/** `Product` + `Offer` untuk `/produk/[slug]` dan `/houseblend/[line]` (FR-49). */
export function productJsonLd(product: Product): string {
  const url = canonicalUrl(pathOf(product));
  return safeJson({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.summary,
    brand: { "@type": "Brand", name: site.name },
    category:
      product.category === "single-origin"
        ? "Single Origin Coffee"
        : "Coffee Blend",
    image: product.image ? `${site.url}${product.image.src.src}` : undefined,
    offers: product.variants.map((variant) => ({
      "@type": "Offer",
      name: variant.label,
      price: variant.unitPrice, // bilangan bulat rupiah (ADR-05)
      priceCurrency: "IDR",
      /**
       * Google menampilkan `price` apa adanya. Untuk houseblend `unitPrice`
       * adalah harga 0,5 kg (KD-02) — separuh harga katalog — sehingga rich
       * result akan mengiklankan Rp105.000 untuk BOLD 70:30 yang harga
       * resminya Rp210.000/kg. `referenceQuantity` menyatakan satuannya
       * supaya angka itu tidak terbaca sebagai harga per kilogram.
       */
      ...(product.category === "houseblend"
        ? {
            referenceQuantity: {
              "@type": "QuantitativeValue",
              value: 0.5,
              unitCode: "KGM",
              unitText: "kg",
            },
          }
        : {}),
      availability:
        product.status === "available"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url,
    })),
  });
}

/** `Organization` untuk beranda (FR-49, Bagian 10.4). */
export function organizationJsonLd(): string {
  return safeJson({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    description: site.description,
    sameAs: [instagram.url, shopee.url],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      telephone: `+${whatsapp.international}`,
      availableLanguage: ["id"],
      hoursAvailable: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [...ALL_DAYS],
        opens: REPLY_HOURS.opens,
        closes: REPLY_HOURS.closes,
      }, // D-03
    },
  });
}

export type BreadcrumbTrail = Array<{ name: string; path: string }>;

/**
 * `BreadcrumbList` untuk `/katalog`, `/produk/[slug]`, `/houseblend/[line]`.
 * Pemakaian: `breadcrumbJsonLd([{ name: "Beranda", path: "/" }, ...])`.
 */
export function breadcrumbJsonLd(trail: BreadcrumbTrail): string {
  return safeJson({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: canonicalUrl(crumb.path),
    })),
  });
}

/** Jejak remah roti siap pakai untuk halaman produk. */
export function productBreadcrumbTrail(product: Product): BreadcrumbTrail {
  const base: BreadcrumbTrail = [
    { name: "Beranda", path: "/" },
    { name: "Katalog", path: "/katalog" },
  ];
  if (product.category === "houseblend") {
    base.push({ name: "Houseblend", path: "/houseblend" });
  }
  base.push({ name: product.name, path: pathOf(product) });
  return base;
}
