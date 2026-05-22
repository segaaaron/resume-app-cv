-- Performance: composite index for CVView stats queries (resumeId + viewedAt range scans)
CREATE INDEX IF NOT EXISTS "CVView_resumeId_viewedAt_idx" ON "CVView"("resumeId", "viewedAt");

-- Performance: composite index for Application kanban column filtering (userId + status)
CREATE INDEX IF NOT EXISTS "Application_userId_status_idx" ON "Application"("userId", "status");
