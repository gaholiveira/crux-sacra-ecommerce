"use server";

import { redirect } from "next/navigation";
import { getcurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

export async function createOrder(idempotencyKey: string, addressId: string) {
  const user = await getcurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  // Idempotência: se o usuário clicar "finalizar compra" duas vezes (ou a
  // requisição for reenviada por qualquer motivo), a segunda tentativa acha
  // o pedido já criado em vez de criar um duplicado.
  const existing = await prisma.order.findUnique({ where: { idempotencyKey } });
  if (existing) {
    redirect(`/checkout/${existing.id}`);
  }

  // Confere que o endereço é realmente do usuário logado — mesmo princípio
  // de sempre: nunca confiar só no id que veio do formulário.
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: user.id },
  });
  if (!address) {
    throw new Error("Endereço inválido");
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: true },
  });

  if (!cart || cart.items.length === 0) {
    redirect("/carrinho");
  }

  const orderId = await prisma.$transaction(async (tx) => {
    let totalCents = 0;
    const orderItemsData = [];

    for (const item of cart.items) {
      // Relê a variante DENTRO da transação — nunca confia no preço/estoque
      // que o carrinho tinha em memória, pode estar desatualizado.
      const variant = await tx.productVariant.findUniqueOrThrow({
        where: { id: item.variantId },
        include: { product: true },
      });

      if (variant.stock < item.quantity) {
        throw new Error(`Estoque insuficiente para "${variant.product.name}"`);
      }

      // Baixa de estoque otimista: só decrementa se o stockVersion ainda for
      // o mesmo que acabamos de ler. Se outra compra simultânea já mudou
      // esse valor, count vem 0 — significa que perdemos a corrida, e
      // abortamos a transação inteira em vez de vender estoque que não existe.
      const updateResult = await tx.productVariant.updateMany({
        where: { id: variant.id, stockVersion: variant.stockVersion },
        data: {
          stock: { decrement: item.quantity },
          stockVersion: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        throw new Error(`Estoque de "${variant.product.name}" mudou, tente novamente`);
      }

      totalCents += item.quantity * variant.priceCents;
      orderItemsData.push({
        variantId: variant.id,
        productName: variant.product.name,
        variantName: variant.name,
        unitPriceCents: variant.priceCents,
        quantity: item.quantity,
      });
    }

    const order = await tx.order.create({
      data: {
        idempotencyKey,
        userId: user.id,
        addressId: address.id,
        totalCents,
        status: "AWAITING_PAYMENT",
        items: { create: orderItemsData },
        statusHistory: {
          create: { status: "AWAITING_PAYMENT", note: "Pedido criado, aguardando pagamento" },
        },
      },
    });

    // O carrinho virou pedido — esvazia pra não aparecer de novo em /carrinho.
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return order.id;
  });

  redirect(`/checkout/${orderId}`);
}
