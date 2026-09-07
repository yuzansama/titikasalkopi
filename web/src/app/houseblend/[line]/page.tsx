import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findHouseblendLineBySlug, houseblendLines } from "@/data/catalog";
import { ProductDetail } from "@/features/catalog/product-detail";
import {
  breadcrumbJsonLd,
  buildProductMetadata,
  productBreadcrumbTrail,
  productJsonLd,
} from "@/lib/seo";

/* ADR-01 */
export const dynamic = "error";
export const dynamicParams = false;

export function generateStaticParams(): Array<{ line: string }> {
  return houseblendLines.map((line) => ({ line: line.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/houseblend/[line]">): Promise<Metadata> {
  const { line } = await params;
  const product = findHouseblendLineBySlug(line);
  return product ? buildProductMetadata(product) : {};
}

export default async function HouseblendLinePage({
  params,
}: PageProps<"/houseblend/[line]">) {
  const { line } = await params;
  const product = findHouseblendLineBySlug(line);
  if (!product) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: productJsonLd(product) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: breadcrumbJsonLd(productBreadcrumbTrail(product)),
        }}
      />
      <ProductDetail product={product} />
    </>
  );
}
