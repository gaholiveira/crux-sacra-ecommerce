import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma, Role } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const roleLabels: Record<string, string> = {
  CUSTOMER: "Cliente",
  ADMIN: "Admin",
};

const inputClass =
  "w-full rounded-md border border-[#D8CDBC] px-3 py-2 text-sm outline-none focus:border-[#5A4738] focus:ring-[3px] focus:ring-[#5A473859]";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const { role, q } = await searchParams;

  const roleFilter = role && role in roleLabels ? role : undefined;

  const where: Prisma.UserWhereInput = {
    ...(roleFilter ? { role: roleFilter as Role } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <p className="mt-1 text-sm text-[#6E6255]">{users.length} conta(s) encontrada(s).</p>
      </div>

      <form className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-[#D8CDBC] bg-white p-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="q" className="text-sm font-medium">
            Nome ou e-mail
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar cliente"
            className={`${inputClass} w-full sm:w-56`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="role" className="text-sm font-medium">
            Tipo de conta
          </label>
          <select id="role" name="role" defaultValue={role ?? ""} className={`${inputClass} w-full sm:w-56`}>
            <option value="">Todos</option>
            {Object.entries(roleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="rounded-md bg-[#5A4738] px-5 py-2 text-sm font-semibold text-white hover:bg-[#4A3A2D]"
        >
          Filtrar
        </button>
        {(role || q) && (
          <Link href="/admin/clientes" className="text-sm text-[#5A4738] hover:underline">
            Limpar filtros
          </Link>
        )}
      </form>

      <div className="overflow-hidden rounded-xl border border-[#D8CDBC] bg-white">
        {users.length === 0 ? (
          <p className="p-10 text-center text-sm text-[#6E6255]">Nenhum cliente encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-[#D8CDBC] text-left text-[#6E6255]">
                  <th className="px-6 py-3 font-medium">Nome</th>
                  <th className="px-6 py-3 font-medium">E-mail</th>
                  <th className="px-6 py-3 font-medium">Tipo</th>
                  <th className="px-6 py-3 font-medium">Pedidos</th>
                  <th className="px-6 py-3 font-medium">Cliente desde</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-[#D8CDBC] last:border-0">
                    <td className="px-6 py-3 font-medium text-[#3A312B]">{user.name ?? "—"}</td>
                    <td className="px-6 py-3 text-[#6E6255]">{user.email}</td>
                    <td className="px-6 py-3">
                      <span className="rounded-full bg-[#F0E6D4] px-3 py-1 text-xs font-medium text-[#5A4738]">
                        {roleLabels[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-[#6E6255]">{user._count.orders}</td>
                    <td className="px-6 py-3 text-[#6E6255]">{formatDate(user.createdAt)}</td>
                    <td className="px-6 py-3 text-right">
                      <Link href={`/admin/clientes/${user.id}`} className="text-[#5A4738] hover:underline">
                        Ver detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
