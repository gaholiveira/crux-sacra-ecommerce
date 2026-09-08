import { ViewTransition } from "react";

// template.tsx (diferente de layout.tsx) remonta a cada navegação — é
// exatamente esse "remontar" que dispara a transição do <ViewTransition>.
// Colocado aqui (na raiz da loja), cobre a troca entre páginas de primeiro
// nível (home, produtos, carrinho, perfil...). O navegador anima o
// crossfade sozinho, sem CSS nem JS de animação escrito por nós.
export default function StoreTemplate({ children }: { children: React.ReactNode }) {
  return <ViewTransition>{children}</ViewTransition>;
}
