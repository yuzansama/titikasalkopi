/**
 * Membangun ekspor statis untuk PRATINJAU, bukan untuk produksi.
 *
 *   npm run build:preview
 *
 * Bedanya dengan `npm run build` cuma satu, dan justru itu yang penting:
 * `SITE_ENV` sengaja TIDAK disetel ke "production", sehingga `robots.ts`
 * menghasilkan `Disallow: /`. Hasil build ini tidak boleh terindeks kalau
 * suatu hari ia tidak sengaja terunggah ke tempat yang bisa diakses publik.
 *
 * `BASE_PATH` diikutkan supaya pratinjau memakai bentuk path yang sama dengan
 * produksi. Ekspor tanpa basePath akan tampak baik-baik saja lalu 404 di
 * seluruh asetnya begitu tayang di GitHub Pages — kelas bug yang paling sering
 * lolos justru karena pratinjaunya dibangun berbeda dari produksi.
 *
 * Menyetel env lewat skrip Node, bukan lewat `VAR=nilai npm run ...`, karena
 * bentuk itu bukan perintah yang sah di PowerShell dan owner memakai Windows.
 * Tanpa dependensi baru (ADR-14) — tidak ada `cross-env`.
 */

import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  STATIC_EXPORT: "1",
  BASE_PATH: process.env.BASE_PATH ?? "/titikasalkopi",
  // TIDAK "production" — inilah inti berkas ini.
  SITE_ENV: "preview",
  NEXT_PUBLIC_SITE_ORIGIN:
    process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://yuzansama.github.io",
};

console.log("Membangun pratinjau (robots: Disallow: /, tidak untuk diindeks)\n");

// `npx.cmd` di Windows, bukan `shell: true` — melewatkan argumen lewat shell
// tidak meng-escape apa pun, dan Node memperingatkannya sejak DEP0190.
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const build = spawnSync(npx, ["next", "build"], { env, stdio: "inherit" });
if (build.status !== 0) process.exit(build.status ?? 1);

console.log("\nMenjalankan seluruh pemeriksaan atas hasil build pratinjau...\n");
const checks = spawnSync(process.execPath, ["scripts/check-all.mjs"], {
  env,
  stdio: "inherit",
});
if (checks.status !== 0) process.exit(checks.status ?? 1);

console.log(`\nSiap. Jalankan \`npm run preview\` lalu buka http://localhost:4173${env.BASE_PATH}/`);
