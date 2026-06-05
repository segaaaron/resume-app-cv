import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = request.nextUrl
  const cursor = searchParams.get("cursor") ?? undefined
  const limitParam = parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10)
  const safeLimit = Math.min(isNaN(limitParam) || limitParam < 1 ? DEFAULT_LIMIT : limitParam, MAX_LIMIT)

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
    take: safeLimit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasMore = rows.length > safeLimit
  const items = hasMore ? rows.slice(0, safeLimit) : rows
  const nextCursor = hasMore ? items[items.length - 1]?.id : null

  return NextResponse.json({ items, nextCursor })
}
