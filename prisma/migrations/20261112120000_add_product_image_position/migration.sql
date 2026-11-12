-- AlterTable: display order for product images (0 = main image)
ALTER TABLE "ProductImage" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- Backfill: keep the existing upload order
UPDATE "ProductImage" pi
SET "position" = ranked.rn - 1
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "productId" ORDER BY "id") AS rn
  FROM "ProductImage"
) ranked
WHERE pi."id" = ranked."id";
