/**
 * Print route: rendered by the PDF microservice, never watched by a human.
 * This boundary exists only to keep the app-wide full-screen loader OUT of the
 * captured page — the renderer waits for `.resume-pages > div[data-print-layout]`
 * and must not paint anything else.
 */
export default function Loading() {
  return null
}
