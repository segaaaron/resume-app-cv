-- Language the user reads, captured at sign-up and updated when they switch it.
-- Nullable on purpose: existing rows keep behaving exactly as before (fallback locale),
-- so this migration cannot change anything for anyone already registered.
ALTER TABLE "User" ADD COLUMN "preferredLocale" TEXT;
