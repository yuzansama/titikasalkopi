import { Container } from "@/components/ui/container";
import { TrackOrderForm } from "@/features/tracking/track-order-form";
import { lacakMetadata } from "@/lib/seo";

/* ADR-01 */
export const dynamic = "error";

/** `lacakMetadata()` menyetel `robots: { index: false }`. */
export const metadata = lacakMetadata();

/**
 * FR-51 — lacak pesanan.
 *
 * Halamannya tetap statis. Yang dinamis hanya hasil pencarian, yang diambil di
 * klien dari endpoint buku order (lihat `lib/tracking.ts`). Tidak ada data
 * pesanan yang pernah masuk ke hasil build.
 *
 * Sengaja `noindex`: URL-nya tidak membawa kode order, jadi tidak ada kebocoran
 * lewat mesin pencari, tetapi halaman formulir kosong juga tidak punya nilai
 * pencarian dan hanya akan bersaing dengan halaman yang punya.
 */
export default function LacakPage() {
  return (
    <Container className="py-8 sm:py-10">
      <h1 className="font-display text-3xl font-semibold text-primary sm:text-4xl">
        Lacak pesanan
      </h1>
      <p className="mt-2 max-w-2xl text-olive">
        Masukkan kode order dari pesan WhatsApp yang Anda kirim, beserta 4 digit
        terakhir nomor WhatsApp Anda.
      </p>

      <div className="mt-8 max-w-2xl">
        <TrackOrderForm />
      </div>

      <section className="mt-12 max-w-2xl" aria-labelledby="lacak-catatan">
        <h2
          id="lacak-catatan"
          className="font-display text-xl font-semibold text-primary"
        >
          Yang perlu Anda tahu
        </h2>
        <ul className="mt-4 space-y-3 text-[0.95rem] text-olive">
          <li>
            Status diperbarui manual oleh kami, bukan otomatis oleh kurir.
            Setelah paket berangkat, nomor resi di halaman ini bisa dilacak di
            situs kurirnya untuk posisi terkini.
          </li>
          <li>
            Pesanan yang baru saja Anda kirim mungkin belum tercatat. Beri kami
            waktu sampai pesan Anda dibalas.
          </li>
          <li>
            Kehilangan kode order? Gulir ke atas pada percakapan WhatsApp Anda —
            kode itu ada di pesan yang Anda kirim sendiri.
          </li>
        </ul>
      </section>
    </Container>
  );
}
