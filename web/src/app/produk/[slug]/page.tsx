import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { findSingleOriginBySlug, singleOriginProducts } from "@/data/catalog";
import { ProductDetail } from "@/features/catalog/product-detail";
import {
  breadcrumbJsonLd,
  buildProductMetadata,
  productBreadcrumbTrail,
  productJsonLd,
} from "@/lib/seo";

/* ADR-01: rute wajib statis. `error` membuat pemakaian API dinamis
   menggagalkan build, bukan diam-diam mengubah rute jadi dinamis. */
export const dynamic = "error";
/* Slug di luar daftar menghasilkan 404 statis, bukan render on-demand. */
export const dynamicParams = false;

export function generateStaticParams(): Array<{ slug: string }> {
  return singleOriginProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/produk/[slug]">): Promise<Metadata> {
  const { slug } = await params; // Next 16: params adalah Promise
  const product = findSingleOriginBySlug(slug);
  return product ? buildProductMetadata(product) : {};
}

export default async function ProductPage({
  params,
}: PageProps<"/produk/[slug]">) {
  const { slug } = await params;
  const product = findSingleOriginBySlug(slug);
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
