-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "festivalDecorations" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "festivalEndsAt" TIMESTAMP(3),
ADD COLUMN     "festivalMessage" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "festivalRecolor" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "festivalTheme" TEXT NOT NULL DEFAULT 'none';
