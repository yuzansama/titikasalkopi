/**
 * Kode order TAK-YYMMDD-XXXX (FR-24).
 *
 * Fungsi murni: `now` dan `random` disuntikkan lewat parameter sehingga bisa
 * diuji deterministik (ADR-11). Kode dibuat DI KLIEN tepat sebelum tautan
 * WhatsApp dibuka, satu klik satu kode, dan tidak pernah disimpan ke
 * `localStorage` supaya tidak ada dua chat dengan kode yang sama (Bagian 1.5).
 */

/**
 * Alfabet sengaja TANPA 0, O, 1, I, dan L. Kode ini disalin manual owner ke
 * buku order (BRD 11.4); menghilangkan karakter yang mudah tertukar mengurangi
 * kesalahan salin tanpa melanggar syarat "alfanumerik huruf besar".
 * 31^4 = 923.521 kombinasi — jauh di atas volume order yang diharapkan.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Pola resmi kode order. Dipakai juga oleh skrip pemeriksaan. */
export const ORDER_CODE_PATTERN = /^TAK-\d{6}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/;

const pad2 = (n: number) => String(n).padStart(2, "0");

function defaultRandom(): number {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    return crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
  }
  return Math.random();
}

/**
 * YYMMDD memakai tanggal LOKAL pembeli sesuai BRD 11.1 langkah 3 — bukan UTC,
 * karena kode ini dibaca manusia yang sedang berada di zona waktunya sendiri.
 */
export function createOrderCode(
  now: Date = new Date(),
  random: () => number = defaultRandom,
): string {
  const yy = pad2(now.getFullYear() % 100);
  const mm = pad2(now.getMonth() + 1);
  const dd = pad2(now.getDate());

  let suffix = "";
  for (let i = 0; i < 4; i += 1) {
    const index = Math.min(
      ALPHABET.length - 1,
      Math.max(0, Math.floor(random() * ALPHABET.length)),
    );
    suffix += ALPHABET[index];
  }

  return `TAK-${yy}${mm}${dd}-${suffix}`;
}
