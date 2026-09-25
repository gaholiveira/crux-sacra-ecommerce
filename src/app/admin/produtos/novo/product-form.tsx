"use client";

import { useActionState, useState } from "react";
import { ImageSlot } from "@/components/image-slot";
import type { CreateProductState } from "./actions";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const inputClass =
  "w-full rounded-md border border-[#D8CDBC] px-3 py-2.5 text-sm outline-none focus:border-[#5A4738] focus:ring-[3px] focus:ring-[#5A473859]";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <span className="text-xs text-red-700">{messages[0]}</span>;
}

type Category = { id: string; name: string };

export function ProductForm({
  action,
  categories,
}: {
  action: (prevState: CreateProductState, formData: FormData) => Promise<CreateProductState>;
  categories: Category[];
}) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  // Cada variante tem uma key própria gerada no cliente (não o índice do
  // array) — assim, remover uma linha do meio não bagunça a identidade das
  // outras nem os campos que o servidor vai ler.
  const [variantKeys, setVariantKeys] = useState<string[]>(() => [crypto.randomUUID()]);

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
        <input
          id="name"
          name="name"
          className={inputClass}
          placeholder="Ex: Terço de Nossa Senhora"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
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
          placeholder="terco-de-nossa-senhora"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
        />
        <FieldError messages={errors?.slug} />
        <span className="text-xs text-[#6E6255]">
          {slugTouched
            ? "Editado manualmente."
            : "Gerado automaticamente a partir do nome. Edite se quiser."}
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
          placeholder="Descreva o produto para o cliente..."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="categoryId" className="text-sm font-medium">
          Categoria
        </label>
        <select id="categoryId" name="categoryId" className={inputClass} defaultValue="">
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
        <label htmlFor="ncm" className="text-sm font-medium">
          NCM (opcional)
        </label>
        <input
          id="ncm"
          name="ncm"
          className={`${inputClass} font-mono text-[13px]`}
          placeholder="71179000"
          maxLength={8}
        />
        <FieldError messages={errors?.ncm} />
        <span className="text-xs text-[#6E6255]">
          Necessário só na hora de emitir nota fiscal — pode preencher depois.
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Imagens (até 3)</span>
        <div className="flex flex-wrap gap-4">
          {[0, 1, 2].map((i) => (
            <ImageSlot key={i} name={`image-${i}`} badge={i === 0 ? "Miniatura" : undefined} />
          ))}
        </div>
        <span className="text-xs text-[#6E6255]">A primeira vira a miniatura nas listagens.</span>
      </div>

      <div className="flex flex-col gap-4 border-t border-[#D8CDBC] pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Variantes</h2>
          <button
            type="button"
            onClick={() => setVariantKeys((prev) => [...prev, crypto.randomUUID()])}
            className="text-sm font-medium text-[#5A4738] hover:underline"
          >
            + Adicionar variante
          </button>
        </div>
        <span className="-mt-2 text-xs text-[#6E6255]">
          Ex: tamanhos (P, M, G) ou cores — cada uma com preço e estoque próprios.
        </span>

        {variantKeys.map((key) => {
          const variantErrors = state?.variantErrors?.[key];

          return (
            <div key={key} className="flex flex-col gap-3 rounded-lg border border-[#D8CDBC] p-4">
              <input type="hidden" name="variantKeys" value={key} />

              <div className="flex items-center justify-between">
                <label htmlFor={`name-${key}`} className="text-sm font-medium">
                  Nome da variante
                </label>
                {variantKeys.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setVariantKeys((prev) => prev.filter((k) => k !== key))}
                    className="text-xs text-[#6E6255] underline hover:text-red-700"
                  >
                    Remover
                  </button>
                )}
              </div>
              <input
                id={`name-${key}`}
                name={`name-${key}`}
                className={inputClass}
                placeholder="Ex: Padrão, P, Azul..."
              />
              <FieldError messages={variantErrors?.name} />

              <div className="flex gap-4">
                <div className="flex flex-1 flex-col gap-1.5">
                  <label htmlFor={`price-${key}`} className="text-sm font-medium">
                    Preço (R$)
                  </label>
                  <input
                    id={`price-${key}`}
                    name={`price-${key}`}
                    type="number"
                    step="0.01"
                    min="0"
                    className={inputClass}
                    placeholder="49.90"
                  />
                  <FieldError messages={variantErrors?.price} />
                </div>

                <div className="flex flex-1 flex-col gap-1.5">
                  <label htmlFor={`compareAtPrice-${key}`} className="text-sm font-medium">
                    Preço original (opcional)
                  </label>
                  <input
                    id={`compareAtPrice-${key}`}
                    name={`compareAtPrice-${key}`}
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
                <label htmlFor={`stock-${key}`} className="text-sm font-medium">
                  Estoque
                </label>
                <input
                  id={`stock-${key}`}
                  name={`stock-${key}`}
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
          {isPending ? "Salvando..." : "Salvar produto"}
        </button>
      </div>
    </form>
  );
}
