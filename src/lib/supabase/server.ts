import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client pro servidor: usado em Server Components, Server Actions e Route
// Handlers. Lê a sessão dos cookies da requisição atual — crie um novo a
// cada chamada, nunca reaproveite entre requisições.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado de dentro de um Server Component (não pode escrever
            // cookie ali, só Server Actions/Route Handlers podem). Sem
            // problema: o proxy.ts já cuida de renovar a sessão antes.
          }
        },
      },
    },
  );
}
