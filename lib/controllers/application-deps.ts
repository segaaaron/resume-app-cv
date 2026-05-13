// lib/controllers/application-deps.ts
import { ApplicationService } from "@/lib/services/application/ApplicationService"
import { createLogger } from "@/lib/logger"

export const applicationService = new ApplicationService(createLogger("ApplicationService"))
