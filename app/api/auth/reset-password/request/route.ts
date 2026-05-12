import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/lib/db"
import { checkOrigin } from "@/lib/csrf"
import { checkRateLimit } from "@/lib/ai-client"
import { resend, emailEnabled } from "@/lib/resend"
import { passwordResetHtml, passwordResetText } from "@/lib/emails/passwordReset"

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: Request) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const allowed = await checkRateLimit(ip, "reset-password-request", 3)
  if (!allowed) return NextResponse.json({ error: "rate_limit" }, { status: 429 })

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "invalid_email" }, { status: 400 })

  const { email } = parsed.data

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, password: true },
  })

  // Anti-enumeration: always return sent:true if email doesn't exist
  if (!user) return NextResponse.json({ sent: true })

  // Google-only account: no password to reset
  if (!user.password) {
    return NextResponse.json({ error: "google_account" }, { status: 409 })
  }

  const otpInt = crypto.getRandomValues(new Uint32Array(1))[0]
  const code = String((otpInt % 900000) + 100000)
  const otpHash = await bcrypt.hash(code, 10)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await db.passwordReset.upsert({
    where: { email },
    create: { email, otpHash, expiresAt, attempts: 0 },
    update: { otpHash, expiresAt, attempts: 0, usedAt: null },
  })

  if (emailEnabled() && resend) {
    await resend.emails.send({
      from: "READY CV <no-reply@readycvv.com>",
      to: email,
      subject: "Tu código para restablecer contraseña — READY CV",
      html: passwordResetHtml({ userName: user.name ?? "Usuario", code }),
      text: passwordResetText({ userName: user.name ?? "Usuario", code }),
    }).catch((e) => console.error("[resend] password reset OTP failed:", e))
  }

  return NextResponse.json({ sent: true })
}
