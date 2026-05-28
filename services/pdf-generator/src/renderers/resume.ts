import type { Page } from "puppeteer-core"
import { applyCookies } from "../cookie-forwarder"
import { embedPdfMetadata, PdfMeta } from "../lib/pdf-metadata"
import { setA4Viewport, emulateMediaType } from "../page/setup"
import { gotoAndWaitForContent } from "../page/navigation"
import { waitForFonts, waitForImages } from "../page/assets"
import { fixLayout } from "./fix-layout"
import { capturePdf as capturePagePdf } from "../page/capture"
import { RESUME_CONTENT_SELECTOR } from "../contracts"

/** Options for rendering a resume to PDF. */
export interface RenderResumeOptions {
  printUrl: string
  cookieHeader: string
  appUrl: string
  candidateName?: string
  resumeTitle?: string
}

/**
 * Renders a resume print page to a PDF buffer.
 * Applies cookies, waits for assets, runs layout fixup, captures PDF, embeds metadata.
 */
export async function renderResumePdf(page: Page, opts: RenderResumeOptions): Promise<Buffer> {
  await setupPage(page, opts)
  await fixLayout(page)
  return capturePdf(page, { title: opts.resumeTitle, author: opts.candidateName })
}

async function setupPage(page: Page, opts: RenderResumeOptions): Promise<void> {
  await setA4Viewport(page)
  await applyCookies(page, opts.cookieHeader, opts.appUrl)
  await gotoAndWaitForContent(page, opts.printUrl, RESUME_CONTENT_SELECTOR)
  await emulateMediaType(page)
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())))
  await waitForFonts(page)
  await waitForImages(page)
}

/**
 * Captura el PDF en modo full-bleed: Puppeteer margin = 0.
 * La web (print-base.css + template) controla padding y fondos.
 */
async function capturePdf(page: Page, meta: PdfMeta): Promise<Buffer> {
  const raw = await capturePagePdf(page, { mode: "full-bleed" })
  return embedPdfMetadata(raw, meta)
}
