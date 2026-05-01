/**
 * lib/pdf/render-page.ts
 *
 * Punto de entrada del sistema PDF.
 *
 * Este archivo solo orquesta. La lógica real vive en:
 *   - renderers/resume.ts        → render de CVs (con gutter painting)
 *   - renderers/cover-letter.ts  → render de cartas
 *   - browser-pool.ts            → gestión del browser singleton
 *   - constants.ts               → dimensiones, márgenes, timeouts
 *
 * Para entender cómo funciona el render, empieza por el renderer
 * correspondiente.
 */

import { withPage } from "./browser-pool"
import { RENDER_TIMEOUT_MS } from "./constants"
import { withTimeout } from "./print-helpers"
import { renderCoverLetterPdf } from "./renderers/cover-letter"
import { renderResumePdf } from "./renderers/resume"

export type RenderPdfOptions = {
  printUrl: string
  cookieHeader: string
  appUrl: string
  /** true → CV (con stretch + gutter painting); false → carta */
  stretchPages: boolean
}

export async function renderToPdf(opts: RenderPdfOptions): Promise<Buffer> {
  const job = withPage((page) =>
    opts.stretchPages
      ? renderResumePdf(page, opts)
      : renderCoverLetterPdf(page, opts),
  )
  return withTimeout(job, RENDER_TIMEOUT_MS, "renderToPdf")
}
