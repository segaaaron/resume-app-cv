-- Migration: add_past_due_status
-- Created: 2026-04-27 11:56:28

-- Add PAST_DUE value to SubscriptionStatus enum (grace period for failed payments)
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PAST_DUE';

