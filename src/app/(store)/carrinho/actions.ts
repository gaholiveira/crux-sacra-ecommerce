"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getcurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

export async function removeCartItem(cartItemID: string) {
  const user = await getcurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  // Nunca confia só no id que veio do form, filtra pelo dono do carrinho
  //se nao qualquer um poderia remover um item do carrinho de outro usuario
  await prisma.cartItem.deleteMany({
    where: {
      id: cartItemID,
      cart: {
        userId: user.id,
      },
    },
  });

  revalidatePath("/carrinho");
}

export async function incrementCartItem(cartItemId: string) {
  const user = await getcurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  await prisma.cartItem.updateMany({
    where: { id: cartItemId, cart: { userId: user.id } },
    data: { quantity: { increment: 1 } },
  });

  revalidatePath("/carrinho");
}

export async function decrementCartItem(cartItemId: string) {
  const user = await getcurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  // updateMany não serve aqui: preciso saber a quantidade ATUAL pra decidir
  // entre diminuir ou remover o item (não faz sentido quantidade 0 no carrinho).
  const item = await prisma.cartItem.findFirst({
    where: { id: cartItemId, cart: { userId: user.id } },
  });

  if (!item) {
    return;
  }

  if (item.quantity <= 1) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  } else {
    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: { decrement: 1 } },
    });
  }

  revalidatePath("/carrinho");
}