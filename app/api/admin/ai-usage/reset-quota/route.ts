// POST /api/admin/ai-usage/reset-quota — clears ONE user's daily AI caps.
//
// The daily cap is anti-abuse: an unlimited plan still cannot burn a thousand
// model calls in an afternoon. It has no escape hatch, and the people who hit it
// first are the ones testing the product — support cannot unblock a paying user
// mid-incident either. Until now the only way out was a hand-written DELETE
// against the database, which is not something anyone should be doing to fix a
// counter.
//
// Scope is deliberately narrow: it deletes the `ai-daily:` rows of ONE user and
// nothing else. It does NOT touch the lifetime freemium counters (the sentinel
// resetAt 2099 rows) — those are the paid boundary, and resetting them would be
// giving away quota, not unblocking a test.
import { NextResponse } from "next/server"
import { z } from "zod"
import { apiError } from "@/lib/controllers/shared"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkOrigin } from "@/lib/csrf"
import { createLogger } from "@/lib/logger"

const logger = createLogger("admin-ai-usage")

const schema = z.object({
  /** Either identifier — the panel lists emails, scripts know ids. */
  userId: z.string().min(1).max(64).optional(),
  email: z.string().email().max(320).optional(),
})

export async function POST(req: Request) {
  if (!checkOrigin(req)) return apiError(403, "Forbidden", { req })

  const session = await auth()
  if (!session?.user?.id) return apiError(401, "Unauthorized", { req })
  if (session.user.role !== "SUPER_ADMIN") return apiError(403, "Forbidden", { req })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success || (!parsed.data.userId && !parsed.data.email)) {
    return apiError(400, "Invalid payload", { req })
  }

  const target = await db.user.findFirst({
    where: parsed.data.userId ? { id: parsed.data.userId } : { email: parsed.data.email },
    select: { id: true, email: true },
  })
  if (!target) return apiError(404, "User not found", { req })

  // Only the self-resetting daily windows. The `ai-daily:` prefix is what keeps
  // these separate from lifetime freemium rows — see quota-enforcer.
  const { count } = await db.aIRateLimit.deleteMany({
    where: { userId: target.id, endpoint: { startsWith: "ai-daily:" } },
  })

  // Who unblocked whom, and when. A quota reset is a grant of paid capacity and
  // has to be answerable later.
  db.auditLog
    .create({
      data: {
        userId: target.id,
        action: "SUBSCRIPTION_UPDATED",
        metadata: { source: "admin_reset_ai_daily_quota", by: session.user.id, cleared: count },
      },
    })
    .catch((err) => logger.error("reset-quota: auditLog write failed", { userId: target.id }, err instanceof Error ? err : undefined))

  logger.info("admin reset daily AI quota", { target: target.email, by: session.user.id, cleared: count })
  return NextResponse.json({ ok: true, cleared: count, email: target.email })
}
