"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
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
    name: z.string().trim().min(1, "Informe o nome da variante"),
    // O <input type="number"> manda o valor como string ("49.9"), sempre com
    // ponto — z.coerce.number() converte pra number e ainda valida que é um
    // número de verdade (rejeita "", "abc", etc.).
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

// fieldErrors: erros do produto em si (nome, slug...). variantErrors: erros
// por linha de variante, indexados pela mesma key que o form usa nos nomes
// dos campos — dá pra ter várias variantes na tela, cada uma com seu erro
// isolado, sem confundir com a de outra linha.
export type CreateProductState = {
  fieldErrors?: Partial<Record<string, string[]>>;
  variantErrors?: Record<string, Partial<Record<string, string[]>>>;
  generalError?: string;
} | null;

// error.meta.target (a forma "clássica" de descobrir qual coluna violou o
// unique) não vem preenchido com o driver adapter do Prisma 7 — confirmado
// testando direto contra o banco. O nome da constraint aparece em
// error.meta.driverAdapterError.cause.constraint.index — é isso que dá pra
// usar pra saber se foi o slug ou o nome da variante que colidiu.
function getConstraintIndex(error: Prisma.PrismaClientKnownRequestError): string | undefined {
  const driverAdapterError = error.meta?.driverAdapterError as
    | { cause?: { constraint?: { index?: string } } }
    | undefined;
  return driverAdapterError?.cause?.constraint?.index;
}

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

export async function createProduct(
  _prevState: CreateProductState,
  formData: FormData,
): Promise<CreateProductState> {
  await requireAdmin();

  const parsedProduct = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
    categoryId: formData.get("categoryId"),
  });

  // Cada linha de variante manda sua própria key (gerada no cliente) num
  // hidden input com o mesmo name ("variantKeys") — getAll() junta todas
  // numa lista, na mesma ordem em que apareceram no formulário.
  const variantKeys = formData.getAll("variantKeys").map(String);
  const variantResults = variantKeys.map((key) =>
    variantSchema.safeParse({
      name: formData.get(`name-${key}`),
      price: formData.get(`price-${key}`),
      compareAtPrice: formData.get(`compareAtPrice-${key}`) || undefined,
      stock: formData.get(`stock-${key}`),
    }),
  );

  if (!parsedProduct.success || variantResults.some((r) => !r.success) || variantKeys.length === 0) {
    const variantErrors: Record<string, Partial<Record<string, string[]>>> = {};
    variantKeys.forEach((key, i) => {
      const result = variantResults[i];
      if (!result.success) {
        variantErrors[key] = z.flattenError(result.error).fieldErrors;
      }
    });

    return {
      fieldErrors: parsedProduct.success ? undefined : z.flattenError(parsedProduct.error).fieldErrors,
      variantErrors: Object.keys(variantErrors).length > 0 ? variantErrors : undefined,
      generalError: variantKeys.length === 0 ? "Adicione pelo menos uma variante" : undefined,
    };
  }

  const data = parsedProduct.data;
  const variants = variantResults.map((r) => {
    // Inalcançável: já teria retornado acima se algum resultado tivesse
    // falhado. Só está aqui pra o TypeScript enxergar o tipo estreitado.
    if (!r.success) throw new Error("unreachable");
    return r.data;
  });

  // Até 3 slots de imagem (image-0, image-1, image-2) — slots vazios são
  // ignorados, a ordem em que foram preenchidos vira a ordem da galeria.
  const imageFiles = [0, 1, 2]
    .map((i) => formData.get(`image-${i}`))
    .filter((file): file is File => file instanceof File && file.size > 0);

  try {
    const imageUrls = await Promise.all(imageFiles.map(uploadProductImage));

    await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        imageUrls,
        categoryId: data.categoryId,
        variants: {
          create: variants.map((variant) => ({
            name: variant.name,
            // Math.round evita sobra de ponto flutuante (49.9 * 100 pode
            // dar 4989.999999999999 em JS) — nunca guarde dinheiro sem
            // arredondar pra inteiro antes de salvar.
            priceCents: Math.round(variant.price * 100),
            compareAtPriceCents:
              variant.compareAtPrice !== undefined ? Math.round(variant.compareAtPrice * 100) : undefined,
            stock: variant.stock,
          })),
        },
      },
    });
  } catch (error) {
    // P2002 = violação de unique constraint. Pode ser o slug (já usado por
    // outro produto) ou o nome de uma variante repetido dentro do mesmo
    // produto ([productId, name] também é @@unique) — ambos são erros
    // prováveis de alguém digitar sem querer, não bugs pra investigar.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const constraintIndex = getConstraintIndex(error);
      if (constraintIndex?.includes("slug")) {
        return { fieldErrors: { slug: ["Esse slug já está em uso por outro produto"] } };
      }
      return { generalError: "Duas variantes não podem ter o mesmo nome" };
    }
    return {
      generalError: error instanceof Error ? error.message : "Não foi possível salvar o produto",
    };
  }

  revalidatePath("/admin/produtos");
  redirect("/admin/produtos");
}
