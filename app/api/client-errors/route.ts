import { NextResponse } from "next/server"
import { z } from "zod"
import { checkOrigin } from "@/lib/csrf"
import { auth } from "@/lib/auth"
import { logError } from "@/lib/services/error/errorLog"
import { isThirdPartyClientError } from "@/lib/client-error-reporter"

// The ErrorLog sink is Prisma-backed → Node runtime.
export const runtime = "nodejs"

const schema = z.object({
  message: z.string().trim().min(1).max(2000),
  stack: z.string().max(6000).optional(),
  source: z.string().max(300).optional(), // the page path the error fired on
  kind: z.enum(["error", "unhandledrejection", "react", "ux"]).optional(),
  /**
   * Facts about a refused action. Scalars only, and short.
   *
   * This carries diagnostics from the editor, where every string in reach is a
   * line of somebody's résumé. The schema is the guard: free text cannot be
   * posted here, so a caller cannot accidentally file a candidate's employment
   * history into the error panel. Send counts, flags and ids — never content.
   */
  detail: z
    .record(z.string().max(40), z.union([z.string().max(40), z.number(), z.boolean()]))
    .optional(),
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
  const { message, stack, source, kind, detail } = parsed.data

  // The browser already drops these, but the browser is not a guard: an old tab
  // running yesterday's bundle, or anything else posting here, would still fill the
  // panel with other people's extensions. Same predicate, one definition.
  if (isThirdPartyClientError(message, stack)) return NextResponse.json({ ok: true })

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
    // A refused action is not a crash: it is the product saying no to a user who
    // asked for something reasonable. Its own service so the panel can be read
    // as "what are we blocking, and how often" without digging through stacks.
    source: kind === "ux" ? "ux" : "client",
    message,
    endpoint: source ?? null,
    stack: stack ?? null,
    statusCode: null, // browser error, no HTTP status
    userId,
    userEmail,
    // `detail` is NESTED, never spread. Its keys come from a caller in the
    // browser, and one of them is already `source` — spreading would let client
    // data overwrite the fields this row is classified by, which is how a
    // failure ends up filed under the wrong service and nobody finds it.
    context: { kind: kind ?? "error", origin: "browser", ...(detail ? { detail } : {}) },
  })

  return NextResponse.json({ ok: true })
}
