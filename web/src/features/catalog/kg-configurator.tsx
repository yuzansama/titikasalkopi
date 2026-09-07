"use client";

/**
 * Konfigurator 0,5 kg untuk houseblend (FR-21, D-02, Bagian 6.6).
 *
 * Nilai yang dikelola adalah `halfKgUnits` — bilangan bulat jumlah satuan
 * 0,5 kg. 1 berarti 0,5 kg, 2 berarti 1 kg, 5 berarti 2,5 kg. Konversi ke
 * kilogram HANYA terjadi saat menampilkan; tidak ada aritmetika pecahan pada
 * uang di mana pun (ADR-05).
 *
 * Perilaku yang ditetapkan FR-21: nilai awal 2 (= 1 kg), tombol kurang
 * nonaktif pada 1 (= 0,5 kg), satu ketukan mengubah 0,5 kg. Kolom angka
 * menerima "0,5", "1", "1,5" dan dibulatkan ke kelipatan 0,5 kg terdekat.
 */

import { QtyStepper } from "@/components/ui/qty-stepper";
import { formatKgFromHalfUnits } from "@/lib/format";

/** "1,5" atau "1.5" -> 3 halfKgUnits. Kembalikan null bila bukan angka. */
export function parseKgToHalfUnits(raw: string): number | null {
  const cleaned = raw.replace(/kg/gi, "").replace(/,/g, ".").trim();
  if (cleaned === "") return null;
  const kg = Number(cleaned);
  if (!Number.isFinite(kg) || kg <= 0) return null;
  return Math.max(1, Math.round(kg * 2));
}

export function KgConfigurator({
  halfKgUnits,
  onChange,
  min,
  step,
  max,
  productName,
}: {
  halfKgUnits: number;
  onChange: (next: number) => void;
  min: number;
  step: number;
  max: number;
  productName: string;
}) {
  return (
    <QtyStepper
      value={halfKgUnits}
      min={min}
      step={step}
      max={max}
      onChange={onChange}
      label={`Jumlah ${productName}`}
      formatValue={formatKgFromHalfUnits}
      parseValue={parseKgToHalfUnits}
      hint="Pemesanan mulai 0,5 kg, kelipatan 0,5 kg."
    />
  );
}
