import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getcurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { removeCartItem, incrementCartItem, decrementCartItem } from "./actions";

export const dynamic = "force-dynamic";

export default async function CarrinhoPage() {
  const user = await getcurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          variant: { include: { product: true } },
        },
      },
    },
  });

  const items = cart?.items ?? [];
  const totalCents = items.reduce(
    (sum, item) => sum + item.quantity * item.variant.priceCents,
    0,
  );

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

  return (
    <div className="px-6 py-8 md:px-16 md:py-12">
      <h1 className="text-2xl font-bold">Carrinho</h1>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-[#6E6255]">Seu carrinho está vazio.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-[#D8CDBC] bg-white p-4"
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F0E6D4]">
                {item.variant.product.imageUrl && (
                  <Image
                    src={item.variant.product.imageUrl}
                    alt={item.variant.product.name}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="min-w-[140px] flex-1">
                <p className="text-sm font-medium">{item.variant.product.name}</p>
                <p className="text-xs text-[#6E6255]">{item.variant.name}</p>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-[#D8CDBC]">
                <form action={decrementCartItem.bind(null, item.id)}>
                  <button
                    type="submit"
                    className="flex h-8 w-8 items-center justify-center text-base text-[#3A312B]"
                  >
                    −
                  </button>
                </form>
                <span className="w-4 text-center text-sm">{item.quantity}</span>
                <form action={incrementCartItem.bind(null, item.id)}>
                  <button
                    type="submit"
                    className="flex h-8 w-8 items-center justify-center text-base text-[#3A312B]"
                  >
                    +
                  </button>
                </form>
              </div>

              <span className="text-right text-sm font-semibold text-[#5A4738] sm:w-24">
                {formatCurrency(item.quantity * item.variant.priceCents)}
              </span>

              <form action={removeCartItem.bind(null, item.id)}>
                <button type="submit" className="text-sm text-[#6E6255] underline hover:text-red-700">
                  Remover
                </button>
              </form>
            </div>
          ))}

          <div className="mt-4 flex items-center justify-between border-t border-[#D8CDBC] pt-4">
            <span className="text-base font-semibold">Total</span>
            <span className="text-lg font-bold text-[#5A4738]">{formatCurrency(totalCents)}</span>
          </div>

          <Link
            href="/checkout"
            className="mt-4 w-full rounded-lg bg-[#5A4738] px-6 py-3 text-center text-sm font-semibold text-white hover:bg-[#4A3A2D] sm:w-fit sm:self-end"
          >
            Finalizar compra
          </Link>
        </div>
      )}
    </div>
  );
}