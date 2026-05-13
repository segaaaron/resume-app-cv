import Fastify, { FastifyInstance } from "fastify"
import { registerAuthHook } from "./routes/auth.hook"
import { registerHealthRoute } from "./routes/health.route"
import { registerGeneratePdfRoute } from "./routes/generate-pdf.route"

/**
 * Builds and returns a configured Fastify application instance.
 * Logger is disabled in test mode to keep test output clean.
 */
export function buildApp(): FastifyInstance {
  const secret = process.env.PDF_SERVICE_SECRET ?? ""
  const app = Fastify({ logger: buildLogger() })
  registerAuthHook(app, secret)
  registerHealthRoute(app)
  registerGeneratePdfRoute(app)
  return app
}

function buildLogger(): false | object {
  if (process.env.NODE_ENV === "test") return false
  const isProd = process.env.NODE_ENV === "production"
  return {
    level: isProd ? "info" : "debug",
    transport: isProd ? undefined : { target: "pino-pretty", options: { colorize: true } },
  }
}
