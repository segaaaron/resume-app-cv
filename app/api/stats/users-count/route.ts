import { NextResponse } from "next/server"
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

export async function GET() {
  try {
    const count = await getCachedUserCount()
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 })
  }
}
