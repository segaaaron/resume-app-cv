"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDF_CREATOR = exports.PDF_PRODUCER = exports.PDF_MARGIN_SIDE_CM = exports.PDF_MARGIN_BOTTOM_CM = exports.PDF_MARGIN_TOP_CM = exports.RENDER_TIMEOUT_MS = exports.FUDGE_PX = exports.PDF_BOTTOM_MARGIN_PX = exports.FONTS_TIMEOUT_MS = exports.GOTO_TIMEOUT_MS = exports.USABLE_PX_PER_PAGE = exports.MM_TO_PX = exports.COVER_MARGIN_MM = exports.A4_HEIGHT_MM = exports.A4_WIDTH_MM = exports.A4_HEIGHT_PX = exports.A4_WIDTH_PX = void 0;
exports.A4_WIDTH_PX = 794;
exports.A4_HEIGHT_PX = 1123;
exports.A4_WIDTH_MM = 210;
exports.A4_HEIGHT_MM = 297;
exports.COVER_MARGIN_MM = 10;
exports.MM_TO_PX = 96 / 25.4;
exports.USABLE_PX_PER_PAGE = exports.A4_HEIGHT_MM * exports.MM_TO_PX;
exports.GOTO_TIMEOUT_MS = 20_000;
exports.FONTS_TIMEOUT_MS = 6_000;
exports.PDF_BOTTOM_MARGIN_PX = 38;
exports.FUDGE_PX = 4;
exports.RENDER_TIMEOUT_MS = 45_000;
// ─── Márgenes físicos para modo header-footer ────────────────────────────────
// Solo Puppeteer los usa. La web NO debe agregar padding equivalente al wrapper.
exports.PDF_MARGIN_TOP_CM = "2cm";
exports.PDF_MARGIN_BOTTOM_CM = "2cm";
exports.PDF_MARGIN_SIDE_CM = "0";
// ─── PDF Metadata branding ────────────────────────────────────────────────────
// pdf-generator microservice only — embedded into PDF producer/creator fields.
// Update here if the product rebrands.
exports.PDF_PRODUCER = "ReadyCV";
exports.PDF_CREATOR = "ReadyCV — readycvv.com";
