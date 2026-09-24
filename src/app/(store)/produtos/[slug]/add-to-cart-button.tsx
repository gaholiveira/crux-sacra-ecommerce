"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { addToCart } from "./actions";

function AddedToCartToast({ onDismiss }: { onDismiss: () => void }) {
  // Efeito só agenda o timer externo (setTimeout) — não espelha nenhum
  // estado síncrono. Como esse componente é remontado a cada novo clique
  // (via key={state.addedAt} no pai), esse efeito roda uma vez por toast.
  useEffect(() => {
    const timeout = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timeout);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-lg bg-[#3A312B] px-5 py-3.5 text-sm text-white shadow-lg">
      <span>Adicionado ao carrinho ✓</span>
      <Link
        href="/carrinho"
        className="font-semibold text-[#E8E0D5] underline underline-offset-2 hover:text-white"
      >
        Ver carrinho
      </Link>
    </div>
  );
}

export function AddToCartButton({
  variantId,
  disabled,
  label,
}: {
  variantId: string;
  disabled: boolean;
  label: string;
}) {
  const [state, formAction, isPending] = useActionState(addToCart.bind(null, variantId), null);
  // Guarda o "addedAt" do último toast já dispensado — comparar com o do
  // state atual (em vez de um boolean solto) evita precisar resetar nada
  // manualmente quando o cliente clica de novo: um novo addedAt já é
  // automaticamente diferente do último dispensado.
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);

  const showToast = Boolean(state?.success) && state?.addedAt !== dismissedAt;

  return (
    <>
      <form action={formAction}>
        <button
          type="submit"
          disabled={disabled || isPending}
          className="mt-2 rounded-lg bg-[#5A4738] px-6 py-3 text-[15px] font-semibold text-white hover:bg-[#4A3A2D] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Adicionando..." : label}
        </button>
      </form>

      {showToast && state && (
        <AddedToCartToast key={state.addedAt} onDismiss={() => setDismissedAt(state.addedAt)} />
      )}
    </>
  );
}
