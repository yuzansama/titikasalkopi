/**
 * Menyajikan hasil ekspor statis di mesin lokal, untuk pengujian manual.
 *
 *   npm run build:preview && npm run preview
 *
 * Alasannya ada: sampai 9 September 2026 tidak ada satu pun tempat untuk
 * membuka situs ini selain produksi. Setiap merge ke `main` langsung tayang,
 * dan tiga puluh test case QA berstatus "tidak dapat dieksekusi" hanya karena
 * tidak ada URL yang bisa dibuka. Berkas ini menghapus alasan itu untuk semua
 * pengujian yang sebenarnya hanya butuh peramban: konfigurator, keranjang,
 * keyboard-only, axe, Lighthouse, dan lebar layar.
 *
 * Yang TETAP butuh URL publik dan tidak bisa digantikan berkas ini: kartu
 * pratinjau tautan WhatsApp dan Instagram, Rich Results Test, Search Console,
 * dan pengujian di ponsel sungguhan yang tidak sejaringan.
 *
 * Tanpa dependensi baru (ADR-14): `node:http` sudah ada.
 *
 * Menyajikan `out/` apa adanya, termasuk `basePath` bila build memakainya —
 * itu disengaja. Menyajikan dari akar padahal produksi memakai basePath akan
 * menyembunyikan tepat kelas bug yang paling sering lolos ke Pages: aset yang
 * 404 karena path-nya kehilangan prefiks.
 */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";

const ROOT = resolve("out");
const PORT = Number(process.env.PORT ?? 4173);

if (!existsSync(ROOT)) {
  console.error("Folder `out/` tidak ada. Jalankan `npm run build:preview` dulu.");
  process.exit(1);
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".woff2": "font/woff2",
};

/**
 * Prefiks yang dibuang sebelum mencari berkas.
 *
 * `next build` menulis ekspornya ke akar `out/`, sementara seluruh URL di
 * dalam HTML membawa `basePath`. Jadi `/titikasalkopi/katalog` harus dicari
 * sebagai `out/katalog`. Inilah persisnya yang dilakukan GitHub Pages, dan
 * meniru bentuknya di sini yang membuat pratinjau ini berguna: aset yang
 * kehilangan prefiks akan 404 di sini juga, bukan diam-diam bekerja.
 */
const BASE_PATH = process.env.BASE_PATH ?? "/titikasalkopi";

/**
 * Mengubah URL menjadi path berkas di dalam `out/`, menolak apa pun yang
 * keluar dari folder itu.
 *
 * Ini server pengujian, bukan server produksi — tetapi ia tetap menolak
 * penelusuran direktori, karena "cuma untuk lokal" adalah kalimat yang selalu
 * mendahului sesuatu dijalankan di tempat lain.
 */
function toFilePath(urlPath) {
  let decoded = decodeURIComponent(urlPath.split("?")[0]);
  if (BASE_PATH && (decoded === BASE_PATH || decoded.startsWith(`${BASE_PATH}/`))) {
    decoded = decoded.slice(BASE_PATH.length) || "/";
  } else if (BASE_PATH && decoded !== "/") {
    // Di produksi, path tanpa prefiks tidak dilayani situs ini sama sekali.
    return null;
  }
  const candidate = normalize(join(ROOT, decoded));
  if (candidate !== ROOT && !candidate.startsWith(ROOT + sep)) return null;
  return candidate;
}

async function resolveFile(path) {
  try {
    const info = await stat(path);
    if (info.isFile()) return path;
    if (info.isDirectory()) {
      const index = join(path, "index.html");
      if (existsSync(index)) return index;
    }
  } catch {
    // Ekspor statis menulis `/katalog.html`, bukan `/katalog/index.html`,
    // tergantung konfigurasi. Dicoba keduanya sebelum menyerah.
    if (existsSync(`${path}.html`)) return `${path}.html`;
  }
  return null;
}

const server = createServer(async (req, res) => {
  const target = toFilePath(req.url ?? "/");
  if (!target) {
    res.writeHead(403).end("Terlarang");
    return;
  }

  const file = await resolveFile(target);
  if (!file) {
    // 404 memakai halaman 404 situs bila ada, supaya yang diuji adalah
    // pengalaman sungguhan dan bukan teks bawaan Node.
    const notFound = join(ROOT, "404.html");
    const body = existsSync(notFound)
      ? await readFile(notFound)
      : "404 — tidak ditemukan";
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" }).end(body);
    return;
  }

  res
    .writeHead(200, {
      "content-type": TYPES[extname(file).toLowerCase()] ?? "application/octet-stream",
      // Tanpa cache: pengujian manual berulang di build yang berganti-ganti.
      "cache-control": "no-store",
    })
    .end(await readFile(file));
});

server.listen(PORT, () => {
  console.log(`Pratinjau siap di http://localhost:${PORT}${BASE_PATH}/`);
  console.log("Tekan Ctrl+C untuk berhenti.");
});
