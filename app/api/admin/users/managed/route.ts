import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkOrigin } from "@/lib/csrf"
import { createLogger } from "@/lib/logger"
import { z } from "zod"
import bcrypt from "@/lib/bcrypt"
import { ResendEmailService } from "@/lib/services/email/ResendEmailService"
import { generateManagedPassword } from "@/lib/managed-password"
import { localeFromRequest } from "@/lib/locale"

const logger = createLogger("admin-managed-users")

const bodySchema = z.object({
  email: z.string().email(),
  expiresAt: z.string().datetime(),
  downloadLimit: z.number().int().positive().optional(),
  note: z.string().max(500).optional(),
})

export async function POST(req: Request) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 422 })

  const { email, expiresAt: expiresAtStr, downloadLimit, note } = parsed.data
  const managedExpiresAt = new Date(expiresAtStr)
  // Treat the supplied date as end-of-day UTC so an admin picking "today" via a
  // `<input type="date">` does not accidentally pass an already-past midnight.
  managedExpiresAt.setUTCHours(23, 59, 59, 999)
  if (managedExpiresAt <= new Date()) return NextResponse.json({ error: "expiresAt must be in the future" }, { status: 422 })

  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true, stripeCustomerId: true, subscriptionStatus: true },
  })

  if (existing) {
    // Only block when the Stripe subscription is currently live (ACTIVE / PAST_DUE).
    // Ex-PRO users whose subscription is CANCELED / EXPIRED / NONE are eligible to be
    // converted into managed users — their stripeCustomerId is irrelevant here.
    const STRIPE_ACTIVE_STATUSES = ["ACTIVE", "PAST_DUE"] as const
    const hasLiveStripeSub =
      !!existing.subscriptionStatus &&
      (STRIPE_ACTIVE_STATUSES as readonly string[]).includes(existing.subscriptionStatus)
    if (hasLiveStripeSub) {
      return NextResponse.json({ code: "STRIPE_ACTIVE", error: "Este email tiene una suscripción de Stripe activa" }, { status: 400 })
    }
    return NextResponse.json({ code: "EMAIL_EXISTS", error: "Email ya registrado" }, { status: 400 })
  }

  const plainPassword = generateManagedPassword()
  const hashedPassword = await bcrypt.hash(plainPassword, 12)

  let user: { id: string; email: string; managedExpiresAt: Date | null; managedDownloadLimit: number | null }
  try {
    user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        plan: "LIMITED",
        isManaged: true,
        emailVerified: new Date(),
        managedExpiresAt,
        managedDownloadLimit: downloadLimit ?? null,
        managedCreatedBy: session.user.id,
        managedNote: note ?? null,
      },
      select: { id: true, email: true, managedExpiresAt: true, managedDownloadLimit: true },
    })
  } catch (e: unknown) {
    const isPrismaUniqueViolation = typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002"
    if (isPrismaUniqueViolation) {
      return NextResponse.json({ code: "EMAIL_EXISTS", error: "Email ya registrado" }, { status: 400 })
    }
    throw e
  }

  db.auditLog.create({
    data: { userId: session.user.id, action: "MANAGED_USER_CREATED", metadata: { targetUserId: user.id, email, managedExpiresAt, managedDownloadLimit: downloadLimit ?? null } },
  }).catch((e) => logger.error("auditLog MANAGED_USER_CREATED failed", { userId: user.id }, e instanceof Error ? e : undefined))

  const emailService = new ResendEmailService()
  await emailService.sendManagedWelcome(email, plainPassword, managedExpiresAt, downloadLimit ?? null, localeFromRequest(req))
    .catch((e) => logger.error("sendManagedWelcome failed after user creation", { userId: user.id }, e instanceof Error ? e : undefined))

  return NextResponse.json({
    id: user.id,
    email: user.email,
    managedExpiresAt: user.managedExpiresAt,
    managedDownloadLimit: user.managedDownloadLimit,
    generatedPassword: plainPassword,
  }, { status: 201 })
}
