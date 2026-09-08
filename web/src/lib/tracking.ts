/**
 * Pelacakan pesanan (FR-51).
 *
 * Website tidak punya basis data. Sumber kebenaran status pesanan adalah buku
 * order yang memang sudah dipelihara owner — sekarang berbentuk Google Sheet —
 * dan Apps Script menyajikannya sebagai JSON read-only. Berkas ini hanya
 * lapisan tipis di depannya: validasi masukan, kosakata status yang tetap, dan
 * satu pemanggilan `fetch` yang tidak pernah menggantung.
 *
 * Kenapa bukan basis data sungguhan. Volume Fase 1 puluhan order per bulan dan
 * adminnya satu orang. Apa pun yang menuntut owner membuka dashboard kedua akan
 * berakhir tidak diperbarui, dan halaman lacak yang menampilkan status basi
 * lebih buruk daripada tidak punya halaman lacak sama sekali. Sheet sudah ada
 * di ponselnya.
 *
 * ponytail: satu berkas, bukan folder seperti `lib/whatsapp/`. Pecah kalau
 * benar-benar tumbuh.
 *
 * BATAS KEPERCAYAAN. Endpoint TIDAK BOLEH mengembalikan nama, nomor telepon,
 * atau alamat pembeli. Pembatasan itu ditegakkan di `ops/order-tracker.gs`,
 * karena di sanalah data pribadi sebenarnya berada.
 */

import { ORDER_CODE_PATTERN } from "./whatsapp/order-code";

/* ------------------------------------------------------------------ */
/* Kosakata status                                                     */
/* ------------------------------------------------------------------ */

/**
 * Kosakata TERTUTUP. Owner mengetik slug ini di kolom `status` pada sheet.
 *
 * Sengaja tertutup: kalau owner salah ketik, halaman menyatakan statusnya tidak
 * dikenali alih-alih menebak. Menebak berarti menampilkan status yang salah
 * kepada orang yang sudah mengirim uang.
 */
export const ORDER_STATUSES = {
  "menunggu-konfirmasi": {
    label: "Menunggu konfirmasi",
    detail: "Pesanan Anda sudah masuk dan sedang kami periksa.",
    final: false,
  },
  "menunggu-pembayaran": {
    label: "Menunggu pembayaran",
    detail: "Total akhir sudah dikirim lewat WhatsApp dan menunggu transfer.",
    final: false,
  },
  diproses: {
    label: "Sedang disiapkan",
    detail: "Kopi Anda sedang digiling dan dikemas.",
    final: false,
  },
  dikirim: {
    label: "Dalam pengiriman",
    detail: "Paket sudah diserahkan ke kurir.",
    final: false,
  },
  selesai: {
    label: "Selesai",
    detail: "Paket sudah sampai. Terima kasih.",
    final: true,
  },
  batal: {
    label: "Dibatalkan",
    detail: "Pesanan ini dibatalkan. Hubungi kami lewat WhatsApp bila keliru.",
    final: true,
  },
} as const;

export type OrderStatusSlug = keyof typeof ORDER_STATUSES;

export function isOrderStatusSlug(value: string): value is OrderStatusSlug {
  return Object.prototype.hasOwnProperty.call(ORDER_STATUSES, value);
}

/* ------------------------------------------------------------------ */
/* Validasi masukan                                                    */
/* ------------------------------------------------------------------ */

/** Empat digit terakhir nomor WhatsApp pemesan. */
export const LAST4_PATTERN = /^\d{4}$/;

/**
 * Normalisasi kode order sebelum divalidasi.
 *
 * Pembeli menyalinnya dari chat WhatsApp sendiri, jadi ia datang dengan huruf
 * kecil, spasi di ujung, atau tanpa awalan "TAK-". Ketiganya dibetulkan di sini
 * supaya kesalahan salin tidak berubah menjadi "pesanan tidak ditemukan" yang
 * menyesatkan.
 */
export function normalizeOrderCode(raw: string): string {
  const trimmed = raw.trim().toUpperCase().replace(/\s+/g, "");
  return trimmed.startsWith("TAK-") ? trimmed : `TAK-${trimmed}`;
}

export type InputProblem = "kode-kosong" | "kode-salah" | "last4-salah";

/**
 * Gerbang sebelum jaringan. Menolak di sini berarti pembeli dapat jawaban
 * seketika, dan endpoint tidak dipakai sebagai pemeriksa ejaan.
 */
export function validateLookupInput(
  rawCode: string,
  rawLast4: string,
):
  | { ok: true; code: string; last4: string }
  | { ok: false; problem: InputProblem } {
  if (rawCode.trim().length === 0) return { ok: false, problem: "kode-kosong" };

  const code = normalizeOrderCode(rawCode);
  if (!ORDER_CODE_PATTERN.test(code)) return { ok: false, problem: "kode-salah" };

  const last4 = rawLast4.trim();
  if (!LAST4_PATTERN.test(last4)) return { ok: false, problem: "last4-salah" };

  return { ok: true, code, last4 };
}

export const INPUT_PROBLEM_MESSAGES: Record<InputProblem, string> = {
  "kode-kosong": "Masukkan kode order lebih dulu.",
  "kode-salah":
    "Kode order tidak sesuai bentuk TAK-YYMMDD-XXXX. Salin ulang dari pesan WhatsApp yang Anda kirim.",
  "last4-salah":
    "Masukkan tepat 4 digit terakhir nomor WhatsApp yang Anda pakai memesan.",
};

/* ------------------------------------------------------------------ */
/* Bentuk jawaban                                                      */
/* ------------------------------------------------------------------ */

export type TrackedOrder = {
  code: string;
  status: OrderStatusSlug;
  /** Tanggal status terakhir diubah owner, format YYYY-MM-DD. */
  statusUpdatedAt: string | null;
  orderedAt: string | null;
  courier: string | null;
  trackingNumber: string | null;
  /** Ringkasan item, teks bebas dari sheet. Bukan data pribadi. */
  items: string | null;
};

export type LookupResult =
  | { kind: "found"; order: TrackedOrder }
  | { kind: "not-found" }
  | { kind: "unknown-status"; raw: string }
  | { kind: "not-configured" }
  | { kind: "error"; reason: "jaringan" | "waktu-habis" | "jawaban-rusak" };

const asText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Mengubah JSON mentah endpoint menjadi bentuk yang dipercaya UI.
 *
 * Dipisah dari `fetch` supaya bisa diuji tanpa jaringan, dan karena inilah
 * satu-satunya tempat data dari luar repositori masuk ke situs. Apa pun yang
 * tidak dikenali menjadi `jawaban-rusak`, bukan dipaksa masuk.
 */
export function parseLookupResponse(payload: unknown): LookupResult {
  if (typeof payload !== "object" || payload === null) {
    return { kind: "error", reason: "jawaban-rusak" };
  }
  const data = payload as Record<string, unknown>;

  if (data.found !== true) return { kind: "not-found" };

  const code = asText(data.code);
  const status = asText(data.status);
  if (!code || !status) return { kind: "error", reason: "jawaban-rusak" };

  const slug = status.toLowerCase();
  if (!isOrderStatusSlug(slug)) return { kind: "unknown-status", raw: status };

  return {
    kind: "found",
    order: {
      code,
      status: slug,
      statusUpdatedAt: asText(data.statusUpdatedAt),
      orderedAt: asText(data.orderedAt),
      courier: asText(data.courier),
      trackingNumber: asText(data.trackingNumber),
      items: asText(data.items),
    },
  };
}

/* ------------------------------------------------------------------ */
/* Kebasian                                                            */
/* ------------------------------------------------------------------ */

/**
 * Ambang "status belum diperbarui". Bukan kegagalan sistem, melainkan
 * pengakuan: satu admin bisa lupa menyentuh sheet, dan halaman yang menampilkan
 * "Sedang disiapkan" selama dua minggu berbohong tanpa niat. Menyebut tanggalnya
 * membuat pembeli menilai sendiri, bukan mempercayai label.
 */
export const STALE_AFTER_DAYS = 5;

export function isStale(order: TrackedOrder, now: Date = new Date()): boolean {
  if (ORDER_STATUSES[order.status].final) return false;
  if (!order.statusUpdatedAt) return true;

  // WIB, sama seperti `lib/reply-hours.ts`: tanggal di sheet ditulis owner
  // dalam waktu lokalnya, bukan UTC.
  const updated = Date.parse(`${order.statusUpdatedAt}T00:00:00+07:00`);
  if (Number.isNaN(updated)) return true;

  return now.getTime() - updated > STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

/* ------------------------------------------------------------------ */
/* Pemanggilan                                                         */
/* ------------------------------------------------------------------ */

export const TRACKING_ENDPOINT: string =
  process.env.NEXT_PUBLIC_TRACKING_ENDPOINT ?? "";

export function isTrackingConfigured(): boolean {
  return TRACKING_ENDPOINT.length > 0;
}

/** Jaringan seluler Indonesia bisa lambat; menggantung selamanya bukan pilihan. */
export const LOOKUP_TIMEOUT_MS = 12_000;

export async function lookupOrder(
  code: string,
  last4: string,
  endpoint: string = TRACKING_ENDPOINT,
): Promise<LookupResult> {
  if (endpoint.length === 0) return { kind: "not-configured" };

  const url =
    `${endpoint}?code=${encodeURIComponent(code)}` +
    `&last4=${encodeURIComponent(last4)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      // Status berubah; jawaban lama tidak boleh dipakai ulang peramban.
      cache: "no-store",
    });
    if (!response.ok) return { kind: "error", reason: "jaringan" };
    return parseLookupResponse(await response.json());
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    return { kind: "error", reason: aborted ? "waktu-habis" : "jaringan" };
  } finally {
    clearTimeout(timer);
  }
}
