import type { CartCatalogEntry } from "@/data/types";

/**
 * Bentuk varian yang boleh diterima Client Component sebagai props.
 * Sengaja sama persis dengan entri `cartCatalogIndex` supaya panel pembelian
 * dan keranjang bicara tentang bentuk yang sama (Bagian 5.4).
 */
export type VariantOption = CartCatalogEntry["variants"][number];
