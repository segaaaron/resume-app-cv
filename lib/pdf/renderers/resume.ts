/**
 * lib/pdf/renderers/resume.ts
 *
 * RESPONSABILIDAD: orquestar el render de un CV a PDF.
 *
 * DISEÑO: Puppeteer con margin=0 en todos los lados. Los templates manejan
 * su propio espaciado interno (padding en columnas y contenido). Esto elimina
 * la necesidad de post-procesamiento con pdf-lib para "pintar" márgenes.
 *
 * FLUJO:
 *   1. setA4Viewport            → viewport A4 @ 96dpi, scale 1
 *   2. applyCookies             → reenvía sesión NextAuth al Chrome headless
 *   3. gotoAndWaitForContent    → carga /print, espera el wrapper del template
 *   4. emulateMediaType("print")→ activa estilos @media print del CSS
 *   5. waitForFonts             → asegura que las fuentes custom estén listas
 *   6. Reset estilos inline     → limpia cualquier zoom/min-height del editor
 *   7. computeAndApplyPageHeight→ mide el contenido y ajusta altura del DOM
 *   8. page.pdf()               → genera el PDF con margin=0, printBackground
 *
 * NO debe: tener lógica de carta (esa vive en cover-letter.ts), pintar
 * márgenes manualmente, ni configurar el browser (eso es browser-pool.ts).
 */

import type { Page } from "puppeteer"
import { applyCookies } from "../cookie-forwarder"
import { computeAndApplyPageHeight } from "../page-sizer"
import {
  gotoAndWaitForContent,
  setA4Viewport,
  waitForFonts,
} from "../print-helpers"

const WRAPPER_SELECTOR = ".resume-pages > div"

export async function renderResumePdf(
  page: Page,
  opts: { printUrl: string; cookieHeader: string; appUrl: string },
): Promise<Buffer> {
  await setA4Viewport(page)
  await applyCookies(page, opts.cookieHeader, opts.appUrl)
  await gotoAndWaitForContent(page, opts.printUrl, WRAPPER_SELECTOR)
  await page.emulateMediaType("print")
  await waitForFonts(page)

  // Reset preventivo: limpia estilos inline que el editor pueda haber
  // injectado (zoom, min-height). Sin esto, la medición del contenido
  // quedaría inflada y generaría páginas en blanco.
  await page.evaluate(() => {
    const wrapper = document.querySelector<HTMLElement>(".resume-pages")
    if (wrapper) {
      wrapper.style.setProperty("width", "210mm", "important")
      wrapper.style.setProperty("min-height", "0", "important")
    }
  })

  await computeAndApplyPageHeight(page, WRAPPER_SELECTOR, { stretchPages: true })

  const rawPdf = await page.pdf({
    format: "A4",
    printBackground: true,
    // margin=0: los templates manejan su propio padding interno.
    // Sin margen físico no hay franjas blancas en los bordes — no se
    // necesita post-procesamiento con pdf-lib.
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  })

  return Buffer.from(rawPdf)
}
