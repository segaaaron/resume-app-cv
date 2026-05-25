import type { ILogger } from "@/lib/interfaces/ILogger"

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
    if (level === "error") console.error(line)
  }

  return {
    info:  (msg, ctx)      => write("info",  msg, ctx),
    warn:  (msg, ctx)      => write("warn",  msg, ctx),
    error: (msg, ctx, err) => write("error", msg, ctx, err),
  }
}
