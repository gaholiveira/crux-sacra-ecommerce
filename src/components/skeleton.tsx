// Bloco cinza pulsante — a peça básica de todo skeleton do site. Usado só
// dentro de arquivos loading.tsx (Server Components), então não precisa de
// "use client": animate-pulse é puro CSS.
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-[#F0E6D4] ${className}`} />;
}
