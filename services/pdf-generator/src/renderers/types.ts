/**
 * Define los modos de captura PDF del motor.
 *
 * full-bleed:
 *   Puppeteer margin = 0 en los 4 lados. La web es 100% responsable
 *   del diseño: padding del wrapper, fondos, flujo. Usar para CVs,
 *   cartas de presentación y cualquier documento con diseño propio.
 *
 * header-footer:
 *   Puppeteer fija márgenes físicos (top: 2cm, bottom: 2cm) para aislar
 *   las zonas de headerTemplate y footerTemplate nativos de Chromium.
 *   El contenido web empieza exactamente donde termina el margen superior.
 *   Usar para facturas, reportes con numeración de página nativa.
 *   IMPORTANTE: El wrapper HTML NO debe tener padding-top adicional.
 */
export type PdfRenderMode = "full-bleed" | "header-footer"

/** Opciones para la función unificada de captura PDF. */
export interface PdfCaptureOptions {
  /** Modo de márgenes. Ver PdfRenderMode. */
  mode: PdfRenderMode
  /**
   * HTML del encabezado nativo de Chromium.
   * Solo se usa cuando mode = "header-footer".
   * Clases disponibles: .pageNumber, .totalPages, .url, .title, .date.
   */
  headerTemplate?: string
  /**
   * HTML del pie de página nativo de Chromium.
   * Solo se usa cuando mode = "header-footer".
   */
  footerTemplate?: string
}
