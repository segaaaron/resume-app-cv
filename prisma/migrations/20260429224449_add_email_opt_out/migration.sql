-- Migration: add_email_opt_out
-- Created: 2026-04-29 22:44:49

ALTER TABLE "User" ADD COLUMN "emailOptOut" BOOLEAN NOT NULL DEFAULT false;
