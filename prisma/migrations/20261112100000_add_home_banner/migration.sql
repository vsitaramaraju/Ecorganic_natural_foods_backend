-- CreateTable: admin-customisable home page hero banner (single row, id = 1)
CREATE TABLE "HomeBanner" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "badge" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "primaryButtonText" TEXT NOT NULL DEFAULT '',
    "primaryButtonLink" TEXT NOT NULL DEFAULT '',
    "secondaryButtonText" TEXT NOT NULL DEFAULT '',
    "secondaryButtonLink" TEXT NOT NULL DEFAULT '',
    "stats" JSONB NOT NULL DEFAULT '[]',
    "highlights" JSONB NOT NULL DEFAULT '[]',
    "imageUrl" TEXT,
    "imageAlt" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeBanner_pkey" PRIMARY KEY ("id")
);
