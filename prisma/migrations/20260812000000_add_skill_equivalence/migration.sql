-- CreateTable
CREATE TABLE "SkillEquivalence" (
    "id" TEXT NOT NULL,
    "termA" TEXT NOT NULL,
    "termB" TEXT NOT NULL,
    "equivalent" BOOLEAN NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillEquivalence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SkillEquivalence_termA_termB_key" ON "SkillEquivalence"("termA", "termB");

-- CreateIndex
CREATE INDEX "SkillEquivalence_createdAt_idx" ON "SkillEquivalence"("createdAt");
