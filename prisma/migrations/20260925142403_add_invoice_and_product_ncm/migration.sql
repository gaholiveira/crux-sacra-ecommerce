-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PROCESSING', 'AUTHORIZED', 'ERROR', 'CANCELLED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "ncm" TEXT;

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PROCESSING',
    "numero" TEXT,
    "serie" TEXT,
    "chaveAcesso" TEXT,
    "statusSefaz" TEXT,
    "mensagemSefaz" TEXT,
    "xmlUrl" TEXT,
    "danfeUrl" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_ref_key" ON "Invoice"("ref");

-- CreateIndex
CREATE INDEX "Invoice_orderId_idx" ON "Invoice"("orderId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
