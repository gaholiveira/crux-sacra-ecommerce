"use client";

import { useState } from "react";
import { AddToCartButton } from "./add-to-cart-button";

type Variant = {
  id: string;
  name: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  stock: number;
};

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

// Junta preço + seletor de variante + botão de adicionar num componente só
// porque os três precisam reagir à mesma escolha (qual variante está
// selecionada) — o resto da página (nome, descrição, galeria) não muda
// com isso, por isso fica de fora, direto em page.tsx.
export function ProductPurchase({ variants }: { variants: Variant[] }) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? "");
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];

  if (!selected) {
    return <AddToCartButton variantId="" disabled label="Indisponível" />;
  }

  const hasPromo = Boolean(
    selected.compareAtPriceCents && selected.compareAtPriceCents > selected.priceCents,
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {hasPromo && selected.compareAtPriceCents && (
          <span className="text-base text-[#6E6255] line-through">
            {formatCurrency(selected.compareAtPriceCents)}
          </span>
        )}
        <span className="text-2xl font-semibold text-[#5A4738]">
          {formatCurrency(selected.priceCents)}
        </span>
        {hasPromo && selected.compareAtPriceCents && (
          <span className="rounded-full bg-[#5A4738] px-2.5 py-1 text-xs font-semibold text-white">
            -{Math.round((1 - selected.priceCents / selected.compareAtPriceCents) * 100)}%
          </span>
        )}
      </div>

      {/* Só aparece quando o produto tem mais de uma variante — um produto
          com uma opção só não precisa de seletor, é confuso à toa. */}
      {variants.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Opção</span>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const outOfStock = variant.stock === 0;
              const isSelected = variant.id === selected.id;

              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={outOfStock}
                  onClick={() => setSelectedId(variant.id)}
                  aria-pressed={isSelected}
                  className={
                    isSelected
                      ? "rounded-lg border border-[#5A4738] bg-[#5A4738] px-4 py-2 text-sm font-medium text-white"
                      : outOfStock
                        ? "cursor-not-allowed rounded-lg border border-[#D8CDBC] px-4 py-2 text-sm font-medium text-[#A99C8C] line-through"
                        : "rounded-lg border border-[#D8CDBC] px-4 py-2 text-sm font-medium text-[#3A312B] hover:border-[#5A4738]"
                  }
                >
                  {variant.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <AddToCartButton
        variantId={selected.id}
        disabled={selected.stock === 0}
        label={selected.stock > 0 ? "Adicionar ao carrinho" : "Fora de estoque"}
      />
    </>
  );
}
