import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const products = await prisma.product.findMany({
    include: { variants: true },
  });

  return (
    <div className="px-6 py-8 md:px-16 md:py-12">
      <h1 className="text-2xl font-bold">Produtos</h1>
      <p className="mt-1 mb-6 text-sm text-[#6E6255] md:mb-8">{products.length} produto(s).</p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/produtos/${product.slug}`}
            className="flex flex-col overflow-hidden rounded-2xl border border-[#D8CDBC] bg-white"
          >
            <div className="flex h-[140px] items-center justify-center bg-[#F0E6D4] md:h-[200px]">
              {product.imageUrls[0] && (
                <Image
                  src={product.imageUrls[0]}
                  alt={product.name}
                  width={200}
                  height={200}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="flex flex-col gap-1.5 p-4">
              <span className="text-[15px] font-medium">{product.name}</span>
              {product.variants[0] && (
                <div className="flex items-baseline gap-2">
                  {product.variants[0].compareAtPriceCents &&
                    product.variants[0].compareAtPriceCents > product.variants[0].priceCents && (
                      <span className="text-xs text-[#6E6255] line-through">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(product.variants[0].compareAtPriceCents / 100)}
                      </span>
                    )}
                  <span className="text-[15px] font-semibold text-[#5A4738]">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(product.variants[0].priceCents / 100)}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
