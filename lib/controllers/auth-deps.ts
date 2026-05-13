import { NextResponse } from "next/server"
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
import { AppError } from "@/lib/services/auth/AppError"

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

export function handleError(err: unknown): NextResponse {
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.code, ...err.extra }, { status: err.status })
  }
  console.error("[controller] unhandled error", err)
  return NextResponse.json({ error: "server_error" }, { status: 500 })
}
