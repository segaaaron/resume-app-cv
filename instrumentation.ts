// Next.js server startup hook. Loads the error-log module so it registers the
// global sink the logger writes through (see lib/logger.ts / lib/services/error/errorLog.ts).
// Node runtime only — the ErrorLog table is behind Prisma, not available on edge.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@/lib/services/error/errorLog")
  }
}
