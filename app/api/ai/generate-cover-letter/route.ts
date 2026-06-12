import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, handleError } from "@/lib/controllers/shared"
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
})

export async function POST(req: Request) {
  const authResult = await requireUser(req, { csrf: true, emailVerified: true })
  if (authResult instanceof NextResponse) return authResult

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 422 })

  try {
    const result = await aiService.generateCoverLetter(authResult.userId, parsed.data, authResult.user.plan)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err)
  }
}
