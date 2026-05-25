import { NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { db } from "@/lib/db"

// GDPR Art. 17 — delete accounts marked for deletion after 90-day retention window.
// Configure in Dokploy: 0 2 * * * → GET https://readycvv.com/api/cron/data-cleanup
// Header: Authorization: Bearer <CRON_SECRET>

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const expected = Buffer.from(`Bearer ${cronSecret}`)
  const received = Buffer.from(authHeader ?? "")
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  // M6: run all deletes in parallel — no data dependency between them
  const [deleted, deletedLogs, deletedAuditLogs] = await Promise.all([
    db.user.deleteMany({
      where: { deletedAt: { lte: cutoff } },
    }),
    db.aIUsageLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    }),
    // Keep 180 days of audit logs (GDPR compliance — minimum for security review)
    db.auditLog.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } },
    }),
  ])

  return NextResponse.json({ deleted: deleted.count, deletedLogs: deletedLogs.count, deletedAuditLogs: deletedAuditLogs.count })
}
