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
  variantName: z.string().trim().min(1, "Informe o nome da variante"),
  // O <input type="number"> manda o valor como string ("49.9"), sempre com
  // ponto — z.coerce.number() converte pra number e ainda valida que é um
  // número de verdade (rejeita "", "abc", etc.).
  variantPrice: z.coerce.number().nonnegative("Preço não pode ser negativo"),
  // Vazio vira undefined (sem promoção) — string vazia coagida por
  // z.coerce.number() daria 0, o que pareceria uma promoção de "de graça".
  variantCompareAtPrice: z.coerce
    .number()
    .nonnegative("Preço original não pode ser negativo")
    .optional(),
  variantStock: z.coerce
    .number()
    .int("Estoque deve ser um número inteiro")
    .nonnegative("Estoque não pode ser negativo"),
}).refine(
  (data) => data.variantCompareAtPrice === undefined || data.variantCompareAtPrice > data.variantPrice,
  { message: "Preço original deve ser maior que o preço atual", path: ["variantCompareAtPrice"] },
);

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

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const parsed = productSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
    categoryId: formData.get("categoryId"),
    variantName: formData.get("variantName"),
    variantPrice: formData.get("variantPrice"),
    variantCompareAtPrice: formData.get("variantCompareAtPrice") || undefined,
    variantStock: formData.get("variantStock"),
  });

  // Até 3 slots de imagem (image-0, image-1, image-2) — slots vazios são
  // ignorados, a ordem em que foram preenchidos vira a ordem da galeria.
  const imageFiles = [0, 1, 2]
    .map((i) => formData.get(`image-${i}`))
    .filter((file): file is File => file instanceof File && file.size > 0);
  const imageUrls = await Promise.all(imageFiles.map(uploadProductImage));

  await prisma.product.create({
    data: {
      name: parsed.name,
      slug: parsed.slug,
      description: parsed.description,
      imageUrls,
      categoryId: parsed.categoryId,
      variants: {
        create: [
          {
            name: parsed.variantName,
            // Math.round evita sobra de ponto flutuante (49.9 * 100 pode dar
            // 4989.999999999999 em JS) — nunca guarde dinheiro sem arredondar
            // pra inteiro antes de salvar.
            priceCents: Math.round(parsed.variantPrice * 100),
            compareAtPriceCents:
              parsed.variantCompareAtPrice !== undefined
                ? Math.round(parsed.variantCompareAtPrice * 100)
                : undefined,
            stock: parsed.variantStock,
          },
        ],
      },
    },
  });

  revalidatePath("/admin/produtos");
  redirect("/admin/produtos");
}
