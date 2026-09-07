/**
 * Pemuat modul TypeScript untuk skrip pemeriksaan.
 *
 * Kenapa ini ada: ADR-14 melarang menambah dependensi, dan proyek ini sengaja
 * tidak memakai kerangka uji. Skrip pemeriksaan karena itu berupa berkas
 * `.mjs` biasa yang dijalankan `node`. Supaya skrip itu dapat menguji KODE
 * SUNGGUHAN — bukan salinannya — modul `.ts` dikompilasi di sini memakai
 * `typescript` yang SUDAH ADA sebagai devDependency (nol paket baru), lalu
 * hasilnya diimpor sebagai ESM.
 *
 * Batasannya disengaja dan dijaga oleh kode yang diuji: modul yang boleh
 * dimuat hanya boleh memakai impor RELATIF untuk nilai. Impor beralias `@/...`
 * di modul-modul itu selalu `import type`, sehingga terhapus saat kompilasi
 * dan tidak pernah perlu di-resolve. Aturan ini juga yang menjaga modul murni
 * tetap bebas React dan bebas katalog.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const WEB_ROOT = resolve(import.meta.dirname, "..");
const OUT_ROOT = join(tmpdir(), "tak-ts-check");

const COMPILER_OPTIONS = {
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2022,
  isolatedModules: true,
  verbatimModuleSyntax: false,
};

function resolveRelative(fromFile, specifier) {
  const base = resolve(dirname(fromFile), specifier);
  const candidates = [`${base}.ts`, `${base}.tsx`, join(base, "index.ts")];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

/** Menambahkan sufiks `.mjs` pada setiap specifier relatif di keluaran JS. */
function rewriteSpecifiers(code) {
  return code.replace(
    /(\bfrom\s*["'])(\.\.?\/[^"']+)(["'])/g,
    (_match, before, spec, after) => `${before}${spec}.mjs${after}`,
  );
}

/**
 * Mengompilasi satu berkas `.ts` beserta seluruh dependensi relatifnya, lalu
 * mengembalikan namespace modulnya.
 *
 * @param {string} entryRelPath path relatif terhadap `web/`, mis. "src/lib/reply-hours.ts"
 */
export async function loadTs(entryRelPath) {
  mkdirSync(OUT_ROOT, { recursive: true });

  const entry = resolve(WEB_ROOT, entryRelPath);
  const queue = [entry];
  const seen = new Set();

  while (queue.length > 0) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);

    const source = readFileSync(file, "utf8");
    const emitted = ts.transpileModule(source, {
      compilerOptions: COMPILER_OPTIONS,
      fileName: file,
    }).outputText;

    const outPath = join(OUT_ROOT, `${relative(WEB_ROOT, file).replace(/\.tsx?$/, "")}.mjs`);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, rewriteSpecifiers(emitted));

    for (const imported of ts.preProcessFile(source, true, true).importedFiles) {
      if (!imported.fileName.startsWith(".")) continue; // alias @/ selalu type-only
      const target = resolveRelative(file, imported.fileName);
      if (target) queue.push(target);
    }
  }

  const entryOut = join(
    OUT_ROOT,
    `${relative(WEB_ROOT, entry).replace(/\.tsx?$/, "")}.mjs`,
  );
  return import(pathToFileURL(entryOut).href);
}

/** Membersihkan keluaran sementara. Aman dipanggil berkali-kali. */
export function cleanupTs() {
  rmSync(OUT_ROOT, { recursive: true, force: true });
}

/* ------------------------------------------------------------------ */
/* Pelapor hasil — sengaja sederhana, tanpa kerangka uji               */
/* ------------------------------------------------------------------ */

let passed = 0;
let failed = 0;

export function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL  ${name}`);
    console.log(`        ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function summary(title) {
  console.log("");
  console.log(`${title}: ${passed} lulus, ${failed} gagal.`);
  cleanupTs();
  if (failed > 0) process.exit(1);
}
