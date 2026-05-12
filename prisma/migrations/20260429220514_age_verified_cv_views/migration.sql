ALTER TABLE "User" ADD COLUMN "ageVerified" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "CVView" (
  "id"        TEXT NOT NULL,
  "resumeId"  TEXT NOT NULL,
  "viewedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CVView_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CVView" ADD CONSTRAINT "CVView_resumeId_fkey"
  FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "CVView_resumeId_idx" ON "CVView"("resumeId");
CREATE INDEX "CVView_viewedAt_idx" ON "CVView"("viewedAt");
