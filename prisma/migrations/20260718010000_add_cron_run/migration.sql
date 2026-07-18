-- CronRun: execution log for scheduled jobs, powers the admin cron-health panel.
CREATE TYPE "CronRunStatus" AS ENUM ('SUCCESS', 'FAILURE');

CREATE TABLE "CronRun" (
    "id" TEXT NOT NULL,
    "job" TEXT NOT NULL,
    "status" "CronRunStatus" NOT NULL,
    "result" JSONB,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CronRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CronRun_job_createdAt_idx" ON "CronRun"("job", "createdAt");
CREATE INDEX "CronRun_createdAt_idx" ON "CronRun"("createdAt");
