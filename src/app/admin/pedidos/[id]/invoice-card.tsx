"use client";

import { useActionState } from "react";
import {
  emitInvoiceAction,
  refreshInvoiceStatusAction,
  cancelInvoiceAction,
  type InvoiceActionState,
} from "./actions";

const inputClass =
  "w-full rounded-md border border-[#D8CDBC] px-3 py-2.5 text-sm outline-none focus:border-[#5A4738] focus:ring-[3px] focus:ring-[#5A473859]";

const statusLabels: Record<string, string> = {
  PROCESSING: "Processando",
  AUTHORIZED: "Autorizada",
  ERROR: "Erro",
  CANCELLED: "Cancelada",
};

type Invoice = {
  id: string;
  status: string;
  numero: string | null;
  serie: string | null;
  chaveAcesso: string | null;
  mensagemSefaz: string | null;
  xmlUrl: string | null;
  danfeUrl: string | null;
};

function ActionError({ state }: { state: InvoiceActionState }) {
  if (!state?.error) return null;
  return <p className="text-xs text-red-700">{state.error}</p>;
}

export function InvoiceCard({ orderId, invoice }: { orderId: string; invoice: Invoice | null }) {
  const [emitState, emitAction, emitPending] = useActionState(
    emitInvoiceAction.bind(null, orderId),
    null,
  );
  const [refreshState, refreshAction, refreshPending] = useActionState(
    refreshInvoiceStatusAction.bind(null, orderId),
    null,
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelInvoiceAction.bind(null, orderId),
    null,
  );

  if (!invoice || invoice.status === "CANCELLED") {
    return (
      <section className="rounded-xl border border-[#D8CDBC] bg-white p-6">
        <h2 className="text-lg font-semibold">Nota fiscal</h2>
        {invoice?.status === "CANCELLED" && (
          <p className="mt-3 text-sm text-[#6E6255]">
            Nota anterior cancelada. Emitir uma nova nota fiscal, se necessário.
          </p>
        )}
        <form action={emitAction} className="mt-3">
          <button
            type="submit"
            disabled={emitPending}
            className="rounded-md bg-[#5A4738] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4A3A2D] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {emitPending ? "Emitindo..." : "Emitir nota fiscal"}
          </button>
          <ActionError state={emitState} />
        </form>
      </section>
    );
  }

  if (invoice.status === "PROCESSING") {
    return (
      <section className="rounded-xl border border-[#D8CDBC] bg-white p-6">
        <h2 className="text-lg font-semibold">Nota fiscal</h2>
        <p className="mt-3 text-sm text-[#6E6255]">Status: {statusLabels.PROCESSING}</p>
        <form action={refreshAction} className="mt-3">
          <button
            type="submit"
            disabled={refreshPending}
            className="rounded-md border border-[#5A4738] px-5 py-2.5 text-sm font-semibold text-[#5A4738] hover:bg-[#F5EFE6] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshPending ? "Verificando..." : "Verificar status"}
          </button>
          <ActionError state={refreshState} />
        </form>
      </section>
    );
  }

  if (invoice.status === "ERROR") {
    return (
      <section className="rounded-xl border border-[#D8CDBC] bg-white p-6">
        <h2 className="text-lg font-semibold">Nota fiscal</h2>
        <p className="mt-3 text-sm text-red-700">
          {invoice.mensagemSefaz ?? "Erro ao emitir a nota fiscal."}
        </p>
        <form action={emitAction} className="mt-3">
          <button
            type="submit"
            disabled={emitPending}
            className="rounded-md bg-[#5A4738] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4A3A2D] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {emitPending ? "Emitindo..." : "Tentar novamente"}
          </button>
          <ActionError state={emitState} />
        </form>
      </section>
    );
  }

  // AUTHORIZED
  return (
    <section className="rounded-xl border border-[#D8CDBC] bg-white p-6">
      <h2 className="text-lg font-semibold">Nota fiscal</h2>
      <div className="mt-3 flex flex-col gap-1 text-sm text-[#6E6255]">
        <span>Status: {statusLabels.AUTHORIZED}</span>
        {invoice.numero && (
          <span>
            Número {invoice.numero} / Série {invoice.serie}
          </span>
        )}
        {invoice.chaveAcesso && <span className="break-all">Chave: {invoice.chaveAcesso}</span>}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        {invoice.danfeUrl && (
          <a
            href={invoice.danfeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-[#5A4738] px-4 py-2 font-semibold text-[#5A4738] hover:bg-[#F5EFE6]"
          >
            Ver DANFE
          </a>
        )}
        {invoice.xmlUrl && (
          <a
            href={invoice.xmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-[#5A4738] px-4 py-2 font-semibold text-[#5A4738] hover:bg-[#F5EFE6]"
          >
            Ver XML
          </a>
        )}
      </div>

      <form action={cancelAction} className="mt-5 flex flex-col gap-2 border-t border-[#D8CDBC] pt-4">
        <label htmlFor="justificativa" className="text-sm font-medium">
          Cancelar nota
        </label>
        <textarea
          id="justificativa"
          name="justificativa"
          rows={2}
          minLength={15}
          maxLength={255}
          placeholder="Justificativa do cancelamento (mínimo 15 caracteres)"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={cancelPending}
          className="self-start rounded-md border border-red-700 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cancelPending ? "Cancelando..." : "Cancelar nota"}
        </button>
        <ActionError state={cancelState} />
      </form>
    </section>
  );
}
