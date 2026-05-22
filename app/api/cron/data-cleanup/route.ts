import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// GDPR Art. 17 — delete accounts marked for deletion after 90-day retention window.
// Configure in Dokploy: 0 2 * * * → GET https://readycvv.com/api/cron/data-cleanup
// Header: Authorization: Bearer <CRON_SECRET>

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  // M6: run both deletes in parallel — no data dependency between them
  const [deleted] = await Promise.all([
    db.user.deleteMany({
      where: { deletedAt: { lte: cutoff } },
    }),
    db.aIUsageLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    }),
  ])

  return NextResponse.json({ deleted: deleted.count })
}
