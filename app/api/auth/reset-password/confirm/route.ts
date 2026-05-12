import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/lib/db"
import { checkOrigin } from "@/lib/csrf"
import { checkRateLimit } from "@/lib/ai-client"
import { purgeUserCache } from "@/lib/auth"

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6).regex(/^\d{6}$/),
  password: z.string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[a-z]/, "Must contain lowercase")
    .regex(/[0-9]/, "Must contain number"),
})

const MAX_ATTEMPTS = 5

export async function POST(req: Request) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 })

  const { email, code, password } = parsed.data

  const allowed = await checkRateLimit(email, "reset-password-confirm", 10)
  if (!allowed) return NextResponse.json({ error: "rate_limit" }, { status: 429 })

  const reset = await db.passwordReset.findUnique({ where: { email } })

  if (!reset) return NextResponse.json({ error: "no_reset_request" }, { status: 400 })
  if (reset.expiresAt < new Date()) return NextResponse.json({ error: "expired" }, { status: 400 })
  if (reset.usedAt) return NextResponse.json({ error: "already_used" }, { status: 400 })
  if (reset.attempts >= MAX_ATTEMPTS) return NextResponse.json({ error: "too_many_attempts" }, { status: 400 })

  await db.passwordReset.update({
    where: { email },
    data: { attempts: { increment: 1 } },
  })

  const valid = await bcrypt.compare(code, reset.otpHash)
  if (!valid) {
    const attemptsLeft = MAX_ATTEMPTS - (reset.attempts + 1)
    return NextResponse.json({ error: "invalid_code", attemptsLeft }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await db.user.findUnique({ where: { email }, select: { id: true } })
  if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 400 })

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { password: passwordHash, activeSessionToken: null },
    }),
    db.passwordReset.update({
      where: { email },
      data: { usedAt: new Date() },
    }),
  ])

  purgeUserCache(user.id)

  return NextResponse.json({ ok: true })
}
