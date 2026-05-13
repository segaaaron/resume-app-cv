export const A4_WIDTH_PX = 794
export const A4_HEIGHT_PX = 1123
export const A4_WIDTH_MM = 210
export const A4_HEIGHT_MM = 297
export const COVER_MARGIN_MM = 10
export const MM_TO_PX = 96 / 25.4
export const USABLE_PX_PER_PAGE = A4_HEIGHT_MM * MM_TO_PX
export const GOTO_TIMEOUT_MS = 20_000
export const FONTS_TIMEOUT_MS = 6_000
export const PDF_BOTTOM_MARGIN_PX = 38
export const FUDGE_PX = 4
export const RENDER_TIMEOUT_MS = 45_000

// ─── Márgenes físicos para modo header-footer ────────────────────────────────
// Solo Puppeteer los usa. La web NO debe agregar padding equivalente al wrapper.
export const PDF_MARGIN_TOP_CM    = "2cm"
export const PDF_MARGIN_BOTTOM_CM = "2cm"
export const PDF_MARGIN_SIDE_CM   = "0"

// ─── PDF Metadata branding ────────────────────────────────────────────────────
// pdf-generator microservice only — embedded into PDF producer/creator fields.
// Update here if the product rebrands.
export const PDF_PRODUCER = "ReadyCV"
export const PDF_CREATOR  = "ReadyCV — readycvv.com"
