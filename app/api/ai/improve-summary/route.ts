import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, handleError } from "@/lib/controllers/shared"
import { aiService } from "@/lib/controllers/ai-deps"
import { AI_INPUT_LIMITS } from "@/lib/services/ai/shared/ai-types"

const schema = z.object({
  summary: z.string().max(AI_INPUT_LIMITS.summary).optional(),
  userDescription: z.string().max(AI_INPUT_LIMITS.userDescription).optional(),
  sectionData: z.record(z.string(), z.unknown()).optional(),
  language: z.enum(["es", "en"]).optional(),
})

export async function POST(req: Request) {
  const authResult = await requireUser(req, { csrf: true, emailVerified: true })
  if (authResult instanceof NextResponse) return authResult

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 422 })

  try {
    const result = await aiService.improveSummary(authResult.userId, parsed.data, authResult.user.plan)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err)
  }
}
