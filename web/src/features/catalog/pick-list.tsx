"use client";

/**
 * Daftar Katalog Kopi 100 gram (KD-07).
 *
 * Bentuknya daftar, bukan kartu seperti `ProductGrid`, dan itu disengaja.
 * Kartu menjanjikan foto, asal, dan catatan rasa; delapan belas kartu yang
 * hanya berisi nama dan harga akan terbaca sebagai katalog yang rusak. Daftar
 * padat justru bentuk yang jujur untuk data yang memang hanya nama dan harga —
 * dan bentuk yang sama dengan poster cetak owner, sehingga keduanya bisa
 * dibandingkan baris per baris.
 *
 * Client Component karena setiap baris menambah ke keranjang. Datanya diterima
 * sebagai props dari Server Component; `@/data/*` tidak pernah diimpor di sini
 * (aturan ketergantungan nomor 4, NFR-03).
 */

import { useState } from "react";
import { QtyStepper } from "@/components/ui/qty-stepper";
import { buttonClass, CARD } from "@/components/ui/styles";
import { trackAddToCart } from "@/lib/analytics";
import { formatIDR } from "@/lib/format";
import { useCartDispatch } from "@/features/cart/cart-provider";
import type { CartCatalogEntry } from "@/data/types";

export function PickList({ entries }: { entries: readonly CartCatalogEntry[] }) {
  return (
    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
      {entries.map((entry) => (
        <li key={entry.slug}>
          <PickRow entry={entry} />
        </li>
      ))}
    </ul>
  );
}

function PickRow({ entry }: { entry: CartCatalogEntry }) {
  const dispatch = useCartDispatch();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const variant = entry.variants[0];

  const handleAdd = () => {
    dispatch({ type: "ADD_ITEM", slug: entry.slug, variantId: variant.id, qty });
    trackAddToCart({
      productId: entry.slug,
      itemVariant: variant.label,
      quantity: qty,
      value: qty * variant.unitPrice,
    });
    setAdded(true);
  };

  return (
    <div className={`${CARD} p-4`}>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-display text-lg font-semibold text-primary">
          {entry.name}
        </h3>
        <p className="font-display text-lg font-semibold text-coffee">
          {formatIDR(variant.unitPrice)}
        </p>
      </div>
      <p className="mt-1 text-sm text-olive">{variant.label}</p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <QtyStepper
          value={qty}
          min={variant.minQty}
          step={variant.step}
          max={99}
          onChange={setQty}
          label={`Jumlah ${entry.name}, ${variant.label}`}
          formatValue={(value) => String(value)}
          parseValue={(raw) => {
            const parsed = Number.parseInt(raw.replace(/\D/g, ""), 10);
            return Number.isFinite(parsed) ? parsed : null;
          }}
        />
        <button
          type="button"
          onClick={handleAdd}
          className={buttonClass("dark", "md")}
        >
          Tambah
        </button>
      </div>

      {/* Umpan balik per baris, bukan satu wilayah bersama: dengan delapan belas
          baris, pengumuman terpusat tidak memberi tahu baris mana yang berhasil. */}
      <p className="mt-2 text-sm text-olive" aria-live="polite">
        {added ? `${entry.name} ditambahkan ke keranjang.` : ""}
      </p>
    </div>
  );
}
