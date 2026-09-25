"use client";

import { useRef, useState } from "react";

// Upload de imagem com cara de site de verdade: clica ou arrasta um arquivo
// pra cima pra escolher/trocar, passa o mouse por cima pra ver a opção de
// remover — em vez do <input type="file"> cru do navegador. Usado tanto na
// criação quanto na edição de produto; a única diferença entre os dois
// modos é `currentUrl`/`removeInputName` (só fazem sentido quando já existe
// uma imagem salva, ou seja, na edição).
export function ImageSlot({
  name,
  currentUrl,
  removeInputName,
  badge,
}: {
  name: string;
  currentUrl?: string | null;
  removeInputName?: string;
  badge?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const displayUrl = previewUrl ?? (removed ? null : (currentUrl ?? null));

  function assignFile(file: File) {
    const input = inputRef.current;
    if (!input) return;
    // Um <input type="file"> não aceita receber um File por atribuição
    // direta — precisa passar por um DataTransfer, que é o mesmo mecanismo
    // que o navegador usa internamente quando você escolhe um arquivo à
    // mão. Sem isso, o arquivo arrastado nunca iria junto no FormData.
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
    setPreviewUrl(URL.createObjectURL(file));
    setRemoved(false);
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) assignFile(file);
        }}
        className={`group relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 transition-colors ${
          isDragOver
            ? "border-[#5A4738] bg-[#F5F0E8]"
            : displayUrl
              ? "border-[#D8CDBC]"
              : "border-dashed border-[#D8CDBC] hover:border-[#5A4738]"
        }`}
      >
        <input
          ref={inputRef}
          name={name}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) assignFile(file);
          }}
        />

        {badge && (
          <span className="absolute top-1 left-1 z-10 rounded bg-[#3A312B]/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {badge}
          </span>
        )}

        {displayUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- preview local (blob:) e imagens já salvas, next/image não serve pros dois casos aqui */}
            <img src={displayUrl} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="text-xs font-medium text-white">Trocar</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setRemoved(true);
                  setPreviewUrl(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                aria-label="Remover imagem"
                className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-bold text-white hover:bg-white/40"
              >
                ✕
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 px-2 text-center text-[#A99C8C]">
            <span className="text-2xl leading-none">+</span>
            <span className="text-[11px]">Arraste ou clique</span>
          </div>
        )}
      </div>

      {/* Checkbox real (não visível), pra chegar no FormData exatamente como
          o servidor já espera (formData.get(name) === "on") — só é marcado
          programaticamente pelo botão "✕" acima, nunca clicado direto. */}
      {removeInputName && (
        <input
          type="checkbox"
          name={removeInputName}
          checked={removed}
          onChange={() => {}}
          className="hidden"
        />
      )}
    </div>
  );
}
