-- AlterTable: add priceUnit column to Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "priceUnit" TEXT NOT NULL DEFAULT 'fixed';