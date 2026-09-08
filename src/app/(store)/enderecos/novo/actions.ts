"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getcurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

const addressSchema = z.object({
  recipient: z.string().trim().min(1, "informe o nome do destinatário"),
  street: z.string().trim().min(1, "informe o nome da rua"),
  number: z.string().trim().min(1, "informe o número da residência"),
  complement: z.string().trim().optional(),
  district: z.string().trim().min(1, "informe o bairro"),
  city: z.string().trim().min(1, "informe a cidade"),
  state: z.string().trim().length(2, "informe o estado"),
  postalCode: z.string().trim().min(8, "informe o CEP"),
});

export async function createAddress(formData: FormData) {
  const user = await getcurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  const parsed = addressSchema.parse({
    recipient: formData.get("recipient"),
    street: formData.get("street"),
    number: formData.get("number"),
    complement: formData.get("complement") || undefined,
    district: formData.get("district"),
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
  });

  await prisma.address.create({
    data: {
      ...parsed,
      userId: user.id,
    },
  });

  redirect("/carrinho");
}