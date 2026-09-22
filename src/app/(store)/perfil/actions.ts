"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getcurrentUser } from "@/lib/auth/dal";

const nameSchema = z.string().trim().min(1, "Informe seu nome").max(120);

export async function updateName(formData: FormData) {
  const user = await getcurrentUser();
  if (!user) {
    redirect("/entrar");
  }

  const name = nameSchema.parse(formData.get("name"));

  await prisma.user.update({
    where: { id: user.id },
    data: { name },
  });

  revalidatePath("/perfil");
}
