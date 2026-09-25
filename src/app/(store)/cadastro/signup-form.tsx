"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "./actions";

const inputClass =
  "w-full rounded-md border border-[#D8CDBC] px-3 py-2.5 text-sm outline-none focus:border-[#5A4738] focus:ring-[3px] focus:ring-[#5A473859]";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <span className="text-xs text-red-700">{messages[0]}</span>;
}

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUp, null);
  const errors = state?.fieldErrors;

  return (
    <form
      action={formAction}
      className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-[#D8CDBC] bg-white p-6 md:p-8"
    >
      <div>
        <h1 className="text-2xl font-bold">Criar conta</h1>
        <p className="mt-1 text-sm text-[#6E6255]">
          Já tem uma conta?{" "}
          <Link href="/entrar" className="text-[#5A4738] underline">
            Entrar
          </Link>
        </p>
      </div>

      {state?.generalError && (
        <p className="rounded-md bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {state.generalError}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Nome
        </label>
        <input id="name" name="name" className={inputClass} />
        <FieldError messages={errors?.name} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input id="email" name="email" type="email" className={inputClass} />
        <FieldError messages={errors?.email} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Senha
        </label>
        <input id="password" name="password" type="password" className={inputClass} />
        <FieldError messages={errors?.password} />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-lg bg-[#5A4738] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4A3A2D] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Criando..." : "Criar Conta"}
      </button>
    </form>
  );
}
