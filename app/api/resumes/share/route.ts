import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { nanoid } from "nanoid"

// Simple in-memory rate limiter: 60 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
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
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { resumeId } = await req.json()
  if (!resumeId) return NextResponse.json({ error: "Missing resumeId" }, { status: 400 })

  const resume = await db.resume.findFirst({
    where: { id: resumeId, userId: session.user.id },
    select: { id: true, isPublic: true, publicSlug: true },
  })

  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (resume.isPublic) {
    // Disable sharing — keep slug so the link just stops working
    await db.resume.update({ where: { id: resumeId }, data: { isPublic: false } })
    return NextResponse.json({ isPublic: false, publicSlug: resume.publicSlug })
  } else {
    // Enable sharing — generate slug if not present
    const slug = resume.publicSlug ?? nanoid(10)
    await db.resume.update({ where: { id: resumeId }, data: { isPublic: true, publicSlug: slug } })
    return NextResponse.json({ isPublic: true, publicSlug: slug })
  }
}
