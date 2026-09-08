import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getcurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  AWAITING_PAYMENT: "Aguardando pagamento",
  PAID: "Pago",
  PROCESSING: "Em separação",
  SHIPPED: "Em transporte",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const user = await getcurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  const { orderId } = await params;

  // findFirst com userId embutido no filtro: se o pedido existir mas for de
  // outra pessoa, cai no mesmo notFound() de um id que não existe — nunca
  // revela pra quem está tentando adivinhar ids que "esse existe, só não é seu".
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: {
      items: true,
      shippingAddress: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) {
    notFound();
  }

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);

  return (
    <div className="px-6 py-8 md:px-16 md:py-12">
      <div className="mb-6 text-sm text-[#6E6255]">
        <Link href="/perfil" className="text-[#5A4738] hover:underline">
          Meu perfil
        </Link>{" "}
        / <span className="text-[#3A312B]">Pedido #{order.id.slice(0, 8)}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
        <span className="rounded-full bg-[#F0E6D4] px-3 py-1 text-xs font-medium text-[#5A4738]">
          {statusLabels[order.status] ?? order.status}
        </span>
      </div>
      <p className="mt-1 text-sm text-[#6E6255]">Feito em {formatDate(order.createdAt)}</p>

      {order.status === "AWAITING_PAYMENT" && (
        <Link
          href={`/checkout/${order.id}`}
          className="mt-4 inline-block rounded-lg bg-[#5A4738] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4A3A2D]"
        >
          Continuar pagamento
        </Link>
      )}

      <div className="mt-8 flex flex-col gap-8 md:flex-row">
        <div className="flex flex-1 flex-col gap-3">
          <h2 className="text-lg font-semibold">Itens</h2>
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-[#D8CDBC] bg-white p-4"
            >
              <div>
                <p className="text-sm font-medium">{item.productName}</p>
                <p className="text-xs text-[#6E6255]">
                  {item.variantName} · Qtd: {item.quantity}
                </p>
              </div>
              <span className="text-sm font-semibold text-[#5A4738]">
                {formatCurrency(item.quantity * item.unitPriceCents)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-[#D8CDBC] pt-4">
            <span className="text-base font-semibold">Total</span>
            <span className="text-lg font-bold text-[#5A4738]">
              {formatCurrency(order.totalCents)}
            </span>
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 md:w-80 md:shrink-0">
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

          <div className="rounded-xl border border-[#D8CDBC] bg-white p-5">
            <h2 className="text-sm font-semibold">Histórico</h2>
            <div className="mt-3 flex flex-col gap-3">
              {order.statusHistory.map((event) => (
                <div key={event.id} className="text-xs text-[#6E6255]">
                  <span className="font-medium text-[#3A312B]">
                    {statusLabels[event.status] ?? event.status}
                  </span>{" "}
                  — {formatDate(event.createdAt)}
                  {event.note && <p className="mt-0.5">{event.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
