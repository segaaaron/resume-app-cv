-- CreateTable
CREATE TABLE "AiAnswerCache" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAnswerCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiAnswerCache_kind_inputHash_key" ON "AiAnswerCache"("kind", "inputHash");

-- CreateIndex
CREATE INDEX "AiAnswerCache_createdAt_idx" ON "AiAnswerCache"("createdAt");
