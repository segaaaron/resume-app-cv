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
// template con su propio CSS (padding en columnas, etc.). No se necesita
// post-procesamiento (gutter-painter eliminado).
//
// Cartas de presentación: usan margen físico de 10mm porque no tienen
// sidebar de color — el espacio en blanco ayuda a la legibilidad.
export const COVER_MARGIN_MM = 10

// --- Conversiones -------------------------------------------------------
// 1mm en píxeles @ 96dpi
export const MM_TO_PX = 96 / 25.4

// --- Altura útil --------------------------------------------------------
// Altura utilizable por página para CVs. Con margin=0, es igual a la
// altura total A4 — cada página del PDF mide exactamente A4_HEIGHT_PX.
// Los templates manejan su propio padding interno.
export const USABLE_PX_PER_PAGE = A4_HEIGHT_MM * MM_TO_PX

// --- Timeouts -----------------------------------------------------------
// page.goto: si tarda más, algo está roto (servidor caído, loop infinito).
export const GOTO_TIMEOUT_MS = 20_000
// fonts.ready: no es bloqueante crítico — degradamos a fuente fallback.
export const FONTS_TIMEOUT_MS = 3_000
// Timeout global del handler completo. Cualquier tiempo mayor cancela.
export const RENDER_TIMEOUT_MS = 45_000
