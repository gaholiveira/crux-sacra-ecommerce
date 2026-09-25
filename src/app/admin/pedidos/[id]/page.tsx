import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateOrderStatus } from "./actions";
import { InvoiceCard } from "./invoice-card";

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

// Emitir nota antes do pagamento confirmado não faz sentido — o cancelamento
// de NFe tem janela curta, então só libera o card depois que o pedido
// realmente virou venda.
const invoiceEligibleStatuses = new Set([
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
]);

const inputClass =
  "w-full rounded-md border border-[#D8CDBC] px-3 py-2.5 text-sm outline-none focus:border-[#5A4738] focus:ring-[3px] focus:ring-[#5A473859]";

export default async function PedidoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      shippingAddress: true,
      items: true,
      payments: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!order) {
    notFound();
  }

  const latestInvoice = order.invoices[0] ?? null;

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);

  return (
    <div>
      <div className="mb-3 text-sm text-[#6E6255]">
        <Link href="/admin/pedidos" className="text-[#5A4738] hover:underline">
          Pedidos
        </Link>{" "}
        / <span className="text-[#3A312B]">#{order.id.slice(0, 8)}</span>
      </div>

      <h1 className="text-2xl font-semibold">Pedido #{order.id.slice(0, 8)}</h1>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-xl border border-[#D8CDBC] bg-white p-6">
            <h2 className="text-lg font-semibold">Itens</h2>
            <div className="mt-4 flex flex-col gap-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.productName} — {item.variantName} × {item.quantity}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(item.unitPriceCents * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-[#D8CDBC] pt-4 font-semibold">
              <span>Total</span>
              <span>{formatCurrency(order.totalCents)}</span>
            </div>
          </section>

          <section className="rounded-xl border border-[#D8CDBC] bg-white p-6">
            <h2 className="text-lg font-semibold">Endereço de entrega</h2>
            <p className="mt-3 text-sm text-[#6E6255]">
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
          </section>

          <section className="rounded-xl border border-[#D8CDBC] bg-white p-6">
            <h2 className="text-lg font-semibold">Pagamento</h2>
            {order.payments.length === 0 ? (
              <p className="mt-3 text-sm text-[#6E6255]">Nenhum pagamento registrado ainda.</p>
            ) : (
              <div className="mt-3 flex flex-col gap-2 text-sm">
                {order.payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between">
                    <span>
                      {payment.method} — {payment.status}
                    </span>
                    <span>{formatCurrency(payment.amountCents)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-[#D8CDBC] bg-white p-6">
            <h2 className="text-lg font-semibold">Histórico</h2>
            <div className="mt-3 flex flex-col gap-2 text-sm text-[#6E6255]">
              {order.statusHistory.map((event) => (
                <div key={event.id} className="flex justify-between">
                  <span>{statusLabels[event.status] ?? event.status}</span>
                  <span>{formatDate(event.createdAt)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-xl border border-[#D8CDBC] bg-white p-6">
            <h2 className="text-lg font-semibold">Cliente</h2>
            <p className="mt-3 text-sm text-[#6E6255]">
              {order.user.name}
              <br />
              {order.user.email}
            </p>
          </section>

          <section className="rounded-xl border border-[#D8CDBC] bg-white p-6">
            <h2 className="text-lg font-semibold">Atualizar status</h2>
            <form
              action={updateOrderStatus.bind(null, order.id)}
              className="mt-4 flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label htmlFor="status" className="text-sm font-medium">
                  Status
                </label>
                <select id="status" name="status" defaultValue={order.status} className={inputClass}>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="carrier" className="text-sm font-medium">
                  Transportadora
                </label>
                <input
                  id="carrier"
                  name="carrier"
                  defaultValue={order.carrier ?? ""}
                  placeholder="Ex: Correios"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="trackingCode" className="text-sm font-medium">
                  Código de rastreio
                </label>
                <input
                  id="trackingCode"
                  name="trackingCode"
                  defaultValue={order.trackingCode ?? ""}
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                className="rounded-md bg-[#5A4738] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4A3A2D]"
              >
                Salvar
              </button>
            </form>
          </section>

          {invoiceEligibleStatuses.has(order.status) && (
            <InvoiceCard orderId={order.id} invoice={latestInvoice} />
          )}
        </div>
      </div>
    </div>
  );
}
