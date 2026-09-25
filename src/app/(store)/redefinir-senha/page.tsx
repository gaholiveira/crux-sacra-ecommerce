import { redirect } from "next/navigation";
import { getcurrentUser } from "@/lib/auth/dal";
import { ResetPasswordForm } from "./reset-password-form";

export default async function RedefinirSenhaPage() {
  const user = await getcurrentUser();

  // Sem sessão nenhuma, não tem por que estar aqui — cobre tanto quem
  // chegou direto na URL quanto um link já usado/expirado.
  if (!user) {
    redirect("/entrar");
  }

  return (
    <div className="flex justify-center px-6 py-10 md:px-16 md:py-16">
      <ResetPasswordForm />
    </div>
  );
}
