import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const allowed = await checkRateLimit(session.user.id, "billing-version", 120)
  if (!allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { sessionVersion: true },
  })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ version: user.sessionVersion })
}
