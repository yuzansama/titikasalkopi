"use client";

/**
 * Tombol "Pesan via WhatsApp" pada halaman keranjang (FR-22, FR-24, Bagian 7.5).
 *
 * Tiga aturan yang tidak boleh dilanggar:
 * 1. Kode order dibuat DI SINI, satu klik satu kode, tidak disimpan ke
 *    `localStorage` (Bagian 1.5).
 * 2. Event GA4 dikirim SEBELUM `window.open` dan tanpa `await` — setelah
 *    WhatsApp mengambil fokus, halaman bisa dibekukan peramban dan event yang
 *    tertunda hilang (Bagian 13.1 aturan 1).
 * 3. Tombol terkunci 2 detik setelah diklik. Alasannya bukan keamanan
 *    melainkan kualitas data: ketukan ganda di layar sentuh menghasilkan DUA
 *    kode order dan DUA event `click_whatsapp_order` untuk satu pesanan, yang
 *    langsung merusak KPI G-01 dan G-03 (Bagian 12.3). Sejak pencatatan
 *    otomatis ada (KD-06), kunci ini juga yang menahan DUA baris masuk ke buku
 *    order untuk satu pesanan.
 * 4. Pencatatan ke buku order dikirim sekali jalan, tanpa `await`, dan
 *    kegagalannya diabaikan. Pesanan lebih penting daripada pembukuannya:
 *    kalau endpoint mati, WhatsApp tetap harus terbuka persis seperti sebelum
 *    fitur ini ada.
 */

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { WhatsAppIcon } from "@/components/icons/icons";
import { buttonClass } from "@/components/ui/styles";
import { trackWhatsAppOrder } from "@/lib/analytics";
import { site } from "@/lib/site";
import { buildOrderRecord, recordOrder, summarizeForRecord } from "@/lib/tracking";
import { buildOrderMessage } from "@/lib/whatsapp/message";
import { createOrderCode } from "@/lib/whatsapp/order-code";
import { sanitizeNote } from "@/lib/whatsapp/sanitize";
import type { ResolvedCartLine } from "@/data/types";

export function WhatsAppOrderButton({
  lines,
  subtotal,
  itemCount,
  note,
  noteLimit,
  last4 = "",
  disabled = false,
}: {
  lines: readonly ResolvedCartLine[];
  subtotal: number;
  itemCount: number;
  note: string;
  noteLimit: number;
  /** 4 digit terakhir nomor WhatsApp pembeli; boleh kosong (KD-06). */
  last4?: string;
  disabled?: boolean;
}) {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const handleClick = () => {
    if (busy || disabled || lines.length === 0) return;
    setBusy(true);
    timer.current = window.setTimeout(() => setBusy(false), 2000);

    const orderCode = createOrderCode();
    const message = buildOrderMessage({
      orderCode,
      lines,
      subtotal,
      note: sanitizeNote(note, noteLimit),
      sourceUrl: `${site.url}${pathname}`,
    });

    trackWhatsAppOrder({
      orderCode,
      cartValue: subtotal,
      cartItems: itemCount,
      sourcePage: pathname,
    });

    // Sebelum `window.open`, dengan alasan yang sama seperti event GA4: begitu
    // WhatsApp mengambil fokus, halaman bisa dibekukan peramban.
    const record = buildOrderRecord(
      orderCode,
      last4,
      summarizeForRecord(lines, subtotal),
    );
    if (record) recordOrder(record);

    window.open(message.url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || busy || lines.length === 0}
      className={buttonClass("primary", "lg", "w-full")}
    >
      <WhatsAppIcon />
      Pesan via WhatsApp
    </button>
  );
}
