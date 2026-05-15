// pdf-generator microservice only
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import { withPage } from "../browser/pool"
import { withTimeout } from "../lib/timeout"
import { RENDER_TIMEOUT_MS } from "../constants"
import { renderResumeScreenshot } from "../renderers/screenshot"

interface GenerateScreenshotBody {
  printUrl: string
  cookies: string
}

/** Registers POST /generate-screenshot. Returns a WebP buffer of the full A4 resume page. */
export function registerGenerateScreenshotRoute(app: FastifyInstance): void {
  app.post<{ Body: GenerateScreenshotBody }>("/generate-screenshot", handleGenerateScreenshot)
}

async function handleGenerateScreenshot(
  request: FastifyRequest<{ Body: GenerateScreenshotBody }>,
  reply: FastifyReply,
): Promise<void> {
  const body = request.body ?? ({} as GenerateScreenshotBody)
  if (!body.printUrl) {
    reply.code(400).send({ error: "missing printUrl" }); return
  }
  const appUrl = new URL(body.printUrl).origin
  const start = Date.now()
  request.log.info({ printUrl: body.printUrl }, "[generate-screenshot] render started")
  try {
    const screenshot = await withTimeout(
      withPage((page) =>
        renderResumeScreenshot(page, {
          printUrl: body.printUrl,
          cookieHeader: body.cookies ?? "",
          appUrl,
        }),
      ),
      RENDER_TIMEOUT_MS,
      "generate-screenshot",
    )
    request.log.info({ durationMs: Date.now() - start, sizeBytes: screenshot.length }, "[generate-screenshot] done")
    reply.header("Content-Type", "image/webp").send(screenshot)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    request.log.error({ err, printUrl: body.printUrl, durationMs: Date.now() - start }, "[generate-screenshot] failed")
    reply.code(500).send({ error: "screenshot failed", detail: msg })
  }
}
