import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { nanoid } from "nanoid"
import { checkOrigin } from "@/lib/csrf"

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

  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { resumeId } = await req.json()
  if (!resumeId) return NextResponse.json({ error: "Missing resumeId" }, { status: 400 })

  const resume = await db.resume.findFirst({
    where: { id: resumeId, userId: session.user.id },
    select: { id: true, isPublic: true, publicSlug: true },
  })

  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (resume.isPublic) {
    await db.resume.update({ where: { id: resumeId }, data: { isPublic: false } })
    await db.auditLog.create({ data: { userId: session.user.id, action: "TOGGLE_PUBLIC_CV", metadata: { resumeId, isPublic: false } } })
    return NextResponse.json({ isPublic: false, publicSlug: resume.publicSlug })
  } else {
    const slug = resume.publicSlug ?? nanoid(10)
    await db.resume.update({ where: { id: resumeId }, data: { isPublic: true, publicSlug: slug } })
    await db.auditLog.create({ data: { userId: session.user.id, action: "TOGGLE_PUBLIC_CV", metadata: { resumeId, isPublic: true, slug } } })
    return NextResponse.json({ isPublic: true, publicSlug: slug })
  }
}
