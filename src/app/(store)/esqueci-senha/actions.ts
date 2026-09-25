"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const forgotPasswordSchema = z.object({
  email: z.email("Informe um e-mail válido"),
});

export type ForgotPasswordState = {
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
} | null;

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  // O resultado (existe ou não esse e-mail) nunca aparece pro cliente — se
  // mostrássemos "e-mail não encontrado" alguém poderia usar esse formulário
  // pra descobrir quais endereços têm conta cadastrada. Sempre a mesma
  // mensagem de sucesso, exista o e-mail ou não.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
  });

  return { success: true };
}
