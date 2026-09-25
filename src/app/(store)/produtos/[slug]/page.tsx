import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductGallery } from "./product-gallery";
import { ProductPurchase } from "./product-purchase";

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

          {product.description && (
            <p className="text-[15px] leading-relaxed text-[#6E6255]">{product.description}</p>
          )}

          <ProductPurchase variants={product.variants} />
        </div>
      </div>
    </div>
  );
}
