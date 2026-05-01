import puppeteer, { Browser, Page } from "puppeteer"

const PUPPETEER_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--no-zygote",
]

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
  const browser = await getBrowser()
  const page = await browser.newPage()
  try {
    return await fn(page)
  } finally {
    await page.close().catch(() => {})
  }
}
