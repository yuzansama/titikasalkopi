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
import { formatIDR, unitLabel } from "@/lib/format";
import type { VariantOption } from "./variant-option";

export function VariantPicker({
  variants,
  selectedId,
  onSelect,
  legend,
  notes,
}: {
  variants: readonly VariantOption[];
  selectedId: string;
  onSelect: (variantId: string) => void;
  legend: string;
  /**
   * Keterangan pendek per varian, mis. penghematan paket 3 pack. Dirakit di
   * Server Component (BR-10 dihitung `bundleSaving()`); komponen ini hanya
   * menampilkan, tidak pernah menghitung uang.
   */
  notes?: Readonly<Record<string, string>>;
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
              {/* Varian TERPILIH tidak mengulang harga satuannya: harganya sudah
                  dinyatakan sekali sebagai total di bawah, dan pengulangan di
                  titik keputusan terbaca sebagai ragu, bukan jelas. Varian yang
                  belum dipilih tetap menampilkan harga — di situlah pembeli
                  membandingkan.
                  Tidak ada lagi pengecualian houseblend di sini. Dulu varian
                  houseblend menampilkan tarif per kg yang bukan angka yang
                  ditagih; sekarang setiap varian punya tepat satu harga, yaitu
                  harga satu kemasan. */}
              {checked ? null : (
                <span className="text-sm text-olive">
                  {formatIDR(variant.unitPrice)} {unitLabel(variant.unit)}
                </span>
              )}
              {notes?.[variant.id] ? (
                <span
                  className={`mt-0.5 text-sm font-semibold ${
                    checked ? "text-cream" : "text-coffee"
                  }`}
                >
                  {notes[variant.id]}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
