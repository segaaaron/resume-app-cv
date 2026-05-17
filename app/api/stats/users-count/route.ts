import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const count = await db.user.count({
      where: { deletedAt: null },
    })
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 1200 })
  }
}
