"use client";

/**
 * "Tanya produk ini" pada halaman detail (FR-38).
 *
 * Berupa `<a>` asli — bukan `<button>` — supaya tetap bisa dibuka di tab baru
 * lewat menu konteks dan tetap berfungsi tanpa JavaScript. Event GA4 dikirim
 * pada `onClick` SEBELUM navigasi (Bagian 13.1 aturan 1); bila JavaScript
 * mati, tautannya tetap benar dan hanya eventnya yang hilang.
 */

import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "@/components/icons/icons";
import { buttonClass } from "@/components/ui/styles";
import { trackWhatsAppAsk } from "@/lib/analytics";
import { site } from "@/lib/site";
import { buildAskMessage } from "@/lib/whatsapp/message";
import type { OrderUnit } from "@/data/types";

export function AskAboutProductButton({
  productId,
  productName,
  categoryLabel,
  variantLabel,
  unit,
  unitPrice,
  pricePerKg,
  path,
}: {
  productId: string;
  productName: string;
  categoryLabel: string;
  variantLabel: string;
  unit: OrderUnit;
  unitPrice: number;
  pricePerKg?: number;
  /** Path kanonis produk, mis. "/produk/abmisibil". */
  path: string;
}) {
  const pathname = usePathname();
  const message = buildAskMessage({
    productName,
    categoryLabel,
    variantLabel,
    unit,
    unitPrice,
    pricePerKg,
    sourceUrl: `${site.url}${path}`,
  });

  return (
    <a
      href={message.url}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClass("outline", "md", "w-full sm:w-auto")}
      onClick={() =>
        trackWhatsAppAsk({
          productId,
          variant: variantLabel,
          sourcePage: pathname,
        })
      }
    >
      <WhatsAppIcon />
      Tanya produk ini
    </a>
  );
}
