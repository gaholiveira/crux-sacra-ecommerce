import { createBrowserClient } from "@supabase/ssr";

// Client pro navegador: usado em Client Components ("use client").
// Guarda a sessão em cookies (não localStorage), pra que o servidor
// consiga ler o mesmo login nas próximas requisições.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
