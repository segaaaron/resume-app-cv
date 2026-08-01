import { NextRequest, NextResponse } from "next/server"
import { apiError } from "@/lib/controllers/shared"
import { z } from "zod"
import { checkOrigin } from "@/lib/csrf"
import { sessionChallengeService, handleError } from "@/lib/controllers/auth-deps"
import { localeFromRequest } from "@/lib/locale"

const bodySchema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) return apiError(403, "forbidden", { req })

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return apiError(400, "invalid_input", { req })

  try {
    const result = await sessionChallengeService.issueChallenge(parsed.data.email, localeFromRequest(req))
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err, { req })
  }
}
