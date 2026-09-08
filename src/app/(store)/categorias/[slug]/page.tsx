import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) { 
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: { 
      products: { include: { variants: true} },
    },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="px-6 py-8 md:px-16 md:py-12">
      <h1 className="text-2xl font-bold">{category.name}</h1>
      <p className="mt-1 mb-6 text-sm text-[#6E6255] md:mb-8">
        {category.products.length} produto(s) nessa categoria.
      </p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
        {category.products.map((product) => (
          <Link
            key={product.id}
            href={`/produtos/${product.slug}`}
            className="flex flex-col overflow-hidden rounded-2xl border border-[#D8CDBC] bg-white"
          >
            <div className="flex h-[140px] items-center justify-center bg-[#F0E6D4] md:h-[200px]">
              {product.imageUrl && (
                <Image
                  src={product.imageUrl}
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
                <span className="text-[15px] font-semibold text-[#5A4738]">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(product.variants[0].priceCents / 100)}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}