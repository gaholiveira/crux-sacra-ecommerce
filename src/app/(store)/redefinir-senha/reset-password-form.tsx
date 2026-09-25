"use client";

import { useActionState } from "react";
import { resetPassword } from "./actions";

const inputClass =
  "w-full rounded-md border border-[#D8CDBC] px-3 py-2.5 text-sm outline-none focus:border-[#5A4738] focus:ring-[3px] focus:ring-[#5A473859]";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <span className="text-xs text-red-700">{messages[0]}</span>;
}

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(resetPassword, null);
  const errors = state?.fieldErrors;

  return (
    <form
      action={formAction}
      className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-[#D8CDBC] bg-white p-6 md:p-8"
    >
      <div>
        <h1 className="text-2xl font-bold">Nova senha</h1>
        <p className="mt-1 text-sm text-[#6E6255]">Escolha uma senha nova para sua conta.</p>
      </div>

      {state?.generalError && (
        <p className="rounded-md bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {state.generalError}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Nova senha
        </label>
        <input id="password" name="password" type="password" className={inputClass} />
        <FieldError messages={errors?.password} />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-lg bg-[#5A4738] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4A3A2D] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Salvando..." : "Salvar nova senha"}
      </button>
    </form>
  );
}
