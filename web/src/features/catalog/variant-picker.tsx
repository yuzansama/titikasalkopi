"use client";

/**
 * Pemilih varian dengan harga reaktif (FR-11).
 *
 * Diimplementasikan sebagai `<input type="radio">` asli yang disembunyikan
 * secara visual di dalam `<label>`: dengan begitu ia otomatis dapat difokus,
 * dapat dipindah dengan tombol panah, dan terbaca pembaca layar sebagai satu
 * grup pilihan (Bagian 11.5). Tidak ada `<div onClick>`.
 *
 * D-01: paket 3 pack berisi tiga kemasan dari origin yang SAMA. Komponen ini
 * tidak menyediakan — dan tidak boleh menyediakan — pemilih origin campur.
 */

import { useId } from "react";
import { formatIDR, formatPricePerKg, unitLabel } from "@/lib/format";
import type { VariantOption } from "./variant-option";

export function VariantPicker({
  variants,
  selectedId,
  onSelect,
  legend,
}: {
  variants: readonly VariantOption[];
  selectedId: string;
  onSelect: (variantId: string) => void;
  legend: string;
}) {
  const name = useId();

  return (
    <fieldset>
      <legend className="font-heading text-sm font-semibold uppercase tracking-wide text-primary">
        {legend}
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {variants.map((variant) => {
          const checked = variant.id === selectedId;
          return (
            <label
              key={variant.id}
              className={[
                "flex min-h-11 cursor-pointer flex-col justify-center rounded-md border-2 px-4 py-2",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-rust",
                checked
                  ? "border-primary bg-primary text-cream"
                  : "border-primary/30 bg-surface text-primary hover:border-primary",
              ].join(" ")}
            >
              <input
                type="radio"
                name={name}
                value={variant.id}
                checked={checked}
                onChange={() => onSelect(variant.id)}
                className="sr-only"
              />
              <span className="text-[0.95rem] font-medium">{variant.label}</span>
              <span
                className={`text-sm ${checked ? "text-cream" : "text-olive"}`}
              >
                {variant.pricePerKg
                  ? formatPricePerKg(variant.pricePerKg)
                  : `${formatIDR(variant.unitPrice)} ${unitLabel(variant.unit)}`}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
