import { Public_Sans, Cormorant_Garamond } from "next/font/google";

// Uma única declaração compartilhada entre o layout da loja e o do admin.
// Chamar Public_Sans({...}) duas vezes em arquivos diferentes (mesmo com a
// config idêntica) confunde o Turbopack na resolução do módulo da fonte —
// "next/font/google queries have exactly one entry" — então isso não é só
// otimização, evita um erro de build de verdade.
export const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-public-sans",
});

// Serifada, só para o banner de citação da home — o resto do site continua
// só em Public Sans.
export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-cormorant",
});
