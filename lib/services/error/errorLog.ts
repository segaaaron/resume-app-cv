import { createHash } from "crypto"
import { db } from "@/lib/db"

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000
const MESSAGE_MAX = 2000
const STACK_MAX = 6000

export interface LogErrorInput {
  source: string
  message: string
  endpoint?: string | null
  stack?: string | null
  statusCode?: number | null
  userId?: string | null
  userEmail?: string | null
  context?: Record<string, unknown> | null
}

/** Normalize a message so similar errors collapse into one fingerprint group. */
function normalize(message: string): string {
  return message
    .replace(/[0-9a-f]{8,}/gi, "#") // uuids / hashes / ids
    .replace(/\d+/g, "#") // remaining numbers
    .slice(0, 200)
    .trim()
}

function fingerprintOf(source: string, endpoint: string | null | undefined, message: string): string {
  return createHash("sha1").update(`${source}|${endpoint ?? ""}|${normalize(message)}`).digest("hex")
}

/**
 * Persist an application error. Fire-and-forget and fully defensive: it never throws
 * and never calls the logger (would recurse). If the DB is the failing dependency the
 * write simply fails silently — capturing errors must not create errors.
 */
export function logError(input: LogErrorInput): void {
  const message = (input.message || "unknown error").slice(0, MESSAGE_MAX)
  const fingerprint = fingerprintOf(input.source, input.endpoint, message)

  void (async () => {
    try {
      await db.errorLog.create({
        data: {
          source: input.source.slice(0, 120),
          endpoint: input.endpoint?.slice(0, 300) ?? null,
          message,
          stack: input.stack?.slice(0, STACK_MAX) ?? null,
          statusCode: input.statusCode ?? null,
          userId: input.userId ?? null,
          userEmail: input.userEmail ?? null,
          context: (input.context ?? undefined) as object | undefined,
          fingerprint,
        },
      })
      // Sampled retention trim — keep the table bounded without a write-time cost every call.
      if (Math.random() < 0.02) {
        await db.errorLog.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - RETENTION_MS) } } })
      }
    } catch {
      // Swallow — do NOT log (recursion). Last resort only:
      try {
        console.error(JSON.stringify({ level: "error", service: "errorLog", message: "persist_failed" }))
      } catch {
        /* noop */
      }
    }
  })()
}

// ─────────────────────── Logger sink registration ───────────────────────
// Wire the global sink the logger calls (server-only side effect). Loaded at
// startup via instrumentation.ts so every logger.error is captured, without the
// logger holding an import edge to Prisma.
type ErrorSinkPayload = { service: string; message: string; context?: Record<string, unknown>; stack?: string }

function pickString(ctx: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = ctx[k]
    if (typeof v === "string" && v) return v
  }
  return undefined
}

;(globalThis as typeof globalThis & { __errorLogSink?: (p: ErrorSinkPayload) => void }).__errorLogSink = (p) => {
  const ctx = p.context ?? {}
  const statusRaw = ctx.status ?? ctx.statusCode
  logError({
    // Prefer an explicit service label from the log context (handleError derives it
    // from the route: "ai", "stripe", …) over the generic logger name ("controller").
    source: pickString(ctx, "source") ?? p.service,
    message: p.message,
    endpoint: pickString(ctx, "route", "endpoint", "path") ?? null,
    stack: p.stack ?? null,
    statusCode: typeof statusRaw === "number" ? statusRaw : null,
    userId: pickString(ctx, "userId") ?? null,
    userEmail: pickString(ctx, "userEmail", "email") ?? null,
    context: ctx,
  })
}

// ─────────────────────────── Admin report ───────────────────────────

export type ErrorWindow = "24h" | "7d" | "30d"

const WINDOW_MS: Record<ErrorWindow, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
}

export interface ErrorIssue {
  fingerprint: string
  source: string
  endpoint: string | null
  message: string
  stack: string | null
  statusCode: number | null
  count: number
  lastSeen: string
  lastUserId: string | null
  lastUserEmail: string | null
}

export interface ErrorReport {
  window: ErrorWindow
  total: number
  affectedUsers: number
  topSource: { source: string; count: number } | null
  sources: string[]
  issues: ErrorIssue[]
}

export interface ErrorReportParams {
  window?: ErrorWindow
  source?: string
  q?: string
}

const ISSUE_LIMIT = 50

export async function getErrorReport(params: ErrorReportParams = {}): Promise<ErrorReport> {
  const window: ErrorWindow = params.window ?? "24h"
  const since = new Date(Date.now() - WINDOW_MS[window])

  const where: Record<string, unknown> = { createdAt: { gte: since } }
  if (params.source) where.source = params.source
  if (params.q) {
    const q = params.q.trim()
    where.OR = [
      { userEmail: { contains: q, mode: "insensitive" } },
      { message: { contains: q, mode: "insensitive" } },
      { userId: q },
    ]
  }

  const [total, byUser, bySource, allSources, counts, reps] = await Promise.all([
    db.errorLog.count({ where }),
    db.errorLog.groupBy({ by: ["userId"], where: { ...where, userId: { not: null } } }),
    db.errorLog.groupBy({ by: ["source"], where, _count: { source: true }, orderBy: { _count: { source: "desc" } }, take: 1 }),
    db.errorLog.findMany({ where: { createdAt: { gte: since } }, select: { source: true }, distinct: ["source"], orderBy: { source: "asc" } }),
    db.errorLog.groupBy({ by: ["fingerprint"], where, _count: { fingerprint: true }, _max: { createdAt: true }, orderBy: { _count: { fingerprint: "desc" } }, take: ISSUE_LIMIT }),
    db.errorLog.findMany({ where, distinct: ["fingerprint"], orderBy: [{ fingerprint: "asc" }, { createdAt: "desc" }] }),
  ])

  const repByFp = new Map(reps.map((r) => [r.fingerprint, r]))

  const issues: ErrorIssue[] = counts
    .map((c) => {
      const r = repByFp.get(c.fingerprint)
      if (!r) return null
      return {
        fingerprint: c.fingerprint,
        source: r.source,
        endpoint: r.endpoint,
        message: r.message,
        stack: r.stack,
        statusCode: r.statusCode,
        count: c._count.fingerprint,
        lastSeen: (c._max.createdAt ?? r.createdAt).toISOString(),
        lastUserId: r.userId,
        lastUserEmail: r.userEmail,
      }
    })
    .filter((x): x is ErrorIssue => x !== null)
    .sort((a, b) => b.count - a.count)

  return {
    window,
    total,
    affectedUsers: byUser.length,
    topSource: bySource[0] ? { source: bySource[0].source, count: bySource[0]._count.source } : null,
    sources: allSources.map((s) => s.source),
    issues,
  }
}
