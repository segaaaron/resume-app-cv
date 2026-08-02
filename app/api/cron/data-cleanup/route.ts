import { NextResponse } from "next/server"
import { apiError } from "@/lib/controllers/shared"
import { timingSafeEqual } from "crypto"
import { db } from "@/lib/db"
import { recordCronRun } from "@/lib/services/cron/cronRunner"

// GDPR Art. 17 — delete accounts marked for deletion after 90-day retention window.
// Configure in Dokploy: 0 2 * * * → GET https://www.valhallaresume.com/api/cron/data-cleanup
// Header: Authorization: Bearer <CRON_SECRET>

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return apiError(401, "Unauthorized", { req })
  const expected = Buffer.from(`Bearer ${cronSecret}`)
  const received = Buffer.from(authHeader ?? "")
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return apiError(401, "Unauthorized", { req })
  }

  const result = await recordCronRun("data-cleanup", async () => {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    // Users are deleted in small batches to keep transactions short and let Prisma
    // cascades (Resume, CoverLetter, Application, etc.) finish without blocking the DB.
    // Logs/audit deletes have no FK fan-out, so they can run in parallel with the loop.
    const BATCH_SIZE = 100

    const userDeletePromise = (async () => {
      let totalDeleted = 0
      while (true) {
        const ids = await db.user.findMany({
          where: { deletedAt: { lte: cutoff } },
          select: { id: true },
          take: BATCH_SIZE,
        })
        if (ids.length === 0) break
        const res = await db.user.deleteMany({ where: { id: { in: ids.map((u) => u.id) } } })
        totalDeleted += res.count
        // small pause between batches to ease DB pressure
        await new Promise((r) => setTimeout(r, 100))
      }
      return totalDeleted
    })()

    const [deletedCount, deletedLogs, deletedAuditLogs] = await Promise.all([
      userDeletePromise,
      db.aIUsageLog.deleteMany({
        where: { createdAt: { lt: cutoff } },
      }),
      // Keep 180 days of audit logs (GDPR compliance — minimum for security review)
      db.auditLog.deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } },
      }),
    ])

    return { deleted: deletedCount, deletedLogs: deletedLogs.count, deletedAuditLogs: deletedAuditLogs.count }
  })

  return NextResponse.json(result)
}
