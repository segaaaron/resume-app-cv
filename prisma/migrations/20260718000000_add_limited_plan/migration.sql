-- Add the LIMITED plan to the Plan enum.
-- schema.prisma declared `LIMITED` but no migration ever added it to the DB enum,
-- so production drifted: cron queries filtering `plan: "LIMITED"` threw
-- (invalid input value for enum "Plan": "LIMITED") and every expire-subscriptions
-- run 500'd. IF NOT EXISTS keeps this idempotent where the value was hotfixed in.
ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'LIMITED';
