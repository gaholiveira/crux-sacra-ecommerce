import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProduct } from "./actions";
import { EditProductForm } from "./product-form";

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { variants: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <div className="mb-3 text-sm text-[#6E6255]">
        <Link href="/admin/produtos" className="text-[#5A4738] hover:underline">
          Produtos
        </Link>{" "}
        / <span className="text-[#3A312B]">Editar</span>
      </div>

      <h1 className="text-2xl font-semibold">Editar produto</h1>
      <p className="mt-1 mb-8 text-sm text-[#6E6255]">
        Atualize os dados do produto e o estoque de cada variante.
      </p>

      <EditProductForm
        action={updateProduct.bind(null, product.id)}
        product={product}
        categories={categories}
      />
    </div>
  );
}
