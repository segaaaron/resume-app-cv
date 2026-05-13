import type { Page } from "puppeteer-core"
import { ensureHealthyBrowser } from "./lifecycle"

let activePages = 0
const waitQueue: Array<() => void> = []
const MAX_CONCURRENT = (): number => parseInt(process.env.MAX_CONCURRENT_PAGES ?? "3", 10)

/** Returns the number of pages currently being rendered. */
export function activePageCount(): number { return activePages }

/** Returns the number of requests waiting for a page slot. */
export function queueDepth(): number { return waitQueue.length }

/** Acquires a rendering slot; queues if at capacity. */
function acquireSlot(): Promise<void> {
  if (activePages < MAX_CONCURRENT()) {
    activePages++
    return Promise.resolve()
  }
  return new Promise<void>((resolve) => waitQueue.push(() => { activePages++; resolve() }))
}

/** Releases a slot and unblocks the next queued request. */
function releaseSlot(): void {
  activePages--
  waitQueue.shift()?.()
}

/** Opens a new browser page, runs `fn`, closes the page, and releases the slot. */
export async function withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
  await acquireSlot()
  const start = Date.now()
  try {
    const browser = await ensureHealthyBrowser()
    const page = await browser.newPage()
    return await runWithPage(page, fn, start)
  } finally {
    releaseSlot()
  }
}

async function runWithPage<T>(page: Page, fn: (page: Page) => Promise<T>, start: number): Promise<T> {
  try {
    const result = await fn(page)
    console.log(`[pool] page done in ${Date.now() - start}ms (active=${activePages}, queue=${waitQueue.length})`)
    return result
  } finally {
    await closePage(page)
  }
}

async function closePage(page: Page): Promise<void> {
  await page.close().catch((err) => {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[pool] page.close() failed — tab not released (${msg}). May cause memory leak if repeated.`)
  })
}
