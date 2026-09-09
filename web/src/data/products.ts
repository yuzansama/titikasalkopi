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
 * - Houseblend punya DUA harga tersimpan karena ia punya DUA UKURAN KEMASAN:
 *   1 kg dan 0,5 kg. Kemasan kecil tidak dijual setengah harga kemasan besar —
 *   bisnis plan "Kopi from heart" memberinya margin sendiri, mis. BOLD 70:30
 *   Rp215.000 sekemasan 1 kg tetapi Rp120.000 sekemasan 0,5 kg. Keduanya harga
 *   satu kemasan yang benar-benar dijual; tidak ada tarif turunan di mana pun
 *   (D-02 direvisi; lihat catatan di catalog.ts).
 * - Jangan menambah metadata yang tidak disebut brief. Field yang tidak
 *   disebutkan brief bernilai `null`, bukan tebakan (FR-07).
 * - Panduan lengkap untuk owner ada di docs/05-backend.md Bagian "Panduan owner".
 */

import abmisibilArtwork from "@/images/produk/abmisibil.jpg";
import { managedPrice, managedStatus } from "./managed.generated";
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
  /** Harga satu kemasan 1 kg. */
  pricePerKg: PriceIDR;
  /** Harga satu kemasan 0,5 kg. BUKAN setengah harga kemasan 1 kg. */
  pricePerHalfKg: PriceIDR;
};

/** Arabica Natural & Fine Robusta Natural. Notes: choco, almond, caramel. */
export const HOUSEBLEND_BOLD_NOTES = ["choco", "almond", "caramel"] as const;

export const houseblendBold: HouseblendBoldRatio[] = [
  {
    id: "bold-70-30",
    arabicaPercent: 70,
    robustaPercent: 30,
    label: "70% Arabica : 30% Robusta",
    pricePerKg: managedPrice("houseblend.bold-70-30"),
    pricePerHalfKg: managedPrice("houseblend.bold-70-30.half"),
  },
  {
    id: "bold-60-40",
    arabicaPercent: 60,
    robustaPercent: 40,
    label: "60% Arabica : 40% Robusta",
    pricePerKg: managedPrice("houseblend.bold-60-40"),
    pricePerHalfKg: managedPrice("houseblend.bold-60-40.half"),
  },
  {
    id: "bold-50-50",
    arabicaPercent: 50,
    robustaPercent: 50,
    label: "50% Arabica : 50% Robusta",
    pricePerKg: managedPrice("houseblend.bold-50-50"),
    pricePerHalfKg: managedPrice("houseblend.bold-50-50.half"),
  },
  {
    id: "bold-40-60",
    arabicaPercent: 40,
    robustaPercent: 60,
    label: "40% Arabica : 60% Robusta",
    pricePerKg: managedPrice("houseblend.bold-40-60"),
    pricePerHalfKg: managedPrice("houseblend.bold-40-60.half"),
  },
  {
    id: "bold-30-70",
    arabicaPercent: 30,
    robustaPercent: 70,
    label: "30% Arabica : 70% Robusta",
    pricePerKg: managedPrice("houseblend.bold-30-70"),
    pricePerHalfKg: managedPrice("houseblend.bold-30-70.half"),
  },
  {
    id: "bold-20-80",
    arabicaPercent: 20,
    robustaPercent: 80,
    label: "20% Arabica : 80% Robusta",
    pricePerKg: managedPrice("houseblend.bold-20-80"),
    pricePerHalfKg: managedPrice("houseblend.bold-20-80.half"),
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
  /** Harga satu kemasan 0,5 kg. BUKAN setengah harga kemasan 1 kg. */
  pricePerHalfKg: PriceIDR;
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
    pricePerKg: managedPrice("houseblend.bright-signature"),
    pricePerHalfKg: managedPrice("houseblend.bright-signature.half"),
  },
  {
    id: "bright-reguler",
    tier: "reguler",
    label: "Reguler",
    pricePerKg: managedPrice("houseblend.bright-reguler"),
    pricePerHalfKg: managedPrice("houseblend.bright-reguler.half"),
  },
];

/* ------------------------------------------------------------------ */
/* Houseblend — Full Robusta                                           */
/* ------------------------------------------------------------------ */

export type HouseblendFullRobusta = {
  id: string;
  label: string;
  pricePerKg: PriceIDR;
  /** Harga satu kemasan 0,5 kg. BUKAN setengah harga kemasan 1 kg. */
  pricePerHalfKg: PriceIDR;
};

export const houseblendFullRobusta: HouseblendFullRobusta = {
  id: "full-robusta",
  label: "Full Robusta",
  pricePerKg: managedPrice("houseblend.full-robusta"),
  pricePerHalfKg: managedPrice("houseblend.full-robusta.half"),
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
      "Houseblend BOLD — campuran Arabica Natural dan Fine Robusta Natural dalam enam rasio, kemasan 1 kg mulai Rp185.000.",
    description:
      "Houseblend BOLD memadukan Arabica Natural dan Fine Robusta Natural. Tersedia dalam enam rasio Arabica:Robusta sehingga kedai dapat memilih titik keseimbangan body dan manis yang paling cocok dengan mesin dan menunya. Rasio paling robusta, 20:80, masih memuat seperlima arabica — bila Anda menginginkan robusta penuh tanpa arabica sama sekali, lini Full Robusta yang dimaksud. Setiap rasio tersedia dalam kemasan 1 kg dan 0,5 kg.",
    tastingNotes: [...HOUSEBLEND_BOLD_NOTES],
    image: {
      src: boldPhoto,
      alt: "Biji kopi sangrai gelap yang mengilap menumpuk rapat, dengan sekop logam menyendok dari sisi kanan atas.",
    },
    status: managedStatus("bold"),
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
      "Houseblend BRIGHT — full Arabica natural dan washed, tersedia varian Signature dan Reguler, dalam kemasan 1 kg dan 0,5 kg.",
    description:
      "Houseblend BRIGHT adalah blend full Arabica yang menggabungkan proses natural dan washed. Tersedia dalam dua varian, Signature dan Reguler. Pada lini ini Signature dan Reguler adalah nama varian blend, bukan tier harga single origin. Kedua varian tersedia dalam kemasan 1 kg dan 0,5 kg.",
    tastingNotes: [...HOUSEBLEND_BRIGHT_NOTES],
    image: {
      src: brightPhoto,
      alt: "Biji kopi arabica sangrai terang di dalam mangkuk kayu, dengan sendok kayu bersandar di tepi mangkuk.",
    },
    status: managedStatus("bright"),
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
    // BR-16 — membedakan lini ini dari BOLD 20:80, yang harganya kini hanya
    // Rp5.000 lebih tinggi. Premis lama BR-16 (harga keduanya identik) sudah
    // batal, tetapi kebutuhannya tetap: selisih Rp5.000 terlalu tipis untuk
    // menjelaskan apa pun, jadi pembedanya harus komposisi, bukan harga.
    // Yang ditulis di bawah hanya turunan dari komposisi yang memang tercatat
    // — 100% robusta terhadap 20% arabica — bukan klaim rasa yang belum
    // pernah dicicip pada lot ini (FR-07).
    summary:
      "Houseblend Full Robusta — 100% robusta, tanpa arabica sama sekali. Kemasan 1 kg Rp180.000.",
    description:
      "Houseblend Full Robusta adalah blend robusta penuh untuk kedai yang mengutamakan body tebal dan biaya per cangkir yang terjaga. Bedanya dengan BOLD 20:80 bukan terletak pada harga, yang hanya berselisih Rp5.000 per kilogram, melainkan pada komposisi: BOLD 20:80 masih memuat seperlima arabica, sementara lini ini tidak memuatnya sama sekali. Pilih lini ini bila resep espresso Anda sudah dikunci di sekitar karakter robusta dan tambahan arabica justru menggeser rasa yang sudah pas. Tersedia dalam kemasan 1 kg dan 0,5 kg.",
    tastingNotes: null,
    // Tidak ada artwork yang jujur mewakili lini ini: lembar HOUSEBLEND hanya
    // memotret BOLD dan BRIGHT. Memakai foto BOLD di sini berarti menampilkan
    // produk lain (FR-07), jadi lini ini tetap memakai placeholder (R-13).
    image: null,
    status: managedStatus("full-robusta"),
    searchTerms: [
      "kopi robusta per kg",
      "houseblend robusta",
      "biji kopi robusta kedai",
    ],
  },
];

/**
 * Houseblend dijual dalam dua ukuran kemasan, 1 kg dan 0,5 kg (D-02 direvisi
 * 9 September 2026 oleh lembar `Product`). Keduanya dipesan per kemasan utuh,
 * jadi tidak ada minimum atau kelipatan khusus untuk dijaga di sini.
 */
export const HOUSEBLEND_KG_GRAMS = 1000;
export const HOUSEBLEND_HALF_KG_GRAMS = 500;

/* ------------------------------------------------------------------ */
/* Single origin                                                       */
/* ------------------------------------------------------------------ */

/** Kemasan utama single origin (BR-08). */
export const SINGLE_ORIGIN_PACK_GRAMS = 200;

/**
 * Kemasan kecil single origin, dari lembar "Product" bisnis plan
 * ("Single Origin - Mini Packs"). Lini terpisah dari Katalog Kopi 100 gram di
 * `picks.ts`: yang ini biji yang sama dengan kemasan 200 gr, dijual di halaman
 * produk yang sama.
 */
export const SINGLE_ORIGIN_MINI_PACK_GRAMS = 100;

/** Jumlah kemasan 200 gr di dalam satu paket bundel (BR-11, D-01). */
export const SINGLE_ORIGIN_PACKS_PER_BUNDLE = 3;

export type TierPricing = {
  /** Harga 1 pack 200 gr. */
  pack1: PriceIDR;
  /** Harga bundel 3 pack 200 gr. HARGA PAKET, bukan 3 x pack1 (BR-10). */
  pack3: PriceIDR;
  /**
   * Harga 1 kemasan mini 100 gr. Bukan setengah `pack1`: kemasan kecil
   * membawa marginnya sendiri di bisnis plan (Signature Rp85.000 terhadap
   * Rp140.000, Reguler Rp70.000 terhadap Rp125.000).
   */
  mini1: PriceIDR;
};

/**
 * Harga single origin ditentukan oleh tier, bukan oleh biji (BR-09).
 * Signature = Kupang / Papua. Reguler = Sumatera / Jawa.
 */
export const singleOriginPricing: Record<Tier, TierPricing> = {
  signature: {
    pack1: managedPrice("single.signature.pack1"),
    pack3: managedPrice("single.signature.pack3"),
    mini1: managedPrice("single.signature.mini1"),
  },
  reguler: {
    pack1: managedPrice("single.reguler.pack1"),
    pack3: managedPrice("single.reguler.pack3"),
    mini1: managedPrice("single.reguler.mini1"),
  },
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
  /**
   * Apakah biji ini juga dijual dalam kemasan mini 100 gr.
   * `false` bukan berarti belum diputuskan: lembar "Product" mendaftar tujuh
   * biji pada kolom Mini Packs dan sengaja melewatkan Sindoro. Menerbitkan
   * kemasan yang tidak ada di rencana berarti menerima pesanan yang tidak bisa
   * dipenuhi, jadi kolomnya ditulis per biji, bukan diturunkan dari tier.
   */
  hasMiniPack: boolean;
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
    hasMiniPack: true,
    status: managedStatus("oelbiteno"),
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
    // Draf keyakinan SEDANG, disetujui owner 7 September 2026 (docs/07-draft-tasting-notes.md).
    // Natural anaerob mendorong profil buah dan fermentasi; arah rasa
    // paling dapat diperkirakan di katalog ini justru karena prosesnya.
    // Belum berasal dari cupping lot ini — koreksi owner mengganti baris ini.
    tastingNotes: ["Beri hitam", "Anggur merah", "Cokelat hitam"],
    image: {
      src: abmisibilArtwork,
      alt: "Ilustrasi lanskap Pegunungan Bintang, Papua: kanguru pohon bertengger di dahan berlumut di atas lembah hutan berkabut, dengan para-para penjemuran ceri kopi merah di kejauhan.",
    },
    hasMiniPack: true,
    status: managedStatus("abmisibil"),
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
    // Draf keyakinan SEDANG, disetujui owner 7 September 2026 (docs/07-draft-tasting-notes.md).
    // Typica washed di 1.900 MASL: bersih dan terang.
    // Belum berasal dari cupping lot ini — koreksi owner mengganti baris ini.
    tastingNotes: ["Gula aren", "Jeruk manis", "Floral"],
    image: {
      src: sabinArtwork,
      alt: "Ilustrasi lanskap Pegunungan Bintang, Papua: burung cendrawasih bertengger di dahan pohon menghadap lembah sungai berhutan, dengan para-para penjemuran ceri kopi di halaman.",
    },
    hasMiniPack: true,
    status: managedStatus("sabin"),
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
    hasMiniPack: true,
    status: managedStatus("pyramid"),
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
    // DEF-11. Brand brief hanya menulis "Desa Palimping, Garut" — satu-satunya
    // origin tanpa provinsi tertulis. Nilai ini TIDAK datang dari brief: ia
    // diturunkan dari fakta administratif bahwa Garut adalah kabupaten di Jawa
    // Barat, bukan dari klaim apa pun tentang kopinya. Ditulis di sini karena
    // `province` wajib terisi (validate.ts) dan judul metadata SEO merakit
    // dirinya dari kolom ini. Menunggu satu kalimat konfirmasi owner; kalau ia
    // menolak, hapus barisnya dan longgarkan validasi, jangan ganti tebakan.
    province: "Jawa Barat",
    process: null,
    altitudeMasl: null,
    varietals: null,
    tastingNotes: null,
    image: null,
    hasMiniPack: true,
    status: managedStatus("palimping"),
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
    hasMiniPack: true,
    status: managedStatus("kerinci"),
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
    // Draf keyakinan SEDANG, disetujui owner 7 September 2026 (docs/07-draft-tasting-notes.md).
    // Natural pada Ateng Super di dataran Gayo: manis buah kering,
    // tubuh tebal.
    // Belum berasal dari cupping lot ini — koreksi owner mengganti baris ini.
    tastingNotes: ["Buah kering", "Cokelat", "Rempah manis"],
    image: {
      src: pondokBaruArtwork,
      alt: "Ilustrasi lanskap dataran tinggi Bener Meriah, Aceh: harimau berjalan di antara kebun kopi berbuah merah dengan punggungan gunung berkabut di kejauhan.",
    },
    hasMiniPack: true,
    status: managedStatus("pondok-baru"),
    searchTerms: [
      "kopi Gayo",
      "arabica Gayo",
      "kopi Aceh",
      "kopi Bener Meriah",
    ],
  },
  {
    id: "sindoro",
    slug: "sindoro",
    name: "Sindoro",
    tier: "reguler",
    origin: null,
    region: "Gunung Sindoro",
    // DIKONFIRMASI OWNER 9 September 2026. Lembar "Product" hanya menulis nama
    // "Sindoro" tanpa satu pun kolom asal; "Jawa Tengah" datang dari owner,
    // bukan dari tebakan kode. Kolom asal lain tetap `null` sampai ia
    // menyerahkan datanya — itu keadaan yang sah, bukan pekerjaan tertinggal.
    province: "Jawa Tengah",
    process: null,
    altitudeMasl: null,
    varietals: null,
    tastingNotes: null,
    image: null,
    // Lembar "Product" mendaftar Sindoro hanya pada kolom 200 gr; kolom Mini
    // Packs melewatinya. Lihat catatan pada `hasMiniPack`.
    hasMiniPack: false,
    status: managedStatus("sindoro"),
    searchTerms: [
      "kopi Sindoro",
      "kopi Temanggung",
      "kopi Jawa Tengah",
      "arabica Jawa Tengah",
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
