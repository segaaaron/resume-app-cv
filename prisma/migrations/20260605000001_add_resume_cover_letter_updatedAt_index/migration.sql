-- CreateIndex: composite index for userId + updatedAt on Resume (speeds up dashboard list queries)
CREATE INDEX "Resume_userId_updatedAt_idx" ON "Resume"("userId", "updatedAt" DESC);

-- CreateIndex: composite index for userId + updatedAt on CoverLetter
CREATE INDEX "CoverLetter_userId_updatedAt_idx" ON "CoverLetter"("userId", "updatedAt" DESC);
