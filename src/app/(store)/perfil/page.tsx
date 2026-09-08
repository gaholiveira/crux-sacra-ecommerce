import { redirect } from "next/navigation";
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

export default async function PerfilPage() {
  const user = await getcurrentUser();
  if (!user) {
    redirect("/entrar");
  }

  const [addresses, orders] = await Promise.all([
    prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const formatCurrency = (cents: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

  const formatDate = (date: Date) => 
    new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
  
  return (
    <div className="px-6 py-8 md:px-16 md:py-12">
      <h1 className="text-2xl font-bold">Meu perfil</h1>

      <section className="mt-8 rounded-xl border border-[#D8CDBC] bg-white p-6">
        <h2 className="text-lg font-semibold">Dados da conta</h2>
        <div className="mt-3 flex flex-col gap-1 text-sm text-[#6E6255]">
          <span>
            <strong className="text-[#3A312B]">Nome:</strong> {user.name}
          </span>
          <span>
            <strong className="text-[#3A312B]">E-mail:</strong> {user.email}
          </span>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-[#D8CDBC] bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Endereços</h2>
          <Link href="/enderecos/novo" className="text-sm font-medium text-[#5A4738] hover:underline">
            + Novo endereço
          </Link>
        </div>

        {addresses.length === 0 ? (
          <p className="mt-3 text-sm text-[#6E6255]">Nenhum endereço cadastrado.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="rounded-lg border border-[#D8CDBC] p-4 text-sm text-[#6E6255]"
              >
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

      <section className="mt-6 rounded-xl border border-[#D8CDBC] bg-white p-6">
        <h2 className="text-lg font-semibold">Meus pedidos</h2>

        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-[#6E6255]">Nenhum pedido ainda.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {orders.map((order) => (
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
                    href={
                      order.status === "AWAITING_PAYMENT"
                        ? `/checkout/${order.id}`
                        : `/pedidos/${order.id}`
                    }
                    className="text-sm font-medium text-[#5A4738] hover:underline"
                  >
                    {order.status === "AWAITING_PAYMENT" ? "Continuar pagamento" : "Ver detalhes"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}