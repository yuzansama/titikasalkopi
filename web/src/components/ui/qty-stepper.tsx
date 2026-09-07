"use client";

/**
 * Stepper kuantitas — tulis tangan, ADR-14 (nol dependensi UI).
 *
 * Nilai yang dikelola SELALU bilangan bulat jumlah satuan pesan. Untuk
 * houseblend satu langkah = 1 `halfKgUnits` = 0,5 kg; konversi ke kilogram
 * hanya terjadi di `formatValue` saat menampilkan (ADR-05, D-02).
 *
 * Aksesibilitas (NFR-05, NFR-07):
 * - `<button>` asli, target 44 x 44 px, jarak antar target 8 px.
 * - Tombol kurang `disabled` pada nilai minimum, bukan disembunyikan.
 * - Nilai diumumkan lewat `aria-live="polite"` saat berubah.
 * - Kolom angka adalah `<input type="text" inputMode="decimal">` supaya
 *   pengunjung bisa mengetik "1,5" langsung; nilainya dinormalkan saat blur.
 */

import { useId, useState } from "react";
import { FOCUS_RING } from "./styles";

const STEP_BUTTON =
  "grid h-11 w-11 shrink-0 place-items-center rounded-md border-2 border-primary " +
  "text-primary transition-colors hover:bg-primary hover:text-cream " +
  "disabled:border-olive disabled:text-olive disabled:hover:bg-transparent " +
  `disabled:hover:text-olive ${FOCUS_RING}`;

export function QtyStepper({
  value,
  min,
  step,
  max,
  onChange,
  label,
  formatValue,
  parseValue,
  hint,
}: {
  /** Bilangan bulat jumlah satuan pesan. */
  value: number;
  min: number;
  step: number;
  max: number;
  onChange: (next: number) => void;
  /** Nama yang terbaca pembaca layar, mis. "Jumlah Houseblend BOLD". */
  label: string;
  /** Nilai satuan pesan -> teks tampilan, mis. 3 -> "1,5 kg". */
  formatValue: (value: number) => string;
  /** Teks yang diketik -> nilai satuan pesan. Kembalikan null bila tidak sah. */
  parseValue: (raw: string) => number | null;
  hint?: string;
}) {
  const inputId = useId();
  const [draft, setDraft] = useState<string | null>(null);

  const clamp = (next: number) =>
    Math.max(min, Math.min(max, Math.round(next / step) * step || min));

  const commit = (raw: string) => {
    const parsed = parseValue(raw);
    setDraft(null);
    if (parsed === null) return;
    onChange(clamp(parsed));
  };

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block font-heading text-sm font-semibold uppercase tracking-wide text-primary"
      >
        {label}
      </label>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          className={STEP_BUTTON}
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
        >
          <span aria-hidden="true" className="text-xl leading-none">
            &minus;
          </span>
          <span className="sr-only">Kurangi jumlah</span>
        </button>

        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          className={`h-11 w-24 rounded-md border-2 border-primary bg-surface px-3 text-center text-[1rem] font-semibold text-primary ${FOCUS_RING}`}
          value={draft ?? formatValue(value)}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={(event) => commit(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit(event.currentTarget.value);
            }
          }}
        />

        <button
          type="button"
          className={STEP_BUTTON}
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
        >
          <span aria-hidden="true" className="text-xl leading-none">
            +
          </span>
          <span className="sr-only">Tambah jumlah</span>
        </button>
      </div>

      <p className="sr-only" aria-live="polite">
        {label}: {formatValue(value)}
      </p>
      {hint ? <p className="mt-2 text-sm text-olive">{hint}</p> : null}
    </div>
  );
}
