import Link from "next/link";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { getcurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { publicSans } from "@/lib/fonts";
import { Header } from "./header";

// Essa layout consulta o Prisma (carrinho e usuário atual) direto, então
// precisa ser dinâmica — senão o Next congelaria o cabeçalho (contador do
// carrinho, nome do usuário) como HTML estático no build.
export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const user = await getcurrentUser();

  let cartCount = 0;
  if (user) {
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: true },
    });
    cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  }

  return (
    <ReactLenis root>
    <div
      className={`${publicSans.variable} flex min-h-screen flex-col font-[family-name:var(--font-public-sans)] bg-[#E8E0D5] text-[#3A312B]`}
    >
      <Header user={user} cartCount={cartCount} />

      <main className="flex-1">{children}</main>

      <footer className="flex flex-col gap-8 bg-[#3A312B] px-6 py-10 text-[#E8E0D5] md:px-16 md:py-14">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between sm:gap-12">
          <div className="flex max-w-xs flex-col gap-2.5">
            <span className="text-[17px] font-bold text-white">Crux Sacra</span>
            <p className="text-[13px] leading-relaxed text-[#C9B18C]">
              Artigos religiosos selecionados com cuidado para acompanhar sua fé.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-[13px] font-semibold text-white">Navegação</span>
            <Link href="/" className="text-[13px] text-[#E8E0D5]">
              Início
            </Link>
            <Link href="/produtos" className="text-[13px] text-[#E8E0D5]">
              Produtos
            </Link>
            <Link href="/#sobre" className="text-[13px] text-[#E8E0D5]">
              Sobre
            </Link>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-[13px] font-semibold text-white">Contato</span>
            <span className="text-[13px] text-[#E8E0D5]">contato@cruxsacra.com.br</span>
            <span className="text-[13px] text-[#E8E0D5]">@cruxsacra</span>
          </div>
        </div>

        <div className="border-t border-white/20 pt-5 text-xs text-[#E8E0D5]">
          © 2026 Crux Sacra. Todos os direitos reservados.
        </div>
      </footer>
    </div>
    </ReactLenis>
  );
}
