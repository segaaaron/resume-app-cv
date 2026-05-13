import type { Page } from "puppeteer-core"
import { GOTO_TIMEOUT_MS } from "../constants"

/**
 * Navigates to `url` and waits for `contentSelector` to appear in the DOM.
 * Throws with a descriptive message if navigation fails or times out.
 */
export async function gotoAndWaitForContent(page: Page, url: string, contentSelector: string): Promise<void> {
  console.log(`[page] navigating to: ${url}`)
  await navigateTo(page, url)
  await waitForSelector(page, contentSelector)
}

async function navigateTo(page: Page, url: string): Promise<void> {
  try {
    // networkidle0: espera hasta que no haya requests de red activos por 500ms.
    // Garantiza que fuentes CDN (Google Fonts, etc.) estén descargadas antes de capturar.
    // document.fonts.ready en waitForFonts() actúa como segunda red de seguridad.
    // Si el timeout ocurre, el error se loguea con hint de causa.
    await page.goto(url, { waitUntil: "networkidle0", timeout: GOTO_TIMEOUT_MS })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const hint = msg.toLowerCase().includes("timeout")
      ? `Page took >${GOTO_TIMEOUT_MS}ms waiting for networkidle0 — check app server speed, ` +
        `CDN font URLs, or use waitUntil:"domcontentloaded" si hay requests externos que no terminan.`
      : `Check URL is reachable and print token is valid. Detail: "${msg}"`
    console.error(`[page] Failed to load ${url} — ${hint}`)
    throw err
  }
}

/**
 * Waits for `selector` to appear in the DOM.
 * Throws if the selector is not found within GOTO_TIMEOUT_MS — this ensures
 * a blank PDF is never silently returned when the page fails to render.
 */
async function waitForSelector(page: Page, selector: string): Promise<void> {
  try {
    await page.waitForSelector(selector, { timeout: GOTO_TIMEOUT_MS })
  } catch {
    throw new Error(
      `[page] Content selector "${selector}" not found after ${GOTO_TIMEOUT_MS}ms. ` +
      `The print page loaded but the resume/cover-letter element did not render. ` +
      `Check the print token is valid and the template mounts the expected root element.`
    )
  }
}
