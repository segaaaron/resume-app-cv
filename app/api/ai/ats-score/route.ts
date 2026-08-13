import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, handleError, apiError } from "@/lib/controllers/shared"
import { aiService } from "@/lib/controllers/ai-deps"
import { AI_INPUT_LIMITS } from "@/lib/services/ai/shared/ai-types"

const schema = z
  .object({
    jobDescription: z.string().max(AI_INPUT_LIMITS.jobDescription).optional(),
    roleTitle: z.string().max(120).optional(),
    sectionData: z.record(z.string(), z.unknown()).optional(),
    language: z.enum(["es", "en"]).optional(),
    templateId: z.string().max(64).optional(),

    resumeId: z.string().max(64).optional(),
    // Echoed back from a previous run over the SAME posting so the extraction is
    // not re-sampled (see ATSScoreInput.cachedKeywords). Bounded and validated
    // like any other input — a client sending nonsense only skews its own score.
    cachedKeywords: z
      .object({
        hardSkills: z.array(z.string().max(80)).max(40),
        softSkills: z.array(z.string().max(80)).max(40),
        jobTitle: z.string().max(120),
        mustHaves: z.array(z.string().max(160)).max(40),
        summary: z.string().max(600).optional(),
      })
      .optional(),
  })
  .refine(
    (d) => (d.jobDescription?.trim().length ?? 0) >= 20 || (d.roleTitle?.trim().length ?? 0) >= 3,
    { message: "Provide a job description (20+ chars) or a role title (3+ chars)" },
  )

export async function POST(req: Request) {
  const authResult = await requireUser(req, { pro: true, csrf: true })
  if (authResult instanceof NextResponse) return authResult

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return apiError(422, "invalid_data", { req })

  try {
    const result = await aiService.atsScore(authResult.userId, parsed.data, authResult.user.plan)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err, { req, userId: authResult.userId, userEmail: authResult.user.email, payload: parsed.data })
  }
}
