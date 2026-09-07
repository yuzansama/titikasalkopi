/**
 * Pemeriksaan HTML hasil build — SEO teknis, aksesibilitas struktural,
 * dan BR-02 pada keluaran yang benar-benar tayang (QA).
 *
 * Jalankan SETELAH build, dari folder `web/`:
 *
 *   npm run build && node scripts/check-build-output.mjs
 *   STATIC_EXPORT=1 BASE_PATH=/titikasalkopi next build && node scripts/check-build-output.mjs out
 *
 * Argumen pertama opsional: folder yang diperiksa. Bila kosong, skrip memakai
 * `.next/server/app` (target Vercel) lalu `out` (target ekspor statis).
 * Bila keduanya tidak ada, skrip berhenti dengan pesan DILEWATI dan kode 0 —
 * supaya `check-all.mjs` tetap bisa dijalankan tanpa build lebih dulu.
 *
 * Kenapa berkas ini ada. 64 pemeriksaan yang sudah ada menguji modul murni:
 * keranjang, pesan WhatsApp, jam balas. Tidak satu pun menyentuh HTML yang
 * benar-benar dikirim ke pengunjung dan ke Google. Seluruh kriteria SEO pada
 * BRD Bagian 12 — judul unik, kanonis, noindex keranjang, JSON-LD sah, isi
 * sitemap — karena itu hanya diverifikasi manual dan tidak punya gerbang.
 *
 * Tidak ada dependensi baru (ADR-14): pencocokan dilakukan dengan regex atas
 * teks HTML, bukan dengan parser DOM.
 */

import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { check, loadTs, summary } from "./_ts-load.mjs";

/* ------------------------------------------------------------------ */
/* Menemukan folder build                                              */
/* ------------------------------------------------------------------ */

/**
 * Asal situs yang diharapkan.
 *
 * Sebelumnya dikunci ke "https://titikasalkopi.id". Begitu host pindah ke
 * GitHub Pages, empat pemeriksaan jatuh padahal keluarannya justru benar —
 * tesnya yang basi, bukan situsnya. Sekarang nilainya diambil dari env yang
 * sama dengan yang dipakai build, sehingga pindah host cukup mengubah satu
 * tempat dan tes ikut benar dengan sendirinya.
 */
const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://yuzansama.github.io";
const SITE_BASE_PATH = process.env.BASE_PATH ?? process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const SITE_URL = `${SITE_ORIGIN}${SITE_BASE_PATH}`;

const CANDIDATES = process.argv[2]
  ? [process.argv[2]]
  : [join(".next", "server", "app"), "out"];

const buildDir = CANDIDATES.find((dir) => existsSync(dir));

if (!buildDir) {
  console.log("Pemeriksaan HTML hasil build\n");
  console.log("  DILEWATI  Folder build tidak ditemukan.");
  console.log("            Jalankan `npm run build` lebih dulu, lalu ulangi.");
  process.exit(0);
}

console.log(`Pemeriksaan HTML hasil build — folder: ${buildDir}\n`);

/* ------------------------------------------------------------------ */
/* Memuat berkas                                                       */
/* ------------------------------------------------------------------ */

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith(".html")) out.push(full);
  }
  return out;
}

/** Ubah path berkas menjadi rute logis, mis. "produk/abmisibil". */
function routeOf(file) {
  return relative(buildDir, file)
    .split(sep)
    .join("/")
    .replace(/\/index\.html$/, "")
    .replace(/\.html$/, "")
    .replace(/^index$/, "");
}

const files = walk(buildDir).sort();
const pages = new Map(); // rute -> { file, html }
for (const file of files) {
  const route = routeOf(file);
  // `_global-error` adalah halaman cadangan internal Next, bukan rute situs;
  // ia tidak melewati `layout.tsx` sehingga tidak punya lang, header, maupun
  // footer. Mengujinya berarti menguji kerangka kerja, bukan produk.
  if (route === "_global-error") continue;
  // `out/404.html` dan `out/404/index.html` adalah berkas yang sama.
  if (!pages.has(route)) pages.set(route, { file, html: readFileSync(file, "utf8") });
}

/** Rute publik Fase 1a — yang wajib ada dan wajib terindeks. */
const PUBLIC_ROUTES = [
  "",
  "katalog",
  "houseblend",
  "houseblend/bold",
  "houseblend/bright",
  "houseblend/full-robusta",
  "cerita-kami",
  "kontak",
  "produk/oelbiteno",
  "produk/abmisibil",
  "produk/sabin",
  "produk/pyramid",
  "produk/palimping",
  "produk/kerinci",
  "produk/pondok-baru",
];

const CART_ROUTE = "keranjang";

const attr = (html, re) => {
  const match = html.match(re);
  return match ? match[1] : null;
};
const titleOf = (html) => attr(html, /<title>([^<]*)<\/title>/);
const canonicalOf = (html) =>
  attr(html, /<link rel="canonical" href="([^"]*)"/);
const robotsOf = (html) => attr(html, /<meta name="robots" content="([^"]*)"/);

/* ------------------------------------------------------------------ */
/* 1. Kelengkapan rute                                                 */
/* ------------------------------------------------------------------ */

check("FR-01/FR-09: 15 rute publik Fase 1a hadir di hasil build", () => {
  const missing = PUBLIC_ROUTES.filter((route) => !pages.has(route));
  assert.deepEqual(missing, [], `rute hilang: ${missing.join(", ")}`);
});

check("FR-17: rute /keranjang hadir di hasil build", () => {
  assert.ok(pages.has(CART_ROUTE), "halaman keranjang tidak dibangun");
});

/* ------------------------------------------------------------------ */
/* 2. FR-44 — judul unik per rute                                      */
/* ------------------------------------------------------------------ */

check("FR-44: setiap rute publik punya <title> yang tidak kosong", () => {
  for (const route of PUBLIC_ROUTES) {
    const title = titleOf(pages.get(route).html);
    assert.ok(title && title.trim().length > 0, `judul kosong pada /${route}`);
  }
});

check("FR-44: judul UNIK — tidak ada dua rute berjudul sama", () => {
  const seen = new Map();
  for (const route of [...PUBLIC_ROUTES, CART_ROUTE]) {
    const title = titleOf(pages.get(route).html);
    assert.ok(
      !seen.has(title),
      `judul ganda "${title}" pada /${route} dan /${seen.get(title)}`,
    );
    seen.set(title, route);
  }
});

check("FR-44: deskripsi meta ada, unik, dan tidak kosong", () => {
  const seen = new Map();
  for (const route of PUBLIC_ROUTES) {
    const desc = attr(
      pages.get(route).html,
      /<meta name="description" content="([^"]*)"/,
    );
    assert.ok(desc && desc.length > 20, `deskripsi kurang pada /${route}`);
    assert.ok(!seen.has(desc), `deskripsi ganda pada /${route}`);
    seen.set(desc, route);
  }
});

check("FR-44: judul halaman produk menyebut daerah asal", () => {
  const expectations = {
    "produk/oelbiteno": "Kupang",
    "produk/abmisibil": "Papua",
    "produk/sabin": "Papua",
    "produk/pyramid": "Papua",
    "produk/palimping": "Garut",
    "produk/kerinci": "Kerinci",
    "produk/pondok-baru": "Aceh",
  };
  for (const [route, needle] of Object.entries(expectations)) {
    const title = titleOf(pages.get(route).html);
    assert.ok(title.includes(needle), `judul /${route} tidak menyebut ${needle}`);
  }
});

/* ------------------------------------------------------------------ */
/* 3. FR-45 — kanonis dan noindex                                      */
/* ------------------------------------------------------------------ */

check(`FR-45: setiap rute punya URL kanonis absolut ke ${SITE_URL}`, () => {
  for (const route of [...PUBLIC_ROUTES, CART_ROUTE]) {
    const canonical = canonicalOf(pages.get(route).html);
    assert.ok(canonical, `kanonis hilang pada /${route}`);
    assert.ok(
      canonical.startsWith(SITE_URL),
      `kanonis /${route} tidak absolut: ${canonical}`,
    );
  }
});

check("FR-45: kanonis menunjuk rutenya sendiri, bukan rute lain", () => {
  for (const route of PUBLIC_ROUTES) {
    const canonical = canonicalOf(pages.get(route).html).replace(/\/$/, "");
    assert.equal(
      canonical,
      `${SITE_URL}${route ? `/${route}` : ""}`,
      `kanonis salah pada /${route}`,
    );
  }
});

check("Bagian 3.2: /keranjang membawa noindex", () => {
  const robots = robotsOf(pages.get(CART_ROUTE).html);
  assert.ok(robots, "meta robots tidak ada pada /keranjang");
  assert.ok(
    robots.includes("noindex"),
    `meta robots /keranjang = "${robots}" (harus memuat noindex)`,
  );
});

check("FR-45: tidak ada rute publik yang ikut ter-noindex", () => {
  for (const route of PUBLIC_ROUTES) {
    const robots = robotsOf(pages.get(route).html);
    assert.ok(
      !robots || !robots.includes("noindex"),
      `/${route} ter-noindex: "${robots}"`,
    );
  }
});

/* ------------------------------------------------------------------ */
/* 4. FR-46 — Open Graph dan Twitter Card                              */
/* ------------------------------------------------------------------ */

check("FR-46: setiap rute publik punya og:title, og:description, dan twitter:card", () => {
  for (const route of PUBLIC_ROUTES) {
    const html = pages.get(route).html;
    assert.ok(/property="og:title"/.test(html), `og:title hilang /${route}`);
    assert.ok(
      /property="og:description"/.test(html),
      `og:description hilang /${route}`,
    );
    assert.ok(
      /name="twitter:card" content="summary_large_image"/.test(html),
      `twitter:card hilang /${route}`,
    );
  }
});

/* ------------------------------------------------------------------ */
/* 5. FR-49 — JSON-LD                                                  */
/* ------------------------------------------------------------------ */

function jsonLdOf(html) {
  const blocks = [
    ...html.matchAll(
      /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
    ),
  ];
  return blocks.map(([, raw]) => raw);
}

check("FR-49: seluruh blok JSON-LD terurai sebagai JSON yang sah", () => {
  for (const [route, page] of pages) {
    for (const raw of jsonLdOf(page.html)) {
      assert.doesNotThrow(
        () => JSON.parse(raw),
        `JSON-LD rusak pada /${route}`,
      );
    }
  }
});

check("FR-49: beranda memuat Organization dengan jam balas 08:00–21:00", () => {
  const blocks = jsonLdOf(pages.get("").html).map((raw) => JSON.parse(raw));
  const org = blocks.find((block) => block["@type"] === "Organization");
  assert.ok(org, "Organization tidak ditemukan di beranda");
  const hours = org.contactPoint?.hoursAvailable;
  assert.equal(hours?.opens, "08:00");
  assert.equal(hours?.closes, "21:00");
  assert.equal(hours?.dayOfWeek?.length, 7, "jam balas harus berlaku 7 hari");
});

check("FR-49: kesepuluh halaman produk memuat Product + Offer + BreadcrumbList", () => {
  const productRoutes = PUBLIC_ROUTES.filter(
    (route) => route.startsWith("produk/") || route.startsWith("houseblend/"),
  );
  assert.equal(productRoutes.length, 10);
  for (const route of productRoutes) {
    const blocks = jsonLdOf(pages.get(route).html).map((raw) => JSON.parse(raw));
    const product = blocks.find((block) => block["@type"] === "Product");
    assert.ok(product, `Product hilang pada /${route}`);
    assert.ok(
      Array.isArray(product.offers) && product.offers.length > 0,
      `Offer hilang pada /${route}`,
    );
    for (const offer of product.offers) {
      assert.equal(offer["@type"], "Offer");
      assert.equal(offer.priceCurrency, "IDR");
      assert.ok(
        Number.isInteger(offer.price) && offer.price > 0,
        `harga Offer bukan bilangan bulat rupiah pada /${route}`,
      );
    }
    assert.ok(
      blocks.some((block) => block["@type"] === "BreadcrumbList"),
      `BreadcrumbList hilang pada /${route}`,
    );
  }
});

/* ------------------------------------------------------------------ */
/* 6. BR-01/BR-02 — harga pada HTML yang tayang                        */
/* ------------------------------------------------------------------ */

check("BR-02: tidak ada 'Rp' diikuti spasi di SELURUH HTML hasil build", () => {
  const offenders = [];
  for (const [route, page] of pages) {
    const hits = page.html.match(/Rp(?:[\s  ]|&nbsp;|&#160;|&#xa0;|%C2%A0)/gi);
    if (hits) offenders.push(`/${route} (${hits.length})`);
  }
  assert.deepEqual(offenders, [], `pelanggaran BR-02: ${offenders.join(", ")}`);
});

check("BR-01: sembilan harga per kg houseblend tayang persis seperti brand brief", () => {
  const html = pages.get("houseblend").html;
  for (const price of [
    "Rp210.000",
    "Rp200.000",
    "Rp195.000",
    "Rp190.000",
    "Rp185.000",
    "Rp175.000",
    "Rp260.000",
    "Rp230.000",
  ]) {
    assert.ok(html.includes(price), `${price} tidak tayang di /houseblend`);
  }
});

check("BR-09: harga single origin tayang persis Rp125.000/Rp350.000 dan Rp110.000/Rp310.000", () => {
  const signature = pages.get("produk/abmisibil").html;
  assert.ok(signature.includes("Rp125.000"));
  assert.ok(signature.includes("Rp350.000"));
  const reguler = pages.get("produk/kerinci").html;
  assert.ok(reguler.includes("Rp110.000"));
  assert.ok(reguler.includes("Rp310.000"));
});

check("BR-10: penghematan bundling dihitung, bukan ditulis manual", () => {
  assert.ok(pages.get("produk/abmisibil").html.includes("Rp25.000"));
  assert.ok(pages.get("produk/kerinci").html.includes("Rp20.000"));
});

/* ------------------------------------------------------------------ */
/* 7. KD-01 — 3 pack satu origin                                       */
/* ------------------------------------------------------------------ */

check("KD-01/BR-11: tidak ada pemilih origin campur di antarmuka mana pun", () => {
  const banned = /origin campur|campur origin|pilih origin|mix ?origin|paket campur/i;
  for (const [route, page] of pages) {
    assert.ok(
      !banned.test(page.html),
      `/${route} memuat penanda pemilih origin campur`,
    );
  }
});

check("KD-01: halaman produk menyatakan 3 pack berasal dari origin yang sama", () => {
  for (const route of PUBLIC_ROUTES.filter((r) => r.startsWith("produk/"))) {
    assert.ok(
      /origin yang sama/.test(pages.get(route).html),
      `/${route} tidak menyatakan 3 pack satu origin`,
    );
  }
});

/* ------------------------------------------------------------------ */
/* 8. KD-03 — janji jam balas di setiap halaman (footer)               */
/* ------------------------------------------------------------------ */

check("KD-03/BR-19: janji jam balas 08.00–21.00 WIB muncul di setiap rute", () => {
  for (const route of [...PUBLIC_ROUTES, CART_ROUTE]) {
    assert.ok(
      pages.get(route).html.includes("08.00–21.00 WIB"),
      `janji jam balas hilang pada /${route}`,
    );
  }
});

check("BR-19: tidak ada janji balas lain di seluruh situs", () => {
  const banned = /balas 24 jam|balas cepat|24\/7|respon cepat/i;
  for (const [route, page] of pages) {
    assert.ok(!banned.test(page.html), `/${route} memuat janji balas lain`);
  }
});

/* ------------------------------------------------------------------ */
/* 9. NFR-07 — aksesibilitas struktural                                */
/* ------------------------------------------------------------------ */

check("NFR-07: tepat satu <h1> per halaman", () => {
  for (const [route, page] of pages) {
    const count = (page.html.match(/<h1[\s>]/g) || []).length;
    assert.equal(count, 1, `/${route} punya ${count} buah <h1>`);
  }
});

check("NFR-07: tingkat heading tidak melompat", () => {
  for (const [route, page] of pages) {
    const levels = [...page.html.matchAll(/<h([1-6])[\s>]/g)].map((m) =>
      Number(m[1]),
    );
    let previous = 0;
    for (const level of levels) {
      if (previous > 0) {
        assert.ok(
          level <= previous + 1,
          `/${route} melompat dari h${previous} ke h${level}`,
        );
      }
      previous = level;
    }
  }
});

check("NFR-07: setiap <img> punya atribut alt", () => {
  for (const [route, page] of pages) {
    for (const [tag] of page.html.matchAll(/<img\b[^>]*>/g)) {
      assert.ok(/\salt=/.test(tag), `/${route} punya <img> tanpa alt`);
    }
  }
});

check("NFR-07: ada landmark <main> dan tautan lewati ke konten", () => {
  for (const route of PUBLIC_ROUTES) {
    const html = pages.get(route).html;
    assert.ok(/<main[\s>]/.test(html), `/${route} tanpa <main>`);
    assert.ok(/Lewati ke konten/i.test(html), `/${route} tanpa skip link`);
  }
});

check("Bagian 12.1: html lang=\"id\"", () => {
  for (const [route, page] of pages) {
    assert.ok(/<html[^>]*lang="id"/.test(page.html), `/${route} tanpa lang=id`);
  }
});

/* ------------------------------------------------------------------ */
/* 10. Bagian 12.1 — pasangan warna terlarang                          */
/* ------------------------------------------------------------------ */

check("Bagian 12.1 aturan D-1: tidak ada bg-gold di HTML hasil build", () => {
  for (const [route, page] of pages) {
    assert.ok(
      !/\bbg-gold\b/.test(page.html),
      `/${route} memakai bg-gold (cream di gold = 3,88:1, GAGAL)`,
    );
  }
});

check("Bagian 12.1 C: pasangan hijau primary di atas rust (2,57:1) tidak dipakai", () => {
  for (const [route, page] of pages) {
    for (const [cls] of page.html.matchAll(/class(?:Name)?=\\?"([^"\\]*)/g)) {
      const hasRustBg = /\bbg-rust\b/.test(cls);
      const hasPrimaryText = /\btext-primary\b/.test(cls);
      assert.ok(
        !(hasRustBg && hasPrimaryText),
        `/${route} memakai text-primary di atas bg-rust: "${cls}"`,
      );
    }
  }
});

check("Bagian 12.1 C: text-primary/60 (4,20:1) tidak dipakai untuk teks", () => {
  for (const [route, page] of pages) {
    assert.ok(
      !/\btext-primary\/60\b/.test(page.html),
      `/${route} memakai text-primary/60`,
    );
  }
});

check("Bagian 12.1 D-4: tidak ada outline-none tanpa pengganti", () => {
  for (const [route, page] of pages) {
    assert.ok(
      !/\boutline-none\b/.test(page.html),
      `/${route} memakai outline-none`,
    );
  }
});

/* ------------------------------------------------------------------ */
/* 11. FR-45 — sitemap dan robots                                      */
/* ------------------------------------------------------------------ */

function readSitemap() {
  for (const candidate of [
    join(buildDir, "sitemap.xml.body"),
    join(buildDir, "sitemap.xml"),
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return readFileSync(candidate, "utf8");
    }
  }
  return null;
}

function readRobots() {
  for (const candidate of [
    join(buildDir, "robots.txt.body"),
    join(buildDir, "robots.txt"),
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return readFileSync(candidate, "utf8");
    }
  }
  return null;
}

check("FR-45: sitemap.xml dibangun", () => {
  assert.ok(readSitemap(), "sitemap.xml tidak ditemukan di folder build");
});

check("FR-45: sitemap memuat PERSIS 15 URL yang diharapkan", () => {
  const xml = readSitemap();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
    m[1].replace(/\/$/, ""),
  );
  const expected = PUBLIC_ROUTES.map(
    (route) => `${SITE_URL}${route ? `/${route}` : ""}`,
  );
  assert.deepEqual([...locs].sort(), [...expected].sort());
});

check("FR-45: sitemap TIDAK memuat /keranjang", () => {
  assert.ok(!readSitemap().includes("/keranjang"));
});

check("FR-45: robots.txt dibangun", () => {
  assert.ok(readRobots(), "robots.txt tidak ditemukan di folder build");
});

check(
  "FR-45: robots.txt cocok dengan lingkungan build (penjaga pratinjau)",
  () => {
    const robots = readRobots();
    // SITE_ENV, bukan VERCEL_ENV: host produksi adalah GitHub Pages, tempat
    // VERCEL_ENV tidak pernah ada. Penjaga yang bergantung padanya akan diam-
    // diam menyajikan `Disallow: /` di situs yang sudah tayang.
    const isProduction = process.env.SITE_ENV === "production";
    if (isProduction) {
      assert.ok(/Allow: \//.test(robots), "produksi harus mengizinkan indeks");
      assert.ok(
        /Disallow: \/keranjang/.test(robots),
        "produksi harus melarang /keranjang",
      );
      assert.ok(/Sitemap:/.test(robots), "produksi harus menyebut sitemap");
    } else {
      assert.ok(
        /Disallow: \/\s*$/m.test(robots),
        "build non-produksi harus Disallow: /",
      );
    }
  },
);

/* ------------------------------------------------------------------ */
/* 12. Target ekspor statis — seluruh aset wajib memakai basePath      */
/* ------------------------------------------------------------------ */

const basePath = (() => {
  const home = pages.get("")?.html ?? "";
  const match = home.match(/(?:href|src)="(\/[^"/]+)\/_next\/static\//);
  return match ? match[1] : "";
})();

check(
  `Ekspor statis: seluruh rujukan aset absolut memakai basePath${
    basePath ? ` "${basePath}"` : " (tidak aktif — dilewati)"
  }`,
  () => {
    if (!basePath) return; // target Vercel: basePath kosong, tidak ada yang diuji
    const offenders = new Set();
    for (const [route, page] of pages) {
      for (const [, url] of page.html.matchAll(
        /(?:src|href)="(\/[^"]*)"/g,
      )) {
        if (url.startsWith(`${basePath}/`) || url === basePath) continue;
        if (url.startsWith("//")) continue; // protocol-relative
        offenders.add(`${url} (mis. /${route})`);
      }
    }
    assert.deepEqual(
      [...offenders],
      [],
      `rujukan tanpa basePath: ${[...offenders].join(", ")}`,
    );
  },
);

/* ------------------------------------------------------------------ */
/* 13. NFR-12 — JSON-LD houseblend wajib jujur soal satuan             */
/* ------------------------------------------------------------------ */

check(
  "NFR-12/BR-01: Offer houseblend menyebut harga per kg, bukan harga 0,5 kg tanpa satuan",
  () => {
    // Google menampilkan `price` apa adanya sebagai harga produk. Untuk
    // houseblend, `unitPrice` adalah harga 0,5 kg — separuh harga katalog —
    // sementara `name` Offer hanya menyebut rasio tanpa satuan. Hasilnya rich
    // result mengiklankan Rp105.000 untuk BOLD 70:30 yang harga resminya
    // Rp210.000/kg. Lolos bila harga per kg dipakai, atau bila satuan
    // dinyatakan eksplisit lewat `referenceQuantity`/`unitText`.
    const blocks = jsonLdOf(pages.get("houseblend/bold").html).map((raw) =>
      JSON.parse(raw),
    );
    const product = blocks.find((block) => block["@type"] === "Product");
    const offer = product.offers.find((entry) => /70%/.test(entry.name));
    const declaresUnit =
      offer.referenceQuantity !== undefined ||
      offer.eligibleQuantity !== undefined ||
      /kg/i.test(offer.name ?? "");
    assert.ok(
      offer.price === 210000 || declaresUnit,
      `Offer BOLD 70:30 berharga ${offer.price} tanpa menyebut satuan; ` +
        `harga resmi katalog Rp210.000/kg (BR-01, NFR-12)`,
    );
  },
);

/* ------------------------------------------------------------------ */
/* 14. BR-20/OQ-12 — alias pencarian "Gayo" sudah dikonfirmasi owner   */
/* ------------------------------------------------------------------ */

check(
  "BR-20/OQ-12: alias 'Gayo' tayang di beranda, katalog, dan halaman Pondok Baru",
  () => {
    // OQ-12 DITUTUP owner pada 7 September 2026: Bener Meriah memang berada di
    // dataran tinggi Gayo dan owner mengonfirmasi alias itu boleh tayang,
    // sehingga syarat konfirmasi tertulis pada BR-20 sudah terpenuhi. KPI G-06
    // menargetkan kata kunci ini, jadi hilangnya alias dari HASIL BUILD adalah
    // regresi — pemeriksaan ini adalah kebalikan dari versi sebelumnya, yang
    // justru melarang alias selama OQ-12 masih terbuka.
    const missing = [];
    for (const route of ["", "katalog", "produk/pondok-baru"]) {
      const page = pages.get(route);
      assert.ok(page, `rute /${route} tidak ada di hasil build`);
      if (!/gayo/i.test(page.html)) missing.push(`/${route}`);
    }
    assert.deepEqual(
      missing,
      [],
      `alias 'Gayo' hilang dari ${missing.join(", ")} padahal OQ-12 sudah ditutup owner (7 September 2026)`,
    );
  },
);

/* ------------------------------------------------------------------ */
/* 15. Silang dengan katalog: jumlah produk dan varian                 */
/* ------------------------------------------------------------------ */

const catalog = await loadTs("src/data/catalog.ts");

check("BRD Bagian 12: katalog tayang berisi 10 produk dan 23 varian jual", () => {
  const products = catalog.allProducts ?? catalog.products;
  assert.ok(Array.isArray(products), "daftar produk tidak ditemukan di catalog");
  assert.equal(products.length, 10);
  const variantCount = products.reduce(
    (total, product) => total + product.variants.length,
    0,
  );
  assert.equal(variantCount, 23);
});

check("BRD Bagian 12: halaman katalog menampilkan kesepuluh nama produk", () => {
  const html = pages.get("katalog").html;
  const products = catalog.allProducts ?? catalog.products;
  for (const product of products) {
    assert.ok(html.includes(product.name), `${product.name} tidak tayang`);
  }
});

summary("HTML hasil build");
