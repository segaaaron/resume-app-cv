import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, handleError, apiError } from "@/lib/controllers/shared"
import { aiService } from "@/lib/controllers/ai-deps"
import { AI_INPUT_LIMITS } from "@/lib/services/ai/shared/ai-types"

const schema = z.object({
  // Two, not ten: in "seed" mode the whole instruction is the job title, and
  // plenty of real ones are shorter than ten characters ("albañil", "cocinero",
  // "chef"). Junk that clears two characters is refused by the model's own
  // off-topic sentinel, which is measured; a length rule never could be.
  prompt: z.string().min(2).max(AI_INPUT_LIMITS.prompt),
  sectionData: z.record(z.string(), z.unknown()).optional(),
  language: z.enum(["es", "en"]).optional(),
  // Which task, so the module can pick the prompt written for it. Unknown
  // values are rejected here rather than silently falling back — a typo that
  // quietly routes to the wrong prompt is the kind of bug nobody sees.
  mode: z.enum(["seed", "certifications", "bullets"]).optional(),
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
