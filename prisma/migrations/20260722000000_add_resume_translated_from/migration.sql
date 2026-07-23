-- Resume.translatedFromId: links a translated copy to its source CV so translation
-- is idempotent (one translation per target language per source; repeat clicks
-- return the existing copy instead of spending another LLM call).
ALTER TABLE "Resume" ADD COLUMN "translatedFromId" TEXT;

-- UNIQUE guarantees idempotency at the DB level: a source CV can have at most one
-- translation per language, so two concurrent inserts can never duplicate.
-- Postgres treats NULLs as distinct → originals (translatedFromId IS NULL) are
-- unaffected and can coexist freely.
CREATE UNIQUE INDEX "Resume_translatedFromId_language_key" ON "Resume"("translatedFromId", "language");
