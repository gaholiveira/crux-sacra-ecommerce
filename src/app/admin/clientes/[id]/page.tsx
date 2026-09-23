import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const roleLabels: Record<string, string> = {
  CUSTOMER: "Cliente",
  ADMIN: "Admin",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  AWAITING_PAYMENT: "Aguardando pagamento",
  PAID: "Pago",
  PROCESSING: "Em processamento",
  SHIPPED: "Em transporte",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

export default async function ClienteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: { orderBy: { createdAt: "desc" } },
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);

  const totalSpentCents = user.orders
    .filter((order) => order.status === "PAID" || order.status === "DELIVERED" || order.status === "SHIPPED")
    .reduce((sum, order) => sum + order.totalCents, 0);

  return (
    <div>
      <div className="mb-3 text-sm text-[#6E6255]">
        <Link href="/admin/clientes" className="text-[#5A4738] hover:underline">
          Clientes
        </Link>{" "}
        / <span className="text-[#3A312B]">{user.name ?? user.email}</span>
      </div>

      <h1 className="text-2xl font-semibold">{user.name ?? "Sem nome cadastrado"}</h1>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-xl border border-[#D8CDBC] bg-white p-6">
            <h2 className="text-lg font-semibold">Pedidos</h2>
            {user.orders.length === 0 ? (
              <p className="mt-3 text-sm text-[#6E6255]">Nenhum pedido ainda.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {user.orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#D8CDBC] p-4 text-sm"
                  >
                    <div>
                      <p className="font-medium text-[#3A312B]">Pedido #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-[#6E6255]">
                        {formatDate(order.createdAt)} · {order.items.length} item(ns)
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-[#F0E6D4] px-3 py-1 text-xs font-medium text-[#5A4738]">
                        {statusLabels[order.status] ?? order.status}
                      </span>
                      <span className="font-semibold text-[#5A4738]">
                        {formatCurrency(order.totalCents)}
                      </span>
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="text-sm font-medium text-[#5A4738] hover:underline"
                      >
                        Ver detalhes
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-[#D8CDBC] bg-white p-6">
            <h2 className="text-lg font-semibold">Endereços</h2>
            {user.addresses.length === 0 ? (
              <p className="mt-3 text-sm text-[#6E6255]">Nenhum endereço cadastrado.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {user.addresses.map((address) => (
                  <div key={address.id} className="rounded-lg border border-[#D8CDBC] p-4 text-sm text-[#6E6255]">
                    <p className="font-medium text-[#3A312B]">{address.recipient}</p>
                    <p>
                      {address.street}, {address.number}
                      {address.complement ? ` — ${address.complement}` : ""}
                    </p>
                    <p>
                      {address.district}, {address.city} - {address.state}
                    </p>
                    <p>CEP {address.postalCode}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-xl border border-[#D8CDBC] bg-white p-6">
            <h2 className="text-lg font-semibold">Conta</h2>
            <div className="mt-3 flex flex-col gap-1 text-sm text-[#6E6255]">
              <span>
                <strong className="text-[#3A312B]">E-mail:</strong> {user.email}
              </span>
              <span>
                <strong className="text-[#3A312B]">Tipo:</strong> {roleLabels[user.role] ?? user.role}
              </span>
              <span>
                <strong className="text-[#3A312B]">Cliente desde:</strong> {formatDate(user.createdAt)}
              </span>
            </div>
          </section>

          <section className="rounded-xl border border-[#D8CDBC] bg-white p-6">
            <h2 className="text-lg font-semibold">Resumo</h2>
            <div className="mt-3 flex flex-col gap-1 text-sm text-[#6E6255]">
              <span>
                <strong className="text-[#3A312B]">Total de pedidos:</strong> {user.orders.length}
              </span>
              <span>
                <strong className="text-[#3A312B]">Total gasto (pagos):</strong>{" "}
                {formatCurrency(totalSpentCents)}
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
