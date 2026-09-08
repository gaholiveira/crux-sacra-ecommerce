import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "product-images";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data: existing } = await supabase.storage.getBucket(BUCKET);

if (existing) {
  console.log(`Bucket "${BUCKET}" já existe, nada a fazer.`);
} else {
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: "5MB",
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
  });

  if (error) {
    console.error("Falha ao criar o bucket:", error.message);
    process.exit(1);
  }

  console.log(`Bucket "${BUCKET}" criado (público, leitura livre, escrita só via service role).`);
}
