"use client";

/**
 * Tabel rasio yang barisnya dapat dipilih (FR-28, FR-29).
 *
 * Aksesibilitas (Bagian 11.5): setiap baris berisi `<input type="radio">` asli
 * yang disembunyikan secara visual di dalam `<label>` selebar sel pertama.
 * Dengan begitu tabel tetap terbaca sebagai tabel data, sekaligus dapat
 * dinavigasi dengan tombol panah dan diumumkan sebagai grup pilihan. Tidak ada
 * baris `<tr onClick>`.
 *
 * Layar sempit (NFR-05): tabel dibungkus `overflow-x-auto` dan tepi gesernya
 * ditandai garis gold — gold sah di sini karena bukan teks (Bagian 11.4).
 */

import { useId } from "react";
import { formatIDR, formatPricePerKg } from "@/lib/format";
import type { VariantOption } from "./variant-option";

export function RatioTable({
  variants,
  selectedId,
  onSelect,
  caption,
}: {
  variants: readonly VariantOption[];
  selectedId: string;
  onSelect: (variantId: string) => void;
  caption: string;
}) {
  const name = useId();

  return (
    <div className="overflow-x-auto rounded-lg border-l-2 border-gold">
      <table className="w-full min-w-[20rem] border-collapse text-left">
        <caption className="px-3 py-2 text-left text-sm text-olive">
          {caption}
        </caption>
        <thead>
          <tr className="border-b border-primary/20">
            <th scope="col" className="px-3 py-2 text-sm font-semibold text-primary">
              Varian
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-right text-sm font-semibold text-primary"
            >
              Per kg
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-right text-sm font-semibold text-primary"
            >
              Per 0,5 kg
            </th>
          </tr>
        </thead>
        <tbody>
          {variants.map((variant) => {
            const checked = variant.id === selectedId;
            return (
              <tr
                key={variant.id}
                className={
                  checked
                    ? "bg-primary/10"
                    : "border-b border-primary/10 last:border-0"
                }
              >
                <th scope="row" className="p-0 font-normal">
                  <label
                    className={[
                      "flex min-h-11 w-full cursor-pointer items-center px-3 py-2",
                      "has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-rust",
                      checked ? "font-semibold text-primary" : "text-primary",
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
                    <span>{variant.label}</span>
                  </label>
                </th>
                <td className="whitespace-nowrap px-3 py-2 text-right text-coffee">
                  {variant.pricePerKg ? formatPricePerKg(variant.pricePerKg) : "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-olive">
                  {formatIDR(variant.unitPrice)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
