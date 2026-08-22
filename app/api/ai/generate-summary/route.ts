import { NextResponse } from "next/server"
import { z } from "zod"
import { POSTING_TERMS_IN_PROMPT } from "@/lib/ats/rewrite-keeps-match"
import { requireUser, handleError, apiError } from "@/lib/controllers/shared"
import { aiService } from "@/lib/controllers/ai-deps"

const schema = z.object({
  sectionData: z.record(z.string(), z.unknown()).optional(),
  language: z.enum(["es", "en"]).optional(),
  // Lo que la vacante pide, tal como lo extrajo el ATS: el resumen es texto del
  // CV y el matcher lo lee como cualquier viñeta.
  postingTerms: z.array(z.string().max(80)).max(POSTING_TERMS_IN_PROMPT).optional(),
})

export async function POST(req: Request) {
  const authResult = await requireUser(req, { csrf: true })
  if (authResult instanceof NextResponse) return authResult

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return apiError(422, "invalid_data", { req })

  try {
    const result = await aiService.generateSummary(authResult.userId, parsed.data, authResult.user.plan)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err, { req, userId: authResult.userId, userEmail: authResult.user.email, payload: parsed.data })
  }
}
