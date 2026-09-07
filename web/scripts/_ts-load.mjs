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
 * dimuat hanya boleh memakai impor RELATIF untuk nilai TypeScript. Impor
 * beralias `@/...` yang membawa nilai hanya diizinkan untuk BERKAS GAMBAR —
 * impor statis `next/image` di `src/data/products.ts` (ADR-06). Impor alias
 * lainnya di modul-modul itu selalu `import type`, sehingga terhapus saat
 * kompilasi dan tidak pernah perlu di-resolve. Aturan ini juga yang menjaga
 * modul murni tetap bebas React dan bebas katalog.
 *
 * Gambar tidak bisa diimpor Node apa adanya, jadi setiap berkas gambar diganti
 * stub `.mjs` yang meniru `StaticImageData`: `src` mengikuti pola berkas yang
 * benar-benar ditulis Next (`<basePath>/_next/static/media/...`), sedangkan
 * `width` dan `height` DIBACA dari header berkas aslinya supaya stub tidak
 * pernah membohongi pemeriksaan tentang ukuran gambar.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
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

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|svg|webp|avif)$/i;

/** Path absolut sebuah specifier impor, atau null bila tidak ditemukan. */
function resolveSpecifier(fromFile, specifier) {
  const base = specifier.startsWith("@/")
    ? resolve(WEB_ROOT, "src", specifier.slice(2))
    : resolve(dirname(fromFile), specifier);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts")];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

/**
 * Menyamakan specifier di keluaran JS dengan tata letak berkas `.mjs` di
 * OUT_ROOT: alias `@/...` diubah menjadi relatif lebih dulu, lalu semuanya
 * diberi sufiks `.mjs`. Keluaran mencerminkan pohon sumber, sehingga path
 * relatif antar modul tetap sama persis.
 */
function rewriteSpecifiers(code, fromFile) {
  // Urutan penting: specifier relatif diproses lebih dulu, baru alias. Hasil
  // penulisan ulang alias sudah berbentuk relatif dan sudah bersufiks `.mjs`,
  // sehingga menjalankan pass relatif setelahnya akan menempelkan `.mjs` kedua.
  return code
    .replace(
      /(\bfrom\s*["'])(\.\.?\/[^"']+)(["'])/g,
      (_match, before, spec, after) => `${before}${spec}.mjs${after}`,
    )
    .replace(/(\bfrom\s*["'])(@\/[^"']+)(["'])/g, (match, before, spec, after) => {
      const target = resolveSpecifier(fromFile, spec);
      if (!target) return match;
      let rel = relative(dirname(fromFile), target).split(sep).join("/");
      if (!rel.startsWith(".")) rel = `./${rel}`;
      return `${before}${rel.replace(/\.tsx?$/, "")}.mjs${after}`;
    });
}

/** Lebar dan tinggi asli sebuah PNG atau JPEG, dibaca dari headernya. */
function imageSize(file) {
  const buf = readFileSync(file);
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf.length > 4 && buf.readUInt16BE(0) === 0xffd8) {
    let offset = 2;
    while (offset + 9 < buf.length) {
      if (buf[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buf[offset + 1];
      // SOF0..SOF15, kecuali DHT (c4), JPG (c8), dan DAC (cc).
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return {
          height: buf.readUInt16BE(offset + 5),
          width: buf.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + buf.readUInt16BE(offset + 2);
    }
  }
  return { width: 0, height: 0 };
}

/** Stub `StaticImageData` untuk satu berkas gambar yang diimpor statis. */
function writeImageStub(file, outPath) {
  const { width, height } = imageSize(file);
  const basePath = process.env.BASE_PATH ?? process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const data = {
    src: `${basePath}/_next/static/media/${file.split(sep).pop()}`,
    width,
    height,
    blurWidth: 0,
    blurHeight: 0,
  };
  writeFileSync(outPath, `export default ${JSON.stringify(data)};\n`);
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
    writeFileSync(outPath, rewriteSpecifiers(emitted, file));

    for (const imported of ts.preProcessFile(source, true, true).importedFiles) {
      const spec = imported.fileName;
      // Alias yang bukan gambar selalu type-only, jadi tidak perlu di-resolve.
      if (!spec.startsWith(".") && !IMAGE_EXTENSIONS.test(spec)) continue;
      const target = resolveSpecifier(file, spec);
      if (!target) continue;
      if (IMAGE_EXTENSIONS.test(target)) {
        const stubPath = join(OUT_ROOT, `${relative(WEB_ROOT, target)}.mjs`);
        mkdirSync(dirname(stubPath), { recursive: true });
        writeImageStub(target, stubPath);
        continue;
      }
      queue.push(target);
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
