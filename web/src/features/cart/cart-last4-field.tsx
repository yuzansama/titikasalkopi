"use client";

/**
 * 4 digit terakhir nomor WhatsApp pembeli (KD-06).
 *
 * OPSIONAL, dan itu keputusan sadar. Kolom wajib di titik paling menentukan —
 * satu ketukan sebelum tombol pesan — adalah tempat paling mahal untuk
 * kehilangan pembeli. Bila dikosongkan, pesanannya tetap tercatat di buku
 * order; yang tertunda hanya kemampuan melacak sendiri, sampai owner mengisi
 * digitnya dari chat.
 *
 * Tidak disimpan ke `localStorage`. Ia hanya hidup selama halaman terbuka, dan
 * hanya dikirim bersama satu pesanan yang benar-benar di-checkout. Menyimpan
 * potongan nomor telepon pengunjung di perangkatnya, untuk kenyamanan sebesar
 * empat ketukan, bukan pertukaran yang layak.
 */

import { useId } from "react";
import { FOCUS_RING } from "@/components/ui/styles";

export function CartLast4Field({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="block font-medium text-primary">
        4 digit terakhir nomor WhatsApp Anda{" "}
        <span className="font-normal text-olive">(opsional)</span>
      </label>
      <p id={`${id}-hint`} className="mt-1 text-sm text-olive">
        Diisi supaya Anda bisa melacak sendiri pesanan ini di halaman Lacak
        pesanan. Kami tidak menyimpan nomor lengkap Anda.
      </p>
      <input
        id={id}
        name="last4"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        aria-describedby={`${id}-hint`}
        value={value}
        onChange={(event) =>
          onChange(event.target.value.replace(/\D/g, "").slice(0, 4))
        }
        placeholder="9567"
        className={`mt-2 w-full rounded-md border-2 border-primary bg-surface px-3 py-2 font-mono text-primary placeholder:text-olive/60 ${FOCUS_RING}`}
      />
    </div>
  );
}
