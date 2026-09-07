/**
 * Titik Asal Kopi — LAPIS PENULISAN katalog (ADR-02).
 *
 * INI BERKAS YANG DISUNTING OWNER. Satu-satunya tempat angka harga ditulis
 * (keputusan CEO #3 pada docs/00-brand-brief.md, FR-41).
 * Semua data di bawah disalin persis dari docs/00-brand-brief.md.
 *
 * JANGAN mengimpor berkas ini dari komponen atau halaman. Seluruh aplikasi
 * membaca dari `@/data/catalog` yang menyusun bentuk seragam dan menghitung
 * harga turunan (ADR-02; ditegakkan lint rule di eslint.config.mjs).
 *
 * Aturan menyunting:
 * - Harga selalu integer rupiah penuh (210000 = Rp210.000). Jangan pakai float,
 *   jangan pakai titik desimal, jangan pakai tanda "Rp" (BR-03, ADR-05).
 * - Harga houseblend hanya ditulis PER KG. Harga 0,5 kg DIHITUNG di catalog.ts —
 *   jangan pernah menulisnya sebagai data kedua (D-02).
 * - Jangan menambah metadata yang tidak disebut brief. Field yang tidak
 *   disebutkan brief bernilai `null`, bukan tebakan (FR-07).
 * - Panduan lengkap untuk owner ada di docs/05-backend.md Bagian "Panduan owner".
 */

import abmisibilArtwork from "@/images/produk/abmisibil.jpg";
import boldPhoto from "@/images/produk/bold.jpg";
import brightPhoto from "@/images/produk/bright.jpg";
import pondokBaruArtwork from "@/images/produk/pondok-baru.jpg";
import sabinArtwork from "@/images/produk/sabin.jpg";
import type {
  HouseblendLineSlug,
  PriceIDR,
  ProductImage,
  ProductStatus,
  Tier,
} from "./types";

export type { PriceIDR, Tier } from "./types";

/* ------------------------------------------------------------------ */
/* Houseblend — BOLD                                                   */
/* ------------------------------------------------------------------ */

export type HouseblendBoldRatio = {
  id: string;
  /** Persentase arabica dalam blend, 0-100. */
  arabicaPercent: number;
  /** Persentase robusta dalam blend, 0-100. Selalu 100 - arabicaPercent. */
  robustaPercent: number;
  /** Label siap tampil, mis. "70% Arabica : 30% Robusta". */
  label: string;
  /** SATU-SATUNYA harga tersimpan. Harga 0,5 kg dihitung di catalog.ts (D-02). */
  pricePerKg: PriceIDR;
};

/** Arabica Natural & Fine Robusta Natural. Notes: choco, almond, caramel. */
export const HOUSEBLEND_BOLD_NOTES = ["choco", "almond", "caramel"] as const;

export const houseblendBold: HouseblendBoldRatio[] = [
  {
    id: "bold-70-30",
    arabicaPercent: 70,
    robustaPercent: 30,
    label: "70% Arabica : 30% Robusta",
    pricePerKg: 210_000,
  },
  {
    id: "bold-60-40",
    arabicaPercent: 60,
    robustaPercent: 40,
    label: "60% Arabica : 40% Robusta",
    pricePerKg: 200_000,
  },
  {
    id: "bold-50-50",
    arabicaPercent: 50,
    robustaPercent: 50,
    label: "50% Arabica : 50% Robusta",
    pricePerKg: 195_000,
  },
  {
    id: "bold-40-60",
    arabicaPercent: 40,
    robustaPercent: 60,
    label: "40% Arabica : 60% Robusta",
    pricePerKg: 190_000,
  },
  {
    id: "bold-30-70",
    arabicaPercent: 30,
    robustaPercent: 70,
    label: "30% Arabica : 70% Robusta",
    pricePerKg: 185_000,
  },
  {
    id: "bold-20-80",
    arabicaPercent: 20,
    robustaPercent: 80,
    label: "20% Arabica : 80% Robusta",
    pricePerKg: 175_000,
  },
];

/* ------------------------------------------------------------------ */
/* Houseblend — BRIGHT                                                 */
/* ------------------------------------------------------------------ */

export type HouseblendBrightVariant = {
  id: string;
  /**
   * PERHATIAN (BR-15): pada lini BRIGHT, "signature"/"reguler" adalah NAMA
   * VARIAN BLEND, bukan tier harga single origin. Ia tidak boleh ikut dalam
   * filter tier katalog. Validator V-07 menegakkan pemisahan ini.
   */
  tier: Tier;
  /** Label siap tampil, mis. "Signature". */
  label: string;
  pricePerKg: PriceIDR;
};

/** Full Arabica, natural & washed. Notes: raisin, orange, lemon zest. */
export const HOUSEBLEND_BRIGHT_NOTES = [
  "raisin",
  "orange",
  "lemon zest",
] as const;

export const houseblendBright: HouseblendBrightVariant[] = [
  {
    id: "bright-signature",
    tier: "signature",
    label: "Signature",
    pricePerKg: 260_000,
  },
  {
    id: "bright-reguler",
    tier: "reguler",
    label: "Reguler",
    pricePerKg: 230_000,
  },
];

/* ------------------------------------------------------------------ */
/* Houseblend — Full Robusta                                           */
/* ------------------------------------------------------------------ */

export type HouseblendFullRobusta = {
  id: string;
  label: string;
  pricePerKg: PriceIDR;
};

export const houseblendFullRobusta: HouseblendFullRobusta = {
  id: "full-robusta",
  label: "Full Robusta",
  pricePerKg: 175_000,
};

/* ------------------------------------------------------------------ */
/* Houseblend — identitas produk per lini (K-02)                       */
/* ------------------------------------------------------------------ */

export type HouseblendLine = {
  /** Slug URL permanen; dipakai /houseblend/[line] (FR-09). */
  slug: HouseblendLineSlug;
  name: string;
  /** Komposisi apa adanya dari brand brief (FR-27). */
  composition: string;
  /** Paragraf halaman detail (FR-27). */
  description: string;
  /** Satu kalimat untuk kartu dan meta description (FR-44). */
  summary: string;
  /** null bila brand brief tidak menyebut catatan rasa. JANGAN dikarang (FR-07). */
  tastingNotes: string[] | null;
  /** Foto produk; null bila belum tersedia — placeholder brand dipakai (R-13). */
  image: ProductImage | null;
  status: ProductStatus;
  /** Kata kunci pemasaran untuk metadata. BUKAN klaim atribut origin (CA-04). */
  searchTerms: string[];
};

export const houseblendLines: HouseblendLine[] = [
  {
    slug: "bold",
    name: "Houseblend BOLD",
    composition: "Arabica Natural & Fine Robusta Natural",
    summary:
      "Houseblend BOLD — campuran Arabica Natural dan Fine Robusta Natural dalam enam rasio, dijual per kilogram mulai Rp175.000.",
    description:
      "Houseblend BOLD memadukan Arabica Natural dan Fine Robusta Natural. Tersedia dalam enam rasio Arabica:Robusta sehingga kedai dapat memilih titik keseimbangan body dan manis yang paling cocok dengan mesin dan menunya. Seluruh rasio dijual per kilogram, dengan pemesanan mulai 0,5 kg.",
    tastingNotes: [...HOUSEBLEND_BOLD_NOTES],
    image: {
      src: boldPhoto,
      alt: "Biji kopi sangrai gelap yang mengilap menumpuk rapat, dengan sekop logam menyendok dari sisi kanan atas.",
    },
    status: "available",
    searchTerms: [
      "houseblend kopi per kg",
      "blend arabica robusta",
      "kopi espresso blend",
      "biji kopi roasted per kg",
    ],
  },
  {
    slug: "bright",
    name: "Houseblend BRIGHT",
    composition: "Full Arabica, natural & washed",
    summary:
      "Houseblend BRIGHT — full Arabica natural dan washed, tersedia varian Signature dan Reguler, dijual per kilogram.",
    description:
      "Houseblend BRIGHT adalah blend full Arabica yang menggabungkan proses natural dan washed. Tersedia dalam dua varian, Signature dan Reguler. Pada lini ini Signature dan Reguler adalah nama varian blend, bukan tier harga single origin. Dijual per kilogram, dengan pemesanan mulai 0,5 kg.",
    tastingNotes: [...HOUSEBLEND_BRIGHT_NOTES],
    image: {
      src: brightPhoto,
      alt: "Biji kopi arabica sangrai terang di dalam mangkuk kayu, dengan sendok kayu bersandar di tepi mangkuk.",
    },
    status: "available",
    searchTerms: [
      "houseblend full arabica",
      "blend arabica natural washed",
      "kopi arabica per kg",
    ],
  },
  {
    slug: "full-robusta",
    name: "Houseblend Full Robusta",
    composition: "Full Robusta",
    summary:
      "Houseblend Full Robusta — blend robusta penuh untuk kebutuhan volume kedai, Rp175.000 per kilogram.",
    description:
      "Houseblend Full Robusta adalah blend robusta penuh untuk kedai yang mengutamakan body tebal dan biaya per cangkir yang terjaga. Dijual per kilogram, dengan pemesanan mulai 0,5 kg.",
    tastingNotes: null,
    // Tidak ada artwork yang jujur mewakili lini ini: lembar HOUSEBLEND hanya
    // memotret BOLD dan BRIGHT. Memakai foto BOLD di sini berarti menampilkan
    // produk lain (FR-07), jadi lini ini tetap memakai placeholder (R-13).
    image: null,
    status: "available",
    searchTerms: [
      "kopi robusta per kg",
      "houseblend robusta",
      "biji kopi robusta kedai",
    ],
  },
];

/**
 * Houseblend dijual per 0,5 kg, kelipatan 0,5 kg (D-02, merevisi BR-13).
 * Satuan pesan internal adalah "half-kg"; harga per 0,5 kg SELALU dihitung
 * dari pricePerKg di catalog.ts — jangan menuliskannya sebagai data.
 */
export const HOUSEBLEND_MIN_HALF_KG_UNITS = 1; // = 0,5 kg
export const HOUSEBLEND_STEP_HALF_KG_UNITS = 1; // = 0,5 kg

/* ------------------------------------------------------------------ */
/* Single origin                                                       */
/* ------------------------------------------------------------------ */

/** Semua single origin dijual dalam kemasan 200 gr (BR-08). */
export const SINGLE_ORIGIN_PACK_GRAMS = 200;

/** Jumlah kemasan 200 gr di dalam satu paket bundel (BR-11, D-01). */
export const SINGLE_ORIGIN_PACKS_PER_BUNDLE = 3;

export type TierPricing = {
  /** Harga 1 pack 200 gr. */
  pack1: PriceIDR;
  /** Harga bundel 3 pack 200 gr. HARGA PAKET, bukan 3 x pack1 (BR-10). */
  pack3: PriceIDR;
};

/**
 * Harga single origin ditentukan oleh tier, bukan oleh biji (BR-09).
 * Signature = Kupang / Papua. Reguler = Sumatera / Jawa.
 */
export const singleOriginPricing: Record<Tier, TierPricing> = {
  signature: { pack1: 125_000, pack3: 350_000 },
  reguler: { pack1: 110_000, pack3: 310_000 },
};

export type SingleOriginBean = {
  id: string;
  /**
   * Slug URL permanen (FR-09). Umumnya sama dengan id, tapi ditulis eksplisit
   * supaya perubahan id internal tidak pernah memutus URL yang sudah dibagikan.
   */
  slug: string;
  name: string;
  tier: Tier;
  /** Desa / lokasi spesifik bila disebut brief, selain itu null. */
  origin: string | null;
  /** Wilayah, mis. "Pegunungan Bintang". TANPA provinsi. */
  region: string;
  /** Provinsi, mis. "Papua". Dipisah supaya metadata SEO bisa merakit judul (FR-44). */
  province: string;
  /** Proses pasca panen bila disebut brief, selain itu null. */
  process: string | null;
  /** Prosesor / petani bila disebut brief. */
  processedBy?: string;
  /** Ketinggian dalam meter di atas permukaan laut. */
  altitudeMasl: number | null;
  /** Varietal bila disebut brief, selain itu null. */
  varietals: string[] | null;
  /** null bila brand brief tidak menyebut catatan rasa. JANGAN dikarang (FR-07). */
  tastingNotes: string[] | null;
  /** Foto produk; null bila belum tersedia — placeholder brand dipakai (R-13). */
  image: ProductImage | null;
  /** Medan disiapkan sejak 1a; UI-nya baru dipakai 1b (FR-14). */
  status: ProductStatus;
  /** Kata kunci pemasaran untuk metadata. BUKAN klaim atribut origin (CA-04). */
  searchTerms: string[];
};

export const singleOriginBeans: SingleOriginBean[] = [
  /* --- Signature (Indonesia Timur) --- */
  {
    id: "oelbiteno",
    slug: "oelbiteno",
    name: "Oelbiteno",
    tier: "signature",
    origin: "Desa Oelbiteno",
    region: "Kupang",
    province: "NTT",
    process: null,
    altitudeMasl: null,
    varietals: null,
    tastingNotes: null,
    image: null,
    status: "available",
    searchTerms: ["kopi Kupang", "kopi NTT", "kopi Timor", "single origin NTT"],
  },
  {
    id: "abmisibil",
    slug: "abmisibil",
    name: "Abmisibil",
    tier: "signature",
    origin: null,
    region: "Pegunungan Bintang",
    province: "Papua",
    process: "Natural Anaerob",
    altitudeMasl: 1900,
    varietals: ["Arabica Bourbon", "Typica"],
    tastingNotes: null,
    image: {
      src: abmisibilArtwork,
      alt: "Ilustrasi lanskap Pegunungan Bintang, Papua: kanguru pohon bertengger di dahan berlumut di atas lembah hutan berkabut, dengan para-para penjemuran ceri kopi merah di kejauhan.",
    },
    status: "available",
    searchTerms: [
      "kopi Papua",
      "kopi Pegunungan Bintang",
      "arabica Papua",
      "kopi natural anaerob",
    ],
  },
  {
    id: "sabin",
    slug: "sabin",
    name: "Sabin",
    tier: "signature",
    origin: null,
    region: "Pegunungan Bintang",
    province: "Papua",
    process: "Washed",
    processedBy: "Elias Kaladana",
    altitudeMasl: 1900,
    varietals: ["Arabica Typica"],
    tastingNotes: null,
    image: {
      src: sabinArtwork,
      alt: "Ilustrasi lanskap Pegunungan Bintang, Papua: burung cendrawasih bertengger di dahan pohon menghadap lembah sungai berhutan, dengan para-para penjemuran ceri kopi di halaman.",
    },
    status: "available",
    searchTerms: [
      "kopi Papua",
      "kopi Pegunungan Bintang",
      "arabica washed Papua",
      "kopi typica",
    ],
  },
  {
    id: "pyramid",
    slug: "pyramid",
    name: "Pyramid",
    tier: "signature",
    origin: "Perabaga",
    region: "Jayawijaya",
    province: "Papua",
    process: null,
    altitudeMasl: null,
    varietals: null,
    tastingNotes: null,
    image: null,
    status: "available",
    searchTerms: ["kopi Papua", "kopi Jayawijaya", "kopi Wamena", "arabica Papua"],
  },

  /* --- Reguler (Pilihan Nusantara) --- */
  {
    id: "palimping",
    slug: "palimping",
    name: "Palimping",
    tier: "reguler",
    origin: "Desa Palimping",
    region: "Garut",
    province: "Jawa Barat",
    process: null,
    altitudeMasl: null,
    varietals: null,
    tastingNotes: null,
    image: null,
    status: "available",
    searchTerms: ["kopi Garut", "kopi Jawa Barat", "arabica Garut"],
  },
  {
    id: "kerinci",
    slug: "kerinci",
    name: "Kerinci",
    tier: "reguler",
    origin: null,
    region: "Pegunungan Kerinci",
    province: "Jambi",
    process: null,
    altitudeMasl: null,
    varietals: null,
    tastingNotes: null,
    image: null,
    status: "available",
    searchTerms: ["kopi Kerinci", "kopi Jambi", "arabica Kerinci"],
  },
  {
    id: "pondok-baru",
    slug: "pondok-baru",
    name: "Pondok Baru",
    tier: "reguler",
    origin: null,
    region: "Bener Meriah",
    province: "Aceh",
    process: "Natural Classic",
    processedBy: "BBMC",
    altitudeMasl: 1400,
    varietals: ["Arabica Bourbon", "Ateng Super"],
    tastingNotes: null,
    image: {
      src: pondokBaruArtwork,
      alt: "Ilustrasi lanskap dataran tinggi Bener Meriah, Aceh: harimau berjalan di antara kebun kopi berbuah merah dengan punggungan gunung berkabut di kejauhan.",
    },
    status: "available",
    searchTerms: [
      "kopi Gayo",
      "arabica Gayo",
      "kopi Aceh",
      "kopi Bener Meriah",
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Helper lapis penulisan                                              */
/* ------------------------------------------------------------------ */
/* beanPrice() DIPINDAHKAN ke catalog.ts sebagai bagian penyusunan Variant.
   Alasannya (K-09): mengembalikan angka telanjang tanpa satuan mengundang
   pemanggil menyimpulkan bahwa 3 pack = 3 x harga satuan, padahal BR-10
   menyatakan itu harga paket. Di catalog.ts angka selalu keluar bersama
   `unit` dan `packsPerUnit`. */

export function beansByTier(tier: Tier): SingleOriginBean[] {
  return singleOriginBeans.filter((bean) => bean.tier === tier);
}

export function findBean(id: string): SingleOriginBean | undefined {
  return singleOriginBeans.find((bean) => bean.id === id);
}

export function findHouseblendLine(
  slug: string,
): HouseblendLine | undefined {
  return houseblendLines.find((line) => line.slug === slug);
}
