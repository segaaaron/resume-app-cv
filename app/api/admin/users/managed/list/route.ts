import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const rows = await db.user.findMany({
    where: { isManaged: true },
    select: {
      id: true,
      email: true,
      managedExpiresAt: true,
      managedDownloadLimit: true,
      managedDownloadsUsed: true,
      managedBlocked: true,
      managedNote: true,
      managedCreatedBy: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(rows)
}
