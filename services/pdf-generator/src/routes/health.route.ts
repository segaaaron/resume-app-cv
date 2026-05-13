import type { FastifyInstance } from "fastify"
import { activePageCount, queueDepth } from "../browser/pool"

/**
 * Registers GET /health — returns pool status, no auth required.
 */
export function registerHealthRoute(app: FastifyInstance): void {
  app.get("/health", async () => ({
    status: "ok",
    activePages: activePageCount(),
    queueDepth: queueDepth(),
  }))
}
