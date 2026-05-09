import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { resend, emailEnabled } from "@/lib/resend"
import { checkOrigin } from "@/lib/csrf"
import { checkRateLimit } from "@/lib/rate-limit"
import { sessionChallengeHtml, sessionChallengeText } from "@/lib/emails/sessionChallenge"

const bodySchema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 })

  const { email } = parsed.data

  // Rate limit: 5 requests/hr per email
  const allowed = await checkRateLimit(email, "session-challenge", 5)
  if (!allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 })

  const user = await db.user.findUnique({ where: { email } })

  // Always return 200 — prevents email enumeration
  if (!user) return NextResponse.json({ sent: true })

  // Always return sent:true to prevent enumeration even when blocked
  if (user.sessionChallengeBlockedUntil && user.sessionChallengeBlockedUntil > new Date()) {
    return NextResponse.json({ sent: true })
  }

  // Only proceed if there's actually an active session to challenge
  if (!user.activeSessionToken) return NextResponse.json({ sent: true })

  // Generate 6-digit OTP (cryptographically secure)
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000)
  const codeHash = await bcrypt.hash(code, 10)
  const exp = new Date(Date.now() + 10 * 60 * 1000)

  await db.user.update({
    where: { id: user.id },
    data: {
      sessionChallengeCode:     codeHash,
      sessionChallengeExp:      exp,
      sessionChallengeAttempts: 0,
    },
  })

  if (emailEnabled() && user.name) {
    await resend!.emails.send({
      from: "READY CV <no-reply@readycvv.com>",
      to: email,
      subject: "Código de acceso a tu cuenta READY CV",
      html: sessionChallengeHtml({ userName: user.name, code }),
      text: sessionChallengeText({ userName: user.name, code }),
    }).catch(() => {})
  }

  return NextResponse.json({ sent: true })
}
