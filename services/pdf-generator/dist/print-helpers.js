"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setA4Viewport = setA4Viewport;
exports.waitForFonts = waitForFonts;
exports.gotoAndWaitForContent = gotoAndWaitForContent;
exports.waitForImages = waitForImages;
exports.withTimeout = withTimeout;
const constants_1 = require("./constants");
async function setA4Viewport(page) {
    await page.setViewport({ width: constants_1.A4_WIDTH_PX, height: constants_1.A4_HEIGHT_PX, deviceScaleFactor: 1 });
}
async function waitForFonts(page) {
    let timedOut = false;
    await Promise.race([
        page.evaluate(() => document.fonts.ready),
        new Promise((resolve) => setTimeout(() => { timedOut = true; resolve(); }, constants_1.FONTS_TIMEOUT_MS)),
    ]);
    if (timedOut) {
        console.warn(`[pdf] fonts not ready after ${constants_1.FONTS_TIMEOUT_MS}ms — proceeding with fallback font metrics`);
    }
}
async function gotoAndWaitForContent(page, url, contentSelector) {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: constants_1.GOTO_TIMEOUT_MS });
    await Promise.race([
        page.waitForSelector(contentSelector, { timeout: constants_1.GOTO_TIMEOUT_MS }),
        new Promise((resolve) => setTimeout(resolve, constants_1.GOTO_TIMEOUT_MS)),
    ]);
}
async function waitForImages(page, timeoutMs = 3_000) {
    await Promise.race([
        page.evaluate(() => Promise.all(Array.from(document.images)
            .filter((img) => !img.complete)
            .map((img) => new Promise((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
        })))),
        new Promise((resolve) => setTimeout(() => {
            console.warn(`[pdf] images not ready after ${timeoutMs}ms — proceeding`);
            resolve();
        }, timeoutMs)),
    ]);
}
function withTimeout(promise, ms, label) {
    return new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error(`Timeout: ${label} after ${ms}ms`)), ms);
        promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
    });
}
