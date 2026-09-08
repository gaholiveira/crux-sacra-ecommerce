import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Roda a cada requisição (chamado pelo proxy.ts). O token de acesso da
// Supabase expira em ~1h — essa função renova ele e regrava o cookie ANTES
// da página renderizar. Sem isso, o usuário é deslogado de forma silenciosa
// e difícil de debugar depois que o token expira.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() valida o token com o servidor da Supabase (não confia só no
  // que está no cookie) — é essa chamada que dispara a renovação.
  await supabase.auth.getUser();

  return response;
}
