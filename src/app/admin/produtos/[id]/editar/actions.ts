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
  // Opcional — só vira bloqueio na hora de emitir nota fiscal (ver
  // src/lib/focusnfe.ts), com mensagem citando o produto.
  ncm: z
    .string()
    .trim()
    .regex(/^\d{8}$/, "NCM deve ter 8 dígitos")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

const newVariantFields = {
  name: z.string().trim().min(1, "Informe o nome da variante"),
  price: z.coerce.number().nonnegative("Preço não pode ser negativo"),
  // Vazio vira undefined (sem promoção) — string vazia coagida por
  // z.coerce.number() daria 0, o que pareceria uma promoção de "de graça".
  compareAtPrice: z.coerce.number().nonnegative("Preço original não pode ser negativo").optional(),
  stock: z.coerce.number().int("Estoque deve ser um número inteiro").nonnegative("Estoque não pode ser negativo"),
};
const comparePriceRefine = {
  check: (data: { compareAtPrice?: number; price: number }) =>
    data.compareAtPrice === undefined || data.compareAtPrice > data.price,
  message: "Preço original deve ser maior que o preço atual",
};

// Variante já existente: precisa do id pra saber qual linha do banco
// atualizar.
const variantSchema = z
  .object({ id: z.string().trim().min(1), ...newVariantFields })
  .refine(comparePriceRefine.check, { message: comparePriceRefine.message, path: ["compareAtPrice"] });

// Variante nova (adicionada nessa edição, ainda sem id): mesmos campos,
// sem o id — vira um create() em vez de update() na transação.
const newVariantSchema = z
  .object(newVariantFields)
  .refine(comparePriceRefine.check, { message: comparePriceRefine.message, path: ["compareAtPrice"] });

// Erros de produto (name, slug...) e de cada variante (indexado pelo id
// dela, já que pode ter várias na mesma tela) ficam separados — o form usa
// cada um pra saber embaixo de qual campo, em qual linha, mostrar a
// mensagem.
export type UpdateProductState = {
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

export async function updateProduct(
  productId: string,
  _prevState: UpdateProductState,
  formData: FormData,
): Promise<UpdateProductState> {
  await requireAdmin();

  const parsedProduct = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
    categoryId: formData.get("categoryId"),
    ncm: formData.get("ncm") || undefined,
  });

  // Cada linha de variante já existente manda seu próprio id num hidden
  // input com o mesmo name ("variantIds") — getAll() junta todos numa
  // lista, na mesma ordem em que apareceram no formulário.
  const variantIds = formData.getAll("variantIds").map(String);
  const variantResults = variantIds.map((id) =>
    variantSchema.safeParse({
      id,
      name: formData.get(`name-${id}`),
      price: formData.get(`price-${id}`),
      compareAtPrice: formData.get(`compareAtPrice-${id}`) || undefined,
      stock: formData.get(`stock-${id}`),
    }),
  );

  // Variantes novas adicionadas nessa edição (botão "+ Adicionar variante")
  // — key gerada no cliente, não existe linha no banco ainda pra elas.
  const newVariantKeys = formData.getAll("newVariantKeys").map(String);
  const newVariantResults = newVariantKeys.map((key) =>
    newVariantSchema.safeParse({
      name: formData.get(`new-name-${key}`),
      price: formData.get(`new-price-${key}`),
      compareAtPrice: formData.get(`new-compareAtPrice-${key}`) || undefined,
      stock: formData.get(`new-stock-${key}`),
    }),
  );

  // Junta os três tipos de erro (produto + variantes existentes + novas)
  // numa resposta só, pra quem está preenchendo ver tudo que precisa
  // corrigir de uma vez, em vez de descobrir um erro por tentativa.
  if (
    !parsedProduct.success ||
    variantResults.some((r) => !r.success) ||
    newVariantResults.some((r) => !r.success)
  ) {
    const variantErrors: Record<string, Partial<Record<string, string[]>>> = {};
    variantIds.forEach((id, i) => {
      const result = variantResults[i];
      if (!result.success) {
        variantErrors[id] = z.flattenError(result.error).fieldErrors;
      }
    });
    newVariantKeys.forEach((key, i) => {
      const result = newVariantResults[i];
      if (!result.success) {
        variantErrors[key] = z.flattenError(result.error).fieldErrors;
      }
    });

    return {
      fieldErrors: parsedProduct.success ? undefined : z.flattenError(parsedProduct.error).fieldErrors,
      variantErrors: Object.keys(variantErrors).length > 0 ? variantErrors : undefined,
    };
  }

  const parsed = parsedProduct.data;
  const variants = variantResults.map((r) => {
    // Inalcançável: já teria retornado acima se algum resultado tivesse
    // falhado. Só está aqui pra o TypeScript enxergar o tipo estreitado.
    if (!r.success) throw new Error("unreachable");
    return r.data;
  });
  const newVariants = newVariantResults.map((r) => {
    if (!r.success) throw new Error("unreachable");
    return r.data;
  });

  try {
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
          // undefined em update() significa "não mexe" — aqui queremos o
          // oposto (campo vazio precisa conseguir apagar um NCM já salvo),
          // então normaliza pra null explicitamente.
          ncm: parsed.ncm ?? null,
        },
      }),
      ...variants.map((variant) => {
        const stockChanged = currentStockById.get(variant.id) !== variant.stock;
        return prisma.productVariant.update({
          where: { id: variant.id },
          data: {
            name: variant.name,
            // Math.round evita sobra de ponto flutuante (49.9 * 100 pode dar
            // 4989.999999999999 em JS) — nunca guarde dinheiro sem
            // arredondar pra inteiro antes de salvar.
            priceCents: Math.round(variant.price * 100),
            compareAtPriceCents:
              variant.compareAtPrice !== undefined ? Math.round(variant.compareAtPrice * 100) : null,
            stock: variant.stock,
            // Só incrementa a versão quando o estoque de fato muda — invalida
            // qualquer checkout que já tinha lido o valor antigo (evita
            // vender uma unidade que o admin acabou de zerar), sem penalizar
            // edições que não mexem em estoque (ex: corrigir só o preço).
            ...(stockChanged ? { stockVersion: { increment: 1 } } : {}),
          },
        });
      }),
      ...newVariants.map((variant) =>
        prisma.productVariant.create({
          data: {
            productId,
            name: variant.name,
            priceCents: Math.round(variant.price * 100),
            compareAtPriceCents:
              variant.compareAtPrice !== undefined ? Math.round(variant.compareAtPrice * 100) : undefined,
            stock: variant.stock,
          },
        }),
      ),
    ]);
  } catch (error) {
    // P2002 = violação de unique constraint. Pode ser o slug (já usado por
    // outro produto) ou o nome de uma variante repetido nesse produto
    // ([productId, name] também é @@unique) — ambos prováveis de alguém
    // digitar sem querer, não bugs pra investigar.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const constraintIndex = getConstraintIndex(error);
      if (constraintIndex?.includes("slug")) {
        return { fieldErrors: { slug: ["Esse slug já está em uso por outro produto"] } };
      }
      return { generalError: "Duas variantes não podem ter o mesmo nome" };
    }
    return {
      generalError: error instanceof Error ? error.message : "Não foi possível salvar as alterações",
    };
  }

  revalidatePath("/admin/produtos");
  redirect("/admin/produtos");
}
