import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const testimonials = [
  {
    quote: "Comprei um terço de presente e a qualidade surpreendeu. Chegou muito bem embalado.",
    name: "Maria S.",
  },
  {
    quote: "Loja séria, entrega rápida. O crucifixo de madeira é ainda mais bonito pessoalmente.",
    name: "João P.",
  },
  {
    quote: "Já é a segunda compra. Atendimento atencioso e produtos com significado de verdade.",
    name: "Ana L.",
  },
];

function Star() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.9 6.9 7.1.6-5.5 4.7 1.7 7-6.2-3.9-6.2 3.9 1.7-7L2 9.5l7.1-.6z" />
    </svg>
  );
}

export default async function HomePage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      {/* Hero com banner */}
      <section className="relative flex h-[360px] items-center overflow-hidden bg-gradient-to-br from-[#F0E7D8] to-[#F0E6D4] md:h-[480px]">
        <svg
          className="absolute top-1/2 -right-16 hidden -translate-y-1/2 opacity-50 md:block"
          width="480"
          height="480"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#C9B18C"
          strokeWidth="0.6"
        >
          <path d="M12 2v20M6 7h12" />
        </svg>
        <div className="relative flex max-w-xl flex-col gap-4 px-6 md:px-16">
          <span className="text-xs font-semibold tracking-widest text-[#5A4738] uppercase">
            Nova coleção
          </span>
          <h1 className="text-[28px] leading-[1.15] font-bold text-[#3A312B] md:text-[44px]">
            Artigos religiosos para acompanhar sua fé
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-[#6E6255] md:text-base">
            Terços, crucifixos, imagens e outros objetos de devoção, selecionados com cuidado
            para todos os momentos da sua caminhada.
          </p>
          <Link
            href="/produtos"
            className="mt-2 w-fit rounded-lg bg-[#5A4738] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4A3A2D] md:px-7 md:py-3.5 md:text-[15px]"
          >
            Explorar produtos
          </Link>
        </div>
      </section>

      {/* Categorias */}
      <section className="px-6 py-10 md:px-16 md:py-18">
        <h2 className="text-xl font-bold md:text-[26px]">Categorias</h2>
        <p className="mt-2 mb-6 text-sm text-[#6E6255] md:mb-8 md:text-[15px]">
          Encontre o que procura por tipo de produto.
        </p>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categorias/${category.slug}`}
              className="relative flex h-[140px] items-end overflow-hidden rounded-2xl bg-[#F0E6D4] md:h-[220px]"
            >
              <span className="w-full bg-[#3A312B]/70 p-2.5 text-center text-xs font-semibold text-white md:p-3.5 md:text-sm">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Sobre */}
      <section
        id="sobre"
        className="flex flex-col items-center gap-8 bg-white px-6 py-10 md:flex-row md:gap-14 md:px-16 md:py-18"
      >
        <div className="h-[200px] w-full shrink-0 rounded-2xl bg-[#F0E6D4] md:h-[340px] md:w-[420px]" />
        <div className="flex max-w-xl flex-col gap-4">
          <span className="text-xs font-semibold tracking-widest text-[#5A4738] uppercase">
            Sobre nós
          </span>
          <h2 className="text-xl leading-tight font-bold md:text-[28px]">Nossa história</h2>
          <p className="text-sm leading-relaxed text-[#6E6255] md:text-[15px]">
            Texto de exemplo — substituir pela história real da Crux Sacra: há quanto tempo
            existe, o que motivou a criação da loja, e o cuidado por trás da seleção de cada
            peça.
          </p>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="px-6 py-10 md:px-16 md:py-18">
        <h2 className="text-center text-xl font-bold md:text-[26px]">
          O que as pessoas dizem sobre nossos produtos
        </h2>
        <p className="mt-1 mb-8 text-center text-[13px] text-[#6E6255] md:mb-10">
          Depoimentos de exemplo — substituir por avaliações reais de clientes.
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="flex flex-col gap-3.5 rounded-2xl border border-[#D8CDBC] bg-white p-7"
            >
              <div className="flex gap-0.5 text-[#C9B18C]">
                <Star />
                <Star />
                <Star />
                <Star />
                <Star />
              </div>
              <p className="text-sm leading-relaxed text-[#3A312B]">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <span className="text-sm font-semibold text-[#6E6255]">{testimonial.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Redes sociais */}
      <section className="flex flex-col items-center gap-5 bg-[#F0E7D8] px-6 py-12 text-center md:px-16 md:py-14">
        <h2 className="text-xl font-bold">Siga as redes sociais</h2>
        <p className="text-sm text-[#6E6255]">
          Acompanhe lançamentos e promoções em primeira mão.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="#"
            className="flex items-center gap-2 rounded-full border border-[#C9B18C] px-5 py-2.5 text-sm font-medium"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
            </svg>
            Instagram
          </a>
          <a
            href="#"
            className="flex items-center gap-2 rounded-full border border-[#C9B18C] px-5 py-2.5 text-sm font-medium"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M15 3h-2a4 4 0 0 0-4 4v3H6v4h3v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
            Facebook
          </a>
          <a
            href="#"
            className="flex items-center gap-2 rounded-full border border-[#C9B18C] px-5 py-2.5 text-sm font-medium"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 20l1.1-5.4A8.5 8.5 0 1 1 21 11.5Z" />
            </svg>
            WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
