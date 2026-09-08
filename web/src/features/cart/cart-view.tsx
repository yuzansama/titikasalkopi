"use client";

/**
 * Isi halaman keranjang (FR-17…FR-26).
 *
 * Harga TIDAK PERNAH dibaca dari `localStorage`: baris tersimpan hanya membawa
 * `{ slug, variantId, qty }` dan di-resolve ulang di sini dari `index` — indeks
 * katalog build-time yang dikirim Server Component `/keranjang` sebagai props
 * (ADR-04, NFR-12). Itulah sebabnya harga di keranjang selalu harga terbaru
 * walau keranjang sudah tersimpan enam hari.
 *
 * Sebelum hydration komponen ini merender kerangka "memuat" yang identik
 * dengan HTML server, bukan keranjang kosong — supaya pengunjung tidak sempat
 * melihat pesan "keranjang kosong" yang salah (Bagian 6.4).
 */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { QtyStepper } from "@/components/ui/qty-stepper";
import { buttonClass, CARD, FOCUS_RING } from "@/components/ui/styles";
import { formatIDR, formatKgFromHalfUnits, formatPricePerKg } from "@/lib/format";
import { trackViewCart } from "@/lib/analytics";
import { parseKgToHalfUnits } from "@/features/catalog/kg-configurator";
import { ReplyHoursStatus } from "@/features/contact/reply-hours-status";
import { ShopeeLink } from "@/features/contact/shopee-link";
import { WhatsAppOrderButton } from "@/features/whatsapp/whatsapp-order-button";
import type { ReactNode } from "react";
import { useCart, useCartDispatch } from "./cart-provider";
import { MAX_NOTE_LENGTH, MAX_QTY_PER_LINE } from "./cart-reducer";
import { CartLast4Field } from "./cart-last4-field";
import { CartNoteField } from "./cart-note-field";
import { resolveCart } from "./cart-selectors";
import type { CartCatalogIndex, ResolvedCartLine } from "./cart-types";

export function CartView({
  index,
  orderSteps,
  shippingNote,
}: {
  index: CartCatalogIndex;
  /** `<OrderSteps />` dikirim sebagai children dari Server Component supaya
      isinya tidak ikut ke bundel klien (Bagian 9.4). */
  orderSteps: ReactNode;
  /** `<ShippingEstimateNote />`, dikirim dengan alasan yang sama: angkanya
      konstanta build-time, jadi tidak ada alasan ia menjadi JavaScript. */
  shippingNote: ReactNode;
}) {
  const { items, note, hydrated } = useCart();
  const dispatch = useCartDispatch();
  // Sengaja state lokal, bukan bagian keranjang tersimpan (KD-06). Lihat
  // catatan di `cart-last4-field.tsx`.
  const [last4, setLast4] = useState("");
  const cart = useMemo(
    () => resolveCart(items, note, index),
    [items, note, index],
  );

  const viewSent = useRef(false);
  useEffect(() => {
    if (!hydrated || viewSent.current) return;
    viewSent.current = true;
    trackViewCart({ cartValue: cart.subtotal, cartItems: cart.itemCount });
  }, [hydrated, cart.subtotal, cart.itemCount]);

  if (!hydrated) {
    return (
      <div className="py-10">
        <p className="text-olive" aria-live="polite">
          Memuat keranjang…
        </p>
        {/* DEF-12. Kerangka "memuat" inilah satu-satunya isi keranjang yang
            benar-benar ada di HTML hasil build, karena sisa komponen ini
            menunggu hydration. Selama janji jam balas hanya dipasang di
            <aside> ringkasan, HTML statis /keranjang memuatnya lewat footer
            saja — bukan di tempat yang diminta BR-19/FR-26. */}
        <ReplyHoursStatus className="mt-6" />
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="py-10">
        {cart.droppedCount > 0 ? <DroppedNotice count={cart.droppedCount} /> : null}
        <h2 className="font-display text-2xl font-semibold text-primary">
          Keranjang masih kosong
        </h2>
        <p className="mt-2 max-w-prose text-olive">
          Pilih single origin dalam kemasan 200 gr atau houseblend per kilogram,
          lalu kembali ke halaman ini untuk memesan lewat WhatsApp.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/katalog" className={buttonClass("primary", "lg")}>
            Lihat katalog
          </Link>
          <Link href="/houseblend" className={buttonClass("outline", "lg")}>
            Houseblend per kg
          </Link>
        </div>
        {/* DEF-12. Keranjang kosong bukan alasan menyembunyikan janji balas:
            pengunjung yang ragu memesan justru sering berada di layar ini. */}
        <ReplyHoursStatus className="mt-8" />
      </div>
    );
  }

  return (
    <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div>
        {cart.droppedCount > 0 ? <DroppedNotice count={cart.droppedCount} /> : null}

        <h2 className="sr-only">Isi keranjang</h2>
        <ul className="space-y-4">
          {cart.lines.map((line) => (
            <li key={`${line.slug}::${line.variantId}`} className={`${CARD} p-4`}>
              <CartLineRow
                line={line}
                onQty={(qty) =>
                  dispatch({
                    type: "SET_QTY",
                    slug: line.slug,
                    variantId: line.variantId,
                    qty,
                  })
                }
                onRemove={() =>
                  dispatch({
                    type: "REMOVE_ITEM",
                    slug: line.slug,
                    variantId: line.variantId,
                  })
                }
              />
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <CartNoteField note={cart.note} />
        </div>

        <div className="mt-8">{orderSteps}</div>
      </div>

      <aside className={`h-fit ${CARD} p-5 lg:sticky lg:top-6`}>
        <h2 className="font-display text-xl font-semibold text-primary">
          Ringkasan pesanan
        </h2>
        <dl className="mt-4 space-y-2" aria-live="polite">
          <div className="flex justify-between gap-4">
            <dt className="text-olive">Jumlah item</dt>
            <dd className="font-medium text-primary">{cart.itemCount}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-olive">Subtotal</dt>
            <dd className="font-display text-xl font-semibold text-coffee">
              {formatIDR(cart.subtotal)}
            </dd>
          </div>
        </dl>
        {/* Titik ragu-ragu terbesar: pembeli berhenti di sini karena tidak
            tahu totalnya. Kalimat lama hanya memperingatkan bahwa ongkir
            belum termasuk; sekarang ia membawa perkiraannya sekalian. */}
        <div className="mt-3">{shippingNote}</div>

        <div className="mt-5">
          <CartLast4Field value={last4} onChange={setLast4} />
        </div>

        <div className="mt-5">
          <WhatsAppOrderButton
            lines={cart.lines}
            subtotal={cart.subtotal}
            itemCount={cart.itemCount}
            note={cart.note}
            noteLimit={MAX_NOTE_LENGTH}
            last4={last4}
          />
        </div>

        <div className="mt-3">
          <ShopeeLink className="w-full">Alternatif: Shopee</ShopeeLink>
        </div>

        <ReplyHoursStatus className="mt-5" />

        <button
          type="button"
          onClick={() => dispatch({ type: "CLEAR" })}
          className={`mt-5 min-h-11 rounded-md text-sm text-olive underline underline-offset-4 hover:text-rust ${FOCUS_RING}`}
        >
          Kosongkan keranjang
        </button>
      </aside>
    </div>
  );
}

function DroppedNotice({ count }: { count: number }) {
  return (
    <p
      role="status"
      className="mb-6 rounded-md bg-coffee px-4 py-3 text-[0.95rem] text-cream"
    >
      {count} item tidak lagi tersedia dan sudah dikeluarkan dari keranjang.
    </p>
  );
}

function CartLineRow({
  line,
  onQty,
  onRemove,
}: {
  line: ResolvedCartLine;
  onQty: (qty: number) => void;
  onRemove: () => void;
}) {
  const isHalfKg = line.unit === "half-kg";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.15em] text-rust">
          {line.categoryLabel}
        </p>
        <h3 className="mt-1 font-display text-lg font-semibold text-primary">
          <Link href={line.href} className={`rounded-sm hover:text-rust ${FOCUS_RING}`}>
            {line.productName}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-olive">
          {line.variantLabel} &middot;{" "}
          {line.pricePerKg
            ? formatPricePerKg(line.pricePerKg)
            : formatIDR(line.unitPrice)}
        </p>

        <div className="mt-4">
          <QtyStepper
            value={line.qty}
            min={1}
            step={1}
            max={MAX_QTY_PER_LINE}
            onChange={onQty}
            label={`Jumlah ${line.productName}, ${line.variantLabel}`}
            formatValue={(value) =>
              isHalfKg ? formatKgFromHalfUnits(value) : String(value)
            }
            parseValue={(raw) => {
              if (isHalfKg) return parseKgToHalfUnits(raw);
              const parsed = Number.parseInt(raw.replace(/\D/g, ""), 10);
              return Number.isFinite(parsed) ? parsed : null;
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <p className="font-display text-lg font-semibold text-coffee">
          {formatIDR(line.lineTotal)}
        </p>
        <button
          type="button"
          onClick={onRemove}
          className={`min-h-11 rounded-md px-2 text-sm text-olive underline underline-offset-4 hover:text-rust ${FOCUS_RING}`}
        >
          Hapus
          <span className="sr-only">
            {" "}
            {line.productName}, {line.variantLabel}
          </span>
        </button>
      </div>
    </div>
  );
}
