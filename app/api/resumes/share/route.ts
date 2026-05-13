import { NextResponse } from "next/server"
import { requireAuth, handleError } from "@/lib/controllers/shared"
import { resumeService } from "@/lib/controllers/resume-deps"

// Simple in-memory rate limiter: 60 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
setInterval(() => {
  const now = Date.now()
  rateLimitMap.forEach((v, k) => { if (now > v.resetAt) rateLimitMap.delete(k) })
}, 10 * 60 * 1000)

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 1000 })
    return true
  }
  if (entry.count >= 60) return false
  entry.count++
  return true
}

// POST /api/resumes/share  { resumeId }  — toggle public sharing
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkIpRateLimit(ip)) {
    return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 })
  }

  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const { resumeId } = await req.json()
  if (!resumeId) return NextResponse.json({ error: "Missing resumeId" }, { status: 400 })

  try {
    const result = await resumeService.toggleShare(authResult.userId, resumeId)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err)
  }
}
