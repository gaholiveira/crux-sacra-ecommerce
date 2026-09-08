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
  variantStock: z.coerce
    .number()
    .int("Estoque deve ser um número inteiro")
    .nonnegative("Estoque não pode ser negativo"),
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

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const parsed = productSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
    categoryId: formData.get("categoryId"),
    variantName: formData.get("variantName"),
    variantPrice: formData.get("variantPrice"),
    variantStock: formData.get("variantStock"),
  });

  const image = formData.get("image");
  const imageUrl =
    image instanceof File && image.size > 0 ? await uploadProductImage(image) : undefined;

  await prisma.product.create({
    data: {
      name: parsed.name,
      slug: parsed.slug,
      description: parsed.description,
      imageUrl,
      categoryId: parsed.categoryId,
      variants: {
        create: [
          {
            name: parsed.variantName,
            // Math.round evita sobra de ponto flutuante (49.9 * 100 pode dar
            // 4989.999999999999 em JS) — nunca guarde dinheiro sem arredondar
            // pra inteiro antes de salvar.
            priceCents: Math.round(parsed.variantPrice * 100),
            stock: parsed.variantStock,
          },
        ],
      },
    },
  });

  revalidatePath("/admin/produtos");
  redirect("/admin/produtos");
}
