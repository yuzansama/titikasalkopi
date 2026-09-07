/**
 * Jam balas WhatsApp (D-03, FR-36, BR-19).
 *
 * Setiap hari 08.00–21.00 WIB. Fungsi murni: tanpa React, tanpa `Intl`, tanpa
 * data zona waktu peramban.
 *
 * Kenapa aritmetika offset dan bukan `Intl.DateTimeFormat({ timeZone })`?
 * WIB tidak mengenal DST sehingga offsetnya tetap UTC+7. Aritmetika langsung
 * menghilangkan ketergantungan pada kelengkapan data zona waktu ICU peramban
 * pada perangkat lama (ADR-08, NFR-06).
 *
 * Nilainya dihitung DI KLIEN setelah hydration (lihat
 * `features/contact/reply-hours-status.tsx`) supaya seluruh halaman tetap
 * statis dan bisa di-cache CDN (ADR-01).
 */

/** 08.00.00 WIB sudah DI DALAM jam balas; 21.00.00 WIB sudah DI LUAR. */
export const REPLY_HOURS = { startHour: 8, endHour: 21 } as const;

/** Kalimat janji netral yang selalu ada di HTML hasil build. */
export const REPLY_HOURS_LABEL = "setiap hari, 08.00–21.00 WIB";

/** Penanda tambahan yang hanya muncul di luar jam balas. */
export const OUTSIDE_REPLY_HOURS_MESSAGE =
  "Di luar jam balas — pesan tetap masuk dan dibalas mulai pukul 08.00 WIB.";

/** WIB = UTC+7, tanpa DST. */
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Jam WIB (0–23) dari sebuah instant, lewat aritmetika offset tetap. */
export function wibHour(now: Date = new Date()): number {
  return new Date(now.getTime() + WIB_OFFSET_MS).getUTCHours();
}

/** Menit WIB (0–59). Dipakai hanya untuk teks bantu, bukan untuk keputusan. */
export function wibMinute(now: Date = new Date()): number {
  return new Date(now.getTime() + WIB_OFFSET_MS).getUTCMinutes();
}

/**
 * Batas yang diuji QA (D-03, catatan untuk QA):
 * 07.59.59 -> false, 08.00.00 -> true, 20.59.59 -> true, 21.00.00 -> false.
 */
export function isWithinReplyHours(now: Date = new Date()): boolean {
  const hour = wibHour(now);
  return hour >= REPLY_HOURS.startHour && hour < REPLY_HOURS.endHour;
}
