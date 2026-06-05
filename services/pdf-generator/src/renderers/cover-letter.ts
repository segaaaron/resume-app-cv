import type { Page } from "puppeteer-core"
import { applyCookies } from "../cookie-forwarder"
import { embedPdfMetadata, PdfMeta } from "../lib/pdf-metadata"
import { setA4Viewport, emulateMediaType } from "../page/setup"
import { gotoAndWaitForContent } from "../page/navigation"
import { waitForFonts, waitForImages } from "../page/assets"
import { capturePdf as capturePagePdf } from "../page/capture"
import { COVER_LETTER_SELECTOR } from "../contracts"

/** Options for rendering a cover letter to PDF. */
export interface RenderCoverLetterOptions {
  printUrl: string
  cookieHeader: string
  appUrl: string
  candidateName?: string
  letterTitle?: string
}

/**
 * Renders a cover letter print page to a PDF buffer.
 * Resets element height to auto before capture to prevent blank trailing pages.
 */
export async function renderCoverLetterPdf(page: Page, opts: RenderCoverLetterOptions): Promise<Buffer> {
  await setupPage(page, opts)
  await resetCoverLetterHeight(page)
  return capturePdf(page, { title: opts.letterTitle, author: opts.candidateName })
}

async function setupPage(page: Page, opts: RenderCoverLetterOptions): Promise<void> {
  await setA4Viewport(page)
  await applyCookies(page, opts.cookieHeader, opts.appUrl)
  await gotoAndWaitForContent(page, opts.printUrl, COVER_LETTER_SELECTOR)
  await emulateMediaType(page)
  await page.evaluate(() => new Promise<void>((resolve) => setTimeout(resolve, 0)))
  await waitForFonts(page)
  await waitForImages(page)
}

async function resetCoverLetterHeight(page: Page): Promise<void> {
  await page.evaluate((selector: string) => {
    const el = document.querySelector<HTMLElement>(selector)
    if (!el) return
    el.style.setProperty("min-height", "0", "important")
    el.style.setProperty("height", "auto", "important")
  }, COVER_LETTER_SELECTOR)
}

/**
 * Captura la carta de presentación en modo full-bleed.
 * La web controla padding y márgenes internos del documento.
 */
async function capturePdf(page: Page, meta: PdfMeta): Promise<Buffer> {
  const raw = await capturePagePdf(page, { mode: "full-bleed" })
  return embedPdfMetadata(raw, meta)
}
