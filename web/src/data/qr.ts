import { products } from "@/data/catalog";

/**
 * Kode QR kemasan: satu QR untuk satu varian (satu jenis kopi + satu ukuran).
 *
 * Isi QR adalah URL `/q/<kode>`, dengan `<kode>` = `Variant.id`. Id varian
 * sudah dijanjikan stabil dan permanen (lihat `Variant.id`), dan itu syarat
 * mutlak di sini: kode yang sudah tercetak di stiker tidak bisa ditarik lagi.
 * Mengganti id varian berarti setiap stiker lama berakhir di halaman 404.
 *
 * Dua pembaca memakai URL yang sama:
 * - Pembeli yang memindai dengan kamera biasa membuka halaman terima kasih
 *   `/q/<kode>` di situs ini.
 * - Aplikasi stok (folder `stok/`) memindai URL yang sama dan memakai
 *   `<kode>` untuk mencatat barang masuk atau terjual. Kode di tabel `varian`
 *   aplikasi stok harus ada di daftar ini.
 *
 * Bundel (`packsPerUnit` > 1, mis. 3 x 200 gr) tidak mendapat QR. Stiker
 * ditempel per bungkus, jadi bundel terdiri atas beberapa bungkus yang
 * masing-masing sudah punya QR ukurannya sendiri.
 */
export type QrEntry = {
  code: string;
  /** Nama kopi, mis. "Houseblend BOLD". */
  name: string;
  /** Label ukuran, mis. "Kemasan 100 gr". */
  label: string;
  tastingNotes: string[] | null;
  /** Halaman produk di situs ini, atau null bila kopinya tidak dijual di situs. */
  href: string | null;
};

const dariKatalog: QrEntry[] = products.flatMap((product) =>
  product.variants
    .filter((variant) => (variant.packsPerUnit ?? 1) === 1)
    .map((variant) => ({
      code: variant.id,
      name: product.name,
      label: variant.label,
      tastingNotes: product.tastingNotes,
      href: `/${product.category === "houseblend" ? "houseblend" : "produk"}/${product.slug}`,
    })),
);

/**
 * Kopi yang dijual dan dilacak lewat aplikasi stok, tetapi tidak ada di
 * katalog situs. Stikernya tetap butuh halaman terima kasih. Pola kodenya
 * sama dengan single origin di katalog (`-mini1` 100 gr, `-pack1` 200 gr),
 * supaya kalau kopinya kelak masuk katalog, stiker lama tetap berlaku.
 * Tidak ada catatan rasa: jangan dikarang (FR-07).
 */
const diLuarKatalog: QrEntry[] = [
  { code: "peneli-mini1", name: "Peneli", label: "1 pack (100 gr)", tastingNotes: null, href: null },
  { code: "peneli-pack1", name: "Peneli", label: "1 pack (200 gr)", tastingNotes: null, href: null },
  // Single origin baru di aplikasi stok (owner, 26 Nov 2026), belum ada di katalog situs.
  ...(
    [
      ["gn-tiom", "Gn. Tiom"],
      ["solok-honey-wash", "Solok Honey dan Wash"],
      ["kersamanah-anaerob", "Kersamanah Anaerob"],
      ["yellow-bourbon", "Yellow Bourbon"],
      ["manglayang-honey", "Manglayang Honey"],
      ["blueberry-infused", "Blueberry Infused"],
    ] as const
  ).map(([slug, name]) => ({
    code: `${slug}-pack1`,
    name,
    label: "1 pack (200 gr)",
    tastingNotes: null,
    href: null,
  })),
];

/**
 * Kemasan 100 gr single origin berhenti dijual 26 Nov 2026 dan hilang dari
 * katalog, tetapi stikernya sudah tercetak. Halaman /q-nya tetap ada.
 */
const SUDAH_TERCETAK_100G = ["oelbiteno", "abmisibil", "sabin", "pyramid", "palimping", "kerinci", "pondok-baru"];
const mini100gLama: QrEntry[] = products
  .filter((product) => SUDAH_TERCETAK_100G.includes(product.slug))
  .map((product) => ({
    code: `${product.slug}-mini1`,
    name: product.name,
    label: "1 pack (100 gr)",
    tastingNotes: product.tastingNotes,
    href: `/produk/${product.slug}`,
  }));

export const qrEntries: QrEntry[] = [
  ...dariKatalog,
  ...[...mini100gLama, ...diLuarKatalog].filter((e) => !dariKatalog.some((k) => k.code === e.code)),
];

const qrIndex = new Map(qrEntries.map((entry) => [entry.code, entry]));

export function findQrEntry(code: string): QrEntry | undefined {
  return qrIndex.get(code);
}

/** Path relatif yang dikodekan ke dalam QR. */
export function qrPath(code: string): string {
  return `/q/${code}`;
}
