-- Migration: add_dispute_chargeback_audit_action
-- Created: 2026-05-04 13:41:50

ALTER TYPE "AuditAction" ADD VALUE 'DISPUTE_CHARGEBACK';

