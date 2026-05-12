import type { Page } from "puppeteer-core"
import { A4_HEIGHT_PX, A4_WIDTH_PX, FONTS_TIMEOUT_MS, GOTO_TIMEOUT_MS } from "./constants"

export async function setA4Viewport(page: Page): Promise<void> {
  await page.setViewport({ width: A4_WIDTH_PX, height: A4_HEIGHT_PX, deviceScaleFactor: 1 })
}

export async function waitForFonts(page: Page): Promise<void> {
  let timedOut = false
  await Promise.race([
    page.evaluate(() => document.fonts.ready),
    new Promise<void>((resolve) =>
      setTimeout(() => { timedOut = true; resolve() }, FONTS_TIMEOUT_MS)
    ),
  ])
  if (timedOut) {
    console.warn(`[pdf] fonts not ready after ${FONTS_TIMEOUT_MS}ms — proceeding with fallback font metrics`)
  }
}

export async function gotoAndWaitForContent(page: Page, url: string, contentSelector: string): Promise<void> {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: GOTO_TIMEOUT_MS })
  await Promise.race([
    page.waitForSelector(contentSelector, { timeout: GOTO_TIMEOUT_MS }),
    new Promise<void>((resolve) => setTimeout(resolve, GOTO_TIMEOUT_MS)),
  ])
}

export async function waitForImages(page: Page, timeoutMs = 3_000): Promise<void> {
  await Promise.race([
    page.evaluate(() =>
      Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete)
          .map((img: HTMLImageElement) => new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          }))
      )
    ),
    new Promise<void>((resolve) =>
      setTimeout(() => {
        console.warn(`[pdf] images not ready after ${timeoutMs}ms — proceeding`)
        resolve()
      }, timeoutMs)
    ),
  ])
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout: ${label} after ${ms}ms`)), ms)
    promise.then(
      (v) => { clearTimeout(t); resolve(v) },
      (e) => { clearTimeout(t); reject(e) }
    )
  })
}
