/**
 * Titik Asal Kopi — kontrak event GA4 (FR-47, ADR-12, Bagian 13.1).
 *
 * Pembungkus tipis di atas `window.dataLayer` / `gtag`. TIDAK ada SDK vendor,
 * tidak ada dependensi baru (ADR-14).
 *
 * Tiga sifat yang dijamin berkas ini:
 * 1. **No-op bila `NEXT_PUBLIC_GA_ID` kosong.** Preview dan pengembangan lokal
 *    tidak pernah mencemari data produksi.
 * 2. **Aman di server.** Setiap fungsi memeriksa `typeof window` lebih dulu,
 *    sehingga memanggilnya saat SSG tidak menggagalkan build.
 * 3. **Tidak pernah melempar.** Analitik tidak boleh merusak alur beli.
 *
 * Kontrak dengan FE (Bagian 8.3, titik singgung nomor 2): komponen TIDAK BOLEH
 * memanggil `gtag()` langsung. Semua lewat fungsi `track*` di bawah. Butuh event
 * baru? Minta ke BE, jangan tulis inline.
 *
 * Aturan pemasangan yang tidak boleh dilanggar (Bagian 13.1):
 * - Event klik dikirim SEBELUM navigasi, tanpa `await`.
 * - `source_page` selalu diisi `pathname`, bukan `document.referrer`.
 * - `click_whatsapp_order` ditandai sebagai konversi di antarmuka GA4
 *   (pekerjaan konfigurasi, bukan kode).
 */

/* ------------------------------------------------------------------ */
/* Konfigurasi                                                         */
/* ------------------------------------------------------------------ */

/** `G-XXXXXXXXXX`. Diisi hanya pada lingkungan Production (Bagian 14.1). */
export const GA_MEASUREMENT_ID: string = process.env.NEXT_PUBLIC_GA_ID ?? "";

/** Kunci localStorage untuk tautan "matikan analitik" (Bagian 12.5, NFR-16). */
export const ANALYTICS_OPTOUT_KEY = "tak.analytics.optout";

/**
 * Konfigurasi privasi yang mengikat (Bagian 12.5, NFR-16).
 * Dipakai `analytics-provider.tsx` saat memanggil `gtag("config", ...)`.
 */
export const GA_CONFIG_PARAMS = {
  anonymize_ip: true,
  allow_google_signals: false,
  allow_ad_personalization_signals: false,
  send_page_view: true,
} as const;

type GtagParams = Record<string, string | number | boolean | undefined>;

type GtagFn = (
  command: "config" | "event" | "js" | "set" | "consent",
  targetOrName: string | Date,
  params?: GtagParams,
) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFn;
  }
}

/** Analitik hanya hidup di peramban, hanya bila measurement ID tersedia. */
export function isAnalyticsConfigured(): boolean {
  return GA_MEASUREMENT_ID.length > 0;
}

/** Pengunjung menolak analitik lewat tautan di footer (Bagian 12.5). */
export function isAnalyticsOptedOut(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ANALYTICS_OPTOUT_KEY) === "1";
  } catch {
    // Mode privat sebagian peramban melempar saat mengakses localStorage.
    return false;
  }
}

/** Menyetel atau membatalkan penolakan analitik. */
export function setAnalyticsOptOut(optOut: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (optOut) {
      window.localStorage.setItem(ANALYTICS_OPTOUT_KEY, "1");
    } else {
      window.localStorage.removeItem(ANALYTICS_OPTOUT_KEY);
    }
  } catch {
    /* diam: analitik tidak boleh merusak alur beli */
  }
}

/** Boleh mengirim event sekarang? */
export function isAnalyticsEnabled(): boolean {
  return (
    typeof window !== "undefined" &&
    isAnalyticsConfigured() &&
    !isAnalyticsOptedOut()
  );
}

/**
 * Menyuntikkan `gtag.js` satu kali. Dipanggil `analytics-provider.tsx` milik FE
 * pada interaksi pertama pengunjung atau setelah jendela idle, mana yang lebih
 * dulu, dan tidak pernah sebelum event `load` (ADR-12).
 *
 * Aman dipanggil berkali-kali: pemanggilan kedua dan seterusnya tidak berbuat
 * apa-apa.
 */
export function loadGtag(): void {
  if (!isAnalyticsEnabled()) return;
  if (window.gtag) return;

  window.dataLayer = window.dataLayer ?? [];
  const gtag: GtagFn = function gtagShim(...args: unknown[]) {
    // GA4 mensyaratkan `arguments` mentah masuk ke dataLayer, bukan array biasa.
    window.dataLayer?.push(args);
  } as unknown as GtagFn;
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, { ...GA_CONFIG_PARAMS });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  document.head.appendChild(script);
}

/**
 * Satu-satunya jalan keluar ke GA4. Sengaja tidak diekspor: komponen memakai
 * fungsi `track*` bertipe di bawah supaya nama dan parameter event tidak pernah
 * bercabang (Bagian 13.1).
 */
function sendEvent(name: string, params: GtagParams): void {
  if (!isAnalyticsEnabled()) return;
  try {
    // Medan undefined dibuang supaya laporan GA4 tidak penuh parameter kosong.
    const clean: GtagParams = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) clean[key] = value;
    }
    if (window.gtag) {
      window.gtag("event", name, clean);
      return;
    }
    // gtag.js belum sempat dimuat: antrean dataLayer tetap menerima event.
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push(["event", name, clean]);
  } catch {
    /* diam: analitik tidak boleh merusak alur beli */
  }
}

/* ------------------------------------------------------------------ */
/* Sepuluh event yang wajib terpasang (Bagian 13.1)                    */
/* ------------------------------------------------------------------ */

/** `/katalog` saat halaman dibuka. Penyebut funnel G-03. */
export function trackViewItemList(itemListName: string): void {
  sendEvent("view_item_list", { item_list_name: itemListName });
}

/** `/produk/[slug]` dan `/houseblend/[line]`. KPI G-03. */
export function trackViewItem(input: {
  productId: string;
  itemCategory: string;
  itemVariant: string;
}): void {
  sendEvent("view_item", {
    product_id: input.productId,
    item_category: input.itemCategory,
    item_variant: input.itemVariant,
  });
}

/** `VariantPicker` dan `RatioTable`. KPI G-08. */
export function trackSelectVariant(input: {
  productId: string;
  variant: string;
}): void {
  sendEvent("select_variant", {
    product_id: input.productId,
    variant: input.variant,
  });
}

/** `AddToCartButton`. KPI G-08. `value` = qty * unitPrice, bilangan bulat. */
export function trackAddToCart(input: {
  productId: string;
  itemVariant: string;
  quantity: number;
  value: number;
}): void {
  sendEvent("add_to_cart", {
    product_id: input.productId,
    item_variant: input.itemVariant,
    quantity: input.quantity,
    value: input.value,
    currency: "IDR",
  });
}

/** `/keranjang` saat halaman dibuka. KPI G-03. */
export function trackViewCart(input: {
  cartValue: number;
  cartItems: number;
}): void {
  sendEvent("view_cart", {
    cart_value: input.cartValue,
    cart_items: input.cartItems,
    currency: "IDR",
  });
}

/**
 * Tombol pesan di keranjang. KPI G-01, G-03, G-04.
 * DITANDAI SEBAGAI KONVERSI di antarmuka GA4 (FR-47).
 * Kirim SEBELUM `window.open`, tanpa `await`.
 */
export function trackWhatsAppOrder(input: {
  orderCode: string;
  cartValue: number;
  cartItems: number;
  sourcePage: string;
}): void {
  sendEvent("click_whatsapp_order", {
    order_code: input.orderCode,
    cart_value: input.cartValue,
    cart_items: input.cartItems,
    source_page: input.sourcePage,
    currency: "IDR",
  });
}

/** "Tanya produk ini" (FR-38). KPI G-01, G-03. */
export function trackWhatsAppAsk(input: {
  productId: string;
  variant: string;
  sourcePage: string;
}): void {
  sendEvent("click_whatsapp_ask", {
    product_id: input.productId,
    variant: input.variant,
    source_page: input.sourcePage,
  });
}

/** CTA kedai / B2B (FR-30, Fase 1b). KPI G-01, G-07. */
export function trackWhatsAppB2B(input: {
  line: string;
  sourcePage: string;
}): void {
  sendEvent("click_whatsapp_b2b", {
    line: input.line,
    source_page: input.sourcePage,
  });
}

/** Tautan Shopee mana pun (FR-25). Pembanding kanal. */
export function trackShopeeClick(input: {
  productId?: string;
  sourcePage: string;
}): void {
  sendEvent("click_shopee", {
    product_id: input.productId,
    source_page: input.sourcePage,
  });
}

/** Penangkap galat global (Bagian 13.3). Selalu `fatal: false`. */
export function trackException(description: string): void {
  sendEvent("exception", {
    description: description.slice(0, 300),
    fatal: false,
  });
}
