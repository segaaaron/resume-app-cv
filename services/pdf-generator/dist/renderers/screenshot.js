"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderResumeScreenshot = renderResumeScreenshot;
const sharp_1 = __importDefault(require("sharp"));
const cookie_forwarder_1 = require("../cookie-forwarder");
const setup_1 = require("../page/setup");
const navigation_1 = require("../page/navigation");
const assets_1 = require("../page/assets");
const contracts_1 = require("../contracts");
const constants_1 = require("../constants");
const THUMB_W = Math.round(constants_1.A4_WIDTH_PX / 2); // 397px
const THUMB_H = Math.round(constants_1.A4_HEIGHT_PX / 2); // 561px
/**
 * Renders the resume print page and returns a compressed WebP thumbnail.
 * Captures at full A4 then downscales via sharp to ~8-15 KB.
 */
async function renderResumeScreenshot(page, opts) {
    await (0, setup_1.setA4Viewport)(page);
    await (0, cookie_forwarder_1.applyCookies)(page, opts.cookieHeader, opts.appUrl);
    await (0, navigation_1.gotoAndWaitForContent)(page, opts.printUrl, contracts_1.RESUME_CONTENT_SELECTOR);
    await (0, assets_1.waitForFonts)(page);
    await (0, assets_1.waitForImages)(page);
    const raw = await page.screenshot({
        type: "png",
        clip: { x: 0, y: 0, width: constants_1.A4_WIDTH_PX, height: constants_1.A4_HEIGHT_PX },
    });
    return (0, sharp_1.default)(Buffer.from(raw))
        .resize(THUMB_W, THUMB_H)
        .webp({ quality: 55, effort: 4 })
        .toBuffer();
}
