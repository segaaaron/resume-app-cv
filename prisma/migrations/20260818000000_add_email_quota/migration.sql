-- CreateTable
CREATE TABLE "EmailQuota" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "monthlyRaw" TEXT NOT NULL,
    "dailyRaw" TEXT,
    "monthlyUsed" INTEGER,
    "monthlyLimit" INTEGER,
    "observations" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailQuota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailQuota_period_key" ON "EmailQuota"("period");
