/**
 * Pemeriksaan jam balas WhatsApp (D-03, FR-36).
 *
 * Jalankan dari folder `web/`:  node scripts/check-reply-hours.mjs
 *
 * Catatan D-03 untuk QA menyebut ini secara eksplisit: indikator jam balas
 * harus benar di KEDUA sisi batas 08.00 dan 21.00 WIB. Karena perhitungan
 * memakai aritmetika offset tetap UTC+7 (bukan Intl), seluruh kasus di bawah
 * dinyatakan sebagai instant UTC — hasilnya tidak bergantung pada zona waktu
 * mesin yang menjalankan skrip ini.
 *
 *   08.00 WIB = 01.00 UTC       21.00 WIB = 14.00 UTC
 */

import assert from "node:assert/strict";
import { check, loadTs, summary } from "./_ts-load.mjs";

const { isWithinReplyHours, wibHour, REPLY_HOURS, REPLY_HOURS_LABEL } =
  await loadTs("src/lib/reply-hours.ts");

console.log("Pemeriksaan jam balas WIB — batas 08.00 dan 21.00\n");

/** Instant UTC -> Date. */
const utc = (h, m = 0, s = 0) => new Date(Date.UTC(2026, 8, 7, h, m, s));

check("konstanta sesuai D-03: mulai 08, berakhir 21", () => {
  assert.equal(REPLY_HOURS.startHour, 8);
  assert.equal(REPLY_HOURS.endHour, 21);
  assert.equal(REPLY_HOURS_LABEL, "setiap hari, 08.00–21.00 WIB");
});

check("konversi WIB = UTC+7 tanpa DST", () => {
  assert.equal(wibHour(utc(0)), 7);
  assert.equal(wibHour(utc(1)), 8);
  assert.equal(wibHour(utc(14)), 21);
  // Melewati tengah malam UTC: 18.00 UTC = 01.00 WIB keesokan harinya.
  assert.equal(wibHour(utc(18)), 1);
});

/* ---------------------------------------------------------------- */
/* Batas 08.00 WIB — 08.00.00 sudah DI DALAM jam balas               */
/* ---------------------------------------------------------------- */

check("07.59.59 WIB (00.59.59 UTC) -> DI LUAR jam balas", () => {
  assert.equal(isWithinReplyHours(utc(0, 59, 59)), false);
});

check("08.00.00 WIB (01.00.00 UTC) -> DI DALAM jam balas", () => {
  assert.equal(isWithinReplyHours(utc(1, 0, 0)), true);
});

check("08.00.01 WIB -> DI DALAM jam balas", () => {
  assert.equal(isWithinReplyHours(utc(1, 0, 1)), true);
});

/* ---------------------------------------------------------------- */
/* Batas 21.00 WIB — 21.00.00 sudah DI LUAR jam balas                */
/* ---------------------------------------------------------------- */

check("20.59.59 WIB (13.59.59 UTC) -> DI DALAM jam balas", () => {
  assert.equal(isWithinReplyHours(utc(13, 59, 59)), true);
});

check("21.00.00 WIB (14.00.00 UTC) -> DI LUAR jam balas", () => {
  assert.equal(isWithinReplyHours(utc(14, 0, 0)), false);
});

check("21.00.01 WIB -> DI LUAR jam balas", () => {
  assert.equal(isWithinReplyHours(utc(14, 0, 1)), false);
});

/* ---------------------------------------------------------------- */
/* Seluruh 24 jam                                                     */
/* ---------------------------------------------------------------- */

check("tepat 13 jam dalam sehari berada di dalam jam balas", () => {
  const inside = [];
  for (let h = 0; h < 24; h += 1) {
    if (isWithinReplyHours(utc(h))) inside.push(wibHour(utc(h)));
  }
  inside.sort((a, b) => a - b);
  assert.deepEqual(inside, [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  assert.equal(inside.length, 13);
});

check("tengah malam WIB (17.00 UTC) berada di luar jam balas", () => {
  assert.equal(wibHour(utc(17)), 0);
  assert.equal(isWithinReplyHours(utc(17)), false);
});

check("berlaku setiap hari, termasuk Sabtu dan Minggu (D-03)", () => {
  // 5 September 2026 adalah Sabtu, 6 September 2026 adalah Minggu.
  const sabtu = new Date(Date.UTC(2026, 8, 5, 5, 0, 0)); // 12.00 WIB
  const minggu = new Date(Date.UTC(2026, 8, 6, 5, 0, 0)); // 12.00 WIB
  assert.equal(sabtu.getUTCDay(), 6);
  assert.equal(minggu.getUTCDay(), 0);
  assert.equal(isWithinReplyHours(sabtu), true);
  assert.equal(isWithinReplyHours(minggu), true);
});

check("pengunjung di zona waktu lain dinilai memakai WIB, bukan waktu lokalnya", () => {
  // 03.00 UTC = 10.00 WIB (di dalam), padahal di Los Angeles baru pukul 20.00
  // hari sebelumnya dan di Tokyo sudah pukul 12.00. Hasilnya harus sama.
  assert.equal(isWithinReplyHours(utc(3)), true);
  // 16.00 UTC = 23.00 WIB (di luar), meski di London baru pukul 17.00.
  assert.equal(isWithinReplyHours(utc(16)), false);
});

summary("Jam balas");
