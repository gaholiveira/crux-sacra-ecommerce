"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getcurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

export async function addToCart(variantId: string) {
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
}