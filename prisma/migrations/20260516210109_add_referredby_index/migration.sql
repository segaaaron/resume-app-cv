-- Migration: add_referredby_index
-- Created: 2026-05-16 21:01:09

CREATE INDEX IF NOT EXISTS "User_referredBy_idx" ON "User"("referredBy");

