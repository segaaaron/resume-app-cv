"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForFonts = waitForFonts;
exports.waitForImages = waitForImages;
exports.evaluateImages = evaluateImages;
const constants_1 = require("../constants");
/**
 * Waits for all custom fonts to finish loading.
 * Continues with fallback fonts if not ready within FONTS_TIMEOUT_MS...
 */
async function waitForFonts(page) {
    let timedOut = false;
    await Promise.race([
        page.evaluate(() => document.fonts.ready),
        new Promise((resolve) => setTimeout(() => { timedOut = true; resolve(); }, constants_1.FONTS_TIMEOUT_MS)),
    ]);
    if (timedOut) {
        console.warn(`[page] Fonts not ready after ${constants_1.FONTS_TIMEOUT_MS}ms — PDF will use fallback fonts. Check CDN reachability.`);
    }
}
/**
 * Waits for all img elements to finish loading.
 * Continues after timeoutMs to avoid blocking the render indefinitely.
 */
async function waitForImages(page, timeoutMs = 6_000) {
    const interval = 200;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const allDone = await page.evaluate(() => {
            const imgs = Array.from(document.images);
            return imgs.length === 0 || imgs.every((img) => img.complete);
        });
        if (allDone)
            return;
        await new Promise((resolve) => setTimeout(resolve, interval));
    }
    const brokenCount = await page.evaluate(() => Array.from(document.images).filter((img) => img.complete && img.naturalWidth === 0).length);
    console.warn(`[page] Images not ready after ${timeoutMs}ms — ${brokenCount} broken image(s). Photos/logos may appear broken. Check external URLs.`);
}
/**
 * Browser-side function passed to page.evaluate().
 * Waits for each incomplete img element to fire onload or onerror.
 * Exported so it can be unit-tested independently of Puppeteer.
 */
function evaluateImages() {
    const incomplete = Array.from(document.images).filter((img) => !img.complete);
    if (incomplete.length === 0)
        return Promise.resolve([]);
    return Promise.all(incomplete.map((img) => new Promise((resolve) => {
        if (img.complete) {
            resolve();
            return;
        }
        img.onload = () => resolve();
        img.onerror = () => resolve();
    })));
}
