-- CreateTable: ResumeVersion (historial de versiones del CV, máximo 10 por resume)
CREATE TABLE "ResumeVersion" (
    "id"        TEXT NOT NULL,
    "resumeId"  TEXT NOT NULL,
    "label"     TEXT,
    "snapshot"  JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResumeVersion_resumeId_idx" ON "ResumeVersion"("resumeId");

-- AddForeignKey
ALTER TABLE "ResumeVersion"
    ADD CONSTRAINT "ResumeVersion_resumeId_fkey"
    FOREIGN KEY ("resumeId") REFERENCES "Resume"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

