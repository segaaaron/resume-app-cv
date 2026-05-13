// lib/controllers/resume-deps.ts
import { ResumeService } from "@/lib/services/resume/ResumeService"
import { createLogger } from "@/lib/logger"

export const resumeService = new ResumeService(createLogger("ResumeService"))
