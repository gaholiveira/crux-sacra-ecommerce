"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getcurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

// Os dois primeiros parâmetros vêm de .bind(null, variantId) — o terceiro é
// o argumento que o React passa de verdade quando esse action é usado com
// useActionState (precisa da assinatura (estadoAnterior, formData) => novoEstado
// pra conseguir saber, no cliente, quando a ação terminou e mostrar o toast).
export async function addToCart(variantId: string, _prevState: unknown, _formData: FormData) {
  const user = await getcurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  const cart = await prisma.cart.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  await prisma.cartItem.upsert({
    where: {
      cartId_variantId: {
        cartId: cart.id,
        variantId,
      },
    },
    update: {
      quantity: {
        increment: 1,
      },
    },
    create: {
      cartId: cart.id,
      variantId,
      quantity: 1,
    },
  });

  revalidatePath("/carrinho");

  return { success: true, addedAt: Date.now() };
}