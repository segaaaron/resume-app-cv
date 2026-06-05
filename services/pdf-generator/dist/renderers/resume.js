"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderResumePdf = renderResumePdf;
const cookie_forwarder_1 = require("../cookie-forwarder");
const pdf_metadata_1 = require("../lib/pdf-metadata");
const setup_1 = require("../page/setup");
const navigation_1 = require("../page/navigation");
const assets_1 = require("../page/assets");
const fix_layout_1 = require("./fix-layout");
const capture_1 = require("../page/capture");
const contracts_1 = require("../contracts");
/**
 * Renders a resume print page to a PDF buffer.
 * Applies cookies, waits for assets, runs layout fixup, captures PDF, embeds metadata.
 */
async function renderResumePdf(page, opts) {
    await setupPage(page, opts);
    await (0, fix_layout_1.fixLayout)(page);
    return capturePdf(page, { title: opts.resumeTitle, author: opts.candidateName });
}
async function setupPage(page, opts) {
    await (0, setup_1.setA4Viewport)(page);
    await (0, cookie_forwarder_1.applyCookies)(page, opts.cookieHeader, opts.appUrl);
    await (0, navigation_1.gotoAndWaitForContent)(page, opts.printUrl, contracts_1.RESUME_CONTENT_SELECTOR);
    await (0, setup_1.emulateMediaType)(page);
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 0)));
    await (0, assets_1.waitForFonts)(page);
    await (0, assets_1.waitForImages)(page);
}
/**
 * Captura el PDF en modo full-bleed: Puppeteer margin = 0.
 * La web (print-base.css + template) controla padding y fondos.
 */
async function capturePdf(page, meta) {
    const raw = await (0, capture_1.capturePdf)(page, { mode: "full-bleed" });
    return (0, pdf_metadata_1.embedPdfMetadata)(raw, meta);
}
