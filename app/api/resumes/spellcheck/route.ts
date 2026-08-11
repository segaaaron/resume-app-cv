// POST /api/resumes/spellcheck
// Deterministic spelling check — NO LLM, NO AI quota, no per-run cost. Lives
// under /api/resumes rather than /api/ai on purpose: nothing here talks to a
// model, so it is not gated behind a paid AI plan. Every logged-in user gets a
// correctly spelled CV; the dictionaries run on the server so the browser never
// downloads 1.5 MB of Hunspell data.
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, handleError, apiError } from "@/lib/controllers/shared"
import { checkAndIncrementRateLimit } from "@/lib/rate-limit"
import { checkSpelling } from "@/lib/ats/spellcheck"
import { findGrammarIssues } from "@/lib/ats/grammar-rules"

const schema = z.object({
  // Prose only — the client collects it with collectSpellcheckText so names,
  // employers and skills never reach the dictionary.
  // One entry per prose field: a long CV with many custom sections can reach a
  // few hundred. Generous on purpose — hitting the cap would surface as a
  // generic "could not check" with no way for the user to know why.
  texts: z.array(z.string().max(20_000)).max(1000),
  language: z.enum(["es", "en"]),
  properNouns: z.array(z.string().max(200)).max(400).optional(),
})

export async function POST(req: Request) {
  const authResult = await requireUser(req, { csrf: true })
  if (authResult instanceof NextResponse) return authResult

  // Loading a dictionary is cheap per process but the check is CPU work; this
  // caps a stuck client from hammering it. Generous: a user editing their CV
  // may legitimately re-check many times in a session.
  const allowed = await checkAndIncrementRateLimit(authResult.userId, "spellcheck", 60)
  if (!allowed) return apiError(429, "rate_limit_exceeded", { req })

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return apiError(422, "invalid_data", { req })

  try {
    const { texts, language } = parsed.data
    const spelling = await checkSpelling(texts, language, parsed.data.properNouns ?? [])
    // Enumerable grammar rides the FREE endpoint, not the PRO-gated model: a
    // repeated word and a missing contraction are rules, and a rule costs nothing
    // to run. Before this, "resulting in in" was only ever found by a model call
    // that three of five plans are not allowed to make.
    const grammar = findGrammarIssues(texts, language)
    // The dictionary wins a tie: it is exact where a rule is a pattern.
    const taken = new Set(spelling.map((i) => i.typed.toLowerCase()))
    const issues = [...spelling, ...grammar.filter((g) => !taken.has(g.typed.toLowerCase()))]
    return NextResponse.json({ issues })
  } catch (err) {
    return handleError(err, { req, userId: authResult.userId, userEmail: authResult.user.email })
  }
}
