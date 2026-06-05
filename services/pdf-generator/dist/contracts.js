"use strict";
/**
 * @file contracts.ts — pdf-generator microservice only
 *
 * Single source of truth for all coupling points between this microservice
 * and the web app (readycvv.com). Nothing here is imported from the web app —
 * these are independent copies owned by this microservice.
 *
 * If the web app changes any of the values below, this file MUST be updated in sync.
 * Never scatter these strings across other files — always import from here.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESSION_COOKIE_NAMES = exports.ALLOWED_COOKIE_NAMES = exports.COVER_LETTER_SELECTOR = exports.RESUME_HEADING_SELECTOR = exports.RESUME_CONTENT_SELECTOR = exports.RESUME_PAGES_SELECTOR = void 0;
exports.toRenderType = toRenderType;
// ─── CSS SELECTORS ────────────────────────────────────────────────────────────
// These match DOM class names rendered by the web app's print pages.
// Web app files that define these classes:
//   - components/resume/PrintLayout.tsx       → .resume-pages, data-print-layout
//   - components/resume/templates/*.tsx       → .resume-entry, .resume-section-title
//   - components/cover-letter/CoverLetterPrintLayout.tsx → .cover-letter-page
/** Root wrapper of the resume print page — used as content-ready sentinel. */
exports.RESUME_PAGES_SELECTOR = ".resume-pages";
/**
 * First child inside the resume wrapper — content-ready selector for navigation wait.
 * Must match [data-print-layout] so we wait for the actual template, not the
 * TemplateSkeleton/loading state that renders before the dynamic import finishes.
 * All templates set data-print-layout="single-column|sidebar-left|sidebar-right".
 */
exports.RESUME_CONTENT_SELECTOR = ".resume-pages > div[data-print-layout]";
/** Elements used to detect and fix margin offsets at page boundaries. */
exports.RESUME_HEADING_SELECTOR = ".resume-entry, .resume-section-title, h1, h2, h3, h4";
/** Root element of the cover letter print page — content-ready + height-reset target. */
exports.COVER_LETTER_SELECTOR = ".cover-letter-page";
// ─── AUTH COOKIES ─────────────────────────────────────────────────────────────
// Cookie names the microservice is allowed to forward to the print page.
// These match NextAuth.js v5 cookie names used by the web app.
// Owned independently by this microservice — NOT imported from the web app.
// If web app migrates auth provider or renames cookies, update this list.
/** All cookies allowed to be forwarded to the print page. */
exports.ALLOWED_COOKIE_NAMES = new Set([
    // pdf-generator microservice only — mirrors NextAuth.js v5 session cookies
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "authjs.csrf-token",
    "__Host-authjs.csrf-token",
    "authjs.callback-url",
    "__Secure-authjs.callback-url",
    // pdf-generator microservice only — Next.js locale cookie
    "NEXT_LOCALE",
]);
/** Session cookies — at least one must be present to confirm the user is authenticated. */
exports.SESSION_COOKIE_NAMES = new Set([
    // pdf-generator microservice only — session identity cookies
    "authjs.session-token",
    "__Secure-authjs.session-token",
]);
/** Converts the web app's stretchPages boolean to the internal render type. */
function toRenderType(stretchPages) {
    // pdf-generator microservice only — stretchPages=true means resume (multi-page stretch layout)
    return stretchPages ? "resume" : "cover-letter";
}
