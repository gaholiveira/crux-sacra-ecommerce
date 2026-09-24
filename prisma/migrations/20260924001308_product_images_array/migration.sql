-- Adiciona a coluna nova primeiro, migra o dado existente de "imageUrl"
-- pra dentro dela, e só depois derruba a coluna antiga — nenhuma imagem já
-- cadastrada se perde na troca.
ALTER TABLE "Product" ADD COLUMN "imageUrls" TEXT[] NOT NULL DEFAULT '{}';

UPDATE "Product"
SET "imageUrls" = ARRAY["imageUrl"]
WHERE "imageUrl" IS NOT NULL;

ALTER TABLE "Product" DROP COLUMN "imageUrl";
