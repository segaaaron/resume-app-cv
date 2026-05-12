import Fastify from "fastify"
import { activePageCount, queueDepth, withPage } from "./browser-pool"
import { RENDER_TIMEOUT_MS } from "./constants"
import { withTimeout } from "./print-helpers"
import { renderCoverLetterPdf } from "./renderers/cover-letter"
import { renderResumePdf } from "./renderers/resume"

const PORT = parseInt(process.env.PORT ?? "3001", 10)

interface GeneratePdfBody {
  printUrl: string
  cookies: string
  stretchPages: boolean
  candidateName?: string
  resumeTitle?: string
  letterTitle?: string
}

export function buildApp() {
  const PDF_SERVICE_SECRET = process.env.PDF_SERVICE_SECRET
  const app = Fastify({ logger: false })

  app.get("/health", async () => {
    return { status: "ok", activePages: activePageCount(), queueDepth: queueDepth() }
  })

  app.addHook("onRequest", async (request, reply) => {
    if (request.url === "/health" && request.method === "GET") return
    const auth = request.headers.authorization
    if (!auth || auth !== `Bearer ${PDF_SERVICE_SECRET}`) {
      reply.code(401).send({ error: "unauthorized" })
      return
    }
  })

  app.post<{ Body: GeneratePdfBody }>("/generate-pdf", async (request, reply) => {
    const { printUrl, cookies, stretchPages, candidateName, resumeTitle, letterTitle } = request.body ?? {}

    if (!printUrl) {
      reply.code(400).send({ error: "missing printUrl" })
      return
    }

    const appUrl = new URL(printUrl).origin

    try {
      const pdf = await withTimeout(
        withPage((page) =>
          stretchPages
            ? renderResumePdf(page, { printUrl, cookieHeader: cookies ?? "", appUrl, candidateName, resumeTitle })
            : renderCoverLetterPdf(page, { printUrl, cookieHeader: cookies ?? "", appUrl, candidateName, letterTitle })
        ),
        RENDER_TIMEOUT_MS,
        "generate-pdf",
      )

      reply.header("Content-Type", "application/pdf")
      reply.send(pdf)
      return
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      request.log.error(err, "PDF render failed")

      if (msg.toLowerCase().includes("timeout")) {
        reply.code(500).send({ error: "render failed", detail: "timeout" })
        return
      }
      reply.code(500).send({ error: "render failed", detail: msg })
      return
    }
  })

  return app
}

// Only start listening when run directly (not during tests)
if (require.main === module) {
  const PDF_SERVICE_SECRET = process.env.PDF_SERVICE_SECRET
  if (!PDF_SERVICE_SECRET) {
    console.error("[pdf-generator] PDF_SERVICE_SECRET env var is required — exiting")
    process.exit(1)
  }
  const app = buildApp()
  app.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    console.log(`[pdf-generator] listening on port ${PORT}`)
  })
}
