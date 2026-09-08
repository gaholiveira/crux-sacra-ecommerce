import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { addToCart } from "./actions";

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

  return (
    <div className="px-6 py-6 md:px-16 md:py-8">
      <div className="mb-6 text-sm text-[#6E6255]">
        <Link href="/" className="text-[#5A4738] hover:underline">
          Início
        </Link>{" "}
        / <span className="text-[#3A312B]">{product.name}</span>
      </div>

      <div className="flex flex-col gap-8 md:flex-row md:gap-14">
        <div className="flex h-[280px] w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#F0E6D4] md:h-[520px] md:w-[520px]">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={520}
              height={520}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>

        <div className="flex max-w-xl flex-1 flex-col gap-5">
          <h1 className="text-[28px] leading-tight font-bold">{product.name}</h1>

          {variant && (
            <span className="text-2xl font-semibold text-[#5A4738]">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(variant.priceCents / 100)}
            </span>
          )}

          {product.description && (
            <p className="text-[15px] leading-relaxed text-[#6E6255]">{product.description}</p>
          )}

        <form action={addToCart.bind(null, variant?.id ?? "")}>
          <button
            className="mt-2 rounded-lg bg-[#5A4738] px-6 py-3 text-[15px] font-semibold text-white hover:bg-[#4A3A2D] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!variant || variant.stock === 0}
          >
            {variant && variant.stock > 0 ? "Adicionar ao carrinho" : "Fora de estoque"}
          </button>
        </form>
      </div>
    </div>
  </div>
  );
}
