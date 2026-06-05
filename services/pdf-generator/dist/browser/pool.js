"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activePageCount = activePageCount;
exports.queueDepth = queueDepth;
exports.withPage = withPage;
const lifecycle_1 = require("./lifecycle");
let activePages = 0;
const waitQueue = [];
const MAX_CONCURRENT = () => parseInt(process.env.MAX_CONCURRENT_PAGES ?? "3", 10);
/** Returns the number of pages currently being rendered. */
function activePageCount() { return activePages; }
/** Returns the number of requests waiting for a page slot. */
function queueDepth() { return waitQueue.length; }
/** Acquires a rendering slot; queues if at capacity. */
function acquireSlot() {
    if (activePages < MAX_CONCURRENT()) {
        activePages++;
        return Promise.resolve();
    }
    return new Promise((resolve) => waitQueue.push(() => { activePages++; resolve(); }));
}
/** Releases a slot and unblocks the next queued request. */
function releaseSlot() {
    activePages--;
    waitQueue.shift()?.();
}
/** Opens a new browser page, runs `fn`, closes the page, and releases the slot. */
async function withPage(fn) {
    await acquireSlot();
    const start = Date.now();
    try {
        const browser = await (0, lifecycle_1.ensureHealthyBrowser)();
        const page = await browser.newPage();
        return await runWithPage(page, fn, start);
    }
    finally {
        releaseSlot();
    }
}
async function runWithPage(page, fn, start) {
    try {
        const result = await fn(page);
        console.log(`[pool] page done in ${Date.now() - start}ms (active=${activePages}, queue=${waitQueue.length})`);
        return result;
    }
    finally {
        await closePage(page);
    }
}
async function closePage(page) {
    await page.close().catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[pool] page.close() failed — tab not released (${msg}). May cause memory leak if repeated.`);
    });
}
