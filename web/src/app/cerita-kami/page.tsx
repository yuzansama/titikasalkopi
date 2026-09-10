import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonClass, CARD } from "@/components/ui/styles";
import { catalogGroups } from "@/data/catalog";
import { ceritaKamiMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

/* ADR-01 */
export const dynamic = "error";

export const metadata = ceritaKamiMetadata();

/**
 * FR-31 — Cerita Kami.
 *
 * BATASAN ISI YANG MENGIKAT: halaman ini TIDAK memuat klaim sertifikasi,
 * penghargaan, jumlah pelanggan, kapasitas produksi, tahun berdiri, maupun
 * cerita pendiri — tidak satu pun disebut brand brief, dan mengarangnya
 * melanggar FR-07 dan FR-31. Setiap kalimat di bawah dapat ditelusuri ke
 * docs/00-brand-brief.md atau ke isi katalog yang sudah tayang.
 *
 * D-11 memangkas halaman ini dari 351 kata ke plafon 260. Pemangkasannya
 * dikerjakan dengan MEMBUANG kalimat, bukan dengan menukarnya menjadi kalimat
 * yang lebih pendek dan lebih berani: batasan di atas membuat kalimat pengganti
 * yang lebih tegas hampir pasti menjadi klaim yang tidak berdasar. Yang tersisa
 * adalah alinea yang menjawab "kenapa Indonesia Timur dan Nusantara" beserta
 * dua kartu kelompok asalnya — itu alasan halaman ini ada.
 */

/* TODO(copy): bila owner ingin menceritakan proses kurasi origin (kunjungan
   kebun, cupping, kriteria seleksi), kalimatnya harus berasal dari owner. Kami
   tidak menambahkannya sendiri karena docs/00-brand-brief.md tidak menyebut
   satu pun proses tersebut. Catatan ini dipindahkan ke sini karena seksi "Cara
   kami menuliskan asal" yang dulu memuatnya dihapus oleh D-11; utangnya kepada
   owner belum lunas, jadi catatannya tidak ikut dihapus. */
export default function CeritaKamiPage() {
  const signature = catalogGroups[0];
  const reguler = catalogGroups[1];

  return (
    <Container width="prose" className="py-10 sm:py-14">
      <h1 className="font-display text-3xl font-semibold text-primary sm:text-4xl">
        Cerita Kami
      </h1>
      <p className="mt-4 text-lg text-olive">{site.tagline}</p>

      <section className="mt-10" aria-labelledby="posisi">
        <h2
          id="posisi"
          className="font-display text-2xl font-semibold text-primary"
        >
          Apa yang kami kerjakan
        </h2>
        <p className="mt-3 text-primary">
          {site.name} menghadirkan kopi single origin dan houseblend dari titik
          terbaik di Indonesia, dengan fokus pada Indonesia Timur dan pilihan
          Nusantara. Setiap kopi kami sebut lewat nama tempatnya, bukan lewat
          nama racikan — karena titik asal itulah yang membedakan rasanya.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="fokus">
        <h2
          id="fokus"
          className="font-display text-2xl font-semibold text-primary"
        >
          Kenapa Indonesia Timur dan Nusantara
        </h2>
        <p className="mt-3 text-primary">
          Tier Signature kami berasal dari Indonesia Timur: Oelbiteno di Kupang,
          NTT, serta Abmisibil, Sabin, dan Pyramid di Papua. Tier Reguler
          mengangkat pilihan Nusantara: Palimping di Garut, Kerinci di Jambi, dan
          Pondok Baru di Bener Meriah, Aceh. Dua kelompok ini yang kami
          tawarkan, dan hanya itu — kami tidak menjual apa yang tidak kami kenal
          asalnya.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[signature, reguler].map((group) => (
            <div key={group.id} className={`${CARD} p-5`}>
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-primary">
                {group.title}
              </h3>
              <p className="mt-1 text-sm text-olive">{group.subtitle}</p>
              <ul className="mt-3 space-y-1 text-[0.95rem] text-primary">
                {group.products.map((product) => (
                  <li key={product.slug}>
                    {product.name}
                    {product.origin
                      ? ` — ${product.origin.region}, ${product.origin.province}`
                      : ""}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* D-11 — seksi "Cara kami menuliskan asal" dihapus seluruhnya. Ia
          menjelaskan kebijakan editorial yang sama dengan kalimat yang dibuang
          dari halaman produk, dan kebijakan itu tetap ditegakkan kode
          (`originFacts()` hanya merender medan non-null), bukan oleh paragraf.
          TODO(copy) yang dulu menempel di sini dipindahkan ke atas berkas.

          D-11 — seksi "Kanal resmi" ikut dihapus, disusutkan menjadi dua tombol
          di bawah. Ketiga kanalnya sudah tayang di footer setiap halaman dan
          diulang lengkap di /kontak; kalimat pembayarannya pun hidup di
          /kontak. Yang tersisa di sini hanyalah dua langkah lanjutan.

          D-11 — kalimat penutup "Ada pertanyaan tentang asal biji tertentu?
          Hubungi kami." dihapus: ia mengulang tombol "Halaman kontak" yang
          berdiri tepat di atasnya. */}
      <p className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href="/katalog" className={buttonClass("primary", "lg")}>
          Lihat katalog
        </Link>
        <Link href="/kontak" className={buttonClass("outline", "lg")}>
          Halaman kontak
        </Link>
      </p>
    </Container>
  );
}
