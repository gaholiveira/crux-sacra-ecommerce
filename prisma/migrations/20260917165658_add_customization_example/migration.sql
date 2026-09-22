-- CreateTable
CREATE TABLE "CustomizationExample" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomizationExample_pkey" PRIMARY KEY ("id")
);
