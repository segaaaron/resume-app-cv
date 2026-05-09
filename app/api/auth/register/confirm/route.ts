import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/lib/db"
import { nanoid } from "nanoid"
import { checkOrigin } from "@/lib/csrf"

const confirmAttempts = new Map<string, { count: number; resetAt: number }>()
const CONFIRM_WINDOW_MS = 15 * 60 * 1000
const CONFIRM_MAX_ATTEMPTS = 10
setInterval(() => { const now = Date.now(); confirmAttempts.forEach((v, k) => { if (now > v.resetAt) confirmAttempts.delete(k) }) }, 10 * 60 * 1000)

function checkConfirmRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = confirmAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    confirmAttempts.set(ip, { count: 1, resetAt: now + CONFIRM_WINDOW_MS })
    return true
  }
  if (entry.count >= CONFIRM_MAX_ATTEMPTS) return false
  entry.count++
  return true
}

const schema = z.object({
  email: z.string().email(),
  code:  z.string().length(6).regex(/^\d{6}$/),
})

export async function POST(req: Request) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkConfirmRateLimit(ip)) {
    return NextResponse.json({ error: "Demasiados intentos. Espera 15 minutos." }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { email, code } = schema.parse(body)

    const pending = await db.pendingRegistration.findUnique({ where: { email } })
    if (!pending) {
      return NextResponse.json({ error: "no_pending" }, { status: 400 })
    }

    if (pending.otpExp < new Date()) {
      await db.pendingRegistration.delete({ where: { email } })
      return NextResponse.json({ error: "expired" }, { status: 400 })
    }

    const valid = await bcrypt.compare(code, pending.otpHash)

    if (!valid) {
      const newAttempts = pending.attempts + 1
      if (newAttempts >= 5) {
        await db.pendingRegistration.delete({ where: { email } })
        return NextResponse.json({ error: "max_attempts" }, { status: 429 })
      }
      await db.pendingRegistration.update({
        where: { email },
        data: { attempts: newAttempts },
      })
      return NextResponse.json({ error: "invalid", attemptsLeft: 5 - newAttempts }, { status: 400 })
    }

    // Race condition guard: re-check before creating
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      await db.pendingRegistration.delete({ where: { email } })
      return NextResponse.json({ error: "email_taken" }, { status: 409 })
    }

    // Resolve referrer if a valid code was provided
    let referrerId: string | undefined
    if (pending.referralCode) {
      const referrer = await db.user.findUnique({
        where: { referralCode: pending.referralCode },
        select: { id: true },
      })
      if (referrer) referrerId = referrer.id
    }

    await db.$transaction([
      db.user.create({
        data: {
          name:             pending.name,
          email:            pending.email,
          password:         pending.passwordHash,
          marketingConsent: pending.marketingConsent,
          ageVerified:      pending.ageConsent,
          referralCode:     nanoid(8),
          emailVerified:    new Date(),
          ...(referrerId ? { referredBy: referrerId } : {}),
        },
      }),
      db.pendingRegistration.delete({ where: { email } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
