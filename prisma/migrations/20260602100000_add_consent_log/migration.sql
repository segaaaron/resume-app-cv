-- CreateTable
CREATE TABLE "ConsentLog" (
    "id"             TEXT NOT NULL,
    "userId"         TEXT NOT NULL,
    "plan"           TEXT NOT NULL,
    "ipHash"         TEXT NOT NULL,
    "userAgent"      TEXT,
    "locale"         TEXT NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "consentText"    TEXT NOT NULL,
    "acceptedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsentLog_userId_idx" ON "ConsentLog"("userId");

-- CreateIndex
CREATE INDEX "ConsentLog_acceptedAt_idx" ON "ConsentLog"("acceptedAt");

-- AddForeignKey
ALTER TABLE "ConsentLog" ADD CONSTRAINT "ConsentLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
