import puppeteer, { Browser } from "puppeteer-core"

const PUPPETEER_ARGS = [
  "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage",
  "--disable-gpu", "--no-zygote", "--single-process", "--disable-extensions",
  "--disable-background-timer-throttling", "--disable-backgrounding-occluded-windows",
  "--disable-renderer-backgrounding", "--disable-features=TranslateUI",
  "--disable-ipc-flooding-protection",
]

let browserPromise: Promise<Browser> | null = null

/** Resolves the Chrome executable path or throws with a clear setup message. */
function resolveExecutablePath(): string {
  const path = process.env.PUPPETEER_EXECUTABLE_PATH
  if (!path) throw new Error(
    "[browser] PUPPETEER_EXECUTABLE_PATH not set — provide the full path to Chrome/Chromium"
  )
  return path
}

/** Launches a new Chrome instance and wires up the disconnect handler. */
async function launchBrowser(executablePath: string): Promise<Browser> {
  const browser = await puppeteer.launch({ headless: true, executablePath, args: PUPPETEER_ARGS })
  browser.on("disconnected", handleDisconnect)
  console.log("[browser] Chrome ready")
  return browser
}

/** Clears the cached promise so the next request triggers a fresh launch. */
function handleDisconnect(): void {
  console.warn("[browser] Chrome exited unexpectedly (OOM/crash). Will relaunch on next request.")
  browserPromise = null
}

/**
 * Creates a new browser instance.
 * Logs the executable path before launching and throws descriptively on failure.
 */
export async function createBrowser(): Promise<Browser> {
  const executablePath = resolveExecutablePath()
  console.log(`[browser] launching Chrome: ${executablePath}`)
  try {
    return await launchBrowser(executablePath)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[browser] Chrome launch failed — verify binary exists at "${executablePath}". ${msg}`)
    throw err
  }
}

/** Returns the shared browser singleton, launching it if not yet running. */
export function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = createBrowser().catch((err) => { browserPromise = null; throw err })
  }
  return browserPromise
}

/** Verifies the browser is responsive; reconnects if health check fails. */
export async function ensureHealthyBrowser(): Promise<Browser> {
  const browser = await getBrowser()
  try {
    await Promise.race([browser.version(), healthTimeout()])
    return browser
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`[browser] health check failed (${msg}) — reconnecting`)
    browserPromise = null
    return getBrowser()
  }
}

function healthTimeout(): Promise<never> {
  return new Promise((_, reject) => {
    const t = setTimeout(() => reject(new Error("health timeout")), 2000)
    t.unref()
  })
}
