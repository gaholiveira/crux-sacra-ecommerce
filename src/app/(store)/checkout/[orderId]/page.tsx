import { redirect, notFound } from "next/navigation";
import { getcurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { resolvePayerEmail } from "@/lib/mercadopago";
import { PaymentBrick } from "./payment-brick";

export const dynamic = "force-dynamic";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const user = await getcurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  const { orderId } = await params;

  // Mesmo princípio de sempre: filtra por dono na própria query, nunca
  // confia só no id que veio da URL.
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: { items: true, shippingAddress: true },
  });

  if (!order) {
    notFound();
  }

  // Pedido já resolvido (pago, cancelado...) — não faz sentido mostrar o
  // formulário de pagamento de novo.
  if (order.status !== "AWAITING_PAYMENT") {
    redirect(`/pedidos/${order.id}`);
  }

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

  return (
    <div className="px-6 py-8 md:px-16 md:py-12">
      <h1 className="text-2xl font-bold">Pagamento</h1>
      <p className="mt-1 text-sm text-[#6E6255]">
        Pagamento processado com segurança pela Mercado Pago.
      </p>

      <div className="mt-8 flex max-w-5xl flex-col gap-10 md:flex-row">
        <div className="flex-1">
          <PaymentBrick
            orderId={order.id}
            amount={order.totalCents / 100}
            payerEmail={resolvePayerEmail(user.email)}
          />
        </div>

        <div className="flex w-full flex-col gap-4 md:w-80 md:shrink-0">
          <div className="rounded-xl border border-[#D8CDBC] bg-white p-5">
            <h2 className="text-sm font-semibold">Itens</h2>
            <div className="mt-3 flex flex-col gap-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-[#3A312B]">{item.productName}</p>
                    <p className="text-xs text-[#6E6255]">
                      {item.variantName} · Qtd: {item.quantity}
                    </p>
                  </div>
                  <span className="font-semibold text-[#5A4738]">
                    {formatCurrency(item.quantity * item.unitPriceCents)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#D8CDBC] pt-4">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-bold text-[#5A4738]">
                {formatCurrency(order.totalCents)}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-[#D8CDBC] bg-white p-5">
            <h2 className="text-sm font-semibold">Endereço de entrega</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6E6255]">
              {order.shippingAddress.recipient}
              <br />
              {order.shippingAddress.street}, {order.shippingAddress.number}
              {order.shippingAddress.complement ? ` — ${order.shippingAddress.complement}` : ""}
              <br />
              {order.shippingAddress.district}, {order.shippingAddress.city} -{" "}
              {order.shippingAddress.state}
              <br />
              CEP {order.shippingAddress.postalCode}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
