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

const variantSchema = z
  .object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1, "Informe o nome da variante"),
    price: z.coerce.number().nonnegative("Preço não pode ser negativo"),
    // Vazio vira undefined (sem promoção) — string vazia coagida por
    // z.coerce.number() daria 0, o que pareceria uma promoção de "de graça".
    compareAtPrice: z.coerce.number().nonnegative("Preço original não pode ser negativo").optional(),
    stock: z.coerce.number().int("Estoque deve ser um número inteiro").nonnegative("Estoque não pode ser negativo"),
  })
  .refine((data) => data.compareAtPrice === undefined || data.compareAtPrice > data.price, {
    message: "Preço original deve ser maior que o preço atual",
    path: ["compareAtPrice"],
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
      compareAtPrice: formData.get(`compareAtPrice-${id}`) || undefined,
      stock: formData.get(`stock-${id}`),
    }),
  );

  // Cada slot (0, 1, 2) pode: ganhar um arquivo novo (substitui), ser
  // marcado pra remover (esvazia), ou nenhum dos dois (mantém a imagem que
  // já estava naquela posição). Slots vazios no final são descartados —
  // por isso o array final pode ficar menor que 3.
  const currentProduct = await prisma.product.findUnique({
    where: { id: productId },
    select: { imageUrls: true },
  });
  const currentImages = currentProduct?.imageUrls ?? [];

  const slots = await Promise.all(
    [0, 1, 2].map(async (i) => {
      const file = formData.get(`image-${i}`);
      if (file instanceof File && file.size > 0) {
        return uploadProductImage(file);
      }
      if (formData.get(`removeImage-${i}`) === "on") {
        return null;
      }
      return currentImages[i] ?? null;
    }),
  );
  const imageUrls = slots.filter((url): url is string => url !== null);

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
        imageUrls,
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
          compareAtPriceCents:
            variant.compareAtPrice !== undefined ? Math.round(variant.compareAtPrice * 100) : null,
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
