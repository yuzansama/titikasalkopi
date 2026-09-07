import type { NextConfig } from "next";

// Penanda tunggal untuk seluruh situs. Lihat catatan di src/app/robots.ts:
// bergantung pada VERCEL_ENV membuat penjaga diam-diam mati saat host pindah.
const isProduction = process.env.SITE_ENV === "production";

/**
 * CSP statis tanpa nonce (ADR-13, Bagian 12.4). 'unsafe-inline' pada script-src
 * dibutuhkan oleh skrip bootstrap inline Next; menghilangkannya menuntut nonce
 * per-request lewat middleware, yang akan membatalkan sifat statis seluruh
 * situs (ADR-01).
 *
 * Ini utang teknis yang diambil secara sadar (UT-03). Syarat pelunasannya:
 * begitu situs menampilkan konten dari luar repositori atau menerima input yang
 * dipersistensikan, CSP wajib naik ke nonce dan halaman terkait berhenti statis.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://www.google-analytics.com",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "connect-src 'self' https://www.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:", // next/font meng-host sendiri; tidak ada domain font eksternal
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Sengaja dipasang bersama `frame-ancestors 'none'` karena sebagian peramban
  // lama hanya mengenal X-Frame-Options.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  // NFR-09. Vercel sudah memaksa HTTPS; header ini membuat peramban ikut
  // menegakkannya. Hanya di produksi supaya localhost dan preview tidak terkunci.
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

/**
 * Target build kedua: ekspor statis untuk GitHub Pages.
 *
 * Seluruh rute sudah SSG (ADR-01), jadi `output: "export"` tidak mengorbankan
 * apa pun. Diaktifkan lewat env agar satu repositori melayani dua target:
 *
 *   npm run build                      -> Vercel, domain titikasalkopi.id
 *   STATIC_EXPORT=1 BASE_PATH=/x build -> GitHub Pages project site
 *
 * `basePath` dibuat kondisional karena Pages menyajikan project site di
 * subdirektori, sedangkan domain sebenarnya di root. Menuliskannya permanen
 * akan merusak build produksi.
 *
 * Batasan yang diterima sadar: `headers()` tidak berlaku pada ekspor statis —
 * GitHub Pages tidak dapat menyetel header, sehingga CSP, X-Frame-Options, dan
 * Permissions-Policy TIDAK aktif di host produksi saat ini. Yang tetap didapat
 * dari Pages adalah HTTPS paksa dan HSTS milik domain github.io.
 *
 * Risiko itu kecil selama situs hanya menyajikan konten statis dari repositori
 * dan tidak menerima input yang dipersistensikan. Begitu salah satu berubah,
 * situs harus pindah ke host yang bisa menyetel header.
 */
const isStaticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Disediakan ke kode aplikasi karena basePath tidak terbaca dari sana, dan
  // next/image tidak menambahkannya sendiri pada gambar `unoptimized`.
  // Origin ikut diteruskan supaya canonical menunjuk ke alamat yang
  // sungguh melayani situs (lihat src/lib/site.ts).
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_SITE_ORIGIN:
      process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://yuzansama.github.io",
  },
  images: {
    // AVIF dipakai bila peramban mendukung; WebP sebagai cadangan (Bagian 9.3).
    formats: ["image/avif", "image/webp"],
    // Tidak ada remotePatterns: seluruh gambar berasal dari repositori (ADR-06).
    // Pengoptimal gambar Next butuh server; pada ekspor statis ia dimatikan.
    ...(isStaticExport ? { unoptimized: true } : {}),
  },
  poweredByHeader: false,
  ...(isStaticExport
    ? {
        output: "export" as const,
        // Tanpa ini, /katalog pada Pages menghasilkan 404: Pages hanya
        // menyajikan berkas, tidak menulis ulang rute tanpa ekstensi.
        trailingSlash: true,
        ...(basePath ? { basePath, assetPrefix: basePath } : {}),
      }
    : {
        async headers() {
          return [{ source: "/:path*", headers: securityHeaders }];
        },
      }),
};

export default nextConfig;
