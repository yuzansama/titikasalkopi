"use client";

/**
 * Tabel rasio yang SEL HARGANYA dapat dipilih (FR-28, FR-29).
 *
 * Sejak 9 September 2026 setiap rasio dijual dalam dua ukuran kemasan, 1 kg dan
 * 0,5 kg, masing-masing dengan harganya sendiri. Tabel ini karena itu tidak lagi
 * memilih BARIS melainkan SEL: satu baris adalah satu rasio, dan dua sel
 * harganya adalah dua pilihan kemasan.
 *
 * Bentuk itu dipilih karena ia menyatukan dua hal yang sebelumnya terpisah —
 * angka yang dibandingkan pembeli dan tombol yang ia tekan. Selama tabel hanya
 * memilih baris, harga di sel kanan adalah informasi yang tidak bisa dibeli
 * langsung, dan justru dari jarak itulah cacat harga kemarin lahir.
 *
 * Aksesibilitas (Bagian 11.5): setiap sel berisi `<input type="radio">` asli
 * yang disembunyikan secara visual di dalam `<label>` selebar selnya, sehingga
 * seluruh tabel tetap satu grup pilihan yang dapat dinavigasi tombol panah.
 * Tidak ada `<td onClick>`. Setiap label membawa teks layar-pembaca yang
 * menyebut rasio dan ukuran kemasannya, karena "Rp215.000" saja tidak memberi
 * tahu apa yang sedang dipilih.
 *
 * Layar sempit (NFR-05): tabel dibungkus `overflow-x-auto` dan tepi gesernya
 * ditandai garis gold — gold sah di sini karena bukan teks (Bagian 11.4).
 */

import { useId } from "react";
import { formatIDR } from "@/lib/format";
import type { VariantOption } from "./variant-option";

export type RatioRow = {
  id: string;
  /** Nama rasio tanpa ukuran, mis. "60% Arabica : 40% Robusta". */
  label: string;
  kg: VariantOption;
  halfKg: VariantOption;
  /** Penghematan memilih kemasan 1 kg, sudah dihitung Server Component. */
  kgSavingLabel?: string;
};

export function RatioTable({
  rows,
  selectedId,
  onSelect,
  caption,
}: {
  rows: readonly RatioRow[];
  selectedId: string;
  onSelect: (variantId: string) => void;
  caption: string;
}) {
  const name = useId();

  const cell = (
    row: RatioRow,
    variant: VariantOption,
    sizeLabel: string,
    note?: string,
  ) => {
    const checked = variant.id === selectedId;
    return (
      <td className="p-0 align-middle">
        <label
          className={[
            "flex min-h-11 w-full cursor-pointer flex-col items-end justify-center px-3 py-2 text-right",
            "has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-rust",
            checked
              ? "bg-primary font-semibold text-cream"
              : "text-coffee hover:bg-primary/10",
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
          <span className="whitespace-nowrap">{formatIDR(variant.unitPrice)}</span>
          {note ? (
            <span
              className={`text-xs font-semibold ${
                checked ? "text-cream" : "text-rust"
              }`}
            >
              {note}
            </span>
          ) : null}
          <span className="sr-only">
            {row.label}, kemasan {sizeLabel}
          </span>
        </label>
      </td>
    );
  };

  return (
    <div className="overflow-x-auto rounded-lg border-l-2 border-gold">
      <table className="w-full min-w-[22rem] border-collapse text-left">
        <caption className="px-3 py-2 text-left text-sm text-olive">
          {caption}
        </caption>
        <thead>
          <tr className="border-b border-primary/20">
            <th scope="col" className="px-3 py-2 text-sm font-semibold text-primary">
              Rasio
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-right text-sm font-semibold text-primary"
            >
              Kemasan 1 kg
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-right text-sm font-semibold text-primary"
            >
              Kemasan 0,5 kg
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-primary/10 last:border-0">
              <th
                scope="row"
                className="px-3 py-2 font-normal text-primary"
              >
                {row.label}
              </th>
              {cell(row, row.kg, "1 kg", row.kgSavingLabel)}
              {cell(row, row.halfKg, "0,5 kg")}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
