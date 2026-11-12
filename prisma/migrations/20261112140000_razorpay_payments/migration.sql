-- AlterTable: Razorpay payment + refund tracking
ALTER TABLE "Order"
  ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
  ADD COLUMN "razorpayOrderId" TEXT,
  ADD COLUMN "razorpayPaymentId" TEXT,
  ADD COLUMN "refundId" TEXT,
  ADD COLUMN "refundAmount" DOUBLE PRECISION,
  ADD COLUMN "refundedAt" TIMESTAMP(3);

-- One Razorpay order can only ever create one shop order.
CREATE UNIQUE INDEX "Order_razorpayOrderId_key" ON "Order"("razorpayOrderId");

-- Manual approval is gone: every order is confirmed when placed.
UPDATE "Order" SET "status" = 'CONFIRMED' WHERE "status" = 'PENDING';
