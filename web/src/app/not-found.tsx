import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonClass } from "@/components/ui/styles";
import { notFoundMetadata } from "@/lib/seo";

export const metadata = notFoundMetadata();

/**
 * Halaman 404. Karena `dynamicParams = false` pada kedua rute berparameter,
 * slug asing menghasilkan 404 STATIS — halaman ini yang tampil (ADR-01).
 */
export default function NotFound() {
  return (
    <Container width="prose" className="py-16 sm:py-24">
      <p className="font-heading text-sm font-semibold uppercase tracking-[0.2em] text-rust">
        404
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-primary sm:text-4xl">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-3 text-olive">
        Tautannya mungkin salah ketik, atau halamannya sudah tidak ada. Katalog
        lengkap kami tetap bisa dibuka lewat tautan di bawah.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/katalog" className={buttonClass("primary", "lg")}>
          Lihat katalog
        </Link>
        <Link href="/" className={buttonClass("outline", "lg")}>
          Kembali ke beranda
        </Link>
      </div>
    </Container>
  );
}
