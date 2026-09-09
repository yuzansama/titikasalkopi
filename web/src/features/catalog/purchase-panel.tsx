"use client";

/**
 * Panel pembelian pada halaman detail — pemilih varian, konfigurator jumlah,
 * dan tombol tambah ke keranjang dalam satu batas klien.
 *
 * PENYIMPANGAN YANG DICATAT dari daftar tertutup ADR-10: dokumen arsitektur
 * mendaftar `variant-picker`, `ratio-table`, `kg-configurator`, dan
 * `add-to-cart-button` sebagai empat Client Component terpisah. Keempatnya
 * berbagi satu state (varian terpilih dan jumlah), sehingga state itu tetap
 * harus diangkat ke sebuah induk yang juga Client Component. Berkas ini adalah
 * induk tersebut; ia TIDAK memperluas batas klien melampaui keempat komponen
 * itu, dan sisa halaman detail tetap Server Component. Dicatat di
 * docs/04-frontend.md.
 *
 * Seluruh props sudah di-resolve oleh Server Component induk — berkas ini tidak
 * pernah mengimpor `@/data/catalog` (aturan ketergantungan nomor 4, NFR-03).
 */

import { useMemo, useState } from "react";
import { QtyStepper } from "@/components/ui/qty-stepper";
import { formatIDR, formatQuantity, formatTotalWeight, unitLabel } from "@/lib/format";
import { trackSelectVariant } from "@/lib/analytics";
import { AddToCartButton } from "./add-to-cart-button";
import { RatioTable, type RatioRow } from "./ratio-table";
import { VariantPicker } from "./variant-picker";
import type { VariantOption } from "./variant-option";

const MAX_QTY = 99;

/** Petunjuk singkat di bawah stepper, sesuai satuan kemasan yang dipilih. */
function qtyHint(unit: VariantOption["unit"]): string {
  switch (unit) {
    case "paket":
      return "Satu paket berisi tiga kemasan 200 gr dari origin yang sama.";
    case "pack":
      return "Satu pack berisi 200 gr.";
    case "kg":
      return "Dihitung per kemasan 1 kg.";
    case "half-kg":
      return "Dihitung per kemasan 0,5 kg.";
    case "gram-100":
      return "Satu kemasan berisi 100 gr.";
  }
}

export function PurchasePanel({
  slug,
  productName,
  variants,
  ratioRows,
  variantNotes,
  soldOut = false,
}: {
  slug: string;
  productName: string;
  variants: readonly VariantOption[];
  /** true bila owner menandai produk ini kosong di sheet (FR-14, KD-08). */
  soldOut?: boolean;
  /**
   * Baris tabel rasio, sudah dikelompokkan per ukuran kemasan oleh Server
   * Component. Diisi hanya untuk lini BOLD, yang enam rasionya lebih terbaca
   * sebagai tabel (FR-28, FR-29); lini lain memakai pemilih varian biasa.
   */
  ratioRows?: readonly RatioRow[];
  /** Keterangan per varian dari Server Component, mis. penghematan 3 pack. */
  variantNotes?: Readonly<Record<string, string>>;
}) {
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const selected = useMemo(
    () => variants.find((variant) => variant.id === variantId) ?? variants[0],
    [variants, variantId],
  );

  const [qty, setQty] = useState(1);

  if (!selected) return null;

  const handleSelect = (nextId: string) => {
    setVariantId(nextId);
    const next = variants.find((variant) => variant.id === nextId);
    trackSelectVariant({ productId: slug, variant: next?.label ?? nextId });
  };

  const lineTotal = qty * selected.unitPrice;
  const weight = formatTotalWeight(qty, selected.unit);

  return (
    <div className="space-y-6">
      {variants.length > 1 ? (
        ratioRows && ratioRows.length > 0 ? (
          <RatioTable
            rows={ratioRows}
            selectedId={selected.id}
            onSelect={handleSelect}
            caption="Pilih rasio dan ukuran kemasannya, lalu atur jumlahnya di bawah tabel."
          />
        ) : (
          <VariantPicker
            variants={variants}
            selectedId={selected.id}
            onSelect={handleSelect}
            legend="Pilih varian"
            notes={variantNotes}
          />
        )
      ) : null}

      <QtyStepper
        value={qty}
        min={selected.minQty}
        step={selected.step}
        max={MAX_QTY}
        onChange={setQty}
        label={`Jumlah ${productName}`}
        formatValue={(value) => String(value)}
        parseValue={(raw) => {
          const parsed = Number.parseInt(raw.replace(/\D/g, ""), 10);
          return Number.isFinite(parsed) ? parsed : null;
        }}
        hint={qtyHint(selected.unit)}
      />

      {/* SATU pernyataan harga, dan ia WAJIB bisa dijumlahkan sendiri oleh
          pembaca: jumlah kemasan, harga satu kemasan, lalu totalnya. Harga
          satuan muncul hanya saat jumlahnya lebih dari satu — di situ ia
          menjelaskan perkaliannya, bukan mengulanginya.

          Tidak ada lagi angka kedua di baris ini. Sebelum 9 September 2026
          houseblend menampilkan tarif per kg di sebelah total yang dihitung
          dari harga kemasan 0,5 kg, dan begitu keduanya berhenti berhubungan,
          layar ini menunjukkan dua angka yang tidak mungkin sama-sama benar.

          Berat total ditulis terpisah dan tanpa rupiah, supaya ia tidak pernah
          terbaca sebagai faktor pengali. */}
      <div className="rounded-md bg-base px-4 py-3" aria-live="polite">
        <p className="text-sm text-olive">
          {formatQuantity(qty, selected.unit)}
          {qty > 1
            ? ` × ${formatIDR(selected.unitPrice)} ${unitLabel(selected.unit)}`
            : ""}
          {weight ? ` · total ${weight}` : ""}
        </p>
        <p className="mt-1 font-display text-2xl font-semibold text-coffee">
          {formatIDR(lineTotal)}
        </p>
      </div>

      <AddToCartButton
        slug={slug}
        productName={productName}
        variant={selected}
        qty={qty}
        soldOut={soldOut}
      />
    </div>
  );
}
