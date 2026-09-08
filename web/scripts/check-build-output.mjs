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

/**
 * `/lacak` (FR-51). Bukan rute publik: ia `noindex` dengan alasan yang sama
 * seperti keranjang — halaman formulir kosong tidak punya nilai pencarian.
 */
const TRACK_ROUTE = "lacak";

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

check("Bagian 3.2: /keranjang dan /lacak membawa noindex", () => {
  for (const route of [CART_ROUTE, TRACK_ROUTE]) {
    const robots = robotsOf(pages.get(route).html);
    assert.ok(robots, `meta robots tidak ada pada /${route}`);
    assert.ok(
      robots.includes("noindex"),
      `meta robots /${route} = "${robots}" (harus memuat noindex)`,
    );
  }
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
  for (const route of [...PUBLIC_ROUTES, CART_ROUTE, TRACK_ROUTE]) {
    assert.ok(
      pages.get(route).html.includes("08.00–21.00 WIB"),
      `janji jam balas hilang pada /${route}`,
    );
  }
});

check(
  "DEF-12/BR-19: /keranjang memuat janji jam balas di badan halaman, bukan " +
    "hanya di footer",
  () => {
    // Footer menyumbang tepat satu kemunculan pada setiap rute. Kalau
    // /keranjang tetap berhenti di satu, berarti blok checkout tidak
    // memuatnya di HTML hasil build — persis kondisi DEF-12, ketika janji itu
    // baru muncul setelah hydration DAN hanya ketika keranjang sudah berisi.
    const html = pages.get(CART_ROUTE).html;
    const hits = html.split("08.00–21.00 WIB").length - 1;
    assert.ok(
      hits >= 2,
      `janji jam balas hanya muncul ${hits}x pada /keranjang; footer sudah ` +
        `menyumbang satu, jadi badan halaman tidak memuatnya`,
    );
  },
);

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

check(
  "DEF-10/FR-45: kanonis dan <loc> sitemap sama persis, termasuk garis miring",
  () => {
    // Pemeriksaan di atas menormalkan garis miring penutup sebelum
    // membandingkan, sehingga ia tidak akan pernah melihat DEF-10: pada target
    // ekspor statis `trailingSlash` memberi kanonis akhiran "/" sementara
    // sitemap sempat menuliskannya tanpa. Selama GitHub Pages hanya pratinjau
    // yang ber-`Disallow: /` itu tidak berdampak; sejak Pages menjadi host
    // produksi, dua bentuk URL untuk satu halaman adalah sinyal duplikat ke
    // Google.
    //
    // Satu-satunya normalisasi yang diizinkan di sini adalah `new URL().href`,
    // dan itu bukan pelonggaran: "https://situs.id" dan "https://situs.id/"
    // adalah URL yang SAMA menurut RFC 3986 — path kosong pada root berarti
    // "/". Next memang menuliskan kanonis beranda tanpa garis miring pada
    // target Vercel sementara sitemap menuliskannya dengan. Di luar root,
    // garis miring penutup membuat URL benar-benar berbeda, dan perbandingan
    // ini tetap menangkapnya.
    const href = (u) => new URL(u).href;
    const locs = new Set(
      [...readSitemap().matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => href(m[1])),
    );
    const mismatched = PUBLIC_ROUTES.filter(
      (route) => !locs.has(href(canonicalOf(pages.get(route).html))),
    );
    assert.deepEqual(
      mismatched,
      [],
      `kanonis tidak ada persis di sitemap untuk: ${mismatched
        .map((route) => `/${route}`)
        .join(", ")}`,
    );
  },
);

check("FR-45: sitemap TIDAK memuat /keranjang maupun /lacak", () => {
  const xml = readSitemap();
  for (const route of [CART_ROUTE, TRACK_ROUTE]) {
    assert.ok(!xml.includes(`/${route}`), `/${route} tidak boleh ada di sitemap`);
  }
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

/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* 14b. KD-07 — Katalog Kopi 100 gram                                  */
/* ------------------------------------------------------------------ */

check(
  "KD-07: kedelapan belas biji Katalog Kopi 100 gram tayang beserta harganya",
  () => {
    const html = pages.get("katalog").html;
    const expected = [
      ["Bali Kintamani", "Rp80.000"],
      ["Gayo Lecie", "Rp120.000"],
      ["Panama", "Rp270.000"],
      ["Kenya", "Rp195.000"],
      ["Luwak", "Rp140.000"],
      ["Halu Banana Anaerob", "Rp90.000"],
      ["Situjuah", "Rp80.000"],
      ["Lawu", "Rp65.000"],
    ];
    const missing = expected.filter(
      ([name, price]) => !html.includes(name) || !html.includes(price),
    );
    assert.deepEqual(
      missing.map(([name]) => name),
      [],
      `biji atau harganya tidak tayang: ${missing.map(([n]) => n).join(", ")}`,
    );
  },
);

check("KD-07: kedua lini tayang berdampingan tanpa saling menutupi", () => {
  // Dua lini hidup di halaman yang sama dengan harga berbeda untuk berat
  // berbeda. Kerinci ada di KEDUANYA; menyembunyikan salah satunya berarti
  // memilihkan jawaban yang belum owner berikan.
  const html = pages.get("katalog").html;
  assert.ok(html.includes("100 gr"), "label 100 gr hilang dari halaman");
  assert.ok(html.includes("Rp85.000"), "harga Kerinci 100 gr hilang");
  assert.ok(html.includes("Rp110.000"), "harga Reguler 200 gr hilang");
});

/* ------------------------------------------------------------------ */
/* 14c. Ikon tab                                                       */
/* ------------------------------------------------------------------ */

check("Ikon tab memakai logo brand, bukan bawaan Next, di setiap rute", () => {
  // Asalnya: logo dipotong dari assets/brand/WhatsApp Image 2026-09-07 at
  // 14.10.57.jpeg pada kotak (586, 12, 172, 138) — hanya tanda (busur, biji,
  // gunung), tanpa wordmark, karena teks tidak terbaca pada 16 px. Latar
  // disampel dari poster itu sendiri, bukan ditebak.
  //
  // `favicon.ico` bawaan Next sengaja DIHAPUS: bila ia ada, sebagian peramban
  // memilihnya lebih dulu dan tab kembali menampilkan segitiga hitam walaupun
  // icon.png sudah benar.
  for (const [route, page] of pages) {
    if (route === "_not-found") continue;
    const icon = page.html.match(/<link rel="icon"[^>]*href="([^"]+)"/);
    assert.ok(icon, `tautan ikon hilang pada /${route}`);
    assert.ok(
      icon[1].includes("icon."),
      `ikon /${route} menunjuk "${icon[1]}", bukan icon.png`,
    );
    if (SITE_BASE_PATH) {
      assert.ok(
        icon[1].startsWith(SITE_BASE_PATH),
        `ikon /${route} tidak memakai basePath: ${icon[1]}`,
      );
    }
  }
});

check("Tidak ada rute yang masih menunjuk favicon.ico bawaan", () => {
  const offenders = [...pages]
    .filter(([, page]) => /favicon\.ico/.test(page.html))
    .map(([route]) => `/${route}`);
  assert.deepEqual(offenders, [], `favicon.ico dirujuk pada: ${offenders.join(", ")}`);
});

/* 15. Kartu placeholder tidak boleh meminta maaf                      */
/* ------------------------------------------------------------------ */

check(
  "Kartu placeholder tidak memuat teks 'foto produk menyusul' (review CEO)",
  () => {
    // Lima produk masih memakai placeholder karena tidak ada artwork yang
    // jujur mewakilinya. Itu keadaan yang sah. Yang TIDAK sah adalah kartunya
    // mengumumkan ketiadaan itu kepada pembeli: di grid katalog, teks seperti
    // "foto produk menyusul" terbaca sebagai "toko ini belum siap" tepat di
    // halaman tempat orang memutuskan mengirim uang.
    //
    // Penjaga ini ada karena perbaikannya berupa penghapusan teks di sepuluh
    // berkas SVG — jenis perubahan yang paling gampang kembali tanpa sengaja
    // saat placeholder dibuat ulang.
    const offenders = [];

    const svgDir = join(buildDir, "produk");
    if (existsSync(svgDir)) {
      for (const name of readdirSync(svgDir)) {
        if (!name.endsWith(".svg")) continue;
        const svg = readFileSync(join(svgDir, name), "utf8");
        if (/menyusul|placeholder/i.test(svg)) offenders.push(`produk/${name}`);
      }
    }

    for (const [route, page] of pages) {
      if (/menyusul/i.test(page.html)) offenders.push(`/${route}`);
    }

    assert.deepEqual(
      offenders,
      [],
      `kartu placeholder kembali meminta maaf pada: ${offenders.join(", ")}`,
    );
  },
);

/* ------------------------------------------------------------------ */
/* 16. Ongkir — perkiraan owner tayang, dan kekosongan Jawa tetap kosong */
/* ------------------------------------------------------------------ */

const siteFacts = await loadTs("src/lib/site.ts");
const { formatIDR } = await loadTs("src/lib/format.ts");

check(
  "Ongkir: perkiraan tayang di /keranjang dan /kontak, dan TIDAK ADA rute yang " +
    "menyebut angka untuk Jawa di luar Jabodetabek",
  () => {
    const { shippingEstimates, shippingQuoteOnRequest } = siteFacts;

    // Bagian pertama — angka yang memang diberi owner harus benar-benar sampai
    // ke pembeli, di dua tempat ia paling dibutuhkan: kolom checkout keranjang
    // (titik ragu-ragu) dan halaman kontak (sebelum ia bertanya).
    for (const route of ["keranjang", "kontak"]) {
      const html = pages.get(route).html;
      for (const estimate of shippingEstimates) {
        assert.ok(
          html.includes(estimate.region),
          `wilayah "${estimate.region}" tidak tayang di /${route}`,
        );
        assert.ok(
          html.includes(formatIDR(estimate.fromIDR)),
          `perkiraan ${formatIDR(estimate.fromIDR)} tidak tayang di /${route}`,
        );
      }
      assert.ok(
        html.includes("mulai dari"),
        `/${route} menyebut angka ongkir tanpa "mulai dari" — perkiraan tidak ` +
          `boleh terbaca sebagai harga tetap`,
      );
      assert.ok(
        html.includes(shippingQuoteOnRequest.region),
        `/${route} menyembunyikan wilayah tanpa perkiraan; pembeli di sana akan ` +
          `mengira salah satu angka lain berlaku untuknya`,
      );
    }

    // Bagian kedua — INI yang paling penting. Owner memberi DUA angka saja.
    // Melengkapinya dengan interpolasi atau tebakan membuat pembeli berpatokan
    // pada angka yang nanti tidak ditagihkan; itu lebih merugikan daripada
    // diam. Dua lapis penjagaan, karena "membantu melengkapi" bisa masuk lewat
    // data maupun lewat teks komponen.

    // Lapis 1 — sumber data. Angka ketiga apa pun langsung menjatuhkan ini.
    assert.deepEqual(
      shippingEstimates.map((estimate) => [estimate.region, estimate.fromIDR]),
      [
        ["Jabodetabek", 15000],
        ["Luar Jawa", 35000],
      ],
      "shippingEstimates menyimpang dari dua angka yang diberi owner",
    );
    assert.ok(
      !/\d/.test(shippingQuoteOnRequest.note),
      `wilayah "${shippingQuoteOnRequest.region}" sudah diberi angka di ` +
        `shippingQuoteOnRequest.note; angka itu tidak datang dari owner`,
    );

    // Lapis 2 — HTML yang benar-benar tayang, termasuk muatan RSC yang dikirim
    // bersama halaman keranjang. Aturannya berbasis URUTAN, bukan jarak,
    // sehingga tidak ikut jatuh saat tata letak berubah: setelah wilayah itu
    // disebut, kata yang menyusul harus keterangan "dikonfirmasi lewat
    // WhatsApp" — bukan angka rupiah.
    const offenders = [];
    for (const [route, page] of pages) {
      let from = 0;
      for (;;) {
        const at = page.html.indexOf(shippingQuoteOnRequest.region, from);
        if (at === -1) break;
        from = at + shippingQuoteOnRequest.region.length;
        const rest = page.html.slice(from);
        const noteAt = rest.indexOf(shippingQuoteOnRequest.note);
        const priceAt = rest.search(/Rp\d/);
        if (noteAt === -1 || (priceAt !== -1 && priceAt < noteAt)) {
          offenders.push(`/${route}`);
          break;
        }
      }
    }
    assert.deepEqual(
      offenders,
      [],
      `angka ongkir dikarang untuk Jawa di luar Jabodetabek pada: ` +
        `${offenders.join(", ")}. Owner tidak pernah memberi angka itu — ` +
        `wilayah tersebut dikonfirmasi lewat WhatsApp sampai ia memberikannya.`,
    );
  },
);

/* ------------------------------------------------------------------ */
/* 14. FR-51 — halaman lacak pesanan                                   */
/* ------------------------------------------------------------------ */

check(
  "FR-51: build produksi membawa endpoint buku order",
  () => {
    // Tanpa penjaga ini, hilangnya satu variabel lingkungan membuat /lacak
    // diam-diam kembali ke keadaan "belum aktif" di situs yang sudah tayang.
    // Halamannya tetap 200 dan tetap rapi, jadi tidak ada yang akan sadar
    // sampai ada pembeli yang mengeluh.
    if (process.env.SITE_ENV !== "production") return;
    const endpoint = process.env.NEXT_PUBLIC_TRACKING_ENDPOINT ?? "";
    assert.ok(
      endpoint.startsWith("https://"),
      "NEXT_PUBLIC_TRACKING_ENDPOINT kosong pada build produksi; /lacak akan " +
        "tayang sebagai 'pelacakan belum aktif'. Lihat pages.yml.",
    );
  },
);

check("FR-51: rute /lacak hadir di hasil build", () => {
  assert.ok(pages.has(TRACK_ROUTE), "halaman lacak tidak dibangun");
});

check("FR-51: robots.txt produksi melarang /lacak", () => {
  const robots = readRobots();
  // Pada build non-produksi seluruh situs sudah `Disallow: /`, jadi aturan ini
  // hanya berlaku pada cabang produksi.
  if (!/Allow: \//.test(robots)) return;
  assert.ok(
    /Disallow: \/lacak/.test(robots),
    "produksi harus melarang /lacak, sama seperti /keranjang",
  );
});

check(
  "FR-51: HTML /lacak TIDAK memuat data pesanan siapa pun",
  () => {
    // Halaman ini statis; seluruh data pesanan diambil di klien. Kalau ada kode
    // order sungguhan yang ikut masuk ke hasil build, itu berarti data pembeli
    // bocor ke repositori publik dan ke cache CDN.
    const html = pages.get(TRACK_ROUTE).html;
    const codes = [...html.matchAll(/TAK-\d{6}-[A-Z0-9]{4}/g)].map((m) => m[0]);
    // Satu-satunya yang boleh muncul adalah contoh bentuk pada placeholder dan
    // teks bantu.
    const ALLOWED = "TAK-260908-K7Q2";
    const leaked = codes.filter((code) => code !== ALLOWED);
    assert.deepEqual(
      leaked,
      [],
      `kode order selain contoh ikut ter-render ke HTML: ${leaked.join(", ")}`,
    );
  },
);

check(
  "FR-51: setiap cabang kegagalan lacak mengarahkan pembeli ke WhatsApp",
  () => {
    // Halaman yang gagal tanpa memberi jalan keluar terbaca sebagai "pesanan
    // Anda tidak ada". Sumbernya diperiksa, bukan HTML, karena cabang-cabang
    // itu memang baru dirender setelah pencarian dijalankan.
    const source = readFileSync(
      join("src", "features", "tracking", "track-order-form.tsx"),
      "utf8",
    );
    for (const branch of [
      '"not-found"',
      '"unknown-status"',
      '"not-configured"',
      '"error"',
    ]) {
      assert.ok(
        source.includes(`case ${branch}:`),
        `cabang ${branch} tidak ditangani di track-order-form.tsx`,
      );
    }
    const waLinkUses = source.match(/<WaLink/g) ?? [];
    assert.ok(
      waLinkUses.length >= 4,
      `hanya ${waLinkUses.length} cabang yang menawarkan WhatsApp; ` +
        `setiap kegagalan wajib punya jalan keluar`,
    );
  },
);

check("FR-51: /lacak dan buku order tertaut dari footer setiap rute", () => {
  for (const [route, page] of pages) {
    if (route === "404" || route === "_not-found") continue;
    assert.ok(
      page.html.includes("Lacak pesanan"),
      `tautan lacak pesanan hilang dari footer pada /${route}`,
    );
  }
});

summary("HTML hasil build");
