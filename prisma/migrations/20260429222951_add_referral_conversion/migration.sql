CREATE TABLE "ReferralConversion" (
  "id" TEXT NOT NULL,
  "referrerId" TEXT NOT NULL,
  "referredId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralConversion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReferralConversion_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReferralConversion_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ReferralConversion_referrerId_referredId_key" ON "ReferralConversion"("referrerId", "referredId");
CREATE INDEX "ReferralConversion_referrerId_idx" ON "ReferralConversion"("referrerId");
