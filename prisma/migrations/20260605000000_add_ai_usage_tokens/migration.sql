-- AlterTable: add token tracking and cost columns to AIUsageLog
ALTER TABLE "AIUsageLog" ADD COLUMN     "model" TEXT NOT NULL DEFAULT '';
ALTER TABLE "AIUsageLog" ADD COLUMN     "plan" TEXT NOT NULL DEFAULT '';
ALTER TABLE "AIUsageLog" ADD COLUMN     "promptTokens" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AIUsageLog" ADD COLUMN     "completionTokens" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AIUsageLog" ADD COLUMN     "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0;
