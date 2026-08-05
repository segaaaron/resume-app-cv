import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, handleError, apiError } from "@/lib/controllers/shared"
import { aiService } from "@/lib/controllers/ai-deps"
import { AI_INPUT_LIMITS } from "@/lib/services/ai/shared/ai-types"

const schema = z.object({
  resumeId: z.string().optional(),
  recipientName: z.string().max(AI_INPUT_LIMITS.recipientName).optional(),
  recipientTitle: z.string().max(AI_INPUT_LIMITS.recipientTitle).optional(),
  company: z.string().max(AI_INPUT_LIMITS.company).optional(),
  jobTitle: z.string().max(AI_INPUT_LIMITS.jobTitle).optional(),
  tone: z.enum(["formal", "creative", "balanced"]).optional(),
  language: z.enum(["es", "en"]).optional(),
  userPrompt: z.string().max(AI_INPUT_LIMITS.userPrompt).optional(),
  // The candidate's three answers — motivation / achievement / fit.
  highlights: z
    .object({
      motivation: z.string().max(AI_INPUT_LIMITS.coverLetterHighlight).optional(),
      achievement: z.string().max(AI_INPUT_LIMITS.coverLetterHighlight).optional(),
      fit: z.string().max(AI_INPUT_LIMITS.coverLetterHighlight).optional(),
    })
    .optional(),
  // The vacancy text. It was MISSING from this schema while the editor sent it
  // and the module read it: zod strips unknown keys, so the tailoring brief was
  // silently built with no job description at all — every letter came out
  // untailored no matter what the user pasted.
  jobDescription: z.string().max(AI_INPUT_LIMITS.jobDescription).optional(),
})

export async function POST(req: Request) {
  const authResult = await requireUser(req, { csrf: true })
  if (authResult instanceof NextResponse) return authResult

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return apiError(422, "invalid_data", { req })

  try {
    const result = await aiService.generateCoverLetter(authResult.userId, parsed.data, authResult.user.plan)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err, { req, userId: authResult.userId, userEmail: authResult.user.email, payload: parsed.data })
  }
}
