import { NextRequest, NextResponse } from "next/server"
import { apiError } from "@/lib/controllers/shared"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return apiError(401, "Unauthorized", { req: request })
  if (session.user.role !== "SUPER_ADMIN") return apiError(403, "Forbidden", { req: request })

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
      managedResumeLimit: true,
      managedCoverLetterLimit: true,
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
