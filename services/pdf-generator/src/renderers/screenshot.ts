// pdf-generator microservice only
import type { Page } from "puppeteer-core"
import { applyCookies } from "../cookie-forwarder"
import { setA4Viewport } from "../page/setup"
import { gotoAndWaitForContent } from "../page/navigation"
import { waitForFonts, waitForImages } from "../page/assets"
import { RESUME_CONTENT_SELECTOR } from "../contracts"
import { A4_WIDTH_PX, A4_HEIGHT_PX } from "../constants"

export interface ScreenshotOptions {
  printUrl: string
  cookieHeader: string
  appUrl: string
}

/**
 * Renders the resume print page and returns a WebP screenshot of the full A4 page.
 * Uses screen media (not print) so colors render accurately for dashboard preview.
 */
export async function renderResumeScreenshot(page: Page, opts: ScreenshotOptions): Promise<Buffer> {
  await setA4Viewport(page)
  await applyCookies(page, opts.cookieHeader, opts.appUrl)
  await gotoAndWaitForContent(page, opts.printUrl, RESUME_CONTENT_SELECTOR)
  await waitForFonts(page)
  await waitForImages(page)
  const raw = await page.screenshot({
    type: "webp",
    quality: 75,
    clip: { x: 0, y: 0, width: A4_WIDTH_PX, height: A4_HEIGHT_PX },
  })
  return Buffer.from(raw)
}
