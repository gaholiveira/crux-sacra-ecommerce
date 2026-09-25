"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Informe uma senha com pelo menos 8 caracteres"),
});

export type ResetPasswordState = {
  fieldErrors?: Partial<Record<string, string[]>>;
  generalError?: string;
} | null;

export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({ password: formData.get("password") });

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    // Só chega aqui sem sessão válida se o link já tiver sido usado ou
    // expirado — a página em si já barra quem chega sem sessão nenhuma.
    return { generalError: "Não foi possível salvar a nova senha. Solicite um novo link." };
  }

  redirect("/perfil");
}
