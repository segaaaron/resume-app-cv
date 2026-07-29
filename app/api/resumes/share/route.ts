import { NextResponse } from "next/server"
import { requireAuth, handleError } from "@/lib/controllers/shared"
import { resumeService } from "@/lib/controllers/resume-deps"
import { checkRateLimit, recordRateLimitUsage } from "@/lib/rate-limit"
import { createLogger } from "@/lib/logger"

const logger = createLogger("share-route")

// POST /api/resumes/share  { resumeId }  — toggle public sharing
export async function POST(req: Request) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  // DB-backed rate limit — works across all replicas (60 req/hr per user)
  const allowed = await checkRateLimit(authResult.userId, "share-toggle", 60)
  if (!allowed) return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 })
  recordRateLimitUsage(authResult.userId, "share-toggle").catch((err) => {
    logger.error("recordRateLimitUsage share-toggle failed", { userId: authResult.userId }, err)
  })

  const { resumeId } = await req.json()
  if (!resumeId) return NextResponse.json({ error: "Missing resumeId" }, { status: 400 })

  try {
    const result = await resumeService.toggleShare(authResult.userId, resumeId)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err, { req })
  }
}
