"use server";

import {redirect} from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const signUpSchema = z.object({
    name: z.string().trim().min(1, "informe seu nome"),
    email: z.email("informe um email válido"),
    password: z.string().min(8, "informe uma senha com pelo menos 8 caracteres"),
});

export async function signUp(formData: FormData) {
  const parsed = signUpSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
  });

  if (error || !data.user) {
    throw new Error(error?.message || "Falha ao criar conta");
  }

  await prisma.user.create({
    data: {
      id: data.user.id,
      email: parsed.email,
      name: parsed.name,  
    },
  });

  redirect("/");
  
}