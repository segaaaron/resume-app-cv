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
 *   6. Reset min-height del wrapper (evita altura forzada de 297mm que
 *      generaría página en blanco si el contenido es corto)
 *   7. page.pdf() — sin post-procesamiento
 *
 * NO debe: pintar gutters, calcular páginas, ni meter lógica de CV.
 */

import type { Page } from "puppeteer"
import { COVER_MARGIN_MM } from "../constants"
import { applyCookies } from "../cookie-forwarder"
import {
  gotoAndWaitForContent,
  setA4Viewport,
  waitForFonts,
} from "../print-helpers"

const WRAPPER_SELECTOR = ".cover-letter-page"

export async function renderCoverLetterPdf(
  page: Page,
  opts: { printUrl: string; cookieHeader: string; appUrl: string },
): Promise<Buffer> {
  await setA4Viewport(page)
  await applyCookies(page, opts.cookieHeader, opts.appUrl)
  await gotoAndWaitForContent(page, opts.printUrl, WRAPPER_SELECTOR)
  await page.emulateMediaType("print")
  await waitForFonts(page)

  // Reset min-height: el wrapper en pantalla tiene min-height: 297mm para
  // verse como hoja completa, pero en print eso fuerza una página vacía
  // si el contenido es corto.
  await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>(".cover-letter-page")
    if (!el) return
    el.style.setProperty("min-height", "0", "important")
    el.style.setProperty("height", "auto", "important")
  })

  const rawPdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: `${COVER_MARGIN_MM}mm`,
      right: "0",
      bottom: `${COVER_MARGIN_MM}mm`,
      left: "0",
    },
  })

  return Buffer.from(rawPdf)
}
