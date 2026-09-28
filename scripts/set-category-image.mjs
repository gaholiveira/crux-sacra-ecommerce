// Sobe (ou troca) a foto de capa de uma categoria, mostrada no card da home.
// Uso: node scripts/set-category-image.mjs <slug-da-categoria> <caminho-da-imagem>
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const BUCKET = "product-images";

const [, , slug, imagePath] = process.argv;

if (!slug || !imagePath) {
  console.error("Uso: node scripts/set-category-image.mjs <slug-da-categoria> <caminho-da-imagem>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const category = await prisma.category.findUnique({ where: { slug } });
if (!category) {
  console.error(`Categoria com slug "${slug}" não encontrada.`);
  process.exit(1);
}

const fileBytes = await readFile(imagePath);
const ext = extname(imagePath).replace(".", "") || "jpg";
const storagePath = `categories/${randomUUID()}.${ext}`;

const { error: uploadError } = await supabase.storage
  .from(BUCKET)
  .upload(storagePath, fileBytes, { contentType: `image/${ext === "jpg" ? "jpeg" : ext}` });

if (uploadError) {
  console.error("Falha ao enviar imagem:", uploadError.message);
  process.exit(1);
}

const imageUrl = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;

await prisma.category.update({ where: { slug }, data: { imageUrl } });

console.log(`OK: imagem da categoria "${category.name}" atualizada.`);
console.log(imageUrl);

await prisma.$disconnect();
