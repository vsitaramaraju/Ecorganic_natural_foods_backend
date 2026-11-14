-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "courierName" TEXT,
ADD COLUMN     "trackingId" TEXT,
ADD COLUMN     "trackingUrl" TEXT,
ADD COLUMN     "shippedAt" TIMESTAMP(3);
