-- DropIndex
DROP INDEX "Cart_userId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");
