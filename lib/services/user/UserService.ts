// lib/services/user/UserService.ts
import { db } from "@/lib/db"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { AppError } from "@/lib/services/auth/AppError"
import { checkRateLimit } from "@/lib/ai-client"
import { purgeUserCache } from "@/lib/auth"
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token"
import { z } from "zod"

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const profileUpdateSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(255).trim(),
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>

// ─── Result types ─────────────────────────────────────────────────────────────

export interface DataExportResult {
  exportedAt: string
  user: {
    id: string
    name: string | null
    email: string | null
    createdAt: Date
    plan: string
    subscriptionStatus: string
    subscriptionEndsAt: Date | null
    planInterval: string | null
  }
  resumes: Array<{
    id: string
    title: string
    personalDetails: unknown
    createdAt: Date
    updatedAt: Date
  }>
  coverLetters: Array<{
    id: string
    title: string
    content: unknown
    createdAt: Date
    updatedAt: Date
  }>
  applications: Array<{
    id: string
    jobTitle: string
    company: string
    status: string
    notes: string | null
    url: string | null
    salary: string | null
    appliedAt: Date | null
    followUpAt: Date | null
    createdAt: Date
  }>
  auditLogs: Array<{
    action: string
    metadata: unknown
    createdAt: Date
  }>
  referralConversions: Array<{
    referredId: string
    createdAt: Date
  }>
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class UserService {
  constructor(private readonly logger: ILogger) {}

  /**
   * Update the display name for a user. Users can only update their own profile.
   */
  async updateProfile(userId: string, input: ProfileUpdateInput): Promise<{ success: true }> {
    const parsed = profileUpdateSchema.safeParse(input)
    if (!parsed.success) {
      throw new AppError("invalid_name", 400)
    }

    await db.user.update({
      where: { id: userId },
      data: { name: parsed.data.name },
    })

    this.logger.info("UserService.updateProfile: name updated", { userId })
    return { success: true }
  }

  /**
   * Soft-delete the user account (GDPR: hard-delete after 90 days via cron).
   */
  async deleteAccount(userId: string): Promise<{ success: true }> {
    await db.auditLog.create({
      data: { userId, action: "DELETE_ACCOUNT" },
    })

    const now = new Date()
    await db.user.update({
      where: { id: userId },
      data: { deletedAt: now, activeSessionToken: null, forceLogoutAt: now },
    })
    purgeUserCache(userId)

    this.logger.info("UserService.deleteAccount: soft-deleted", { userId })
    return { success: true }
  }

  /**
   * Export all user data (GDPR Article 20 — data portability).
   * Rate-limited to 1 request per hour per user.
   */
  async exportData(userId: string): Promise<DataExportResult> {
    const allowed = await checkRateLimit(userId, "data-export", 1)
    if (!allowed) {
      throw new AppError("rate_limited", 429)
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        plan: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        planInterval: true,
        resumes: {
          select: {
            id: true,
            title: true,
            personalDetails: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        coverLetters: {
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        applications: {
          select: {
            id: true, jobTitle: true, company: true, status: true,
            notes: true, url: true, salary: true, appliedAt: true,
            followUpAt: true, createdAt: true,
          },
        },
        auditLogs: {
          select: { action: true, metadata: true, createdAt: true },
          orderBy: { createdAt: "desc" as const },
          take: 200,
        },
      },
    })

    if (!user) {
      throw new AppError("not_found", 404)
    }

    await db.auditLog.create({ data: { userId, action: "DATA_EXPORT" } })

    const referralConversions = await db.referralConversion.findMany({
      where: { referrerId: userId },
      select: { referredId: true, createdAt: true },
      take: 1000,
      orderBy: { createdAt: "desc" },
    })

    this.logger.info("UserService.exportData: export generated", { userId })

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndsAt: user.subscriptionEndsAt,
        planInterval: user.planInterval,
      },
      resumes: user.resumes,
      coverLetters: user.coverLetters,
      applications: user.applications,
      auditLogs: user.auditLogs,
      referralConversions,
    }
  }

  /**
   * Mark a user as opted out of marketing/transactional emails.
   * Token is validated via HMAC — no auth session required.
   */
  async unsubscribeEmail(userId: string, token: string): Promise<{ success: true }> {
    if (!verifyUnsubscribeToken(userId, token)) {
      throw new AppError("invalid_token", 400)
    }

    await db.user.update({
      where: { id: userId },
      data: { emailOptOut: true },
    })

    this.logger.info("UserService.unsubscribeEmail: opt-out recorded", { userId })
    return { success: true }
  }

  /**
   * Verify email address from a verification token (link-based flow).
   * Cleans up expired tokens automatically.
   */
  async verifyEmail(token: string): Promise<{ success: true }> {
    if (!token || token.length !== 64) {
      throw new AppError("invalid_token", 400)
    }

    const record = await db.verificationToken.findUnique({ where: { token } })

    if (!record) {
      throw new AppError("invalid_token", 400)
    }

    if (record.expires < new Date()) {
      await db.verificationToken.delete({ where: { token } }).catch((err) => {
        this.logger.error("UserService.verifyEmail: delete expired token failed", { token }, err instanceof Error ? err : undefined)
      })
      throw new AppError("token_expired", 400)
    }

    await db.user.update({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    })

    await db.verificationToken.delete({ where: { token } })

    this.logger.info("UserService.verifyEmail: email verified", { identifier: record.identifier })
    return { success: true }
  }
}
