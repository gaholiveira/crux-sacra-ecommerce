import "server-only";
import { MercadoPagoConfig, Order } from "mercadopago";
import { prisma } from "@/lib/prisma";

// Mesma razão do client do Supabase admin: criado sob demanda, não no
// carregamento do módulo — senão o build do Next quebraria em páginas que
// nem usam isso, avaliando este arquivo sem as variáveis de ambiente ainda
// configuradas.
let config: MercadoPagoConfig | undefined;

function getConfig(): MercadoPagoConfig {
  if (!config) {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN precisa estar definido no .env");
    }
    config = new MercadoPagoConfig({ accessToken });
  }
  return config;
}

// API de Orders (POST /v1/orders) — a API de Payments clássica (/v1/payments)
// está marcada como legado pela própria Mercado Pago.
export function getOrderClient(): Order {
  return new Order(getConfig());
}

// A sandbox da Mercado Pago só reconhece cartões de teste se o comprador
// (payer.email) for exatamente esse endereço fixo — não é escolha nossa,
// é exigência documentada da API de Orders. Sem isso, cartões de teste
// dão "no_payment_method_for_provided_bin" mesmo com as credenciais certas.
// Desliga isso (MERCADOPAGO_TEST_MODE=false ou ausente) quando for usar
// credenciais de produção com clientes de verdade.
export function resolvePayerEmail(realEmail: string): string {
  if (process.env.MERCADOPAGO_TEST_MODE === "true") {
    return "test@testuser.com";
  }
  return realEmail;
}

// A Mercado Pago quer nome e sobrenome separados (payer.first_name /
// payer.last_name), mas guardamos só um campo "name" — divide no primeiro
// espaço, que cobre a esmagadora maioria dos nomes brasileiros. Sem espaço
// (nome só), o sobrenome fica vazio.
export function splitName(name: string | null): { firstName?: string; lastName?: string } {
  if (!name) return {};
  const trimmed = name.trim();
  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex === -1) return { firstName: trimmed };
  return { firstName: trimmed.slice(0, spaceIndex), lastName: trimmed.slice(spaceIndex + 1) };
}

// Taxonomia própria da Mercado Pago para items.category_id (confirmada via
// GET https://api.mercadopago.com/item_categories, endpoint público) — não
// tem categoria "religioso", então mapeamos pro id mais próximo por slug da
// nossa própria categoria. "others" é o fallback seguro.
const CATEGORY_SLUG_TO_MERCADOPAGO: Record<string, string> = {
  tercos: "others",
  camisetas: "fashion",
  "dezena-para-carros": "automotive",
  pulseiras: "fashion",
  chaveiros: "fashion",
};

export function mapCategoryToMercadoPago(categorySlug: string | undefined): string {
  return CATEGORY_SLUG_TO_MERCADOPAGO[categorySlug ?? ""] ?? "others";
}

// bank_transfer é como a Mercado Pago chama o Pix na API — não existe um
// payment_method type "pix" separado.
export function mapPaymentTypeToMethod(paymentTypeId: string | undefined): "CARD" | "PIX" | "BOLETO" {
  if (paymentTypeId === "bank_transfer") return "PIX";
  if (paymentTypeId === "ticket") return "BOLETO";
  return "CARD";
}

// Status da Mercado Pago -> nosso enum interno.
//
// Confirmado testando um pagamento de cartão aprovado de verdade: na API de
// Orders, o pagamento bem-sucedido vem com status "processed" e
// status_detail "accredited" — NÃO "approved" como a documentação do SDK
// sugeria (e como a API de Payments clássica de fato usava). Por segurança,
// aceitamos os dois vocabulários.
//
// "pending"/"in_process"/"action_required" (comum em Pix, que fica assim
// até o cliente pagar o QR code) caem no PENDING — a linha de Payment só é
// criada/atualizada, o pedido continua AWAITING_PAYMENT até a confirmação
// de verdade chegar.
export function mapPaymentStatus(
  status: string | undefined,
  statusDetail: string | undefined,
): "PENDING" | "SUCCEEDED" | "FAILED" {
  if (status === "approved" || statusDetail === "accredited") return "SUCCEEDED";
  if (status === "rejected" || status === "cancelled" || statusDetail?.startsWith("cc_rejected")) {
    return "FAILED";
  }
  return "PENDING";
}

type OrderLike = {
  id?: string;
  external_reference?: string;
  transactions?: {
    payments?: Array<{
      id?: string;
      status?: string;
      status_detail?: string;
      amount?: string;
      payment_method?: { type?: string };
    }>;
  };
};

type NormalizedPaymentResult = {
  orderId: string;
  providerPaymentIntent: string;
  providerOrderId: string | undefined;
  status: string | undefined;
  statusDetail: string | undefined;
  amountCents: number;
  paymentTypeId: string | undefined;
  raw: unknown;
};

// Na API de Orders, o pagamento de verdade (status, valor, método) mora
// dentro de transactions.payments[0] — o pedido em si tem um status
// separado (created/processed/cancelled) que não é o que nos interessa
// aqui. Essa função extrai só o que importa, vindo tanto da resposta
// imediata da criação quanto de uma busca feita pelo webhook.
export function extractPaymentResult(order: OrderLike): NormalizedPaymentResult | null {
  const payment = order.transactions?.payments?.[0];
  if (!order.external_reference || !payment?.id) return null;

  return {
    orderId: order.external_reference,
    providerPaymentIntent: String(payment.id),
    providerOrderId: order.id,
    status: payment.status,
    statusDetail: payment.status_detail,
    // amount vem como string decimal ("49.90") na API de Orders, diferente
    // da API de Payments clássica (que usava number).
    amountCents: Math.round(Number(payment.amount ?? "0") * 100),
    paymentTypeId: payment.payment_method?.type,
    raw: order,
  };
}

// Ponto único de verdade: tanto a resposta imediata do Payment Brick quanto
// o webhook (que pode chegar antes, depois, ou nem chegar em dev local sem
// um túnel público) passam por aqui. Chamado duas vezes para o mesmo
// pagamento não duplica nada — upsert por providerPaymentIntent, e o Order
// só muda de status se ainda não tiver mudado.
export async function applyPaymentResult(result: NormalizedPaymentResult) {
  const { orderId, providerPaymentIntent, providerOrderId, raw } = result;
  const status = mapPaymentStatus(result.status, result.statusDetail);
  const method = mapPaymentTypeToMethod(result.paymentTypeId);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;

  await prisma.payment.upsert({
    where: { providerPaymentIntent },
    update: { status, providerOrderId, rawWebhookPayload: raw as object },
    create: {
      orderId,
      method,
      status,
      amountCents: result.amountCents,
      providerPaymentIntent,
      providerOrderId,
      rawWebhookPayload: raw as object,
    },
  });

  // Só mexe no pedido se ele ainda estiver esperando pagamento — evita
  // sobrescrever um status mais avançado (ex: já enviado) se o webhook
  // chegar atrasado ou duplicado.
  if (order.status !== "AWAITING_PAYMENT") return;

  if (status === "SUCCEEDED") {
    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { status: "PAID" } }),
      prisma.orderStatusEvent.create({
        data: { orderId, status: "PAID", note: "Pagamento aprovado pela Mercado Pago" },
      }),
    ]);
  } else if (status === "FAILED") {
    // TODO: quando o pagamento falha/é recusado, o estoque decrementado na
    // criação do pedido não volta automaticamente. Repor estoque em
    // cancelamento é um passo futuro — por ora, o pedido só é marcado como
    // cancelado, e é preciso ajuste manual de estoque se necessário.
    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } }),
      prisma.orderStatusEvent.create({
        data: {
          orderId,
          status: "CANCELLED",
          note: `Pagamento recusado (${result.statusDetail ?? "motivo desconhecido"})`,
        },
      }),
    ]);
  }
}
