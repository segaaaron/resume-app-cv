// pdf-generator microservice only
import type { Page } from "puppeteer-core"
import sharp from "sharp"
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

const THUMB_W = Math.round(A4_WIDTH_PX / 2) // 397px
const THUMB_H = Math.round(A4_HEIGHT_PX / 2) // 561px

/**
 * Renders the resume print page and returns a compressed WebP thumbnail.
 * Captures at full A4 then downscales via sharp to ~8-15 KB.
 */
export async function renderResumeScreenshot(page: Page, opts: ScreenshotOptions): Promise<Buffer> {
  await setA4Viewport(page)
  await applyCookies(page, opts.cookieHeader, opts.appUrl)
  await gotoAndWaitForContent(page, opts.printUrl, RESUME_CONTENT_SELECTOR)
  await waitForFonts(page)
  await waitForImages(page)
  const raw = await page.screenshot({
    type: "png",
    clip: { x: 0, y: 0, width: A4_WIDTH_PX, height: A4_HEIGHT_PX },
  })
  return sharp(Buffer.from(raw))
    .resize(THUMB_W, THUMB_H)
    .webp({ quality: 55, effort: 4 })
    .toBuffer()
}
