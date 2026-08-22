import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, handleError, apiError } from "@/lib/controllers/shared"
import { aiService } from "@/lib/controllers/ai-deps"
import { AI_INPUT_LIMITS } from "@/lib/services/ai/shared/ai-types"
import { POSTING_TERMS_IN_PROMPT } from "@/lib/ats/rewrite-keeps-match"

const schema = z.object({
  summary: z.string().max(AI_INPUT_LIMITS.summary).optional(),
  userDescription: z.string().max(AI_INPUT_LIMITS.userDescription).optional(),
  sectionData: z.record(z.string(), z.unknown()).optional(),
  // Lo que la vacante pide, tal como lo extrajo el ATS. El tope es el mismo que
  // usa el prompt para no recibir una lista que después recorta en silencio.
  postingTerms: z.array(z.string().max(80)).max(POSTING_TERMS_IN_PROMPT).optional(),
  language: z.enum(["es", "en"]).optional(),
})

export async function POST(req: Request) {
  const authResult = await requireUser(req, { csrf: true })
  if (authResult instanceof NextResponse) return authResult

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return apiError(422, "invalid_data", { req })

  try {
    const result = await aiService.improveSummary(authResult.userId, parsed.data, authResult.user.plan)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err, { req, userId: authResult.userId, userEmail: authResult.user.email, payload: parsed.data })
  }
}
