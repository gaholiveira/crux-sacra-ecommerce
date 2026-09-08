import { redirect } from "next/navigation";
import { getcurrentUser } from "@/lib/auth/dal";
import { createAddress } from "./actions";

const inputClass =
  "w-full rounded-md border border-[#D8CDBC] px-3 py-2.5 text-sm outline-none focus:border-[#5A4738] focus:ring-[3px] focus:ring-[#5A473859]";

export default async function NovoEnderecoPage() {
  const user = await getcurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  return (
    <div className="flex justify-center px-6 py-10 md:px-16 md:py-16">
      <form
        action={createAddress}
        className="flex w-full max-w-lg flex-col gap-5 rounded-2xl border border-[#D8CDBC] bg-white p-6 md:p-8"
      >
        <h1 className="text-2xl font-bold">Novo endereço</h1>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="recipient" className="text-sm font-medium">
            Nome de quem recebe
          </label>
          <input id="recipient" name="recipient" className={inputClass} />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-[2] flex flex-col gap-1.5">
            <label htmlFor="street" className="text-sm font-medium">
              Rua
            </label>
            <input id="street" name="street" className={inputClass} />
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <label htmlFor="number" className="text-sm font-medium">
              Número
            </label>
            <input id="number" name="number" className={inputClass} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="complement" className="text-sm font-medium">
            Complemento (opcional)
          </label>
          <input id="complement" name="complement" className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="district" className="text-sm font-medium">
            Bairro
          </label>
          <input id="district" name="district" className={inputClass} />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1 flex flex-col gap-1.5">
            <label htmlFor="city" className="text-sm font-medium">
              Cidade
            </label>
            <input id="city" name="city" className={inputClass} />
          </div>
          <div className="w-20 flex flex-col gap-1.5">
            <label htmlFor="state" className="text-sm font-medium">
              UF
            </label>
            <input id="state" name="state" maxLength={2} className={inputClass} />
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <label htmlFor="postalCode" className="text-sm font-medium">
              CEP
            </label>
            <input id="postalCode" name="postalCode" className={inputClass} />
          </div>
        </div>

        <button
          type="submit"
          className="mt-2 rounded-lg bg-[#5A4738] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4A3A2D]"
        >
          Salvar endereço
        </button>
      </form>
    </div>
  );
}