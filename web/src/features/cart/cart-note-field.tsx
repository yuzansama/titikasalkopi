"use client";

/**
 * Catatan bebas pembeli, maksimal 200 karakter (FR-23).
 *
 * Batas ditegakkan di TIGA tempat sekaligus (Bagian 12.1): `maxLength` di sini,
 * `SET_NOTE` pada reducer, dan `sanitizeNote()` pada generator pesan. Yang
 * pertama bisa dilewati, yang ketiga adalah gerbang terakhir sebelum teks
 * meninggalkan situs.
 */

import { useId } from "react";
import { FOCUS_RING } from "@/components/ui/styles";
import { MAX_NOTE_LENGTH } from "./cart-reducer";
import { useCartDispatch } from "./cart-provider";

export function CartNoteField({ note }: { note: string }) {
  const dispatch = useCartDispatch();
  const id = useId();
  const remaining = MAX_NOTE_LENGTH - note.length;

  return (
    <div>
      <label htmlFor={id} className="block font-medium text-primary">
        Catatan untuk penjual
      </label>
      <p id={`${id}-hint`} className="mt-1 text-sm text-olive">
        Misalnya tingkat gilingan, kota tujuan, atau kebutuhan hadiah. Maksimal{" "}
        {MAX_NOTE_LENGTH} karakter.
      </p>
      <textarea
        id={id}
        aria-describedby={`${id}-hint`}
        rows={3}
        maxLength={MAX_NOTE_LENGTH}
        value={note}
        onChange={(event) =>
          dispatch({ type: "SET_NOTE", note: event.target.value })
        }
        className={`mt-2 w-full rounded-md border-2 border-primary bg-surface px-3 py-2 text-primary ${FOCUS_RING}`}
      />
      <p className="mt-1 text-sm text-olive" aria-live="polite">
        Sisa {remaining} karakter.
      </p>
    </div>
  );
}
