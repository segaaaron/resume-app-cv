CREATE TABLE "AIRateLimit" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "endpoint"  TEXT NOT NULL,
  "count"     INTEGER NOT NULL DEFAULT 0,
  "resetAt"   TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIRateLimit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AIRateLimit_userId_endpoint_key" ON "AIRateLimit"("userId", "endpoint");
CREATE INDEX "AIRateLimit_userId_idx" ON "AIRateLimit"("userId");
CREATE INDEX "AIRateLimit_resetAt_idx" ON "AIRateLimit"("resetAt");

CREATE TABLE "AIUsageLog" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "endpoint"  TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIUsageLog_userId_idx" ON "AIUsageLog"("userId");
CREATE INDEX "AIUsageLog_endpoint_idx" ON "AIUsageLog"("endpoint");
CREATE INDEX "AIUsageLog_createdAt_idx" ON "AIUsageLog"("createdAt");
