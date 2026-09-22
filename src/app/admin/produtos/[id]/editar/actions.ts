"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin, PRODUCT_IMAGES_BUCKET } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth/dal";

const productSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do produto"),
  slug: z
    .string()
    .trim()
    .min(1, "Informe o slug")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífen"),
  description: z.string().trim().optional(),
  categoryId: z.string().trim().min(1, "Selecione uma categoria"),
});

const variantSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1, "Informe o nome da variante"),
  price: z.coerce.number().nonnegative("Preço não pode ser negativo"),
  stock: z.coerce.number().int("Estoque deve ser um número inteiro").nonnegative("Estoque não pode ser negativo"),
});

async function uploadProductImage(image: File): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin();
  const ext = image.name.split(".").pop() ?? "jpg";
  const path = `${randomUUID()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, image, { contentType: image.type });

  if (error) {
    throw new Error(`Falha ao enviar imagem: ${error.message}`);
  }

  return supabaseAdmin.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function updateProduct(productId: string, formData: FormData) {
  await requireAdmin();

  const parsed = productSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
    categoryId: formData.get("categoryId"),
  });

  // Cada linha de variante manda seu próprio id num hidden input com o mesmo
  // name ("variantIds") — formData.getAll junta todos numa lista, na mesma
  // ordem em que apareceram no formulário.
  const variantIds = formData.getAll("variantIds").map(String);
  const variants = variantIds.map((id) =>
    variantSchema.parse({
      id,
      name: formData.get(`name-${id}`),
      price: formData.get(`price-${id}`),
      stock: formData.get(`stock-${id}`),
    }),
  );

  const image = formData.get("image");
  const imageUrl =
    image instanceof File && image.size > 0 ? await uploadProductImage(image) : undefined;

  const currentVariants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: { id: true, stock: true },
  });
  const currentStockById = new Map(currentVariants.map((v) => [v.id, v.stock]));

  await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: {
        name: parsed.name,
        slug: parsed.slug,
        description: parsed.description,
        categoryId: parsed.categoryId,
        ...(imageUrl ? { imageUrl } : {}),
      },
    }),
    ...variants.map((variant) => {
      const stockChanged = currentStockById.get(variant.id) !== variant.stock;
      return prisma.productVariant.update({
        where: { id: variant.id },
        data: {
          name: variant.name,
          // Math.round evita sobra de ponto flutuante (49.9 * 100 pode dar
          // 4989.999999999999 em JS) — nunca guarde dinheiro sem arredondar
          // pra inteiro antes de salvar.
          priceCents: Math.round(variant.price * 100),
          stock: variant.stock,
          // Só incrementa a versão quando o estoque de fato muda — invalida
          // qualquer checkout que já tinha lido o valor antigo (evita vender
          // uma unidade que o admin acabou de zerar), sem penalizar edições
          // que não mexem em estoque (ex: corrigir só o preço).
          ...(stockChanged ? { stockVersion: { increment: 1 } } : {}),
        },
      });
    }),
  ]);

  revalidatePath("/admin/produtos");
  redirect("/admin/produtos");
}
