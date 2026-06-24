-- Migration: add_basic_sprint_plans
-- Adds two one-time plan tiers to the Plan enum.
-- BASIC  = $2.99, 1 calendar month, download only (no AI).
-- SPRINT = $7.99, 7 days, content AI + PRO templates (no tailor/ats/review).

ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'BASIC';
ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'SPRINT';
