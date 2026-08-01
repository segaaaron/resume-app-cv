import { NextResponse } from "next/server"
import { apiError } from "@/lib/controllers/shared"
import { auth, purgeUserCache } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkOrigin } from "@/lib/csrf"
import { createLogger } from "@/lib/logger"
import { z } from "zod"
import bcrypt from "@/lib/bcrypt"
import { ResendEmailService } from "@/lib/services/email/ResendEmailService"
import { generateManagedPassword } from "@/lib/managed-password"
import { localeFromRequest } from "@/lib/locale"

const logger = createLogger("admin-managed-user-actions")

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("block") }),
  z.object({ action: z.literal("unblock") }),
  z.object({
    action: z.literal("edit"),
    expiresAt: z.string().datetime(),
    downloadLimit: z.number().int().positive().nullable().optional(),
    // NULL/omitted → the LIMITED default (5) applies in code.
    resumeLimit: z.number().int().positive().nullable().optional(),
    coverLetterLimit: z.number().int().positive().nullable().optional(),
  }),
  z.object({ action: z.literal("reset-downloads") }),
  z.object({ action: z.literal("reset-password") }),
])

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  if (!checkOrigin(req)) return apiError(403, "Forbidden", { req })

  const session = await auth()
  if (!session?.user?.id) return apiError(401, "Unauthorized", { req })
  if (session.user.role !== "SUPER_ADMIN") return apiError(403, "Forbidden", { req })

  const { id } = await params

  let body: unknown
  try { body = await req.json() } catch { return apiError(400, "Invalid JSON", { req }) }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return apiError(422, "Invalid payload", { req, extra: { details: parsed.error.flatten() } })

  // Fetch all fields needed across all action branches in one query
  const existing = await db.user.findUnique({
    where: { id },
    select: { isManaged: true, email: true, managedExpiresAt: true, managedDownloadLimit: true },
  })
  if (!existing) return apiError(404, "User not found", { req })
  if (!existing.isManaged) return apiError(400, "Not a managed user", { req })

  const data = parsed.data

  if (data.action === "block" || data.action === "unblock") {
    const managedBlocked = data.action === "block"
    await db.user.update({ where: { id }, data: { managedBlocked, sessionVersion: { increment: 1 } } })
    purgeUserCache(id)
    logger.info("admin: managed user block toggled", { targetUserId: id, managedBlocked, byAdmin: session.user.id })
    db.auditLog.create({
      data: { userId: session.user.id, action: managedBlocked ? "MANAGED_USER_BLOCKED" : "MANAGED_USER_UNBLOCKED", metadata: { targetUserId: id, email: existing.email } },
    }).catch((err) => logger.error("auditLog MANAGED_USER_BLOCKED/UNBLOCKED failed", { targetUserId: id }, err instanceof Error ? err : undefined))
    return NextResponse.json({ id, managedBlocked })
  }

  if (data.action === "edit") {
    const managedExpiresAt = new Date(data.expiresAt)
    // Match POST: treat the supplied date as end-of-day UTC so picking "today"
    // does not flip into the past at the moment of update.
    managedExpiresAt.setUTCHours(23, 59, 59, 999)
    if (managedExpiresAt <= new Date()) return apiError(422, "expiresAt must be in the future", { req })
    await db.user.update({
      where: { id },
      data: {
        managedExpiresAt,
        managedDownloadLimit: data.downloadLimit ?? null,
        managedResumeLimit: data.resumeLimit ?? null,
        managedCoverLetterLimit: data.coverLetterLimit ?? null,
        sessionVersion: { increment: 1 },
      },
    })
    purgeUserCache(id)
    logger.info("admin: managed user edited", { targetUserId: id, managedExpiresAt, byAdmin: session.user.id })
    db.auditLog.create({
      data: { userId: session.user.id, action: "MANAGED_USER_EDITED", metadata: { targetUserId: id, email: existing.email, managedExpiresAt, managedDownloadLimit: data.downloadLimit ?? null, managedResumeLimit: data.resumeLimit ?? null, managedCoverLetterLimit: data.coverLetterLimit ?? null } },
    }).catch((err) => logger.error("auditLog MANAGED_USER_EDITED failed", { targetUserId: id }, err instanceof Error ? err : undefined))
    return NextResponse.json({ id, managedExpiresAt, managedDownloadLimit: data.downloadLimit ?? null, managedResumeLimit: data.resumeLimit ?? null, managedCoverLetterLimit: data.coverLetterLimit ?? null })
  }

  if (data.action === "reset-downloads") {
    await db.user.update({ where: { id }, data: { managedDownloadsUsed: 0, sessionVersion: { increment: 1 } } })
    purgeUserCache(id)
    logger.info("admin: managed user downloads reset", { targetUserId: id, byAdmin: session.user.id })
    db.auditLog.create({
      data: { userId: session.user.id, action: "MANAGED_USER_DOWNLOADS_RESET", metadata: { targetUserId: id, email: existing.email } },
    }).catch((err) => logger.error("auditLog MANAGED_USER_DOWNLOADS_RESET failed", { targetUserId: id }, err instanceof Error ? err : undefined))
    return NextResponse.json({ id, managedDownloadsUsed: 0 })
  }

  if (data.action === "reset-password") {
    const newPassword = generateManagedPassword()
    const hashed = await bcrypt.hash(newPassword, 12)
    await db.user.update({ where: { id }, data: { password: hashed, sessionVersion: { increment: 1 } } })
    purgeUserCache(id)

    if (existing.managedExpiresAt) {
      const emailService = new ResendEmailService()
      await emailService.sendManagedWelcome(existing.email, newPassword, existing.managedExpiresAt, existing.managedDownloadLimit, localeFromRequest(req))
        .catch((e) => logger.error("sendManagedWelcome on reset failed", { targetUserId: id }, e instanceof Error ? e : undefined))
    }

    logger.info("admin: managed user password reset", { targetUserId: id, byAdmin: session.user.id })
    db.auditLog.create({
      data: { userId: session.user.id, action: "MANAGED_USER_PASSWORD_RESET", metadata: { targetUserId: id, email: existing.email } },
    }).catch((err) => logger.error("auditLog MANAGED_USER_PASSWORD_RESET failed", { targetUserId: id }, err instanceof Error ? err : undefined))
    return NextResponse.json({ id, generatedPassword: newPassword })
  }

  return apiError(500, "Unhandled action", { req })
}

export async function DELETE(req: Request, { params }: Params) {
  if (!checkOrigin(req)) return apiError(403, "Forbidden", { req })

  const session = await auth()
  if (!session?.user?.id) return apiError(401, "Unauthorized", { req })
  if (session.user.role !== "SUPER_ADMIN") return apiError(403, "Forbidden", { req })

  const { id } = await params

  const existing = await db.user.findUnique({ where: { id }, select: { isManaged: true, email: true } })
  if (!existing) return apiError(404, "User not found", { req })
  if (!existing.isManaged) return apiError(400, "Not a managed user", { req })

  // Audit BEFORE delete — once the user row is gone, AuditLog rows with userId pointing to
  // the deleted user would cascade away. Log against the admin's userId instead, with the
  // target email captured in metadata for trace.
  await db.auditLog.create({
    data: { userId: session.user.id, action: "MANAGED_USER_DELETED", metadata: { targetUserId: id, email: existing.email } },
  }).catch((err) => logger.error("auditLog MANAGED_USER_DELETED failed", { targetUserId: id }, err instanceof Error ? err : undefined))

  // Hard delete: cascade removes Resume, CoverLetter, AuditLog (target's own), ConsentLog,
  // ReferralConversion, AIRateLimit/AIUsageLog (no FK, fine), Account, Session, etc.
  // Email becomes free for re-registration.
  await db.user.delete({ where: { id } })
  purgeUserCache(id)

  logger.info("admin: managed user hard-deleted", { targetUserId: id, byAdmin: session.user.id })

  return new Response(null, { status: 204 })
}
