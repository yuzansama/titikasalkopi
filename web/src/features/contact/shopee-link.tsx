"use client";

/**
 * Tautan ke toko Shopee dengan event `click_shopee` (FR-25).
 *
 * Tetap `<a target="_blank" rel="noopener noreferrer">` (Bagian 12.2); event
 * dikirim sebelum navigasi dan tanpa `await` (Bagian 13.1 aturan 1).
 */

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ShopeeIcon } from "@/components/icons/icons";
import { buttonClass, type ButtonVariant } from "@/components/ui/styles";
import { trackShopeeClick } from "@/lib/analytics";
import { shopee } from "@/lib/site";

export function ShopeeLink({
  productId,
  variant = "outline",
  className = "",
  children,
}: {
  productId?: string;
  variant?: ButtonVariant;
  className?: string;
  children?: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <a
      href={shopee.url}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClass(variant, "md", className)}
      onClick={() => trackShopeeClick({ productId, sourcePage: pathname })}
    >
      <ShopeeIcon />
      {children ?? "Beli lewat Shopee"}
    </a>
  );
}
