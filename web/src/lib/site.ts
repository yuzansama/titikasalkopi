/**
 * Konstanta situs Titik Asal Kopi.
 * Sumber: docs/00-brand-brief.md. Jangan hardcode nomor/handle di komponen —
 * import dari sini supaya satu kali ubah berlaku di seluruh situs.
 */

export const site = {
  name: "Titik Asal Kopi",
  domain: "titikasalkopi.id",
  url: "https://titikasalkopi.id",
  tagline: "Pilih rasa, temukan asalnya, nikmati setiap momen.",
  description:
    "Kopi single origin & houseblend dari titik terbaik di Indonesia — fokus Indonesia Timur dan Nusantara.",
  locale: "id-ID",
  lang: "id",
} as const;

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
