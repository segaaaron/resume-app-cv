-- Performance indexes: Session.userId, Account.userId, User.deletedAt
-- NOTE: CONCURRENTLY removed — Prisma wraps migrations in transactions and
-- Postgres rejects CREATE INDEX CONCURRENTLY inside a transaction block.
-- Tables are small/medium; brief lock is acceptable during deploy.

CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");
CREATE INDEX IF NOT EXISTS "User_deletedAt_idx" ON "User"("deletedAt");
