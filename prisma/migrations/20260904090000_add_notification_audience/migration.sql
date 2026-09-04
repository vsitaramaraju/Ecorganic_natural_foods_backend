-- AlterTable: distinguish who a notification is for
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "audience" TEXT NOT NULL DEFAULT 'BROADCAST';

-- Backfill: any existing row that already targets a specific user (order
-- status changes) is a "USER" notification, not a broadcast. Everything
-- else (product/category/coupon rows, which have no userId) is correctly
-- left as the "BROADCAST" default above.
UPDATE "Notification" SET "audience" = 'USER' WHERE "userId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "Notification_audience_idx" ON "Notification"("audience");
