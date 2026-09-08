import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy-session";

export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Roda em tudo, menos assets estáticos e imagens otimizadas —
    // não têm sessão pra renovar, só custaria performance à toa.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
