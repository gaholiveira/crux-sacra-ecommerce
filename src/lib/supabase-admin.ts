import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Client com a service role: ignora RLS e as políticas de Storage.
// Só pode ser importado em código que roda no servidor (Server Actions,
// Route Handlers) — o pacote "server-only" faz o build falhar se algum
// componente cliente tentar importar isso por engano.
//
// Criado sob demanda (não no carregamento do módulo): o Next.js avalia
// esse arquivo ao coletar dados das páginas durante o build, e isso
// aconteceria mesmo sem o DATABASE_URL/Supabase configurados ainda.
let client: SupabaseClient | undefined;

export function getSupabaseAdmin(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidos no .env",
      );
    }

    client = createClient(url, serviceKey, { auth: { persistSession: false } });
  }

  return client;
}

export const PRODUCT_IMAGES_BUCKET = "product-images";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

// image.type vem do navegador — não é prova de que o arquivo é mesmo uma
// imagem, mas evita o caso comum (alguém troca sem querer, ou o formulário
// é usado errado) de mandar um tipo/arquivo inesperado pro Storage.
export function assertValidProductImage(image: File): void {
  if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
    throw new Error(`Formato de imagem não suportado: ${image.type || "desconhecido"}`);
  }
  if (image.size > MAX_IMAGE_BYTES) {
    throw new Error("Imagem muito grande (máximo 5MB)");
  }
}
