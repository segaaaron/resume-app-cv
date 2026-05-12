import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { resend, emailEnabled } from "@/lib/resend"
import { checkOrigin } from "@/lib/csrf"
import { purgeUserCache } from "@/lib/auth"
import { checkRateLimit } from "@/lib/ai-client"
import { sessionChallengeFailedHtml, sessionChallengeFailedText } from "@/lib/emails/sessionChallengeFailedAttempt"
import { sessionChallengeBlockedHtml, sessionChallengeBlockedText } from "@/lib/emails/sessionChallengeBlocked"
import { sessionForcedHtml, sessionForcedText } from "@/lib/emails/sessionForced"

const MAX_ATTEMPTS = 5
const BLOCK_DURATION_MS = 5 * 60 * 60 * 1000

const bodySchema = z.object({
  email: z.string().email(),
  code:  z.string().length(6).regex(/^\d{6}$/),
})

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 })

  const { email, code } = parsed.data

  const allowed = await checkRateLimit(email, "session-challenge-verify", 10)
  if (!allowed) return NextResponse.json({ error: "rate_limit" }, { status: 429 })

  const user = await db.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ error: "invalid_or_no_challenge" }, { status: 400 })

  if (user.sessionChallengeBlockedUntil && user.sessionChallengeBlockedUntil > new Date()) {
    return NextResponse.json(
      { blocked: true, blockedUntil: user.sessionChallengeBlockedUntil.toISOString() },
      { status: 429 }
    )
  }

  if (!user.sessionChallengeCode || !user.sessionChallengeExp) {
    return NextResponse.json({ error: "no_challenge" }, { status: 400 })
  }

  if (user.sessionChallengeExp < new Date()) {
    return NextResponse.json({ error: "expired" }, { status: 400 })
  }

  const valid = await bcrypt.compare(code, user.sessionChallengeCode)

  if (!valid) {
    const newAttempts = user.sessionChallengeAttempts + 1

    if (newAttempts >= MAX_ATTEMPTS) {
      const blockedUntil = new Date(Date.now() + BLOCK_DURATION_MS)
      await db.user.update({
        where: { id: user.id },
        data: {
          sessionChallengeAttempts:     newAttempts,
          sessionChallengeBlockedUntil: blockedUntil,
          sessionChallengeCode:         null,
          sessionChallengeExp:          null,
        },
      })
      if (emailEnabled() && user.name) {
        await resend!.emails.send({
          from: "READY CV <no-reply@readycvv.com>",
          to: email,
          subject: "Cuenta bloqueada temporalmente — READY CV",
          html: sessionChallengeBlockedHtml({ userName: user.name, unblockedAt: blockedUntil }),
          text: sessionChallengeBlockedText({ userName: user.name, unblockedAt: blockedUntil }),
        }).catch(() => {})
      }
      return NextResponse.json({ blocked: true, blockedUntil: blockedUntil.toISOString() }, { status: 429 })
    }

    await db.user.update({
      where: { id: user.id },
      data: { sessionChallengeAttempts: newAttempts },
    })
    const attemptsLeft = MAX_ATTEMPTS - newAttempts
    if (emailEnabled() && user.name) {
      await resend!.emails.send({
        from: "READY CV <no-reply@readycvv.com>",
        to: email,
        subject: "Intento fallido de acceso — READY CV",
        html: sessionChallengeFailedHtml({ userName: user.name, attemptsLeft }),
        text: sessionChallengeFailedText({ userName: user.name, attemptsLeft }),
      }).catch(() => {})
    }
    return NextResponse.json({ error: "invalid", attemptsLeft }, { status: 400 })
  }

  // Valid — clear session and challenge data
  await db.user.update({
    where: { id: user.id },
    data: {
      activeSessionToken:           null,
      sessionChallengeCode:         null,
      sessionChallengeExp:          null,
      sessionChallengeAttempts:     0,
      sessionChallengeBlockedUntil: null,
    },
  })

  purgeUserCache(user.id)

  if (emailEnabled() && user.name) {
    await resend!.emails.send({
      from: "READY CV <no-reply@readycvv.com>",
      to: email,
      subject: "Tu sesión fue cerrada — READY CV",
      html: sessionForcedHtml({ userName: user.name }),
      text: sessionForcedText({ userName: user.name }),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
