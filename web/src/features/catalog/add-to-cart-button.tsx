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
}: {
  slug: string;
  productName: string;
  variant: VariantOption;
  qty: number;
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
