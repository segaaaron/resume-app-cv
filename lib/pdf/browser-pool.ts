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

// Cola de resolvers en espera de un slot libre.
const waitQueue: Array<() => void> = []

function acquireSlot(): Promise<void> {
  if (activePages < MAX_CONCURRENT_PAGES) {
    activePages++
    return Promise.resolve()
  }
  return new Promise<void>((resolve) => waitQueue.push(() => { activePages++; resolve() }))
}

function releaseSlot(): void {
  activePages--
  waitQueue.shift()?.()
}

/** Número de renders en espera de slot (útil para monitoring). */
export function queueDepth(): number { return waitQueue.length }

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

async function ensureHealthyBrowser(): Promise<Browser> {
  const browser = await getBrowser()
  try {
    await Promise.race([
      browser.version(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("health timeout")), 2000)
      ),
    ])
    return browser
  } catch (err) {
    console.warn("[browser-pool] health check failed, reconnecting", err)
    browserPromise = null
    return getBrowser()
  }
}

export async function withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
  await acquireSlot()
  try {
    const browser = await ensureHealthyBrowser()
    const page = await browser.newPage()
    try {
      return await fn(page)
    } finally {
      await page.close().catch(() => {})
    }
  } finally {
    releaseSlot()
  }
}
