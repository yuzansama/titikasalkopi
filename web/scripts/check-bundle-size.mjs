/**
 * Gerbang anggaran JS muat awal (NFR-03, D-04).
 *
 *   node scripts/check-bundle-size.mjs
 *
 * D-04 menetapkan plafon **190 KB ter-gzip pada rute mana pun**, diambil dari
 * rute terberat, bukan dari beranda. Saat ditetapkan, rute terberat terukur
 * 185,4 KB — sisa margin 4,6 KB. Sejak itu situs bertambah tiga fitur (lacak
 * pesanan, lini 100 gram, sinkronisasi katalog) dan **tidak ada satu pun yang
 * mengukur ulang**, karena gerbangnya memang belum pernah ada.
 *
 * Itu bentuk kegagalan yang sama dengan cacat harga 9 September 2026: sebuah
 * angka disepakati, lalu tidak ada yang menjaganya. Berkas ini menjaganya.
 *
 * Yang diukur adalah JS yang benar-benar diminta sebuah halaman saat dimuat:
 * setiap `<script src>` pada HTML rute itu, ditambah berkas yang di-preload
 * lewat `<link rel="modulepreload">`. Bukan seluruh isi folder `_next`, yang
 * juga memuat potongan untuk rute lain dan akan melaporkan angka yang jauh
 * lebih besar daripada yang dialami pengunjung.
 *
 * Tanpa dependensi baru: `node:zlib` sudah ada di Node (ADR-14).
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join, sep } from "node:path";
import { check, summary } from "./_ts-load.mjs";

/** Plafon D-04, dalam bita ter-gzip. */
const BUDGET_BYTES = 190 * 1024;

/**
 * Ambang peringatan. Melewatinya tidak menggagalkan apa pun, tetapi mencetak
 * sisa marginnya — supaya rute yang merayap naik terlihat sebelum ia menabrak
 * plafon di tengah pekerjaan orang lain.
 */
const WARN_BYTES = Math.round(BUDGET_BYTES * 0.9);

const CANDIDATES = [join(".next", "server", "app"), "out"];
const buildDir = CANDIDATES.find((dir) => existsSync(dir));

console.log("Pemeriksaan anggaran JS muat awal (NFR-03, D-04)\n");

if (!buildDir) {
  console.log("  DILEWATI  Folder build tidak ditemukan.");
  console.log("            Jalankan `npm run build` lebih dulu, lalu ulangi.");
  process.exit(0);
}

/** Seluruh berkas .html di dalam folder build. */
function walk(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...walk(full));
    else if (full.endsWith(".html")) found.push(full);
  }
  return found;
}

function routeOf(file) {
  return (
    file
      .slice(buildDir.length + 1)
      .split(sep)
      .join("/")
      .replace(/\/index\.html$/, "")
      .replace(/\.html$/, "")
      .replace(/^index$/, "") || "/"
  );
}

/**
 * Mencari berkas aset di folder build.
 *
 * Path pada HTML membawa basePath (mis. `/titikasalkopi/_next/...`) yang tidak
 * ada di struktur folder, jadi pencocokan dilakukan dari ujung path — bagian
 * yang stabil apa pun basePath-nya.
 */
function findAsset(assetPath) {
  const wanted = assetPath.split("?")[0].split("/").filter(Boolean);
  const index = wanted.indexOf("_next");
  if (index === -1) return null;
  // "_next/static/chunks/x.js" ada di ".next/static/chunks/x.js" pada build
  // biasa, dan di "out/_next/static/chunks/x.js" pada ekspor statis.
  const afterNext = wanted.slice(index + 1);
  const candidates = [
    join(".next", ...afterNext),
    join("out", "_next", ...afterNext),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

const pages = walk(buildDir)
  .map((file) => ({ file, route: routeOf(file), html: readFileSync(file, "utf8") }))
  .filter((page) => !page.route.startsWith("_"));

const measured = [];
const unresolved = new Set();

for (const page of pages) {
  const refs = new Set();
  for (const match of page.html.matchAll(/<script[^>]+src="([^"]+)"/g)) {
    refs.add(match[1]);
  }
  for (const match of page.html.matchAll(
    /<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g,
  )) {
    refs.add(match[1]);
  }

  let bytes = 0;
  let resolved = 0;
  for (const ref of refs) {
    if (!ref.includes("_next") || !ref.endsWith(".js")) continue;
    const asset = findAsset(ref);
    if (!asset) {
      unresolved.add(ref);
      continue;
    }
    bytes += gzipSync(readFileSync(asset)).length;
    resolved += 1;
  }
  if (resolved > 0) measured.push({ route: page.route, bytes, count: resolved });
}

measured.sort((a, b) => b.bytes - a.bytes);

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

check("NFR-03: ada rute yang benar-benar terukur", () => {
  if (measured.length === 0) {
    // Bukan "lulus karena tidak ada masalah" melainkan "tidak mengukur apa
    // pun". Gerbang yang diam-diam tidak mengukur lebih buruk daripada tidak
    // ada gerbang, karena ia terbaca hijau.
    throw new Error(
      `Tidak ada rute yang bisa diukur dari ${buildDir}. ` +
        (unresolved.size > 0
          ? `Aset tidak ditemukan, contoh: ${[...unresolved][0]}`
          : "Tidak ada rujukan skrip pada HTML."),
    );
  }
});

check(`NFR-03: setiap rute <= ${kb(BUDGET_BYTES)} ter-gzip (D-04)`, () => {
  const over = measured.filter((entry) => entry.bytes > BUDGET_BYTES);
  if (over.length > 0) {
    throw new Error(
      `${over.length} rute melewati plafon:\n` +
        over
          .map(
            (entry) =>
              `    /${entry.route} = ${kb(entry.bytes)} ` +
              `(lebih ${kb(entry.bytes - BUDGET_BYTES)})`,
          )
          .join("\n"),
    );
  }
});

const heaviest = measured[0];
if (heaviest) {
  const margin = BUDGET_BYTES - heaviest.bytes;
  console.log(
    `\n  Rute terberat: /${heaviest.route} = ${kb(heaviest.bytes)} ` +
      `(${heaviest.count} berkas), sisa margin ${kb(margin)}.`,
  );
  if (heaviest.bytes > WARN_BYTES) {
    console.log(
      `  PERINGATAN  Sudah melewati ${kb(WARN_BYTES)}. Margin menipis; ` +
        `fitur berikutnya kemungkinan menabrak plafon.`,
    );
  }
  console.log("  Lima terberat:");
  for (const entry of measured.slice(0, 5)) {
    console.log(`    ${kb(entry.bytes).padStart(9)}  /${entry.route}`);
  }
}
if (unresolved.size > 0) {
  console.log(
    `\n  Catatan: ${unresolved.size} rujukan aset tidak ditemukan di folder build ` +
      `dan TIDAK ikut dihitung. Angka di atas karena itu adalah batas bawah.`,
  );
}

summary("Anggaran bundel");
