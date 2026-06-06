-- Managed PDF refund failure tracking
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MANAGED_DOWNLOAD_REFUND_FAILED';
