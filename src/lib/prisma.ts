import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Em dev, o Next.js recarrega módulos a cada mudança de arquivo (Fast Refresh).
// Sem isso, cada reload criaria um novo PrismaClient e uma nova pool de
// conexões, até esgotar o limite do Postgres. Guardamos a instância no
// objeto global, que sobrevive entre reloads.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
