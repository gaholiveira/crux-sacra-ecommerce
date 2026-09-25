import { NextResponse, type NextRequest } from "next/server";
import { applyInvoiceStatus } from "@/lib/focusnfe";

// A Focus NFe (diferente da Mercado Pago) não assina o corpo com HMAC — a
// verificação é um segredo simples que a gente escolhe ao cadastrar o
// webhook (campo "authorization_header" no POST /v2/hooks), e ela devolve
// esse mesmo valor no header Authorization de toda chamada. Ainda não
// confirmado contra uma chamada real — ajustar aqui se o header vier
// diferente na primeira notificação de teste.
export async function POST(request: NextRequest) {
  const secret = process.env.FOCUS_NFE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("FOCUS_NFE_WEBHOOK_SECRET não configurado — webhook recusado.");
    return NextResponse.json({ error: "not configured" }, { status: 401 });
  }

  const authorization = request.headers.get("authorization");
  if (authorization !== secret) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.ref) {
    return NextResponse.json({ received: true });
  }

  // Mesmo princípio do webhook da Mercado Pago: um ref desconhecido ou uma
  // falha pontual não pode derrubar a requisição sem tratamento.
  try {
    await applyInvoiceStatus(body.ref, body);
  } catch (error) {
    console.error("Webhook Focus NFe: falha ao aplicar status", { ref: body.ref, error });
  }

  return NextResponse.json({ received: true });
}
