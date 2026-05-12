/**
 * lib/pdf/constants.ts
 *
 * Single source of truth for all PDF generation dimensions and timeouts.
 *
 * RESPONSABILIDAD: contener constantes documentadas. No debe importar nada
 * que no sea tipos puros — cualquier código que cargue puppeteer va en otro
 * módulo para mantener este archivo libre de side-effects.
 *
 * REGLA: cualquier número mágico relacionado al PDF se documenta aquí con
 * el porqué. Si añades una constante nueva, explica el racional.
 */

// --- Dimensiones A4 -----------------------------------------------------
// A4 @ 96dpi resolución pantalla. Estos valores configuran el viewport de
// Puppeteer y los cálculos de paginado.
export const A4_WIDTH_PX = 794   // 210mm @ 96dpi
export const A4_HEIGHT_PX = 1123 // 297mm @ 96dpi
export const A4_WIDTH_MM = 210
export const A4_HEIGHT_MM = 297

// --- Márgenes -----------------------------------------------------------
// CVs: margin = 0 en Puppeteer. El espaciado interior lo maneja cada
// template con su propio CSS (padding en columnas, etc.).
//
// Cartas de presentación: margen físico de 10mm — sin sidebar de color,
// el espacio en blanco mejora la legibilidad.
export const COVER_MARGIN_MM = 10

// --- Conversiones -------------------------------------------------------
// 1mm en píxeles @ 96dpi
export const MM_TO_PX = 96 / 25.4

// --- Altura útil --------------------------------------------------------
// Altura de referencia por página para CVs (A4 completo a 96dpi).
// Con Paged.js, la paginación la controla el CSS @page — esta constante
// sirve como referencia para viewports y otros cálculos.
export const USABLE_PX_PER_PAGE = A4_HEIGHT_MM * MM_TO_PX

// --- Timeouts -----------------------------------------------------------
// page.goto: si tarda más, algo está roto (servidor caído, loop infinito).
export const GOTO_TIMEOUT_MS = 20_000
// fonts.ready: no es bloqueante crítico — degradamos a fuente fallback.
// 6s da margen para fuentes auto-hospedadas en entornos con disco lento.
export const FONTS_TIMEOUT_MS = 6_000

// --- Márgenes del PDF ---------------------------------------------------
// Margen inferior de página controlado por CSS @page { margin-bottom: 10mm }.
// Chrome repagina dentro del área imprimible (pagePx - PDF_BOTTOM_MARGIN_PX).
// El height snap usa effectivePagePx para que no se genere una última página extra.
// CSS @page toma precedencia sobre el margin de page.pdf() en Chrome headless —
// por eso la fuente de verdad es print-resume.css, no el parámetro de Puppeteer.
// top = 0: los div-spacers gestionan el padding superior por página.
// 10mm @ 96dpi ≈ 38px — espacio de respiración profesional entre páginas.
export const PDF_BOTTOM_MARGIN_PX = 38 // 10mm @ 96dpi (all pages via @page margin-bottom)
// Top margin applies to pages 2+ only (@page :first overrides page 1 to margin-top: 0).
// Chrome paginates pages 2+ at (A4_HEIGHT - top - bottom) = 1047px intervals.
export const PDF_TOP_MARGIN_PX = 38 // 10mm @ 96dpi

// --- Tolerancias --------------------------------------------------------
// Tolerancia de sub-pixel rounding de Chrome al medir scrollHeight.
// Chrome a veces reporta una altura ~1-3px mayor que la real visible,
// lo que dispara un page-break espurio si calculamos numPages = ceil(rawH / pagePx).
// Restamos FUDGE_PX antes del ceil() para absorber ese error.
export const FUDGE_PX = 4
// Timeout global del handler completo. Cualquier tiempo mayor cancela.
export const RENDER_TIMEOUT_MS = 45_000
