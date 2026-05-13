// lib/controllers/cron-deps.ts
import { CronService } from "@/lib/services/cron/CronService"
import { resend, emailEnabled } from "@/lib/resend"
import { createLogger } from "@/lib/logger"

export const cronService = new CronService(
  resend,
  emailEnabled(),
  createLogger("CronService"),
)
