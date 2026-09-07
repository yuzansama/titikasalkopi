import Image from "next/image";
import {
  PRODUCT_IMAGE_HEIGHT,
  PRODUCT_IMAGE_WIDTH,
  placeholderImagePath,
} from "@/data/catalog";
import type { Product } from "@/data/types";

/**
 * Bingkai gambar produk (ADR-06, FR-12, NFR-02).
 *
 * Rasio aspek 4:5 dikunci di WRAPPER, bukan di gambar, supaya placeholder dan
 * foto asli menempati ruang yang persis sama — penggantian nanti tidak
 * menggeser tata letak sama sekali (CLS ≤ 0,05).
 *
 * Teks alternatif (NFR-07, Bagian 11.5):
 * - Ada foto asli  -> memakai `image.alt` yang divalidasi V-14 saat build.
 * - Belum ada foto -> placeholder SVG bergaya brand bersifat DEKORATIF, jadi
 *   `alt=""`. Mengarang deskripsi foto yang tidak ada akan menyesatkan
 *   pembaca layar dan melanggar prinsip FR-07; nama produk sudah dibacakan
 *   oleh heading di sebelahnya.
 */
export function ProductMedia({
  product,
  sizes,
  priority = false,
  className = "",
}: {
  product: Product;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const hasPhoto = product.image !== null;

  return (
    <div
      className={`relative aspect-[4/5] w-full overflow-hidden rounded-md bg-base ${className}`}
    >
      {hasPhoto ? (
        <Image
          src={product.image!.src}
          alt={product.image!.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <Image
          src={placeholderImagePath(product.slug)}
          alt=""
          aria-hidden="true"
          width={PRODUCT_IMAGE_WIDTH}
          height={PRODUCT_IMAGE_HEIGHT}
          sizes={sizes}
          priority={priority}
          // SVG tidak melewati pengoptimal gambar Next; berkasnya hanya ±1,4 KB
          // sehingga tidak ada yang perlu dioptimalkan (docs/05-backend.md §10).
          unoptimized
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
