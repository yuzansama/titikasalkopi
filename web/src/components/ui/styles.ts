/**
 * Kelas utilitas bersama untuk tombol, tautan-tombol, dan kartu.
 *
 * Sengaja berupa FUNGSI PENGHASIL STRING, bukan komponen: dengan begitu Server
 * Component (`<a>`) dan Client Component (`<button>`) memakai gaya yang sama
 * persis tanpa memaksa salah satunya ikut ke bundel klien (ADR-10).
 *
 * ATURAN KONTRAS YANG MENGIKAT (Bagian 11.3–11.4 arsitektur, NFR-07):
 * - `bg-gold` DILARANG menjadi latar tombol berlabel teks normal
 *   (cream di gold = 3,88:1, GAGAL). Gold hanya untuk garis, ikon, dan angka
 *   berukuran display.
 * - Pasangan hijau primary + rust DILARANG sepenuhnya (2,57:1) — termasuk
 *   sebagai border dan sebagai cincin fokus. Karena itu ada dua cincin fokus:
 *   `FOCUS_RING` (rust, untuk latar terang) dan `FOCUS_RING_INVERSE` (cream,
 *   untuk latar hijau/cokelat gelap).
 * - Target sentuh minimal 44 x 44 px (NFR-05) lewat `min-h-11 min-w-11`.
 */

/** Indikator fokus di atas latar terang. Rust di cream = 5,74:1 (lulus 3:1). */
export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rust";

/** Indikator fokus di atas latar hijau/cokelat. Cream di hijau = 14,74:1. */
export const FOCUS_RING_INVERSE =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-base";

export type ButtonVariant =
  /** Aksi utama di latar terang. Cream di rust = 5,74:1 (lulus). */
  | "primary"
  /** Aksi utama alternatif. Cream di coffee = 7,04:1 (lulus). */
  | "coffee"
  /** Aksi utama di dalam blok cream. Cream di hijau = 14,74:1 (lulus). */
  | "dark"
  /** Aksi sekunder di latar terang. Hijau di cream = 14,74:1 (lulus). */
  | "outline"
  /** Aksi sekunder di dalam blok gelap. Cream di hijau = 14,74:1 (lulus). */
  | "outlineInverse";

export type ButtonSize = "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium " +
  "min-h-11 transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const SIZES: Record<ButtonSize, string> = {
  md: "px-4 py-2.5 text-[0.95rem]",
  lg: "px-6 py-3 text-[1rem]",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: `bg-rust text-cream hover:bg-clay ${FOCUS_RING}`,
  coffee: `bg-coffee text-cream hover:bg-clay ${FOCUS_RING}`,
  dark: `bg-primary text-cream hover:bg-primary-deep ${FOCUS_RING}`,
  outline: `border-2 border-primary text-primary hover:bg-primary hover:text-cream ${FOCUS_RING}`,
  outlineInverse: `border-2 border-base text-cream hover:bg-base hover:text-primary ${FOCUS_RING_INVERSE}`,
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra = "",
): string {
  return [BASE, SIZES[size], VARIANTS[variant], extra].filter(Boolean).join(" ");
}

/**
 * Kartu di atas latar cream. Batas dinyatakan oleh perbedaan latar
 * (`bg-surface` di atas `bg-base`) DAN oleh jarak; `ring-primary/10` hanya
 * hiasan dan tidak pernah menjadi satu-satunya penanda batas (Bagian 11.4).
 */
export const CARD = "rounded-lg bg-surface ring-1 ring-primary/10";

/**
 * Teks sekunder. `text-primary/70` di cream = 5,77:1 (lulus).
 * JANGAN turun ke /60 — 4,20:1 dan GAGAL untuk teks normal.
 */
export const MUTED_TEXT = "text-olive";
