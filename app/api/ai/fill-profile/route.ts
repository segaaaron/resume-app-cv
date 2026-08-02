import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, handleError, apiError } from "@/lib/controllers/shared"
import { aiService } from "@/lib/controllers/ai-deps"
import { AI_INPUT_LIMITS } from "@/lib/services/ai/shared/ai-types"

const schema = z.object({
  prompt: z.string().min(10).max(AI_INPUT_LIMITS.prompt),
  sectionData: z.record(z.string(), z.unknown()).optional(),
  language: z.enum(["es", "en"]).optional(),
})

export async function POST(req: Request) {
  const authResult = await requireUser(req, { csrf: true })
  if (authResult instanceof NextResponse) return authResult

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return apiError(422, "invalid_data", { req })

  try {
    const result = await aiService.fillProfile(authResult.userId, parsed.data, authResult.user.plan)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err, { req, userId: authResult.userId, userEmail: authResult.user.email, payload: parsed.data })
  }
}
