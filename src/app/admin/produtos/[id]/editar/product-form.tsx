"use client";

import { useState } from "react";
import Image from "next/image";

const inputClass =
  "w-full rounded-md border border-[#D8CDBC] px-3 py-2.5 text-sm outline-none focus:border-[#5A4738] focus:ring-[3px] focus:ring-[#5A473859]";

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
  action: (formData: FormData) => void;
  product: Product;
  categories: Category[];
}) {
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([null, null, null]);
  const [removedSlots, setRemovedSlots] = useState<boolean[]>([false, false, false]);

  return (
    <form
      action={action}
      className="flex max-w-xl flex-col gap-6 rounded-xl border border-[#D8CDBC] bg-white p-8"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Nome do produto
        </label>
        <input id="name" name="name" className={inputClass} defaultValue={product.name} />
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
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Imagens (até 3)</span>
        <div className="flex flex-wrap gap-4">
          {[0, 1, 2].map((i) => {
            const currentUrl = product.imageUrls[i];
            const isRemoved = removedSlots[i];

            return (
              <div key={i} className="flex flex-col gap-1.5">
                {currentUrl && !previewUrls[i] && !isRemoved && (
                  <Image
                    src={currentUrl}
                    alt={`${product.name} ${i + 1}`}
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-lg border border-[#D8CDBC] object-cover"
                  />
                )}
                {previewUrls[i] && (
                  // eslint-disable-next-line @next/next/no-img-element -- preview local (blob:), next/image não aceita blob URL
                  <img
                    src={previewUrls[i]!}
                    alt={`Pré-visualização ${i + 1}`}
                    className="h-24 w-24 rounded-lg border border-[#D8CDBC] object-cover"
                  />
                )}
                <input
                  id={`image-${i}`}
                  name={`image-${i}`}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="text-xs"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setPreviewUrls((prev) => {
                      const next = [...prev];
                      next[i] = file ? URL.createObjectURL(file) : null;
                      return next;
                    });
                  }}
                />
                {currentUrl && !previewUrls[i] && (
                  <label className="flex items-center gap-1.5 text-xs text-[#6E6255]">
                    <input
                      type="checkbox"
                      name={`removeImage-${i}`}
                      checked={isRemoved}
                      onChange={(e) =>
                        setRemovedSlots((prev) => {
                          const next = [...prev];
                          next[i] = e.target.checked;
                          return next;
                        })
                      }
                    />
                    Remover
                  </label>
                )}
              </div>
            );
          })}
        </div>
        <span className="text-xs text-[#6E6255]">
          Deixe em branco pra manter a imagem atual daquele slot. A primeira vira a miniatura nas
          listagens.
        </span>
      </div>

      <div className="flex flex-col gap-4 border-t border-[#D8CDBC] pt-6">
        <h2 className="text-sm font-semibold">Variantes</h2>
        {product.variants.map((variant) => (
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
            </div>
          </div>
        ))}
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
          className="rounded-md bg-[#5A4738] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4A3A2D]"
        >
          Salvar alterações
        </button>
      </div>
    </form>
  );
}
