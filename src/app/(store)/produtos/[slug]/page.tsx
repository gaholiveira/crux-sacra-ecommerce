import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AddToCartButton } from "./add-to-cart-button";
import { ProductGallery } from "./product-gallery";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { variants: true },
  });

  if (!product) {
    notFound();
  }

  const variant = product.variants[0];
  const hasPromo = Boolean(
    variant?.compareAtPriceCents && variant.compareAtPriceCents > variant.priceCents,
  );
  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

  return (
    <div className="px-6 py-6 md:px-16 md:py-8">
      <div className="mb-6 text-sm text-[#6E6255]">
        <Link href="/" className="text-[#5A4738] hover:underline">
          Início
        </Link>{" "}
        / <span className="text-[#3A312B]">{product.name}</span>
      </div>

      <div className="flex flex-col gap-8 md:flex-row md:gap-14">
        <ProductGallery images={product.imageUrls} alt={product.name} />

        <div className="flex max-w-xl flex-1 flex-col gap-5">
          <h1 className="text-[28px] leading-tight font-bold">{product.name}</h1>

          {variant && (
            <div className="flex flex-wrap items-center gap-3">
              {hasPromo && variant.compareAtPriceCents && (
                <span className="text-base text-[#6E6255] line-through">
                  {formatCurrency(variant.compareAtPriceCents)}
                </span>
              )}
              <span className="text-2xl font-semibold text-[#5A4738]">
                {formatCurrency(variant.priceCents)}
              </span>
              {hasPromo && variant.compareAtPriceCents && (
                <span className="rounded-full bg-[#5A4738] px-2.5 py-1 text-xs font-semibold text-white">
                  -
                  {Math.round(
                    (1 - variant.priceCents / variant.compareAtPriceCents) * 100,
                  )}
                  %
                </span>
              )}
            </div>
          )}

          {product.description && (
            <p className="text-[15px] leading-relaxed text-[#6E6255]">{product.description}</p>
          )}

        <AddToCartButton
          variantId={variant?.id ?? ""}
          disabled={!variant || variant.stock === 0}
          label={variant && variant.stock > 0 ? "Adicionar ao carrinho" : "Fora de estoque"}
        />
      </div>
    </div>
  </div>
  );
}
