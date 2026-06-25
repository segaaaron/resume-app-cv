-- Add AI_USED to AuditAction enum (evidence trail for successful AI usage by paying users).
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'AI_USED';
