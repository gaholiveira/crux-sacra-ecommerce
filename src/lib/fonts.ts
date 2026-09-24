import { Public_Sans } from "next/font/google";

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
