"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "./actions";

const inputClass =
  "w-full rounded-md border border-[#D8CDBC] px-3 py-2.5 text-sm outline-none focus:border-[#5A4738] focus:ring-[3px] focus:ring-[#5A473859]";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <span className="text-xs text-red-700">{messages[0]}</span>;
}

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, null);
  const errors = state?.fieldErrors;

  if (state?.success) {
    return (
      <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-[#D8CDBC] bg-white p-6 text-center md:p-8">
        <h1 className="text-2xl font-bold">Verifique seu e-mail</h1>
        <p className="text-sm text-[#6E6255]">
          Se esse e-mail tiver uma conta, enviamos um link pra redefinir a senha. Confira também a
          caixa de spam.
        </p>
        <Link href="/entrar" className="text-sm font-medium text-[#5A4738] hover:underline">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-[#D8CDBC] bg-white p-6 md:p-8"
    >
      <div>
        <h1 className="text-2xl font-bold">Esqueci minha senha</h1>
        <p className="mt-1 text-sm text-[#6E6255]">
          Informe seu e-mail e enviamos um link pra você criar uma senha nova.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input id="email" name="email" type="email" className={inputClass} />
        <FieldError messages={errors?.email} />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-lg bg-[#5A4738] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4A3A2D] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Enviando..." : "Enviar link"}
      </button>

      <Link href="/entrar" className="text-center text-sm text-[#5A4738] hover:underline">
        Voltar para o login
      </Link>
    </form>
  );
}
