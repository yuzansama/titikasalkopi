"use client";

/**
 * Indikator keranjang global di header (FR-17, Bagian 6.4).
 *
 * Sebelum hydration komponen ini merender bentuk yang SAMA PERSIS dengan HTML
 * server; ruang badge tetap dipesan agar tidak ada layout shift (NFR-02).
 * Angka baru muncul setelah `hydrated` bernilai true.
 */

import Link from "next/link";
import { CartIcon } from "@/components/icons/icons";
import { FOCUS_RING } from "@/components/ui/styles";
import { useCart } from "./cart-provider";

export function CartBadge() {
  const { items, hydrated } = useCart();
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const showCount = hydrated && count > 0;

  return (
    <Link
      href="/keranjang"
      className={`relative grid h-11 w-11 place-items-center rounded-md text-primary hover:bg-primary/10 ${FOCUS_RING}`}
    >
      <CartIcon className="h-6 w-6" />
      <span className="sr-only" aria-live="polite">
        {hydrated ? `Keranjang, ${count} item` : "Keranjang"}
      </span>
      <span
        aria-hidden="true"
        className="absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-rust px-1 text-[0.7rem] font-semibold text-cream"
        style={{ visibility: showCount ? "visible" : "hidden" }}
      >
        {showCount ? count : ""}
      </span>
    </Link>
  );
}
