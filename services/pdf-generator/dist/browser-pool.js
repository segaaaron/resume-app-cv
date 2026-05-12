"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueDepth = queueDepth;
exports.activePageCount = activePageCount;
exports.getBrowser = getBrowser;
exports.withPage = withPage;
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
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
];
const MAX_CONCURRENT_PAGES = parseInt(process.env.MAX_CONCURRENT_PAGES ?? "3", 10);
let activePages = 0;
const waitQueue = [];
function acquireSlot() {
    if (activePages < MAX_CONCURRENT_PAGES) {
        activePages++;
        return Promise.resolve();
    }
    return new Promise((resolve) => waitQueue.push(() => { activePages++; resolve(); }));
}
function releaseSlot() {
    activePages--;
    waitQueue.shift()?.();
}
function queueDepth() { return waitQueue.length; }
function activePageCount() { return activePages; }
let browserPromise = null;
async function createBrowser() {
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (!executablePath) {
        throw new Error("PUPPETEER_EXECUTABLE_PATH is not set");
    }
    const browser = await puppeteer_core_1.default.launch({
        headless: true,
        executablePath,
        args: PUPPETEER_ARGS,
    });
    browser.on("disconnected", () => { browserPromise = null; });
    return browser;
}
async function getBrowser() {
    if (!browserPromise) {
        browserPromise = createBrowser().catch((err) => { browserPromise = null; throw err; });
    }
    return browserPromise;
}
async function ensureHealthyBrowser() {
    const browser = await getBrowser();
    try {
        await Promise.race([
            browser.version(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("health timeout")), 2000)),
        ]);
        return browser;
    }
    catch (err) {
        console.warn("[browser-pool] health check failed, reconnecting", err);
        browserPromise = null;
        return getBrowser();
    }
}
async function withPage(fn) {
    await acquireSlot();
    try {
        const browser = await ensureHealthyBrowser();
        const page = await browser.newPage();
        try {
            return await fn(page);
        }
        finally {
            await page.close().catch(() => { });
        }
    }
    finally {
        releaseSlot();
    }
}
