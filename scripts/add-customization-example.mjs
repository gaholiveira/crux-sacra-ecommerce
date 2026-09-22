// Adiciona uma foto de exemplo à galeria da categoria "Personalizado".
// Uso: node scripts/add-customization-example.mjs <caminho-da-imagem> "<legenda opcional>"
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const BUCKET = "product-images";

const [, , imagePath, caption] = process.argv;

if (!imagePath) {
  console.error('Uso: node scripts/add-customization-example.mjs <caminho-da-imagem> "<legenda opcional>"');
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

const fileBytes = await readFile(imagePath);
const ext = extname(imagePath).replace(".", "") || "jpg";
const storagePath = `examples/${randomUUID()}.${ext}`;

const { error: uploadError } = await supabase.storage
  .from(BUCKET)
  .upload(storagePath, fileBytes, { contentType: `image/${ext === "jpg" ? "jpeg" : ext}` });

if (uploadError) {
  console.error("Falha ao enviar imagem:", uploadError.message);
  process.exit(1);
}

const imageUrl = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;

const example = await prisma.customizationExample.create({
  data: { imageUrl, caption: caption || null },
});

console.log(`OK: exemplo criado (${example.id})`);
console.log(imageUrl);

await prisma.$disconnect();
