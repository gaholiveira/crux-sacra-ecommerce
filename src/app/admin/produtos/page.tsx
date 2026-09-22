import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

// Consulta o Prisma direto (não via fetch), então o Next não tem como
// saber que o dado muda — sem isso, ele prerenderizaria a lista uma vez
// no build e serviria esse HTML congelado depois.
export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { variants: true},
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Produtos</h1>
          <p className="mt-1 text-sm text-[#6E6255]">
            {products.length} produto(s) cadastrado(s).
          </p>
        </div>
        <Link
          href="/admin/produtos/novo"
          className="rounded-lg bg-[#5A4738] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4A3A2D]"
        >
          Novo produto
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#D8CDBC] bg-white">
        {products.length === 0 ? (
          <p className="p-10 text-center text-sm text-[#6E6255]">
            Nenhum produto cadastrado ainda.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#D8CDBC] text-left text-[#6E6255]">
                <th className="px-6 py-3 font-medium">Imagem</th>
                <th className="px-6 py-3 font-medium">Nome</th>
                <th className="px-6 py-3 font-medium">Slug</th>
                <th className="px-6 py-3 font-medium">Preço</th>
                <th className="px-6 py-3 font-medium">Estoque</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-[#D8CDBC] last:border-0">
                  <td className="px-6 py-3">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-[#F0E6D4]" />
                    )}
                  </td>
                  <td className="px-6 py-3 font-medium">{product.name}</td>
                  <td className="px-6 py-3 font-mono text-xs text-[#6E6255]">
                    {product.slug}
                  </td>
                  <td className="px-6 py-3">
                    {product.variants[0]
                    ? new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(product.variants[0].priceCents / 100)
                    : "-"}
                  </td>
                  <td className="px-6 py-3">
                    {(() => {
                      const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
                      return (
                        <span className={totalStock === 0 ? "font-medium text-red-700" : ""}>
                          {totalStock}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Link
                      href={`/admin/produtos/${product.id}/editar`}
                      className="text-[#5A4738] hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
