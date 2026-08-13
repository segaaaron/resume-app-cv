-- Ties a cached answer to the résumé it was computed from, so deleting the CV
-- deletes what we derived from it. Additive and nullable: existing rows stay
-- valid and are purged by age.
ALTER TABLE "AiAnswerCache" ADD COLUMN "resumeId" TEXT;
CREATE INDEX "AiAnswerCache_resumeId_idx" ON "AiAnswerCache"("resumeId");
