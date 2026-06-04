CREATE INDEX IF NOT EXISTS "User_plan_managedExpiresAt_managedBlocked_idx"
  ON "User"("plan", "managedExpiresAt", "managedBlocked");

CREATE INDEX IF NOT EXISTS "User_isManaged_idx"
  ON "User"("isManaged");
