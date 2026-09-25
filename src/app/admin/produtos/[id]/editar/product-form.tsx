"use client";

import { useActionState, useState } from "react";
import { ImageSlot } from "@/components/image-slot";
import type { UpdateProductState } from "./actions";

const inputClass =
  "w-full rounded-md border border-[#D8CDBC] px-3 py-2.5 text-sm outline-none focus:border-[#5A4738] focus:ring-[3px] focus:ring-[#5A473859]";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <span className="text-xs text-red-700">{messages[0]}</span>;
}

type Category = { id: string; name: string };
type Variant = {
  id: string;
  name: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  stock: number;
};
type Product = {
  name: string;
  slug: string;
  description: string | null;
  imageUrls: string[];
  categoryId: string | null;
  variants: Variant[];
};

export function EditProductForm({
  action,
  product,
  categories,
}: {
  action: (prevState: UpdateProductState, formData: FormData) => Promise<UpdateProductState>;
  product: Product;
  categories: Category[];
}) {
  const [state, formAction, isPending] = useActionState(action, null);
  // Variantes novas adicionadas nessa edição — ainda sem id, só existem no
  // cliente até salvar. Cada uma tem uma key própria (não o índice), pra
  // remover uma do meio não bagunçar as outras.
  const [newVariantKeys, setNewVariantKeys] = useState<string[]>([]);

  const errors = state?.fieldErrors;

  return (
    <form
      action={formAction}
      className="flex max-w-xl flex-col gap-6 rounded-xl border border-[#D8CDBC] bg-white p-8"
    >
      {state?.generalError && (
        <p className="rounded-md bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {state.generalError}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Nome do produto
        </label>
        <input id="name" name="name" className={inputClass} defaultValue={product.name} />
        <FieldError messages={errors?.name} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="slug" className="text-sm font-medium">
          Slug (URL)
        </label>
        <input
          id="slug"
          name="slug"
          className={`${inputClass} font-mono text-[13px]`}
          defaultValue={product.slug}
        />
        <FieldError messages={errors?.slug} />
        <span className="text-xs text-[#6E6255]">
          Cuidado: mudar o slug muda a URL do produto na loja.
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          className={`${inputClass} resize-y`}
          defaultValue={product.description ?? ""}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="categoryId" className="text-sm font-medium">
          Categoria
        </label>
        <select
          id="categoryId"
          name="categoryId"
          className={inputClass}
          defaultValue={product.categoryId ?? ""}
        >
          <option value="" disabled>
            Selecione uma categoria
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <FieldError messages={errors?.categoryId} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Imagens (até 3)</span>
        <div className="flex flex-wrap gap-4">
          {[0, 1, 2].map((i) => (
            <ImageSlot
              key={i}
              name={`image-${i}`}
              currentUrl={product.imageUrls[i]}
              removeInputName={`removeImage-${i}`}
              badge={i === 0 ? "Miniatura" : undefined}
            />
          ))}
        </div>
        <span className="text-xs text-[#6E6255]">
          Passe o mouse sobre uma imagem pra trocar ou remover. A primeira vira a miniatura nas
          listagens.
        </span>
      </div>

      <div className="flex flex-col gap-4 border-t border-[#D8CDBC] pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Variantes</h2>
          <button
            type="button"
            onClick={() => setNewVariantKeys((prev) => [...prev, crypto.randomUUID()])}
            className="text-sm font-medium text-[#5A4738] hover:underline"
          >
            + Adicionar variante
          </button>
        </div>

        {product.variants.map((variant) => {
          const variantErrors = state?.variantErrors?.[variant.id];

          return (
            <div key={variant.id} className="flex flex-col gap-3 rounded-lg border border-[#D8CDBC] p-4">
              <input type="hidden" name="variantIds" value={variant.id} />

              <div className="flex flex-col gap-1.5">
                <label htmlFor={`name-${variant.id}`} className="text-sm font-medium">
                  Nome da variante
                </label>
                <input
                  id={`name-${variant.id}`}
                  name={`name-${variant.id}`}
                  className={inputClass}
                  defaultValue={variant.name}
                />
                <FieldError messages={variantErrors?.name} />
              </div>

              <div className="flex gap-4">
                <div className="flex flex-1 flex-col gap-1.5">
                  <label htmlFor={`price-${variant.id}`} className="text-sm font-medium">
                    Preço (R$)
                  </label>
                  <input
                    id={`price-${variant.id}`}
                    name={`price-${variant.id}`}
                    type="number"
                    step="0.01"
                    min="0"
                    className={inputClass}
                    defaultValue={(variant.priceCents / 100).toFixed(2)}
                  />
                  <FieldError messages={variantErrors?.price} />
                </div>

                <div className="flex flex-1 flex-col gap-1.5">
                  <label htmlFor={`compareAtPrice-${variant.id}`} className="text-sm font-medium">
                    Preço original
                  </label>
                  <input
                    id={`compareAtPrice-${variant.id}`}
                    name={`compareAtPrice-${variant.id}`}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Sem promoção"
                    className={inputClass}
                    defaultValue={
                      variant.compareAtPriceCents !== null
                        ? (variant.compareAtPriceCents / 100).toFixed(2)
                        : ""
                    }
                  />
                  <FieldError messages={variantErrors?.compareAtPrice} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor={`stock-${variant.id}`} className="text-sm font-medium">
                  Estoque
                </label>
                <input
                  id={`stock-${variant.id}`}
                  name={`stock-${variant.id}`}
                  type="number"
                  step="1"
                  min="0"
                  className={inputClass}
                  defaultValue={variant.stock}
                />
                <FieldError messages={variantErrors?.stock} />
              </div>
            </div>
          );
        })}

        {newVariantKeys.map((key) => {
          const variantErrors = state?.variantErrors?.[key];

          return (
            <div key={key} className="flex flex-col gap-3 rounded-lg border border-dashed border-[#5A4738] p-4">
              <input type="hidden" name="newVariantKeys" value={key} />

              <div className="flex items-center justify-between">
                <label htmlFor={`new-name-${key}`} className="text-sm font-medium">
                  Nome da variante (nova)
                </label>
                <button
                  type="button"
                  onClick={() => setNewVariantKeys((prev) => prev.filter((k) => k !== key))}
                  className="text-xs text-[#6E6255] underline hover:text-red-700"
                >
                  Remover
                </button>
              </div>
              <input
                id={`new-name-${key}`}
                name={`new-name-${key}`}
                className={inputClass}
                placeholder="Ex: P, M, G, Azul..."
              />
              <FieldError messages={variantErrors?.name} />

              <div className="flex gap-4">
                <div className="flex flex-1 flex-col gap-1.5">
                  <label htmlFor={`new-price-${key}`} className="text-sm font-medium">
                    Preço (R$)
                  </label>
                  <input
                    id={`new-price-${key}`}
                    name={`new-price-${key}`}
                    type="number"
                    step="0.01"
                    min="0"
                    className={inputClass}
                    placeholder="49.90"
                  />
                  <FieldError messages={variantErrors?.price} />
                </div>

                <div className="flex flex-1 flex-col gap-1.5">
                  <label htmlFor={`new-compareAtPrice-${key}`} className="text-sm font-medium">
                    Preço original (opcional)
                  </label>
                  <input
                    id={`new-compareAtPrice-${key}`}
                    name={`new-compareAtPrice-${key}`}
                    type="number"
                    step="0.01"
                    min="0"
                    className={inputClass}
                    placeholder="69.90"
                  />
                  <FieldError messages={variantErrors?.compareAtPrice} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor={`new-stock-${key}`} className="text-sm font-medium">
                  Estoque
                </label>
                <input
                  id={`new-stock-${key}`}
                  name={`new-stock-${key}`}
                  type="number"
                  step="1"
                  min="0"
                  className={inputClass}
                  placeholder="10"
                />
                <FieldError messages={variantErrors?.stock} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-3 border-t border-[#D8CDBC] pt-6">
        <a
          href="/admin/produtos"
          className="rounded-md border border-[#D8CDBC] px-4.5 py-2.5 text-sm font-medium hover:bg-[#F5F0E8]"
        >
          Cancelar
        </a>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-[#5A4738] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4A3A2D] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
