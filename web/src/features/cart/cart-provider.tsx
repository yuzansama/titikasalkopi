"use client";

/**
 * Provider keranjang (Bagian 6.3, ADR-04, ADR-10).
 *
 * Aturan anti hydration mismatch yang dipatuhi berkas ini (Bagian 6.4):
 * 1. `localStorage` TIDAK PERNAH dibaca saat render — hanya di dalam `useEffect`.
 * 2. Render pertama klien identik dengan HTML server: `EMPTY_CART`,
 *    `hydrated: false`.
 * 3. Komponen konsumen wajib menghormati `hydrated` sebelum menampilkan angka.
 * 4. Tidak ada `suppressHydrationWarning`.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { cartReducer, EMPTY_CART, lineKey, type CartAction } from "./cart-reducer";
import { CART_STORAGE_KEY, readCart, writeCart } from "./cart-storage";
import type { CartState } from "./cart-types";

const StateContext = createContext<CartState>(EMPTY_CART);
const DispatchContext = createContext<Dispatch<CartAction>>(() => {});

export function CartProvider({
  children,
  validKeys,
}: {
  children: ReactNode;
  /**
   * Daftar "slug::variantId" yang sah, diserialkan dari katalog build-time oleh
   * `layout.tsx` (Server Component). Inilah yang memungkinkan pruning tanpa
   * melanggar aturan "client tidak mengimpor @/data/*".
   */
  validKeys: readonly string[];
}) {
  const [state, dispatch] = useReducer(cartReducer, EMPTY_CART);

  const validKeySet = useMemo(() => new Set(validKeys), [validKeys]);

  // Berjalan SETELAH hydration selesai, jadi tidak mungkin menimbulkan mismatch.
  useEffect(() => {
    dispatch({ type: "HYDRATE", payload: readCart() });
    dispatch({ type: "PRUNE", validKeys: validKeySet });
  }, [validKeySet]);

  // Tulis balik setiap perubahan, tetapi TIDAK sebelum hydration — tanpa
  // penjaga ini render pertama akan menimpa keranjang tersimpan dengan kosong.
  useEffect(() => {
    if (!state.hydrated) return;
    writeCart({
      items: state.items,
      note: state.note,
      updatedAt: state.updatedAt,
    });
  }, [state.hydrated, state.items, state.note, state.updatedAt]);

  // Sinkronisasi antartab: dua tab terbuka tidak boleh saling menimpa.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== CART_STORAGE_KEY) return;
      dispatch({ type: "HYDRATE", payload: readCart() });
      dispatch({ type: "PRUNE", validKeys: validKeySet });
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [validKeySet]);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export const useCart = () => useContext(StateContext);
export const useCartDispatch = () => useContext(DispatchContext);
export { lineKey };
