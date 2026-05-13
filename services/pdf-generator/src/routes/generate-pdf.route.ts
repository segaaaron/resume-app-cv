// pdf-generator microservice only
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import type { Page } from "puppeteer-core"
import { withPage } from "../browser/pool"
import { withTimeout } from "../lib/timeout"
import { RENDER_TIMEOUT_MS } from "../constants"
import { toRenderType, type PdfRenderType } from "../contracts"
import { renderResumePdf } from "../renderers/resume"
import { renderCoverLetterPdf } from "../renderers/cover-letter"

// Web app API contract — fields sent by app/api/resumes/[id]/pdf/route.ts
// and app/api/cover-letters/[id]/pdf/route.ts
interface GeneratePdfBody {
  printUrl: string
  cookies: string
  stretchPages: boolean  // true = resume, false = cover-letter (converted to PdfRenderType internally)
  candidateName?: string
  resumeTitle?: string
  letterTitle?: string
}

/** Registers POST /generate-pdf. Dispatches to resume or cover-letter renderer. */
export function registerGeneratePdfRoute(app: FastifyInstance): void {
  app.post<{ Body: GeneratePdfBody }>("/generate-pdf", handleGeneratePdf)
}

async function handleGeneratePdf(request: FastifyRequest<{ Body: GeneratePdfBody }>, reply: FastifyReply): Promise<void> {
  const body = request.body ?? ({} as GeneratePdfBody)
  if (!body.printUrl) {
    request.log.warn("[generate-pdf] printUrl missing — caller must send { printUrl, cookies, stretchPages }")
    reply.code(400).send({ error: "missing printUrl" }); return
  }
  // pdf-generator microservice only — convert web app boolean to internal render type
  const type: PdfRenderType = toRenderType(body.stretchPages)
  const start = Date.now()
  request.log.info({ printUrl: body.printUrl, type }, "[generate-pdf] render started")
  try {
    const pdf = await withTimeout(withPage((page) => dispatchRenderer(page, body)), RENDER_TIMEOUT_MS, "generate-pdf")
    request.log.info({ printUrl: body.printUrl, type, durationMs: Date.now() - start, sizeBytes: pdf.length }, "[generate-pdf] render complete")
    reply.header("Content-Type", "application/pdf").send(pdf)
  } catch (err) {
    sendRenderError(request, reply, err, body, type, start)
  }
}

function dispatchRenderer(page: Page, body: GeneratePdfBody): Promise<Buffer> {
  const appUrl = new URL(body.printUrl).origin
  // pdf-generator microservice only — route to renderer based on internal type
  if (toRenderType(body.stretchPages) === "resume") {
    return renderResumePdf(page, { printUrl: body.printUrl, cookieHeader: body.cookies ?? "", appUrl, candidateName: body.candidateName, resumeTitle: body.resumeTitle })
  }
  return renderCoverLetterPdf(page, { printUrl: body.printUrl, cookieHeader: body.cookies ?? "", appUrl, candidateName: body.candidateName, letterTitle: body.letterTitle })
}

function sendRenderError(request: FastifyRequest, reply: FastifyReply, err: unknown, body: GeneratePdfBody, type: string, start: number): void {
  const msg = err instanceof Error ? err.message : String(err)
  const durationMs = Date.now() - start
  const isTimeout = msg.toLowerCase().includes("timeout")
  const rootCause = isTimeout
    ? `Render timed out after ${durationMs}ms — app may be slow, print token expired, or selector never appeared.`
    : `Render failed after ${durationMs}ms: "${msg}" — check Chrome logs above.`
  request.log.error({ err, printUrl: body.printUrl, type, durationMs }, `[generate-pdf] ${rootCause}`)
  console.error(`[generate-pdf] FAILED | type=${type} | url=${body.printUrl} | ${durationMs}ms | ${rootCause}`)
  reply.code(500).send({ error: "render failed", detail: isTimeout ? "timeout" : msg })
}
