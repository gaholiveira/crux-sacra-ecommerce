import Link from "next/link";
import { login } from "./actions";

const inputClass = "w-full rounded-md border border-[#D8CDBC] px-3 py-2.5 text-sm outline-none focus:border-[#5A4738] focus:ring-[3px] focus:ring-[#5A473859]";

export default function EntrarPage() {
  return (
    <div className="flex justify-center px-6 py-10 md:px-16 md:py-16">
      <form
        action={login}
        className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-[#D8CDBC] bg-white p-6 md:p-8">
          <div>
            <h1 className="text-2xl font-bold">Entrar</h1>
            <p className="mt-1 text-sm text-[#6E6255]">
              Ainda não tem uma conta? {" "} 
              <Link href="/cadastro" className="text-[#5A4738]">
              Criar conta
              </Link>
            </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email 
                </label>
                <input id="email" name="email" type="email" className={inputClass} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium">
                  Senha
                </label>
                <input id="password" name="password" type="password" className={inputClass} />
              </div>

              <button
                type="submit"
                className="mt-2 rounded-lg bg-[#5A4738] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4A3A2D]" >
                Entrar
              </button>
            </form>
          </div>
  );
}