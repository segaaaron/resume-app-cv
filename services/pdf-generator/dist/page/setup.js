"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setA4Viewport = setA4Viewport;
exports.emulateMediaType = emulateMediaType;
const constants_1 = require("../constants");
/**
 * Sets the Puppeteer page viewport to A4 dimensions at 96dpi.
 * Must be called before navigating to the print URL.
 */
async function setA4Viewport(page) {
    await page.setViewport({ width: constants_1.A4_WIDTH_PX, height: constants_1.A4_HEIGHT_PX, deviceScaleFactor: 1 });
}
/**
 * Switches the page to `print` media so CSS @media print rules apply.
 * Must be called after navigation and before PDF capture.
 */
async function emulateMediaType(page) {
    await page.emulateMediaType("print");
}
