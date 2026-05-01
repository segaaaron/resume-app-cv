/**
 * lib/pdf/print-helpers.ts
 *
 * RESPONSABILIDAD: utilities reutilizables sobre la API de Puppeteer.
 * Cada función hace una sola cosa y está documentada con su motivación.
 *
 * NO debe: contener lógica específica de CV ni de carta. Esto es genérico
 * — cualquier código que use Puppeteer puede importar de aquí.
 */

import type { Page } from "puppeteer"
import {
  A4_HEIGHT_PX,
  A4_WIDTH_PX,
  FONTS_TIMEOUT_MS,
  GOTO_TIMEOUT_MS,
} from "./constants"

/**
 * Aplica el viewport estándar A4. Debe llamarse antes de page.goto.
 * deviceScaleFactor: 1 evita que Chrome escale el contenido — críticos
 * para que las medidas en CSS (mm/px) sean fidedignas al PDF generado.
 */
export async function setA4Viewport(page: Page): Promise<void> {
  await page.setViewport({
    width: A4_WIDTH_PX,
    height: A4_HEIGHT_PX,
    deviceScaleFactor: 1,
  })
}

/**
 * Espera a que las fuentes carguen, con timeout de seguridad.
 *
 * POR QUÉ: sin esto, Puppeteer puede generar el PDF antes de que las
 * fuentes custom (Poppins, Inter, etc.) carguen, produciendo un PDF
 * con métricas de fallback que no coinciden con la previsualización.
 *
 * El timeout es no-bloqueante: preferimos un PDF con fallback antes
 * que colgar el handler indefinidamente.
 */
export async function waitForFonts(page: Page): Promise<void> {
  await Promise.race([
    page.evaluate(() => document.fonts.ready),
    new Promise<void>((resolve) => setTimeout(resolve, FONTS_TIMEOUT_MS)),
  ])
}

/**
 * Wrapper de goto que usa `domcontentloaded` (más rápido y determinista
 * que `networkidle0` cuando hay sockets abiertos en background) +
 * `waitForSelector` para confirmar que el template renderizó al DOM.
 *
 * El waitForSelector tiene su propio race con timeout — si el selector
 * nunca aparece (template roto), continuamos y dejamos que el render
 * falle visiblemente en lugar de colgarse 20s.
 */
export async function gotoAndWaitForContent(
  page: Page,
  url: string,
  contentSelector: string,
): Promise<void> {
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: GOTO_TIMEOUT_MS,
  })
  await Promise.race([
    page.waitForSelector(contentSelector, { timeout: GOTO_TIMEOUT_MS }),
    new Promise<void>((resolve) => setTimeout(resolve, GOTO_TIMEOUT_MS)),
  ])
}

/**
 * Race entre una promesa y un timeout. Si la promesa no resuelve en
 * `ms` milisegundos, rechaza con un Error descriptivo.
 *
 * Útil para envolver el handler completo y garantizar que nunca quede
 * colgado consumiendo recursos del browser pool.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`Timeout: ${label} after ${ms}ms`)),
      ms,
    )
    promise.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}
