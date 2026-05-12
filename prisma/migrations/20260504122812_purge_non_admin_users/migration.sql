-- Migration: purge_non_admin_users
-- Created: 2026-05-04 12:28:12

-- Delete all users except admin@cvvpro.com.
-- AIRateLimit and AIUsageLog store userId as plain String (no FK constraint),
-- so they must be deleted explicitly before the User rows are removed.
-- All other relations (Account, Session, Resume, ResumeVersion, CoverLetter,
-- Application, CVView, ReferralConversion, AuditLog) have onDelete: Cascade
-- and are handled automatically when User rows are deleted.

DELETE FROM "AIRateLimit"
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email != 'admin@cvvpro.com'
);

DELETE FROM "AIUsageLog"
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email != 'admin@cvvpro.com'
);

DELETE FROM "User"
WHERE email != 'admin@cvvpro.com';
