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
import { formatIDR, formatQuantity } from "@/lib/format";
import { trackSelectVariant } from "@/lib/analytics";
import { AddToCartButton } from "./add-to-cart-button";
import { KgConfigurator } from "./kg-configurator";
import { RatioTable } from "./ratio-table";
import { VariantPicker } from "./variant-picker";
import type { VariantOption } from "./variant-option";

/** Jumlah awal houseblend = 1 kg = 2 satuan 0,5 kg (FR-21). */
const DEFAULT_HALF_KG_UNITS = 2;
const MAX_QTY = 99;

export function PurchasePanel({
  slug,
  productName,
  variants,
  useRatioTable,
  variantNotes,
}: {
  slug: string;
  productName: string;
  variants: readonly VariantOption[];
  /** true untuk lini BOLD: enam rasio lebih terbaca sebagai tabel (FR-28, FR-29). */
  useRatioTable: boolean;
  /** Keterangan per varian dari Server Component, mis. penghematan 3 pack. */
  variantNotes?: Readonly<Record<string, string>>;
}) {
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const selected = useMemo(
    () => variants.find((variant) => variant.id === variantId) ?? variants[0],
    [variants, variantId],
  );

  const isHalfKg = selected?.unit === "half-kg";
  const [qty, setQty] = useState(isHalfKg ? DEFAULT_HALF_KG_UNITS : 1);

  if (!selected) return null;

  const handleSelect = (nextId: string) => {
    setVariantId(nextId);
    const next = variants.find((variant) => variant.id === nextId);
    trackSelectVariant({ productId: slug, variant: next?.label ?? nextId });
  };

  const lineTotal = qty * selected.unitPrice;

  return (
    <div className="space-y-6">
      {variants.length > 1 ? (
        useRatioTable ? (
          <RatioTable
            variants={variants}
            selectedId={selected.id}
            onSelect={handleSelect}
            caption="Pilih rasio, lalu atur jumlahnya di bawah tabel."
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

      {isHalfKg ? (
        <KgConfigurator
          halfKgUnits={qty}
          onChange={setQty}
          min={selected.minQty}
          step={selected.step}
          max={MAX_QTY}
          productName={productName}
        />
      ) : (
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
          hint={
            selected.unit === "paket"
              ? "Satu paket berisi tiga kemasan 200 gr dari origin yang sama."
              : "Satu pack berisi 200 gr."
          }
        />
      )}

      {/* SATU pernyataan harga.
          Sebelumnya blok ini mengulang harga satuan yang sudah tertulis pada
          tombol varian, lalu menuliskan total di bawahnya — harga yang sama
          tampil tiga kali dalam satu layar. Yang tersisa sekarang: APA yang
          dibeli (jumlah + satuan, tanpa angka rupiah) dan BERAPA totalnya.
          Label varian hanya diulang untuk houseblend, karena di sana label itu
          menyebut rasio/lini — informasi yang tidak terkandung dalam jumlah.
          Harga satuan muncul di sini HANYA saat jumlahnya lebih dari satu, yaitu
          saat total tidak lagi sama dengan harga satuan: di situ ia menjelaskan
          perkalian, bukan mengulanginya. Houseblend tidak memakainya karena
          harga satuannya (per 0,5 kg) bukan satuan harga resmi — harga per kg
          sudah tertulis pada tombol varian/tabel rasio (BR-01). */}
      <div className="rounded-md bg-base px-4 py-3" aria-live="polite">
        <p className="text-sm text-olive">
          Total {formatQuantity(qty, selected.unit)}
          {isHalfKg ? ` · ${selected.label}` : ""}
          {!isHalfKg && qty > 1 ? ` × ${formatIDR(selected.unitPrice)}` : ""}
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
      />
    </div>
  );
}
