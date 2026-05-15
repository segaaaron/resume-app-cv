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
  // Capture full resolution then downscale to half — ~15-30 KB vs ~80 KB
  const THUMB_W = Math.round(A4_WIDTH_PX / 2)
  const THUMB_H = Math.round(A4_HEIGHT_PX / 2)
  const raw = await page.screenshot({
    type: "webp",
    quality: 75,
    clip: { x: 0, y: 0, width: A4_WIDTH_PX, height: A4_HEIGHT_PX },
  })
  const resized = await page.evaluate(
    async (dataUrl: string, w: number, h: number): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          canvas.width = w
          canvas.height = h
          canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
          resolve(canvas.toDataURL("image/webp", 0.6).split(",")[1])
        }
        img.src = dataUrl
      })
    },
    `data:image/webp;base64,${Buffer.from(raw).toString("base64")}`,
    THUMB_W,
    THUMB_H,
  )
  return Buffer.from(resized, "base64")
}
