"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.email("Informe um e-mail válido"),
  password: z.string().min(1, "Informe uma senha"),
});

export type LoginState = {
  fieldErrors?: Partial<Record<string, string[]>>;
  generalError?: string;
} | null;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Mensagem genérica de propósito: não diz se o problema foi o e-mail ou
    // a senha, pra não virar um jeito de descobrir quais e-mails já têm
    // conta cadastrada.
    return { generalError: "E-mail ou senha incorretos" };
  }

  redirect("/");
}
