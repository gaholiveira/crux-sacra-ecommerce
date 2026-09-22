import { createHmac } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getOrderClient, extractPaymentResult, applyPaymentResult } from "@/lib/mercadopago";

// Só a Mercado Pago deveria conseguir chamar isso. Sem validar a
// assinatura, qualquer um poderia forjar um POST dizendo "esse pedido foi
// pago" e receber produto de graça — por isso validamos o header
// x-signature (HMAC) antes de confiar em qualquer coisa do corpo.
function isValidSignature(request: NextRequest, dataId: string, secret: string): boolean {
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  if (!xSignature) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key?.trim(), value?.trim()];
    }),
  );
  const ts = parts.ts;
  const hash = parts.v1;
  if (!ts || !hash) return false;

  const manifest = `id:${dataId};request-id:${xRequestId ?? ""};ts:${ts};`;
  const expectedHash = createHmac("sha256", secret).update(manifest).digest("hex");

  return expectedHash === hash;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  // IMPORTANTE (verificar com um teste real antes de confiar em produção):
  // não consegui confirmar com uma fonte 100% oficial nesta sessão se, sob
  // a API de Orders, a notificação vem com "type": "payment" (como na API
  // clássica) ou "type": "order". Aceitamos os dois por precaução — quando
  // testar de verdade (com um túnel tipo ngrok), vale logar `body` uma vez
  // e confirmar qual formato chega, ajustando este `if` se necessário.
  if (!body || !["payment", "order"].includes(body.type) || !body.data?.id) {
    return NextResponse.json({ received: true });
  }

  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.error("MERCADOPAGO_WEBHOOK_SECRET não configurado — webhook recusado.");
    return NextResponse.json({ error: "not configured" }, { status: 401 });
  }

  if (!isValidSignature(request, String(body.data.id), secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // Nunca confia no status que veio dentro do corpo da notificação — ele só
  // avisa "algo mudou nesse pedido". Busca o pedido de verdade na API antes
  // de decidir qualquer coisa.
  const mpOrder = await getOrderClient().get({ id: body.data.id });
  const result = extractPaymentResult(mpOrder);
  if (result) {
    await applyPaymentResult(result);
  }

  return NextResponse.json({ received: true });
}
