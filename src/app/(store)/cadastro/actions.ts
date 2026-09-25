"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Informe seu nome"),
  email: z.email("Informe um e-mail válido"),
  password: z.string().min(8, "Informe uma senha com pelo menos 8 caracteres"),
});

export type SignUpState = {
  fieldErrors?: Partial<Record<string, string[]>>;
  generalError?: string;
} | null;

export async function signUp(_prevState: SignUpState, formData: FormData): Promise<SignUpState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    // Confirmado testando direto contra o Supabase: e-mail já cadastrado
    // vem com esse código estável (não depende do texto da mensagem, que
    // pode mudar entre versões).
    if (error?.code === "user_already_exists") {
      return { fieldErrors: { email: ["Esse e-mail já está cadastrado"] } };
    }
    return { generalError: error?.message ?? "Não foi possível criar a conta" };
  }

  await prisma.user.create({
    data: {
      id: data.user.id,
      email: parsed.data.email,
      name: parsed.data.name,
    },
  });

  redirect("/");
}
