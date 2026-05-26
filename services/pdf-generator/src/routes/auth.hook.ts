import { timingSafeEqual } from "crypto"
import type { FastifyInstance } from "fastify"

const PUBLIC_ROUTES = new Set(["/health", "/", "/favicon.ico"])

/**
 * Registers the Bearer token auth hook on all non-public routes.
 * Returns 401 with a descriptive log when token is missing or wrong.
 * Uses timingSafeEqual to prevent timing-based token enumeration attacks.
 */
export function registerAuthHook(app: FastifyInstance, secret: string): void {
  app.addHook("onRequest", async (request, reply) => {
    if (PUBLIC_ROUTES.has(request.url) && request.method === "GET") return
    const auth = request.headers.authorization
    if (isAuthorized(auth, secret)) return
    request.log.warn(
      { url: request.url, ip: request.ip, hasHeader: !!auth },
      `[auth] ${!auth ? "Authorization header missing" : "Bearer token does not match PDF_SERVICE_SECRET"}`,
    )
    return reply.code(401).send({ error: "unauthorized" })
  })
}

/**
 * Compares the Authorization header against the expected Bearer token
 * using a constant-time comparison to prevent timing attacks.
 */
export function isAuthorized(auth: string | undefined, secret: string): boolean {
  if (!auth) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const got = Buffer.from(auth)
  return expected.length === got.length && timingSafeEqual(expected, got)
}
