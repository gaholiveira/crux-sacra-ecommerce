import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createProduct } from "./actions";
import { ProductForm } from "./product-form";

export default async function NovoProdutoPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <div className="mb-3 text-sm text-[#6E6255]">
        <Link href="/admin/produtos" className="text-[#5A4738] hover:underline">
          Produtos
        </Link>{" "}
        / <span className="text-[#3A312B]">Novo produto</span>
      </div>

      <h1 className="text-2xl font-semibold">Novo produto</h1>
      <p className="mt-1 mb-8 text-sm text-[#6E6255]">
        Cadastre as informações básicas. Variantes, preço e estoque são adicionados depois.
      </p>

      <ProductForm action={createProduct} categories={categories} />
    </div>
  );
}
