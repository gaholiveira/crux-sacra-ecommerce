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
        Total do pedido: <span className="font-semibold text-[#5A4738]">{formatCurrency(order.totalCents)}</span>
      </p>

      <div className="mt-6 max-w-md">
        <PaymentBrick
          orderId={order.id}
          amount={order.totalCents / 100}
          payerEmail={resolvePayerEmail(user.email)}
        />
      </div>
    </div>
  );
}
