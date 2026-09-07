/**
 * Konstanta situs Titik Asal Kopi.
 * Sumber: docs/00-brand-brief.md. Jangan hardcode nomor/handle di komponen —
 * import dari sini supaya satu kali ubah berlaku di seluruh situs.
 */

/**
 * Asal dan prefiks tempat situs benar-benar dilayani.
 *
 * Host produksi saat ini adalah GitHub Pages, sehingga situs hidup di
 * https://yuzansama.github.io/titikasalkopi/ — bukan di titikasalkopi.id,
 * yang belum dimiliki. `url` WAJIB menunjuk ke alamat yang sungguh melayani
 * situs: canonical, sitemap, dan Open Graph dibangun darinya, dan canonical
 * yang menunjuk ke domain mati membuat Google membuang seluruh halaman.
 *
 * Saat domain sudah aktif dan diarahkan ke Pages, cukup setel dua env ini
 * ketika build — tidak ada berkas lain yang perlu disentuh:
 *   NEXT_PUBLIC_SITE_ORIGIN=https://titikasalkopi.id
 *   BASE_PATH=            (kosong, karena domain melayani dari akar)
 */
const origin = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://yuzansama.github.io";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const site = {
  name: "Titik Asal Kopi",
  /** Nama domain untuk DITAMPILKAN ke pengunjung, bukan alamat teknis situs. */
  domain: "titikasalkopi.id",
  /** Alamat yang benar-benar melayani situs. Dasar seluruh URL absolut. */
  url: `${origin}${basePath}`,
  tagline: "Pilih rasa, temukan asalnya, nikmati setiap momen.",
  description:
    "Kopi single origin & houseblend dari titik terbaik di Indonesia — fokus Indonesia Timur dan Nusantara.",
  locale: "id-ID",
  lang: "id",
} as const;

/**
 * URL absolut kanonis untuk sebuah path internal.
 *
 * Dua hal yang mudah salah dan sengaja dipusatkan di sini:
 * 1. `metadataBase` tidak bisa dipakai untuk path relatif ketika situs
 *    dilayani di subdirektori — "/katalog" akan diselesaikan ke akar host
 *    dan menghapus prefiks /titikasalkopi.
 * 2. Ekspor statis memakai `trailingSlash`, jadi URL yang benar-benar
 *    dilayani selalu berakhir dengan garis miring. Canonical tanpa garis
 *    miring menunjuk ke alamat yang membalas pengalihan, bukan halaman.
 */
export function canonicalUrl(path: string): string {
  if (path === "/") return `${site.url}/`;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${site.url}${clean.endsWith("/") ? clean : `${clean}/`}`;
}

/**
 * Asal situs — skema dan host saja, TANPA basePath.
 *
 * `metadataBase` di `layout.tsx` wajib memakai nilai ini, bukan `site.url`:
 * Next merakit URL aset metadata berbasis berkas (`opengraph-image`,
 * `twitter-image`) dengan MENGGABUNGKAN pathname `metadataBase` dan path aset
 * yang sudah memuat basePath. Bila metadataBase ikut membawa basePath, hasilnya
 * berprefiks ganda — https://host/titikasalkopi/titikasalkopi/opengraph-image.png
 * — dan pratinjau tautan memuat gambar yang 404.
 */
export const siteOrigin = origin;

/**
 * URL absolut untuk aset yang path-nya SUDAH memuat basePath.
 *
 * Impor statis `next/image` menghasilkan `src` yang sudah diawali `assetPrefix`
 * (mis. "/titikasalkopi/_next/static/media/abmisibil.<hash>.jpg"). Menyambungnya
 * ke `site.url` — yang juga sudah memuat basePath — akan menggandakan prefiks
 * dan menghasilkan URL gambar yang 404 di pratinjau tautan dan di JSON-LD.
 * Karena itu aset dijadikan absolut terhadap ORIGIN saja, bukan `site.url`.
 */
export function assetUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${siteOrigin}${path.startsWith("/") ? path : `/${path}`}`;
}

export const whatsapp = {
  /** Format lokal untuk ditampilkan ke pengunjung. */
  display: "087777939567",
  /** Format internasional tanpa tanda plus, dipakai wa.me. */
  international: "6287777939567",
  /** Deeplink dasar. Pakai waLink() bila ingin menyertakan pesan. */
  link: "https://wa.me/6287777939567",
} as const;

/** Bangun deeplink WhatsApp, opsional dengan pesan yang sudah di-encode. */
export function waLink(message?: string): string {
  if (!message) return whatsapp.link;
  return `${whatsapp.link}?text=${encodeURIComponent(message)}`;
}

export const instagram = {
  handle: "@Titikasalkopi",
  username: "Titikasalkopi",
  url: "https://instagram.com/titikasalkopi",
} as const;

export const shopee = {
  handle: "Titikasalkopi",
  url: "https://shopee.co.id/titikasalkopi",
} as const;

export const socials = { whatsapp, instagram, shopee } as const;
