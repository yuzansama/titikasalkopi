/**
 * Menjalankan seluruh skrip pemeriksaan berurutan.
 *
 *   node scripts/check-all.mjs
 *
 * Keluar dengan kode 1 bila ada satu pun pemeriksaan yang gagal, sehingga bisa
 * dipasang di CI tanpa kerangka uji dan tanpa dependensi baru (ADR-14).
 *
 * Dua berkas terakhir ditambahkan QA (docs/06-qa-test-plan.md):
 * - `check-format.mjs` menguji BR-02 pada titik kodenya. Sebelumnya BR-02
 *   justru dinormalkan di dalam `check-whatsapp.mjs`, sehingga gerbang bisa
 *   hijau padahal aturannya dilanggar di seluruh situs.
 * - `check-build-output.mjs` menguji HTML yang benar-benar tayang. Ia
 *   melewatkan dirinya sendiri (kode 0) bila belum ada folder build, jadi
 *   urutan `npm run build && node scripts/check-all.mjs` yang memberi
 *   cakupan penuh.
 * - `check-bundle-size.mjs` menjaga plafon 190 KB ter-gzip (NFR-03, D-04).
 *   Ditambahkan 9 September 2026: plafonnya disepakati sejak awal, tetapi
 *   tidak pernah ada yang mengukur ulang setelah tiga fitur bertambah.
 *   Sama seperti check-build-output, ia butuh folder build.
 */

import { spawnSync } from "node:child_process";

const SCRIPTS = [
  "scripts/check-cart.mjs",
  "scripts/check-whatsapp.mjs",
  "scripts/check-reply-hours.mjs",
  "scripts/check-format.mjs",
  "scripts/check-picks.mjs",
  "scripts/check-sync-katalog.mjs",
  "scripts/check-tracking.mjs",
  "scripts/check-order-tracker-gs.mjs",
  "scripts/check-build-output.mjs",
  "scripts/check-bundle-size.mjs",
];

let failed = 0;

for (const script of SCRIPTS) {
  console.log(`\n=== ${script} ===`);
  const result = spawnSync(process.execPath, [script], { stdio: "inherit" });
  if (result.status !== 0) failed += 1;
}

console.log("");
if (failed > 0) {
  console.log(`${failed} dari ${SCRIPTS.length} berkas pemeriksaan GAGAL.`);
  process.exit(1);
}
console.log(`Seluruh berkas pemeriksaan lulus (${SCRIPTS.length}/${SCRIPTS.length}).`);
