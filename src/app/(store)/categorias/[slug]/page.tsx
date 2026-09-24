import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const WHATSAPP_MESSAGE = "Olá! Gostaria de fazer um pedido personalizado.";

// Categoria especial: não vende produtos com preço/estoque fixos (encomenda
// sob medida). Em vez da grade de produtos comum, mostra fotos de exemplo
// e um botão que abre uma conversa no WhatsApp.
async function CustomizationPage() {
  const examples = await prisma.customizationExample.findMany({
    orderBy: { createdAt: "desc" },
  });

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
    : null;

  return (
    <div className="px-6 py-8 md:px-16 md:py-12">
      <h1 className="text-2xl font-bold">Personalizado</h1>
      <p className="mt-1 max-w-xl text-sm text-[#6E6255]">
        Tem uma ideia em mente? Envie uma referência ou descreva o que você quer e a gente
        monta um orçamento sob medida, com o cuidado de sempre.
      </p>

      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-block rounded-lg bg-[#5A4738] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4A3A2D]"
        >
          Falar no WhatsApp
        </a>
      ) : (
        <p className="mt-5 text-sm text-[#6E6255] italic">
          Contato via WhatsApp em breve.
        </p>
      )}

      {examples.length > 0 && (
        <>
          <h2 className="mt-10 text-lg font-semibold">Alguns exemplos</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
            {examples.map((example) => (
              <div
                key={example.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-[#D8CDBC] bg-white"
              >
                <div className="flex h-[140px] items-center justify-center bg-[#F0E6D4] md:h-[200px]">
                  <Image
                    src={example.imageUrl}
                    alt={example.caption ?? "Exemplo de personalização"}
                    width={200}
                    height={200}
                    className="h-full w-full object-cover"
                  />
                </div>
                {example.caption && (
                  <p className="p-3 text-xs text-[#6E6255]">{example.caption}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      products: { include: { variants: true } },
    },
  });

  if (!category) {
    notFound();
  }

  if (category.slug === "personalizado") {
    return <CustomizationPage />;
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
