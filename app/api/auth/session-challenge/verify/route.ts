import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkOrigin } from "@/lib/csrf"
import { sessionChallengeService, handleError } from "@/lib/controllers/auth-deps"
import { AppError } from "@/lib/services/auth/AppError"
import { localeFromRequest } from "@/lib/locale"

const bodySchema = z.object({
  email: z.string().email(),
  code:  z.string().length(6).regex(/^\d{6}$/),
})

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 })

  try {
    const result = await sessionChallengeService.verifyChallenge(parsed.data.email, parsed.data.code, localeFromRequest(req))
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof AppError && err.code === "invalid" && err.extra?.attemptsLeft !== undefined) {
      return NextResponse.json({ error: "invalid", attemptsLeft: err.extra.attemptsLeft }, { status: 400 })
    }
    if (err instanceof AppError && err.code === "blocked") {
      return NextResponse.json({ blocked: true, blockedUntil: err.extra?.blockedUntil }, { status: 429 })
    }
    return handleError(err, { req })
  }
}
