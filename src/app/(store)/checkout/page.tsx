import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { getcurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { createOrder } from "./actions";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await getcurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: {
      items: { include: { variant: { include: { product: true } } } },
    },
  });

  if (!cart || cart.items.length === 0) {
    redirect("/carrinho");
  }

  // Simplificação por enquanto: usa o endereço mais recente do usuário, sem
  // deixar escolher entre vários. Se não tiver nenhum, manda cadastrar um.
  const address = await prisma.address.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (!address) {
    redirect("/enderecos/novo");
  }

  const totalCents = cart.items.reduce(
    (sum, item) => sum + item.quantity * item.variant.priceCents,
    0,
  );

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

  // Gerado uma vez por carregamento da página — o mesmo valor viaja em toda
  // tentativa de clique no botão "Confirmar pedido" desse carregamento.
  const idempotencyKey = randomUUID();

  return (
    <div className="px-6 py-8 md:px-16 md:py-12">
      <h1 className="text-2xl font-bold">Finalizar compra</h1>

      <div className="mt-8 flex flex-col gap-10 md:flex-row">
        <div className="flex flex-1 flex-col gap-4">
          <h2 className="text-lg font-semibold">Itens</h2>
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-[#D8CDBC] bg-white p-4"
            >
              <div>
                <p className="text-sm font-medium">{item.variant.product.name}</p>
                <p className="text-xs text-[#6E6255]">
                  {item.variant.name} · Qtd: {item.quantity}
                </p>
              </div>
              <span className="text-sm font-semibold text-[#5A4738]">
                {formatCurrency(item.quantity * item.variant.priceCents)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex w-full flex-col gap-4 md:w-80 md:shrink-0">
          <div className="rounded-xl border border-[#D8CDBC] bg-white p-5">
            <h2 className="text-sm font-semibold">Endereço de entrega</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6E6255]">
              {address.recipient}
              <br />
              {address.street}, {address.number}
              {address.complement ? ` — ${address.complement}` : ""}
              <br />
              {address.district}, {address.city} - {address.state}
              <br />
              CEP {address.postalCode}
            </p>
          </div>

          <div className="rounded-xl border border-[#D8CDBC] bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-bold text-[#5A4738]">
                {formatCurrency(totalCents)}
              </span>
            </div>
          </div>

          <form action={createOrder.bind(null, idempotencyKey, address.id)}>
            <button
              type="submit"
              className="w-full rounded-lg bg-[#5A4738] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4A3A2D]"
            >
              Confirmar pedido
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
