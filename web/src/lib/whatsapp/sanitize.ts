/**
 * Pembersih catatan pembeli sebelum ditanam ke badan pesan WhatsApp
 * (Bagian 12.1 arsitektur). Gerbang TERAKHIR sebelum teks meninggalkan situs.
 *
 * Tiga hal yang dicegah:
 * 1. Karakter kontrol yang membuat pesan tampil rusak di WhatsApp Web.
 * 2. Baris baru yang memecah tata letak blok pesan BRD 11.2.
 * 3. Pemalsuan penanda — pengunjung mengetik "Kode order: TAK-260101-AAAA"
 *    atau "Dikirim dari titikasalkopi.id" ke dalam catatan, yang akan mencemari
 *    buku order dan menggelembungkan KPI G-01 dan G-04 secara diam-diam.
 *
 * Batas panjang disuntikkan lewat parameter, bukan diimpor dari
 * `@/features/cart/cart-reducer`: aturan ketergantungan nomor 1 melarang
 * `lib/` mengenal `features/`. Pemanggil di keranjang mengirim
 * `MAX_NOTE_LENGTH` miliknya sehingga tetap satu sumber kebenaran.
 */

/** Nilai bawaan; sama dengan `MAX_NOTE_LENGTH` pada reducer keranjang (FR-23). */
export const DEFAULT_NOTE_LENGTH = 200;

const SPOOFED_MARKER = /^\s*(kode\s*order\s*:|dikirim\s+dari)/i;

/**
 * Karakter kontrol C0/C1 kecuali TAB (9), LF (10), dan CR (13) — ketiganya
 * ditangani terpisah di bawah sebagai pemisah baris. Ditulis sebagai
 * pemeriksaan kode karakter, bukan kelas regex, supaya tidak ada karakter
 * kontrol harfiah yang ikut tersimpan di dalam berkas sumber.
 */
function isControlChar(code: number): boolean {
  if (code === 9 || code === 10 || code === 13) return false;
  return code < 32 || code === 127;
}

function stripControlChars(raw: string): string {
  let out = "";
  for (const char of raw) {
    const code = char.codePointAt(0) ?? 0;
    if (!isControlChar(code)) out += char;
  }
  return out;
}

export function sanitizeNote(
  raw: string,
  maxLength: number = DEFAULT_NOTE_LENGTH,
): string {
  return stripControlChars(raw)
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((line) => !SPOOFED_MARKER.test(line))
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, maxLength);
}
