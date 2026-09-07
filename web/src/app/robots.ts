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
 * Preview deployment TIDAK BOLEH terindeks. Tanpa penjaga ini, URL *.vercel.app
 * bisa muncul di Google dan bersaing dengan domain asli (duplicate content).
 */
export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === "production";

  if (!isProduction) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    // /keranjang tidak layak diindeks; halamannya juga noindex lewat metadata.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/keranjang"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
