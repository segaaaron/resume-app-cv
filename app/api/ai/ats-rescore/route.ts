// POST /api/ai/ats-rescore
// Deterministic ATS re-score — NO LLM, NO quota. Reuses the keywords a prior
// /api/ai/ats-score already extracted, so the score moves the instant the user
// applies a fix, without spending another AI call or hitting the cooldown.
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, handleError } from "@/lib/controllers/shared"
import { aiService } from "@/lib/controllers/ai-deps"
import { canUseAdvancedAts } from "@/lib/plans"

const schema = z.object({
  keywords: z.object({
    hardSkills: z.array(z.string().max(120)).max(60),
    softSkills: z.array(z.string().max(120)).max(60),
    jobTitle: z.string().max(200),
    mustHaves: z.array(z.string().max(200)).max(60),
  }),
  sectionData: z.record(z.string(), z.unknown()).optional(),
  language: z.enum(["es", "en"]).optional(),
  templateId: z.string().max(64).optional(),
})

export async function POST(req: Request) {
  const authResult = await requireUser(req, { pro: true, csrf: true })
  if (authResult instanceof NextResponse) return authResult
  // Advanced ATS is PRO/LIMITED only. `pro: true` (isActive) also passes
  // BASIC/SPRINT; this quota-less route must gate them out explicitly.
  if (!canUseAdvancedAts(authResult.user.plan)) {
    return NextResponse.json({ error: "feature_pro_only" }, { status: 403 })
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 422 })

  try {
    const result = aiService.atsRescore(parsed.data)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err)
  }
}
