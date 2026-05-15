-- Migration: add_resume_thumbnail
-- Created: 2026-05-15 12:35:52

ALTER TABLE "Resume" ADD COLUMN "thumbnailUrl" TEXT;
