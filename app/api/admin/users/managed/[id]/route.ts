import { NextResponse } from "next/server"
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
  }),
  z.object({ action: z.literal("reset-downloads") }),
  z.object({ action: z.literal("reset-password") }),
])

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 422 })

  // Fetch all fields needed across all action branches in one query
  const existing = await db.user.findUnique({
    where: { id },
    select: { isManaged: true, email: true, managedExpiresAt: true, managedDownloadLimit: true },
  })
  if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 })
  if (!existing.isManaged) return NextResponse.json({ error: "Not a managed user" }, { status: 400 })

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
    if (managedExpiresAt <= new Date()) return NextResponse.json({ error: "expiresAt must be in the future" }, { status: 422 })
    await db.user.update({
      where: { id },
      data: { managedExpiresAt, managedDownloadLimit: data.downloadLimit ?? null, sessionVersion: { increment: 1 } },
    })
    purgeUserCache(id)
    logger.info("admin: managed user edited", { targetUserId: id, managedExpiresAt, byAdmin: session.user.id })
    db.auditLog.create({
      data: { userId: session.user.id, action: "MANAGED_USER_EDITED", metadata: { targetUserId: id, email: existing.email, managedExpiresAt, managedDownloadLimit: data.downloadLimit ?? null } },
    }).catch((err) => logger.error("auditLog MANAGED_USER_EDITED failed", { targetUserId: id }, err instanceof Error ? err : undefined))
    return NextResponse.json({ id, managedExpiresAt, managedDownloadLimit: data.downloadLimit ?? null })
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

  return NextResponse.json({ error: "Unhandled action" }, { status: 500 })
}

export async function DELETE(req: Request, { params }: Params) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  const existing = await db.user.findUnique({ where: { id }, select: { isManaged: true, email: true } })
  if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 })
  if (!existing.isManaged) return NextResponse.json({ error: "Not a managed user" }, { status: 400 })

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
