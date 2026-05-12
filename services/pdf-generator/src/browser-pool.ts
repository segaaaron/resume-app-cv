import puppeteer, { Browser, Page } from "puppeteer-core"

const PUPPETEER_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--no-zygote",
  "--single-process",
  "--disable-extensions",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-renderer-backgrounding",
  "--disable-features=TranslateUI",
  "--disable-ipc-flooding-protection",
]

const MAX_CONCURRENT_PAGES = parseInt(process.env.MAX_CONCURRENT_PAGES ?? "3", 10)
let activePages = 0
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

export function queueDepth(): number { return waitQueue.length }
export function activePageCount(): number { return activePages }

let browserPromise: Promise<Browser> | null = null

async function createBrowser(): Promise<Browser> {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
  if (!executablePath) {
    throw new Error("PUPPETEER_EXECUTABLE_PATH is not set")
  }
  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: PUPPETEER_ARGS,
  })
  browser.on("disconnected", () => { browserPromise = null })
  return browser
}

export async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = createBrowser().catch((err) => { browserPromise = null; throw err })
  }
  return browserPromise
}

async function ensureHealthyBrowser(): Promise<Browser> {
  const browser = await getBrowser()
  try {
    await Promise.race([
      browser.version(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("health timeout")), 2000)),
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
