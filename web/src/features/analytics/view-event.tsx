"use client";

/**
 * Pemicu event tayang halaman: `view_item_list` dan `view_item` (FR-47, G-03).
 *
 * Kedua event ini menuntut sisi klien (GA4 hanya hidup di peramban) sementara
 * halamannya wajib tetap Server Component. Komponen ini adalah satu-satunya
 * jembatannya: ia tidak merender apa pun, hanya mengirim satu event setelah
 * mount. Props-nya sudah berupa nilai primitif yang di-resolve Server
 * Component, jadi tidak ada `@/data/*` yang ikut ke bundel klien.
 *
 * Penambahan dari daftar ADR-10 — dicatat di docs/04-frontend.md.
 */

import { useEffect } from "react";
import { trackViewItem, trackViewItemList } from "@/lib/analytics";

type ViewEventProps =
  | { kind: "list"; listName: string }
  | {
      kind: "item";
      productId: string;
      itemCategory: string;
      itemVariant: string;
    };

export function ViewEvent(props: ViewEventProps) {
  const key =
    props.kind === "list"
      ? `list:${props.listName}`
      : `item:${props.productId}:${props.itemVariant}`;

  useEffect(() => {
    if (props.kind === "list") {
      trackViewItemList(props.listName);
      return;
    }
    trackViewItem({
      productId: props.productId,
      itemCategory: props.itemCategory,
      itemVariant: props.itemVariant,
    });
    // `key` merangkum seluruh props; efek berjalan sekali per halaman.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return null;
}
