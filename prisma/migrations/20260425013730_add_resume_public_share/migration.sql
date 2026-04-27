ALTER TABLE "Resume" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Resume" ADD COLUMN "publicSlug" TEXT;
CREATE UNIQUE INDEX "Resume_publicSlug_key" ON "Resume"("publicSlug");

