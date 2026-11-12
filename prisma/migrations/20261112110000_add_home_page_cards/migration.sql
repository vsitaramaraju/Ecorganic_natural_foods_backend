-- AlterTable: make the trust badges, "why us" cards and sign-up banner customisable
ALTER TABLE "HomeBanner"
  ADD COLUMN "trustVisible" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "trustItems" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "whyVisible" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "whyTitle" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "whySubtitle" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "whyCards" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "ctaVisible" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "ctaTitle" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "ctaText" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "ctaButtonText" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "ctaButtonLink" TEXT NOT NULL DEFAULT '';
