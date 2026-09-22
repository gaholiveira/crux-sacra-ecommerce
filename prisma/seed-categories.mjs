import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const categories = [
  { slug: "tercos", name: "Terços" },
  { slug: "camisetas", name: "Camisetas" },
  { slug: "dezena-para-carros", name: "Dezena Para Carros" },
  { slug: "pulseiras", name: "Pulseiras" },
  { slug: "chaveiros", name: "Chaveiros" },
  // Categoria especial: tratada diferente na página (src/app/(store)/categorias/[slug]/page.tsx)
  // — mostra galeria de exemplos + botão de WhatsApp, não a grade de produtos comum.
  { slug: "personalizado", name: "Personalizado" },
];

for (const category of categories) {
  const result = await prisma.category.upsert({
    where: { slug: category.slug },
    update: { name: category.name },
    create: category,
  });
  console.log(`OK: ${result.name} (${result.slug})`);
}

// Remove categorias antigas (chutes que não correspondem à lista real).
// Produtos ligados a elas voltam para "sem categoria" (categoryId null),
// nunca são apagados.
const keepSlugs = categories.map((c) => c.slug);
const removed = await prisma.category.deleteMany({
  where: { slug: { notIn: keepSlugs } },
});
if (removed.count > 0) {
  console.log(`Removidas ${removed.count} categoria(s) antiga(s).`);
}

await prisma.$disconnect();
