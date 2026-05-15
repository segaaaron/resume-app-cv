import type { Page } from "puppeteer-core"
import { FONTS_TIMEOUT_MS } from "../constants"

/**
 * Waits for all custom fonts to finish loading.
 * Continues with fallback fonts if not ready within FONTS_TIMEOUT_MS...
 */
export async function waitForFonts(page: Page): Promise<void> {
  let timedOut = false
  await Promise.race([
    page.evaluate(() => document.fonts.ready),
    new Promise<void>((resolve) => setTimeout(() => { timedOut = true; resolve() }, FONTS_TIMEOUT_MS)),
  ])
  if (timedOut) {
    console.warn(`[page] Fonts not ready after ${FONTS_TIMEOUT_MS}ms — PDF will use fallback fonts. Check CDN reachability.`)
  }
}

/**
 * Waits for all img elements to finish loading.
 * Continues after timeoutMs to avoid blocking the render indefinitely.
 */
export async function waitForImages(page: Page, timeoutMs = 6_000): Promise<void> {
  await Promise.race([
    page.evaluate(evaluateImages),
    new Promise<void>((resolve) => setTimeout(() => {
      console.warn(`[page] Images not ready after ${timeoutMs}ms — photos/logos may appear broken. Check external URLs.`)
      resolve()
    }, timeoutMs)),
  ])
}

/**
 * Browser-side function passed to page.evaluate().
 * Waits for each incomplete img element to fire onload or onerror.
 * Exported so it can be unit-tested independently of Puppeteer.
 */
export function evaluateImages(): Promise<void[]> {
  return Promise.all(
    Array.from(document.images)
      .filter((img) => !img.complete)
      .map((img) => new Promise<void>((resolve) => {
        img.onload = () => resolve()
        img.onerror = () => resolve()
      }))
  )
}
