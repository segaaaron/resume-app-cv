import type { Page } from "puppeteer-core"
import { A4_WIDTH_PX, A4_HEIGHT_PX } from "../constants"

/**
 * Sets the Puppeteer page viewport to A4 dimensions at 96dpi.
 * Must be called before navigating to the print URL.
 */
export async function setA4Viewport(page: Page): Promise<void> {
  await page.setViewport({ width: A4_WIDTH_PX, height: A4_HEIGHT_PX, deviceScaleFactor: 1 })
}

/**
 * Switches the page to `print` media so CSS @media print rules apply.
 * Must be called after navigation and before PDF capture.
 */
export async function emulateMediaType(page: Page): Promise<void> {
  await page.emulateMediaType("print")
}
