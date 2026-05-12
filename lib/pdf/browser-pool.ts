import puppeteer, { Browser, Page } from "puppeteer"

const PUPPETEER_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--no-zygote",
]

// Limita renders concurrentes para evitar saturar la CPU del contenedor.
// Chrome headless es muy hambriento de memoria — 3 páginas simultáneas
// es un equilibrio razonable para un contenedor de 2 vCPU / 2GB RAM.
const MAX_CONCURRENT_PAGES = 3
let activePages = 0

let browserPromise: Promise<Browser> | null = null

async function createBrowser(): Promise<Browser> {
  const launchOpts: Parameters<typeof puppeteer.launch>[0] = {
    headless: true,
    args: PUPPETEER_ARGS,
  }
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOpts.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
  }
  const browser = await puppeteer.launch(launchOpts)
  browser.on("disconnected", () => {
    browserPromise = null
  })
  return browser
}

export async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = createBrowser().catch((err) => {
      browserPromise = null
      throw err
    })
  }
  return browserPromise
}

export async function withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
  // Semáforo simple: si hay 3 renders en curso, espera 200ms y reintenta.
  // Para producción de mayor escala, sustituir por una cola con backpressure.
  while (activePages >= MAX_CONCURRENT_PAGES) {
    await new Promise<void>((resolve) => setTimeout(resolve, 200))
  }
  activePages++
  const browser = await getBrowser()
  const page = await browser.newPage()
  try {
    return await fn(page)
  } finally {
    await page.close().catch(() => {})
    activePages--
  }
}
