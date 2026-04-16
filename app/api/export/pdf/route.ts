import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const resume = await db.resume.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // For now, return a placeholder response
  // Full PDF generation with @react-pdf/renderer will be implemented in Phase 2
  return NextResponse.json({
    message: "PDF generation endpoint — Phase 2 implementation",
    resumeId: id,
    title: resume.title,
  })
}
