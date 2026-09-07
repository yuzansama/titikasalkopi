/**
 * Reducer keranjang — murni, tanpa `localStorage`, tanpa DOM (Bagian 6.1).
 * Dapat diuji langsung: `node scripts/check-cart.mjs`.
 *
 * State sengaja sekecil mungkin: tiga medan data plus satu penanda hydration.
 * Segala yang bisa dihitung — subtotal, jumlah item, label, harga — dihitung
 * saat render dan TIDAK PERNAH disimpan (ADR-04).
 */

import type { CartItem, CartState } from "./cart-types";

/** FR-23. Ditegakkan juga oleh `maxLength` input dan `sanitizeNote()`. */
export const MAX_NOTE_LENGTH = 200;
/** Pagar kewarasan; 99 satuan pesan = 49,5 kg houseblend. */
export const MAX_QTY_PER_LINE = 99;
/** Pagar kewarasan; keranjang ritel tidak pernah sepanjang ini. */
export const MAX_LINES = 30;

export const EMPTY_CART: CartState = {
  items: [],
  note: "",
  updatedAt: 0,
  hydrated: false,
};

export type CartAction =
  /** Dikirim sekali setelah localStorage dibaca. Satu-satunya cara `hydrated` jadi true. */
  | { type: "HYDRATE"; payload: Omit<CartState, "hydrated"> }
  /** qty adalah jumlah satuan pesan; untuk houseblend = halfKgUnits (ADR-05). */
  | { type: "ADD_ITEM"; slug: string; variantId: string; qty: number }
  | { type: "SET_QTY"; slug: string; variantId: string; qty: number }
  | { type: "REMOVE_ITEM"; slug: string; variantId: string }
  | { type: "SET_NOTE"; note: string }
  | { type: "CLEAR" }
  /** Membuang baris yang produk/variannya tidak ada lagi di katalog (ADR-04). */
  | { type: "PRUNE"; validKeys: ReadonlySet<string> };

/** Kunci baris keranjang. Satu-satunya bentuk yang dipakai di seluruh fitur. */
export const lineKey = (slug: string, variantId: string): string =>
  `${slug}::${variantId}`;

/** Kuantitas selalu bilangan bulat 1..99. NaN dan pecahan dijepit (ADR-05). */
const clampQty = (n: number): number =>
  Math.max(1, Math.min(MAX_QTY_PER_LINE, Math.trunc(n) || 1));

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { ...action.payload, hydrated: true };

    case "ADD_ITEM": {
      const qty = clampQty(action.qty);
      const idx = state.items.findIndex(
        (item) => item.slug === action.slug && item.variantId === action.variantId,
      );
      // FR-16: varian yang sama menambah jumlah pada baris yang ada,
      // bukan membuat baris baru.
      if (idx >= 0) {
        const items = state.items.slice();
        items[idx] = { ...items[idx], qty: clampQty(items[idx].qty + qty) };
        return { ...state, items, updatedAt: Date.now() };
      }
      if (state.items.length >= MAX_LINES) return state;
      const item: CartItem = {
        slug: action.slug,
        variantId: action.variantId,
        qty,
      };
      return { ...state, items: [...state.items, item], updatedAt: Date.now() };
    }

    case "SET_QTY": {
      // qty <= 0 berarti hapus baris (FR-18).
      if (action.qty <= 0) {
        return cartReducer(state, {
          type: "REMOVE_ITEM",
          slug: action.slug,
          variantId: action.variantId,
        });
      }
      const items = state.items.map((item) =>
        item.slug === action.slug && item.variantId === action.variantId
          ? { ...item, qty: clampQty(action.qty) }
          : item,
      );
      return { ...state, items, updatedAt: Date.now() };
    }

    case "REMOVE_ITEM": {
      const items = state.items.filter(
        (item) =>
          !(item.slug === action.slug && item.variantId === action.variantId),
      );
      return { ...state, items, updatedAt: Date.now() };
    }

    case "SET_NOTE":
      return {
        ...state,
        note: action.note.slice(0, MAX_NOTE_LENGTH),
        updatedAt: Date.now(),
      };

    case "CLEAR":
      return { ...EMPTY_CART, hydrated: true, updatedAt: Date.now() };

    case "PRUNE": {
      const items = state.items.filter((item) =>
        action.validKeys.has(lineKey(item.slug, item.variantId)),
      );
      if (items.length === state.items.length) return state;
      return { ...state, items, updatedAt: Date.now() };
    }

    default:
      return state;
  }
}
