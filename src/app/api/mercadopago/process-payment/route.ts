import { NextResponse, type NextRequest } from "next/server";
import { getcurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import {
  getOrderClient,
  extractPaymentResult,
  applyPaymentResult,
  resolvePayerEmail,
  splitName,
  mapCategoryToMercadoPago,
} from "@/lib/mercadopago";

// Chamado pelo Payment Brick (client-side) no onSubmit. Recebe o formData
// que o Brick monta (payment_method_id, token, installments, payer...) mais
// o nosso orderId anexado pelo componente, e monta o pedido no formato que
// a API de Orders espera (pagamento aninhado em transactions.payments[]).
export async function POST(request: NextRequest) {
  const user = await getcurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { orderId, mpPaymentType, ...formData } = await request.json();

  // A API de Orders exige payment_method.type (confirmado testando direto
  // contra a API: o campo é opcional nos tipos do SDK, mas obrigatório de
  // verdade) — "pix" é o único caso em que dá pra inferir com certeza pelo
  // id, já que esse id só existe pra esse método. Cartão depende do que o
  // Brick mandou, porque a mesma bandeira serve pra crédito e débito.
  const paymentMethodType =
    mpPaymentType ?? (formData.payment_method_id === "pix" ? "bank_transfer" : undefined);

  if (!paymentMethodType) {
    return NextResponse.json({ error: "Método de pagamento não reconhecido" }, { status: 400 });
  }

  // Mesmo princípio de sempre: o cliente diz qual pedido, o servidor decide
  // se ele pode mexer nesse pedido.
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: {
      items: { include: { variant: { include: { product: { include: { category: true } } } } } },
      shippingAddress: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  if (order.status !== "AWAITING_PAYMENT") {
    return NextResponse.json({ error: "Pedido não está aguardando pagamento" }, { status: 409 });
  }

  // Nunca confia no valor que o navegador manda — recalcula a partir do
  // total do pedido guardado no banco. A API de Orders quer o valor como
  // string decimal ("49.90"), não centavos.
  const totalAmount = (order.totalCents / 100).toFixed(2);
  const { firstName, lastName } = splitName(user.name);

  const mpOrder = await getOrderClient().create({
    body: {
      type: "online",
      processing_mode: "automatic",
      total_amount: totalAmount,
      external_reference: order.id,
      payer: {
        email: resolvePayerEmail(user.email),
        identification: formData.payer?.identification,
        first_name: firstName,
        last_name: lastName,
        // Outro item do checklist "Aprovação dos pagamentos": endereço do
        // pagador ajuda o antifraude da Mercado Pago. Vem do endereço de
        // entrega já escolhido no pedido, não de um formulário novo.
        address: {
          street_name: order.shippingAddress.street,
          street_number: order.shippingAddress.number,
          zip_code: order.shippingAddress.postalCode,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
        },
      },
      transactions: {
        payments: [
          {
            amount: totalAmount,
            payment_method: {
              id: formData.payment_method_id,
              type: paymentMethodType,
              token: formData.token,
              installments: formData.installments,
            },
          },
        ],
      },
      // Recomendado pela própria Mercado Pago (checklist "Aprovação dos
      // pagamentos" no painel): detalhar os itens melhora a taxa de
      // aprovação antifraude. Vem direto do snapshot já salvo no pedido —
      // nunca do carrinho/produto atual.
      items: order.items.map((item) => ({
        title: `${item.productName} - ${item.variantName}`,
        unit_price: (item.unitPriceCents / 100).toFixed(2),
        quantity: item.quantity,
        category_id: mapCategoryToMercadoPago(item.variant.product.category?.slug),
      })),
      config: {
        // Texto que aparece na fatura do cartão do cliente — reduz
        // contestação por "não reconheço essa cobrança". Limite de ~10
        // caracteres da própria Mercado Pago.
        statement_descriptor: "CRUZ SACRA",
        ...(process.env.NEXT_PUBLIC_APP_URL
          ? {
              online: {
                callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
              },
            }
          : {}),
      },
    },
    // Reaproveita a chave de idempotência do próprio pedido: se o cliente
    // reenviar a mesma tentativa (ex: clique duplo), a Mercado Pago também
    // evita processar duas vezes.
    requestOptions: { idempotencyKey: order.idempotencyKey },
  });

  const result = extractPaymentResult(mpOrder);
  if (result) {
    await applyPaymentResult(result);
  }

  const payment = mpOrder.transactions?.payments?.[0];

  return NextResponse.json({
    status: payment?.status,
    qrCode: payment?.payment_method?.qr_code,
    qrCodeBase64: payment?.payment_method?.qr_code_base64,
  });
}
