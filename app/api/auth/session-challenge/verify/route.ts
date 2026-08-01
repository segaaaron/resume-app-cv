import { NextRequest, NextResponse } from "next/server"
import { apiError } from "@/lib/controllers/shared"
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
  if (!checkOrigin(req)) return apiError(403, "forbidden", { req })

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return apiError(400, "invalid_input", { req })

  try {
    const result = await sessionChallengeService.verifyChallenge(parsed.data.email, parsed.data.code, localeFromRequest(req))
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof AppError && err.code === "invalid" && err.extra?.attemptsLeft !== undefined) {
      return apiError(400, "invalid", { req, extra: { attemptsLeft: err.extra.attemptsLeft } })
    }
    if (err instanceof AppError && err.code === "blocked") {
      return NextResponse.json({ blocked: true, blockedUntil: err.extra?.blockedUntil }, { status: 429 })
    }
    return handleError(err, { req })
  }
}
