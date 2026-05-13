// lib/controllers/auth-deps.ts
import { PrismaUserRepository } from "@/lib/repositories/PrismaUserRepository"
import { PrismaPendingRegistrationRepository } from "@/lib/repositories/PrismaPendingRegistrationRepository"
import { PrismaPasswordResetRepository } from "@/lib/repositories/PrismaPasswordResetRepository"
import { PrismaSessionRepository } from "@/lib/repositories/PrismaSessionRepository"
import { ResendEmailService } from "@/lib/services/email/ResendEmailService"
import { RateLimitService } from "@/lib/services/rate-limit/RateLimitService"
import { createLogger } from "@/lib/logger"
import { RegistrationService } from "@/lib/services/auth/RegistrationService"
import { PasswordResetService } from "@/lib/services/auth/PasswordResetService"
import { SessionChallengeService } from "@/lib/services/auth/SessionChallengeService"

// backward-compat re-export — new routes should import directly from "@/lib/controllers/shared"
export { handleError } from "@/lib/controllers/shared"

const users        = new PrismaUserRepository()
const pending      = new PrismaPendingRegistrationRepository()
const resets       = new PrismaPasswordResetRepository()
const sessionRepo  = new PrismaSessionRepository()
const emailService = new ResendEmailService()
const rateLimitSvc = new RateLimitService()

export const registrationService = new RegistrationService(
  users, pending, rateLimitSvc, emailService, createLogger("RegistrationService"),
)

export const passwordResetService = new PasswordResetService(
  users, resets, rateLimitSvc, emailService, createLogger("PasswordResetService"),
)

export const sessionChallengeService = new SessionChallengeService(
  users, sessionRepo, rateLimitSvc, emailService, createLogger("SessionChallengeService"),
)
