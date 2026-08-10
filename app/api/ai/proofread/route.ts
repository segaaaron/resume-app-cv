// POST /api/ai/proofread
//
// Grammar pass over the CV's prose. Lives under /api/ai (unlike the dictionary
// check next door) because it costs a model call: the dictionary can only ask
// "is this a word?", which is why "more then 7 years" read as clean — both are
// words. Checking the words is not checking the writing.
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, handleError, apiError } from "@/lib/controllers/shared"
import { aiService } from "@/lib/controllers/ai-deps"
import { canUseAdvancedAts } from "@/lib/plans"

const schema = z.object({
  texts: z.array(z.string().max(20_000)).max(1000),
  language: z.enum(["es", "en"]),
})

export async function POST(req: Request) {
  const authResult = await requireUser(req, { pro: true, csrf: true })
  if (authResult instanceof NextResponse) return authResult

  // Same gate as the other panel routes. `pro: true` (isActive) also lets
  // BASIC/SPRINT through, and they would otherwise reach the quota check and get
  // a confusing 429 instead of being told this needs PRO.
  if (!canUseAdvancedAts(authResult.user.plan)) {
    return apiError(403, "feature_pro_only", { req })
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return apiError(422, "invalid_data", { req })

  try {
    const corrections = await aiService.proofread(
      authResult.userId,
      parsed.data.texts,
      parsed.data.language,
      authResult.user.plan,
    )
    return NextResponse.json({ corrections })
  } catch (err) {
    return handleError(err, { req, userId: authResult.userId, userEmail: authResult.user.email })
  }
}
