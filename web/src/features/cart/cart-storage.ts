/**
 * Persistensi keranjang di `localStorage` (Bagian 6.2, ADR-04, FR-20).
 *
 * Yang dipersistensikan HANYA `{ slug, variantId, qty }` beserta catatan dan
 * stempel waktu — bukan harga dan bukan nama produk. Harga di-resolve ulang
 * dari katalog build-time setiap kali keranjang dirender, sehingga harga yang
 * tampil selalu harga terbaru walau keranjang sudah tersimpan enam hari
 * (NFR-12).
 *
 * Seluruh fungsi di berkas ini TIDAK PERNAH melempar. Setiap keadaan tidak
 * normal berakhir pada keranjang kosong, bukan pada halaman rusak.
 */

import {
  MAX_LINES,
  MAX_NOTE_LENGTH,
  MAX_QTY_PER_LINE,
} from "./cart-reducer";
import type { CartItem, CartState } from "./cart-types";

/**
 * Kunci membawa nomor versi. Kalau bentuk data harus berubah tidak kompatibel,
 * NAIKKAN nomor di kunci (`tak.cart.v2`). Kunci lama ditinggalkan begitu saja —
 * tidak ada yang perlu diselamatkan dari keranjang berumur maksimal 7 hari.
 */
const STORAGE_KEY = "tak.cart.v1";
const SCHEMA_VERSION = 1 as const;

/** FR-20: bertahan 7 hari, lalu dikosongkan otomatis. */
export const CART_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type PersistedCart = {
  v: typeof SCHEMA_VERSION;
  items: CartItem[];
  note: string;
  updatedAt: number;
};

export type StoredCart = Omit<CartState, "hydrated">;

const EMPTY: StoredCart = { items: [], note: "", updatedAt: 0 };

function isValidItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.slug === "string" &&
    item.slug.length > 0 &&
    item.slug.length < 80 &&
    typeof item.variantId === "string" &&
    item.variantId.length > 0 &&
    item.variantId.length < 80 &&
    typeof item.qty === "number" &&
    Number.isInteger(item.qty) &&
    item.qty >= 1 &&
    item.qty <= MAX_QTY_PER_LINE
  );
}

/**
 * Inti pembacaan, dipisahkan dari `localStorage` supaya bisa diuji tanpa DOM
 * (`node scripts/check-cart.mjs`). Mengembalikan keranjang kosong pada SETIAP
 * kondisi tidak normal: JSON rusak, versi tidak dikenal, bentuk tidak sesuai,
 * atau sudah lewat 7 hari.
 */
export function parseStoredCart(raw: string | null, now: number): StoredCart {
  if (!raw) return EMPTY;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return EMPTY;
  }

  if (typeof parsed !== "object" || parsed === null) return EMPTY;
  const data = parsed as Partial<PersistedCart>;

  // Versi tidak dikenal (lebih tua ATAU lebih baru, mis. pengunjung membuka
  // deploy lama setelah deploy baru). Buang; tidak ada yang berharga di sini.
  if (data.v !== SCHEMA_VERSION) return EMPTY;

  if (typeof data.updatedAt !== "number" || now - data.updatedAt > CART_TTL_MS) {
    return EMPTY; // FR-20: kedaluwarsa 7 hari
  }

  const items = Array.isArray(data.items)
    ? data.items.filter(isValidItem).slice(0, MAX_LINES)
    : [];
  const note =
    typeof data.note === "string" ? data.note.slice(0, MAX_NOTE_LENGTH) : "";

  return { items, note, updatedAt: data.updatedAt };
}

/** Membaca keranjang dari `localStorage`. Aman dipanggil di peramban mana pun. */
export function readCart(now: number = Date.now()): StoredCart {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY; // storage diblokir (Safari private) — keranjang jalan di memori
  }

  const parsed = parseStoredCart(raw, now);
  // Data rusak atau kedaluwarsa dibuang supaya tidak menghantui sesi berikutnya.
  if (raw && parsed.updatedAt === 0) clearCart();
  return parsed;
}

export function writeCart(state: StoredCart): void {
  const payload: PersistedCart = {
    v: SCHEMA_VERSION,
    items: state.items,
    note: state.note,
    updatedAt: state.updatedAt || Date.now(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // QuotaExceeded atau storage diblokir. Diabaikan dengan sengaja:
    // keranjang tetap bekerja di memori untuk sesi berjalan.
  }
}

export function clearCart(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* diabaikan dengan sengaja */
  }
}

export const CART_STORAGE_KEY = STORAGE_KEY;
export const CART_SCHEMA_VERSION = SCHEMA_VERSION;
