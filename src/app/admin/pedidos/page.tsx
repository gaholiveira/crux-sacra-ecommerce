import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma, OrderStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

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

const inputClass =
  "w-full rounded-md border border-[#D8CDBC] px-3 py-2 text-sm outline-none focus:border-[#5A4738] focus:ring-[3px] focus:ring-[#5A473859]";

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;

  // Só aceita um status que realmente exista no enum — um valor qualquer
  // vindo da URL (?status=qualquercoisa) não pode virar filtro do Prisma.
  const statusFilter = status && status in statusLabels ? status : undefined;

  const where: Prisma.OrderWhereInput = {
    ...(statusFilter ? { status: statusFilter as OrderStatus } : {}),
    ...(q
      ? {
          user: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };

  const orders = await prisma.order.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
      items: true,
    },
  });

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Pedidos</h1>
        <p className="mt-1 text-sm text-[#6E6255]">{orders.length} pedidos encontrados</p>
      </div>

      {/* GET simples: cada filtro vira parâmetro na URL (?status=PAID&q=maria),
          então dá pra recarregar a página, voltar no navegador, ou compartilhar
          o link já filtrado — nada disso funciona com um filtro só em estado
          de cliente (useState). */}
      <form className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-[#D8CDBC] bg-white p-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="q" className="text-sm font-medium">
            Cliente
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Nome ou e-mail"
            className={`${inputClass} w-full sm:w-56`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <select id="status" name="status" defaultValue={status ?? ""} className={`${inputClass} w-full sm:w-56`}>
            <option value="">Todos</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="rounded-md bg-[#5A4738] px-5 py-2 text-sm font-semibold text-white hover:bg-[#4A3A2D]"
        >
          Filtrar
        </button>
        {(status || q) && (
          <Link href="/admin/pedidos" className="text-sm text-[#5A4738] hover:underline">
            Limpar filtros
          </Link>
        )}
      </form>

      <div className="overflow-hidden rounded-xl border border-[#D8CDBC] bg-white">
        {orders.length === 0 ? (
          <p className="p-10 text-center text-sm text-[#6E6255]">Nenhum pedido encontrado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-[#D8CDBC] text-left text-[#6E6255]">
                  <th className="px-6 py-3 font-medium">Pedido</th>
                  <th className="px-6 py-3 font-medium">Cliente</th>
                  <th className="px-6 py-3 font-medium">Data</th>
                  <th className="px-6 py-3 font-medium">Itens</th>
                  <th className="px-6 py-3 font-medium">Total</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-[#D8CDBC] last:border-0">
                    <td className="px-6 py-3 font-mono text-xs">{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-3">
                      <div className="font-medium text-[#3A312B]">{order.user.name ?? order.user.email}</div>
                      <div className="text-xs text-[#6E6255]">{order.user.email}</div>
                    </td>
                    <td className="px-6 py-3 text-[#6E6255]">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-3 text-[#6E6255]">{order.items.length}</td>
                    <td className="px-6 py-3 font-medium">{formatCurrency(order.totalCents)}</td>
                    <td className="px-6 py-3">
                      <span className="rounded-full bg-[#F0E6D4] px-3 py-1 text-xs font-medium text-[#5A4738]">
                        {statusLabels[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link href={`/admin/pedidos/${order.id}`} className="text-[#5A4738] hover:underline">
                        Ver detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
