import type { MetadataRoute } from "next";
import { houseblendLines, singleOriginProducts } from "@/data/catalog";
import { canonicalUrl } from "@/lib/site";

/**
 * Wajib untuk target ekspor statis (GitHub Pages): tanpa ini Next 16
 * memperlakukan route handler metadata sebagai dinamis dan build gagal.
 * Tidak berpengaruh pada build Vercel, yang memang sudah statis.
 */
export const dynamic = "force-static";


/**
 * `sitemap.xml` (FR-45, FR-48). Dievaluasi saat build, ikut statis (ADR-01).
 *
 * Memuat 15 dari 16 rute Fase 1a. `/keranjang` sengaja TIDAK masuk: isinya
 * hidup di localStorage pengunjung, jadi tidak ada yang layak diindeks — dan
 * halamannya sudah `robots: { index: false }` lewat `keranjangMetadata()`.
 *
 * `lastModified` memakai waktu build. Untuk katalog yang berubah beberapa kali
 * setahun itu sudah cukup jujur; menyimpan tanggal per produk berarti menambah
 * medan yang harus dipelihara owner tanpa manfaat peringkat yang nyata.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["", "/katalog", "/houseblend", "/cerita-kami", "/kontak"];
  const now = new Date();

  return [
    ...staticPaths.map((path) => ({
      url: canonicalUrl(path),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
    ...singleOriginProducts.map((product) => ({
      url: canonicalUrl(`/produk/${product.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...houseblendLines.map((line) => ({
      url: canonicalUrl(`/houseblend/${line.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
