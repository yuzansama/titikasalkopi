import type { StaticImageData } from "next/image";
import solokIlustrasi from "@/images/solok/solok-ilustrasi.jpg";

/**
 * Kopi yang SEGERA HADIR: sudah diumumkan, belum dijual.
 *
 * Sengaja terpisah dari katalog. Katalog harus sama persis dengan lembar
 * Product owner dan setiap produknya wajib punya harga (FR-49); kopi di sini
 * belum punya keduanya. Begitu dijual, kopinya pindah ke katalog dan halaman
 * /segera-hadir/<slug> dialihkan ke /produk/<slug>.
 *
 * ATURAN ISI (docs/riset-solok.md milik owner, 23 Nov 2026):
 * - Yang boleh tampil hanya fakta KAWASAN berstatus terverifikasi, ditandai
 *   sebagai fakta kawasan, dengan sumbernya.
 * - Data LOT (asal persis, proses, ketinggian kebun, varietas, catatan rasa)
 *   tidak ditulis sampai owner mengisinya dari pemasok atau cupping. Rentang
 *   ketinggian kawasan bukan ketinggian lot kita.
 * - Nama Indikasi Geografis, logonya, dan nama "Solok Radjo" tidak dipakai:
 *   itu perlindungan hukum dan merek pihak lain.
 */
export type FaktaKawasan = { label: string; isi: string };

export type SegeraHadir = {
  slug: string;
  name: string;
  /** Wilayah seperti tertulis di kemasan. */
  wilayah: string;
  ringkas: string;
  image: { src: StaticImageData; alt: string };
  judulKawasan: string;
  faktaKawasan: FaktaKawasan[];
  sumber: { label: string; url: string }[];
};

export const segeraHadir: SegeraHadir[] = [
  {
    slug: "solok",
    name: "Solok",
    wilayah: "Sumatera Barat",
    ringkas: "Arabika dari dataran tinggi Solok sedang kami siapkan.",
    image: {
      src: solokIlustrasi,
      alt: "Ilustrasi gunung hijau di atas danau dan kebun berbaris, dengan rumah bergonjong di tepi danau dan dahan kopi berbuah merah di depan.",
    },
    judulKawasan: "Dataran tinggi Kabupaten Solok",
    faktaKawasan: [
      { label: "Ketinggian kawasan", isi: "1.000–1.800 mdpl" },
      { label: "Gunung", isi: "Gunung Talang, gunung api aktif" },
      { label: "Tanah", isi: "Vulkanik (Andosol dan Alfisol)" },
      { label: "Iklim", isi: "Rata-rata 15–25 °C, curah hujan sekitar 2.500 mm per tahun, kemarau Juni–Oktober" },
      { label: "Cara petik", isi: "Selektif, hanya buah masak, di bawah pohon penaung" },
    ],
    sumber: [
      {
        label: "Berita Resmi DJKI No. 14/IG/VIII/A/2019",
        url: "https://www.dgip.go.id/berita-resmi/1622/download",
      },
    ],
  },
];

const indeks = new Map(segeraHadir.map((k) => [k.slug, k]));

export function findSegeraHadir(slug: string): SegeraHadir | undefined {
  return indeks.get(slug);
}
