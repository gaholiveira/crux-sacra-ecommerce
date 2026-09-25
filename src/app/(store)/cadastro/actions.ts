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
  // Preenchido quando a conta do Supabase é criada mas ainda precisa do
  // código de confirmação (email_confirmed_at nulo) — o form troca pra tela
  // de digitar o código em vez de redirecionar.
  needsConfirmation?: boolean;
  email?: string;
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

  // Com "Confirm email" ligado no Supabase, a conta é criada mas a sessão
  // vem nula até o código ser confirmado — sem isso ligado, session já
  // vem preenchida e o comportamento continua idêntico ao de antes.
  if (!data.session) {
    return { needsConfirmation: true, email: parsed.data.email };
  }

  redirect("/");
}

const verifyCodeSchema = z.object({
  email: z.email(),
  code: z.string().trim().min(1, "Informe o código"),
});

export type VerifyCodeState = { generalError?: string } | null;

export async function verifySignUpCode(
  _prevState: VerifyCodeState,
  formData: FormData,
): Promise<VerifyCodeState> {
  const parsed = verifyCodeSchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return { generalError: "Informe o código recebido por e-mail" };
  }

  const supabase = await createClient();
  // Confirmado testando direto contra a API: type "email" é o que funciona
  // pra verificar o código de cadastro — "signup" (que soaria mais óbvio)
  // não é aceito aqui, apesar de aparecer no retorno do generateLink.
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.code,
    type: "email",
  });

  if (error) {
    return { generalError: "Código inválido ou expirado" };
  }

  redirect("/");
}

export async function resendSignUpCode(email: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });

  if (error) {
    // Supabase limita reenvios (60s entre tentativas) — é o erro mais
    // provável de alguém esbarrar clicando de novo rápido demais.
    return { error: "Aguarde um pouco antes de pedir outro código" };
  }

  return {};
}
