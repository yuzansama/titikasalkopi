import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Wajib untuk target ekspor statis (GitHub Pages): tanpa ini Next 16
 * memperlakukan route handler metadata sebagai dinamis dan build gagal.
 * Tidak berpengaruh pada build Vercel, yang memang sudah statis.
 */
export const dynamic = "force-static";


/**
 * `robots.txt` yang sadar lingkungan (FR-45, Bagian 10.3).
 *
 * Pratinjau TIDAK BOLEH terindeks, supaya URL pratinjau tidak bersaing dengan
 * situs asli sebagai konten duplikat.
 *
 * Penandanya `SITE_ENV`, bukan `VERCEL_ENV`. Host produksi sekarang GitHub
 * Pages, dan di sana `VERCEL_ENV` tidak pernah ada — akibatnya situs yang
 * sudah tayang menyajikan `Disallow: /` dan memblokir seluruh crawler.
 * Alur penerapan menyetel `SITE_ENV=production` secara eksplisit.
 */
export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.SITE_ENV === "production";

  if (!isProduction) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    // /keranjang dan /lacak tidak layak diindeks; keduanya juga noindex lewat
    // metadata. /lacak tidak pernah membawa kode order di URL, jadi ini soal
    // nilai pencarian, bukan kebocoran.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/keranjang", "/lacak"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
