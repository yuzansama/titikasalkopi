"use client";

/**
 * Tombol "Tambah ke keranjang" (FR-16).
 *
 * Menambahkan varian yang sama menambah jumlah pada baris yang ada, bukan
 * membuat baris baru — logikanya di `cartReducer`, bukan di sini.
 * Event `add_to_cart` dikirim dengan `value = qty * unitPrice`, dua bilangan
 * bulat dikalikan (ADR-05).
 *
 * Umpan balik keberhasilan diumumkan lewat wilayah `aria-live="polite"`
 * sehingga pemakai pembaca layar tahu aksinya berhasil (Bagian 11.5).
 *
 * FR-14 — bila owner menandai produk kosong di sheet, tombol ini TIDAK BOLEH
 * menerima pesanan. Sampai 9 September 2026 medan `status` mengalir sampai ke
 * data lalu berhenti: owner menandai kosong, memercayainya, dan situs tetap
 * menerima pesanan yang tidak bisa dipenuhi. Kegagalan itu sunyi di kedua sisi.
 */

import { useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/ui/styles";
import { trackAddToCart } from "@/lib/analytics";
import { useCartDispatch } from "@/features/cart/cart-provider";
import type { VariantOption } from "./variant-option";

export function AddToCartButton({
  slug,
  productName,
  variant,
  qty,
  soldOut = false,
}: {
  slug: string;
  productName: string;
  variant: VariantOption;
  qty: number;
  /** true bila owner menandai produk ini kosong di sheet (FR-14, KD-08). */
  soldOut?: boolean;
}) {
  const dispatch = useCartDispatch();
  const [added, setAdded] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const handleClick = () => {
    dispatch({ type: "ADD_ITEM", slug, variantId: variant.id, qty });
    trackAddToCart({
      productId: slug,
      itemVariant: variant.label,
      quantity: qty,
      value: qty * variant.unitPrice,
    });
    setAdded(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 4000);
  };

  if (soldOut) {
    // Tombol nonaktif, bukan tombol yang hilang: pembeli yang datang dari
    // tautan lama perlu tahu bahwa produknya ada tetapi sedang habis, bukan
    // mengira halamannya rusak.
    return (
      <div>
        <button
          type="button"
          disabled
          className={buttonClass("dark", "lg", "w-full cursor-not-allowed opacity-50 sm:w-auto")}
        >
          Stok sedang kosong
        </button>
        <p className="mt-2 text-sm text-olive">
          {productName} sedang tidak tersedia. Tanyakan lewat WhatsApp untuk
          perkiraan roasting berikutnya.
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className={buttonClass("dark", "lg", "w-full sm:w-auto")}
      >
        Tambah ke keranjang
      </button>
      <p className="mt-2 text-sm text-olive" aria-live="polite">
        {added ? `${productName} — ${variant.label} ditambahkan ke keranjang.` : ""}
      </p>
    </div>
  );
}
