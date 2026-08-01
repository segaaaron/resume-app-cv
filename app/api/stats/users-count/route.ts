import { NextResponse } from "next/server"
import { apiError } from "@/lib/controllers/shared"
import { db } from "@/lib/db"
import { unstable_cache } from "next/cache"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const revalidate = 3600

const getCachedUserCount = unstable_cache(
  async () => db.user.count({ where: { deletedAt: null } }),
  ["users-count"],
  { revalidate: 3600 }
)

export async function GET(req: Request) {
  try {
    const count = await getCachedUserCount()
    return NextResponse.json({ count })
  } catch {
    return apiError(503, "unavailable", { req })
  }
}
