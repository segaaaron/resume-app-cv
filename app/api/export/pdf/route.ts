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

  return NextResponse.json({ error: "Not implemented — use window.print() via /resume/[id]/print" }, { status: 501 })
}
