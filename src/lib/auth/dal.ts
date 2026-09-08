import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getcurrentUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  return prisma.user.findUnique({
    where: {
      id: authUser.id,
    }
  });
}

export async function requireAdmin() {
  const user = await getcurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return user;
}