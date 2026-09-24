import { NextResponse, type NextRequest } from "next/server";
import { getcurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { getOrderClient, extractPaymentResult, applyPaymentResult } from "@/lib/mercadopago";

// Consultado pela tela de Pix enquanto o cliente não escaneou o QR code
// ainda. Em produção o webhook cobre isso, mas em dev local (sem URL
// pública) e mesmo em produção como reforço, esse endpoint permite ao
// front-end perguntar "já mudou?" em vez de ficar esperando passivamente.
export async function GET(request: NextRequest) {
  const user = await getcurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const orderId = request.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId é obrigatório" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  // Já resolvido (por webhook, ou por uma consulta anterior) — nem precisa
  // perguntar de novo pra Mercado Pago.
  if (order.status !== "AWAITING_PAYMENT") {
    return NextResponse.json({ status: order.status });
  }

  const providerOrderId = order.payments[0]?.providerOrderId;
  if (!providerOrderId) {
    return NextResponse.json({ status: order.status });
  }

  const mpOrder = await getOrderClient().get({ id: providerOrderId });
  const result = extractPaymentResult(mpOrder);
  if (result) {
    await applyPaymentResult(result);
  }

  const updated = await prisma.order.findUnique({ where: { id: orderId } });

  return NextResponse.json({ status: updated?.status ?? order.status });
}
