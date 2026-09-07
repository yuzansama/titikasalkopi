"use client";

/**
 * Status jam balas WhatsApp (D-03, FR-36, ADR-08).
 *
 * HTML hasil build SELALU memuat kalimat janji netral. Penanda "di luar jam
 * balas" hanya ditambahkan setelah hydration, sehingga render pertama klien
 * identik dengan HTML server dan halaman tetap statis serta cacheable
 * (ADR-01, Bagian 6.4).
 *
 * Dipasang di tiga tempat sesuai D-03: halaman Kontak, blok checkout keranjang,
 * dan footer.
 */

import { useEffect, useState } from "react";
import {
  isWithinReplyHours,
  OUTSIDE_REPLY_HOURS_MESSAGE,
  REPLY_HOURS_LABEL,
} from "@/lib/reply-hours";

export function ReplyHoursStatus({
  tone = "light",
  className = "",
}: {
  /** "light" = di atas cream; "dark" = di atas blok hijau/cokelat. */
  tone?: "light" | "dark";
  className?: string;
}) {
  // null = belum hydrated. Render pertama klien identik dengan HTML statis.
  const [within, setWithin] = useState<boolean | null>(null);

  useEffect(() => {
    const update = () => setWithin(isWithinReplyHours());
    update();
    // Satu pemeriksaan per menit sudah cukup, dan membuat penanda berubah
    // sendiri bila halaman dibiarkan terbuka melewati pukul 21.00 WIB.
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const promiseClass = tone === "dark" ? "text-cream" : "text-olive";
  // Cream di coffee = 7,04:1 (lulus). Gold DILARANG di sini karena label ini
  // berukuran teks normal (Bagian 11.4).
  const noticeClass =
    tone === "dark"
      ? "bg-base text-primary"
      : "bg-coffee text-cream";

  return (
    <div className={className}>
      <p className={`text-[0.95rem] ${promiseClass}`}>
        Kami membalas {REPLY_HOURS_LABEL}.
      </p>
      <p aria-live="polite">
        {within === false ? (
          <span
            className={`mt-2 block rounded-md px-3 py-2 text-[0.95rem] ${noticeClass}`}
          >
            {OUTSIDE_REPLY_HOURS_MESSAGE}
          </span>
        ) : null}
      </p>
    </div>
  );
}
