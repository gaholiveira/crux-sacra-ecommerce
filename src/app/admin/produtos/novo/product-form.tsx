"use client";

import { useState } from "react";

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

type Category = { id: string; name: string };

export function ProductForm({
  action,
  categories,
}: {
  action: (formData: FormData) => void;
  categories: Category[];
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([null, null, null]);

  return (
    <form
      action={action}
      className="flex max-w-xl flex-col gap-6 rounded-xl border border-[#D8CDBC] bg-white p-8"
    >
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
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Imagens (até 3)</span>
        <div className="flex flex-wrap gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-1.5">
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
              {previewUrls[i] && (
                // eslint-disable-next-line @next/next/no-img-element -- preview local (blob:), next/image não aceita blob URL
                <img
                  src={previewUrls[i]!}
                  alt={`Pré-visualização ${i + 1}`}
                  className="h-24 w-24 rounded-lg border border-[#D8CDBC] object-cover"
                />
              )}
            </div>
          ))}
        </div>
        <span className="text-xs text-[#6E6255]">A primeira vira a miniatura nas listagens.</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="variantName" className="text-sm font-medium">
          Nome da variante
        </label>
        <input
          id="variantName"
          name="variantName"
          className={inputClass}
          placeholder="Ex: Padrão"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="variantPrice" className="text-sm font-medium">
            Preço (R$)
          </label>
          <input
            id="variantPrice"
            name="variantPrice"
            type="number"
            step="0.01"
            min="0"
            className={inputClass}
            placeholder="49.90"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="variantCompareAtPrice" className="text-sm font-medium">
            Preço original (opcional)
          </label>
          <input
            id="variantCompareAtPrice"
            name="variantCompareAtPrice"
            type="number"
            step="0.01"
            min="0"
            className={inputClass}
            placeholder="69.90"
          />
          <span className="text-xs text-[#6E6255]">Preenche pra mostrar riscado como promoção.</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="variantStock" className="text-sm font-medium">
          Estoque
        </label>
        <input
          id="variantStock"
          name="variantStock"
          type="number"
          step="1"
          min="0"
          className={inputClass}
          placeholder="10"
        />
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
          Salvar produto
        </button>
      </div>
    </form>
  );
}
