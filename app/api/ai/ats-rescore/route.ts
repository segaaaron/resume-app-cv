// POST /api/ai/ats-rescore
// Deterministic ATS re-score — NO LLM, NO quota. Reuses the keywords a prior
// /api/ai/ats-score already extracted, so the score moves the instant the user
// applies a fix, without spending another AI call or hitting the cooldown.
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, handleError, apiError } from "@/lib/controllers/shared"
import { aiService } from "@/lib/controllers/ai-deps"
import { canUseAdvancedAts } from "@/lib/plans"

const schema = z.object({
  /** Scopes any cached answer to the résumé it came from. */
  resumeId: z.string().max(64).optional(),
  keywords: z.object({
    hardSkills: z.array(z.string().max(120)).max(60),
    softSkills: z.array(z.string().max(120)).max(60),
    jobTitle: z.string().max(200),
    mustHaves: z.array(z.string().max(200)).max(60),
  }),
  sectionData: z.record(z.string(), z.unknown()).optional(),
  language: z.enum(["es", "en"]).optional(),
  templateId: z.string().max(64).optional(),
  // Echoed from the full analysis so the instant re-score credits the same
  // synonym matches instead of silently scoring exact-match only.
  semanticMatches: z.array(z.string().max(120)).max(80).optional(),
  demonstratedSoftSkills: z.array(z.string().max(120)).max(40).optional(),
})

export async function POST(req: Request) {
  const authResult = await requireUser(req, { pro: true, csrf: true })
  if (authResult instanceof NextResponse) return authResult
  // Advanced ATS is PRO/LIMITED only. `pro: true` (isActive) also passes
  // BASIC/SPRINT; this quota-less route must gate them out explicitly.
  if (!canUseAdvancedAts(authResult.user.plan)) {
    return apiError(403, "feature_pro_only", { req })
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return apiError(422, "invalid_data", { req })

  try {
    const result = aiService.atsRescore(parsed.data)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err, { req, userId: authResult.userId, userEmail: authResult.user.email, payload: parsed.data })
  }
}
