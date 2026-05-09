-- Admin force-logout mechanism: JWTs issued before this timestamp are rejected
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "forceLogoutAt" TIMESTAMP(3);

-- New audit actions
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ADMIN_RECONCILE_USER';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ADMIN_FORCE_LOGOUT';
