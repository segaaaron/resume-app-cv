import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, handleError, apiError } from "@/lib/controllers/shared"
import { aiService } from "@/lib/controllers/ai-deps"

const schema = z.object({
  targetId: z.string().min(1).max(64),
  // Exactly two, and they must be real positions in the role's bullet list — the
  // module re-checks against the CV, because a stale index would fuse the wrong
  // two lines and that is worse than doing nothing.
  indexes: z.tuple([z.number().int().min(0).max(200), z.number().int().min(0).max(200)]),
  sectionData: z.record(z.string(), z.unknown()),
  language: z.enum(["es", "en"]).optional(),
})

export async function POST(req: Request) {
  const authResult = await requireUser(req, { pro: true, csrf: true })
  if (authResult instanceof NextResponse) return authResult

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return apiError(422, "invalid_data", { req })

  try {
    const result = await aiService.mergeBullets(authResult.userId, parsed.data, authResult.user.plan)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err, { req, userId: authResult.userId, userEmail: authResult.user.email, payload: parsed.data })
  }
}
