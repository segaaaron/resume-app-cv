-- CreateTable
CREATE TABLE "AtsCheck" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "scoreOverall" INTEGER NOT NULL,
    "scoreKeywords" INTEGER NOT NULL,
    "scoreFormat" INTEGER NOT NULL,
    "scoreSections" INTEGER NOT NULL,
    "scoreLength" INTEGER NOT NULL,
    "scoreContact" INTEGER NOT NULL DEFAULT 0,
    "locale" TEXT NOT NULL,
    "country" TEXT,
    "userAgent" TEXT,
    "jdHash" TEXT NOT NULL,
    "resumeHash" TEXT NOT NULL,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AtsCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AtsCheck_createdAt_idx" ON "AtsCheck"("createdAt");

-- CreateIndex
CREATE INDEX "AtsCheck_sessionId_idx" ON "AtsCheck"("sessionId");
