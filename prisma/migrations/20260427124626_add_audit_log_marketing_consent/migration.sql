-- Add marketingConsent and deletedAt to User
ALTER TABLE "User" ADD COLUMN "marketingConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Create AuditAction enum
CREATE TYPE "AuditAction" AS ENUM ('DELETE_ACCOUNT', 'CANCEL_SUBSCRIPTION', 'TOGGLE_PUBLIC_CV', 'DATA_EXPORT', 'REFUND_ISSUED');

-- Create AuditLog table
CREATE TABLE "AuditLog" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "action"    "AuditAction" NOT NULL,
  "metadata"  JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
