// lib/controllers/cover-letter-deps.ts
import { CoverLetterService } from "@/lib/services/cover-letter/CoverLetterService"
import { createLogger } from "@/lib/logger"

export const coverLetterService = new CoverLetterService(createLogger("CoverLetterService"))
