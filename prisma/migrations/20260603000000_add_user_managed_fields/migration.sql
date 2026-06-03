-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isManaged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "managedExpiresAt" TIMESTAMP(3),
ADD COLUMN     "managedDownloadLimit" INTEGER,
ADD COLUMN     "managedDownloadsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "managedCreatedBy" TEXT,
ADD COLUMN     "managedNote" TEXT,
ADD COLUMN     "managedBlocked" BOOLEAN NOT NULL DEFAULT false;
