"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.email("informe um email válido"),
  password: z.string().min(1, "informe uma senha"),
})

export async function login(formData: FormData) {
  const parsed = loginSchema.parse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.email,
    password: parsed.password,
  });

  if (error) {
    throw new Error(error?.message || "Falha ao fazer login");
  }

  redirect("/");
}