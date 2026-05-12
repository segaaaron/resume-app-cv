/**
 * lib/pdf/renderers/cover-letter.ts
 *
 * RESPONSABILIDAD: orquestar el render de una carta de presentación a PDF.
 *
 * Más simple que `resume.ts`:
 *   - No hace gutter painting (las cartas rara vez tienen sidebar de color).
 *   - No hace stretchPages: las cartas no necesitan llenar la última página;
 *     se cortan naturalmente al contenido.
 *
 * FLUJO:
 *   1. setA4Viewport
 *   2. applyCookies
 *   3. gotoAndWaitForContent
 *   4. emulateMediaType("print")
 *   5. waitForFonts
 *   6. waitForImages
 *   7. Reset min-height del wrapper (evita altura forzada de 297mm que
 *      generaría página en blanco si el contenido es corto)
 *   8. page.pdf() con preferCSSPageSize: true — tamaño y margen vienen
 *      de @page en styles/print-cover-letter.css (margin: 10mm 0)
 *   9. embedPdfMetadata — embebe título/autor con pdf-lib
 *
 * NO debe: pintar gutters, calcular páginas, ni meter lógica de CV.
 */

import { PDFDocument } from "pdf-lib"
import type { Page } from "puppeteer"
import { applyCookies } from "../cookie-forwarder"
import {
  gotoAndWaitForContent,
  setA4Viewport,
  waitForFonts,
  waitForImages,
} from "../print-helpers"

const WRAPPER_SELECTOR = ".cover-letter-page"

export async function renderCoverLetterPdf(
  page: Page,
  opts: {
    printUrl: string
    cookieHeader: string
    appUrl: string
    candidateName?: string
    letterTitle?: string
  },
): Promise<Buffer> {
  await setA4Viewport(page)
  await applyCookies(page, opts.cookieHeader, opts.appUrl)
  await gotoAndWaitForContent(page, opts.printUrl, WRAPPER_SELECTOR)
  await page.emulateMediaType("print")
  await waitForFonts(page)
  await waitForImages(page)

  // Reset min-height: el wrapper en pantalla tiene min-height: 297mm para
  // verse como hoja completa, pero en print eso fuerza una página vacía
  // si el contenido es corto.
  await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>(".cover-letter-page")
    if (!el) return
    el.style.setProperty("min-height", "0", "important")
    el.style.setProperty("height", "auto", "important")
  })

  // preferCSSPageSize: true — Chrome uses @page in print-cover-letter.css
  // for both page size and margins (margin: 10mm 0). CDP margin params are
  // ignored when preferCSSPageSize is true.
  const rawPdf = await page.pdf({
    preferCSSPageSize: true,
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  })

  return embedPdfMetadata(Buffer.from(rawPdf), {
    title: opts.letterTitle,
    author: opts.candidateName,
  })
}

async function embedPdfMetadata(
  pdfBuffer: Buffer,
  meta: { title?: string; author?: string },
): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    if (meta.title) pdfDoc.setTitle(meta.title)
    if (meta.author) pdfDoc.setAuthor(meta.author)
    pdfDoc.setProducer("ReadyCV")
    pdfDoc.setCreator("ReadyCV — readycvv.com")
    pdfDoc.setCreationDate(new Date())
    const bytes = await pdfDoc.save()
    return Buffer.from(bytes)
  } catch {
    return pdfBuffer
  }
}
