import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkOrigin } from "@/lib/csrf"
import { createLogger } from "@/lib/logger"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import { ResendEmailService } from "@/lib/services/email/ResendEmailService"

const logger = createLogger("admin-managed-users")

const PASSWORD_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+"
const PASSWORD_LENGTH = 16

export function generateManagedPassword(): string {
  const bytes = randomBytes(PASSWORD_LENGTH)
  let password = ""
  for (let i = 0; i < PASSWORD_LENGTH; i++) {
    password += PASSWORD_CHARS[bytes[i] % PASSWORD_CHARS.length]
  }
  const categories = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "abcdefghijklmnopqrstuvwxyz",
    "0123456789",
    "!@#$%^&*()-_=+",
  ]
  const arr = password.split("")
  for (let i = 0; i < categories.length; i++) {
    const src = categories[i]
    arr[i] = src[randomBytes(1)[0] % src.length]
  }
  return arr.join("")
}

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
  if (managedExpiresAt <= new Date()) return NextResponse.json({ error: "expiresAt must be in the future" }, { status: 422 })

  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true, stripeCustomerId: true, subscriptionStatus: true },
  })

  if (existing) {
    if (existing.stripeCustomerId || (existing.subscriptionStatus && existing.subscriptionStatus !== "NONE")) {
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
  await emailService.sendManagedWelcome(email, plainPassword, managedExpiresAt, downloadLimit ?? null)
    .catch((e) => logger.error("sendManagedWelcome failed after user creation", { userId: user.id }, e instanceof Error ? e : undefined))

  return NextResponse.json({
    id: user.id,
    email: user.email,
    managedExpiresAt: user.managedExpiresAt,
    managedDownloadLimit: user.managedDownloadLimit,
    generatedPassword: plainPassword,
  }, { status: 201 })
}
