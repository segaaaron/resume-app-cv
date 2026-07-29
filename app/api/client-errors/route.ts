import { NextResponse } from "next/server"
import { z } from "zod"
import { checkOrigin } from "@/lib/csrf"
import { auth } from "@/lib/auth"
import { logError } from "@/lib/services/error/errorLog"

// The ErrorLog sink is Prisma-backed → Node runtime.
export const runtime = "nodejs"

const schema = z.object({
  message: z.string().trim().min(1).max(2000),
  stack: z.string().max(6000).optional(),
  source: z.string().max(300).optional(), // the page path the error fired on
  kind: z.enum(["error", "unhandledrejection", "react"]).optional(),
})

// Anti-flood: the client dedupes, but a same-origin script could bypass it and bloat
// ErrorLog. A best-effort in-memory fixed-window cap per IP bounds the damage without a
// DB round-trip. In-memory on purpose — a restart resets it; this is telemetry, not auth.
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 30
const hits = new Map<string, { count: number; resetAt: number }>()

function overRateLimit(ip: string): boolean {
  const now = Date.now()
  const rec = hits.get(ip)
  if (!rec || now >= rec.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    if (hits.size > 5000) for (const [k, v] of hits) if (now >= v.resetAt) hits.delete(k) // bound the map
    return false
  }
  rec.count += 1
  return rec.count > MAX_PER_WINDOW
}

/**
 * Browser error sink. The dashboard is server-side, so uncaught client errors would
 * otherwise be invisible; ClientErrorReporter + the error.tsx boundaries POST here and
 * the failure lands in the same "Service Errors" view under the "client" service, with
 * the page path, message and stack. Same-origin only — this is telemetry, not a public
 * API. Deduped/capped on the client so it can't be used to flood the table.
 */
export async function POST(req: Request) {
  if (!checkOrigin(req)) return NextResponse.json({ ok: false }, { status: 403 })

  // Silently drop once over the per-IP window — telemetry should never error the client.
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown"
  if (overRateLimit(ip)) return NextResponse.json({ ok: true })

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 422 })
  const { message, stack, source, kind } = parsed.data

  // Best-effort attribution — a client error can happen while logged out.
  let userId: string | null = null
  let userEmail: string | null = null
  try {
    const session = await auth()
    userId = session?.user?.id ?? null
    userEmail = session?.user?.email ?? null
  } catch {
    /* anonymous — leave null */
  }

  logError({
    source: "client",
    message,
    endpoint: source ?? null,
    stack: stack ?? null,
    statusCode: null, // browser error, no HTTP status
    userId,
    userEmail,
    context: { kind: kind ?? "error", origin: "browser" },
  })

  return NextResponse.json({ ok: true })
}
