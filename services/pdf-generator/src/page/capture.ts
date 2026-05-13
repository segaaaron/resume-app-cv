import type { Page, PDFOptions } from "puppeteer-core"
import { PDF_MARGIN_TOP_CM, PDF_MARGIN_BOTTOM_CM, PDF_MARGIN_SIDE_CM } from "../constants"
import type { PdfCaptureOptions } from "../renderers/types"

/**
 * Función unificada de captura PDF. Única responsable de configurar page.pdf().
 *
 * Aplica la regla de separación de responsabilidades:
 * - full-bleed  → Puppeteer margin 0. Web controla todo el diseño.
 * - header-footer → Puppeteer fija márgenes físicos para aislar header/footer
 *   nativos. El contenido web NO debe duplicar ese espacio con padding.
 *
 * printBackground: true siempre — junto con -webkit-print-color-adjust: exact
 * en el CSS, garantiza que Chromium no suprima fondos de color ni imágenes.
 */
export async function capturePdf(page: Page, opts: PdfCaptureOptions): Promise<Buffer> {
  const pdfOptions = opts.mode === "full-bleed"
    ? buildFullBleedOptions()
    : buildHeaderFooterOptions(opts)
  const raw = await page.pdf(pdfOptions)
  return Buffer.from(raw)
}

/**
 * Configuración full-bleed: Puppeteer no añade márgenes.
 * La web controla padding y fondos de extremo a extremo.
 */
function buildFullBleedOptions(): PDFOptions {
  return {
    preferCSSPageSize: true, // Respeta @page { size: A4 } del CSS
    printBackground: true,   // Renderiza fondos de color e imágenes de fondo
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  }
}

/**
 * Configuración header-footer: márgenes físicos estrictos.
 * Chromium reserva top/bottom para los templates nativos.
 * El contenido HTML empieza exactamente donde termina el margen superior.
 */
function buildHeaderFooterOptions(opts: PdfCaptureOptions): PDFOptions {
  return {
    preferCSSPageSize: true,
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: opts.headerTemplate ?? defaultHeader(),
    footerTemplate: opts.footerTemplate ?? defaultFooter(),
    margin: {
      top: PDF_MARGIN_TOP_CM,
      bottom: PDF_MARGIN_BOTTOM_CM,
      left: PDF_MARGIN_SIDE_CM,
      right: PDF_MARGIN_SIDE_CM,
    },
  }
}

/**
 * Header mínimo por defecto: ocupa el espacio físico reservado pero
 * no muestra nada. Necesario para que Chromium active el modo header/footer.
 */
function defaultHeader(): string {
  return `<div style="font-size:0;width:100%;"></div>`
}

/**
 * Footer con paginación por defecto: "Página N de T" alineado a la derecha.
 * Las clases .pageNumber y .totalPages son inyectadas por Chromium.
 */
function defaultFooter(): string {
  return `
    <div style="font-size:9px;width:100%;padding:0 15mm;text-align:right;
                font-family:sans-serif;color:#666;">
      Página <span class="pageNumber"></span>
      de <span class="totalPages"></span>
    </div>`
}
