-- AlterTable: remember how the customer chose to pay ("COD" | "UPI")
ALTER TABLE "Order" ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'COD';
