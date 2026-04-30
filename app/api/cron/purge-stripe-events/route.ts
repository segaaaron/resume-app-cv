import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago

  const { count } = await db.stripeEvent.deleteMany({
    where: {
      processedAt: {
        lt: cutoff,
      },
    },
  })

  return NextResponse.json({ deleted: count })
}
