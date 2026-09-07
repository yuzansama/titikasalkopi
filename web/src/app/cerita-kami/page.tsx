import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonClass, CARD, FOCUS_RING } from "@/components/ui/styles";
import { catalogGroups } from "@/data/catalog";
import { ceritaKamiMetadata } from "@/lib/seo";
import { instagram, shopee, site, whatsapp } from "@/lib/site";

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
 */
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

      <section className="mt-10" aria-labelledby="cara-memilih">
        <h2
          id="cara-memilih"
          className="font-display text-2xl font-semibold text-primary"
        >
          Cara kami menuliskan asal
        </h2>
        <p className="mt-3 text-primary">
          Pada halaman produk kami hanya menuliskan keterangan yang benar-benar
          kami ketahui: lokasi, wilayah, provinsi, dan — bila tersedia — proses
          pasca panen, nama prosesor, ketinggian, serta varietal. Bila sebuah
          keterangan belum kami pastikan, keterangan itu tidak ditampilkan sama
          sekali, bukan diisi perkiraan. Karena itu sebagian halaman produk
          memuat lebih sedikit baris daripada yang lain.
        </p>
        {/* TODO(copy): bila owner ingin menceritakan proses kurasi origin
            (kunjungan kebun, cupping, kriteria seleksi), kalimatnya harus
            berasal dari owner. Kami tidak menambahkannya sendiri karena
            docs/00-brand-brief.md tidak menyebut satu pun proses tersebut. */}
      </section>

      <section className="mt-10" aria-labelledby="kanal">
        <h2 id="kanal" className="font-display text-2xl font-semibold text-primary">
          Kanal resmi
        </h2>
        <p className="mt-3 text-primary">
          Kami hanya melayani lewat tiga kanal berikut. Pemesanan diselesaikan di
          WhatsApp; pembayaran tidak pernah dilakukan di website ini.
        </p>
        <ul className="mt-3 space-y-1 text-primary">
          <li>WhatsApp {whatsapp.display}</li>
          <li>Instagram {instagram.handle}</li>
          <li>Shopee {shopee.handle}</li>
        </ul>
        <p className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/katalog" className={buttonClass("primary", "lg")}>
            Lihat katalog
          </Link>
          <Link href="/kontak" className={buttonClass("outline", "lg")}>
            Halaman kontak
          </Link>
        </p>
      </section>

      <p className="mt-10 text-sm text-olive">
        Ada pertanyaan tentang asal biji tertentu?{" "}
        <Link
          href="/kontak"
          className={`rounded-sm text-rust underline underline-offset-4 ${FOCUS_RING}`}
        >
          Hubungi kami
        </Link>
        .
      </p>
    </Container>
  );
}
