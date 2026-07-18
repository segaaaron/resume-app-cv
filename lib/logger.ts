import type { ILogger } from "@/lib/interfaces/ILogger"

/**
 * Error-log sink registered by a server-only module (lib/services/error/errorLog via
 * instrumentation.ts). The logger calls it through globalThis so it holds NO import
 * edge to Prisma/db — that keeps logger.ts safe to bundle into client components.
 */
type ErrorSink = (p: { service: string; message: string; context?: Record<string, unknown>; stack?: string }) => void

function persistError(service: string, message: string, context?: Record<string, unknown>, err?: unknown): void {
  const sink = (globalThis as typeof globalThis & { __errorLogSink?: ErrorSink }).__errorLogSink
  if (!sink) return
  try {
    sink({ service, message, context, stack: err instanceof Error ? err.stack : undefined })
  } catch {
    /* never let capture break logging */
  }
}

export function createLogger(service: string): ILogger {
  function write(
    level: "info" | "warn" | "error",
    message: string,
    context?: Record<string, unknown>,
    err?: unknown,
  ): void {
    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      service,
      message,
      ...context,
    }
    if (err instanceof Error) entry.stack = err.stack
    let line: string
    try {
      line = JSON.stringify(entry)
    } catch {
      line = JSON.stringify({ timestamp: entry.timestamp, level, service, message, error: "non-serializable context" })
    }
    if (level === "info")  console.log(line)
    if (level === "warn")  console.warn(line)
    if (level === "error") {
      console.error(line)
      // Server-only: the ErrorLog table lives behind Prisma. The window guard lets the
      // bundler drop this branch (and the server-only import) from client bundles.
      if (typeof window === "undefined") persistError(service, message, context, err)
    }
  }

  return {
    info:  (msg, ctx)      => write("info",  msg, ctx),
    warn:  (msg, ctx)      => write("warn",  msg, ctx),
    error: (msg, ctx, err) => write("error", msg, ctx, err),
  }
}
