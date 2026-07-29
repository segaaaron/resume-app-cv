// Next.js server instrumentation.
//
// register(): loads the error-log module so it registers the global sink the logger
// writes through (see lib/logger.ts / lib/services/error/errorLog.ts).
//
// onRequestError(): Next's global server-error hook. It fires for EVERY unhandled
// server-side error — API routes that don't use handleError, uncaught throws, Server
// Component/render errors — with the request path. This is what makes the admin
// "Service Errors" dashboard exhaustive on the server: a route that never wrapped its
// error still lands there, attributed to its service, with the real message + stack.
// (Errors caught by handleError return a response instead of throwing, so they never
// reach here — no double logging.)
//
// Node runtime only — the ErrorLog table is behind Prisma, not available on edge.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@/lib/services/error/errorLog")
  }
}

/** Map a request path to a service family, mirror of shared.ts's serviceFromRoute. */
function serviceFromPath(path: string): string {
  const clean = path.split("?")[0]
  const segs = clean.split("/").filter(Boolean)
  if (segs[0] === "api" && segs[1]) return segs[1]
  return segs[0] ?? "app"
}

// Next control-flow "errors" (redirect / notFound / dynamic-usage) are thrown sentinels,
// not failures — never log them as service errors.
function isControlFlow(err: unknown): boolean {
  const digest = (err as { digest?: unknown })?.digest
  if (typeof digest === "string") {
    if (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND" || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK")) {
      return true
    }
  }
  const msg = (err as { message?: unknown })?.message
  return typeof msg === "string" && (msg === "NEXT_NOT_FOUND" || msg.startsWith("NEXT_REDIRECT") || msg.includes("DYNAMIC_SERVER_USAGE"))
}

export async function onRequestError(
  error: unknown,
  request: { path?: string; method?: string },
  context?: { routeType?: string; routerKind?: string },
): Promise<void> {
  // Edge has no Prisma; the sink lives on the Node runtime.
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  if (isControlFlow(error)) return

  try {
    const { logError } = await import("@/lib/services/error/errorLog")
    const path = request?.path ?? ""
    logError({
      source: path ? serviceFromPath(path) : "server",
      message: error instanceof Error && error.message ? error.message : "unhandled server error",
      endpoint: path || null,
      stack: error instanceof Error ? error.stack ?? null : null,
      statusCode: 500,
      context: {
        method: request?.method,
        routeType: context?.routeType,
        routerKind: context?.routerKind,
        captured_by: "onRequestError",
      },
    })
  } catch {
    // Capturing an error must never create one.
  }
}
