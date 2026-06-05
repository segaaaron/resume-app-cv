"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderCoverLetterPdf = renderCoverLetterPdf;
const cookie_forwarder_1 = require("../cookie-forwarder");
const pdf_metadata_1 = require("../lib/pdf-metadata");
const setup_1 = require("../page/setup");
const navigation_1 = require("../page/navigation");
const assets_1 = require("../page/assets");
const capture_1 = require("../page/capture");
const contracts_1 = require("../contracts");
/**
 * Renders a cover letter print page to a PDF buffer.
 * Resets element height to auto before capture to prevent blank trailing pages.
 */
async function renderCoverLetterPdf(page, opts) {
    await setupPage(page, opts);
    await resetCoverLetterHeight(page);
    return capturePdf(page, { title: opts.letterTitle, author: opts.candidateName });
}
async function setupPage(page, opts) {
    await (0, setup_1.setA4Viewport)(page);
    await (0, cookie_forwarder_1.applyCookies)(page, opts.cookieHeader, opts.appUrl);
    await (0, navigation_1.gotoAndWaitForContent)(page, opts.printUrl, contracts_1.COVER_LETTER_SELECTOR);
    await (0, setup_1.emulateMediaType)(page);
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 0)));
    await (0, assets_1.waitForFonts)(page);
    await (0, assets_1.waitForImages)(page);
}
async function resetCoverLetterHeight(page) {
    await page.evaluate((selector) => {
        const el = document.querySelector(selector);
        if (!el)
            return;
        el.style.setProperty("min-height", "0", "important");
        el.style.setProperty("height", "auto", "important");
    }, contracts_1.COVER_LETTER_SELECTOR);
}
/**
 * Captura la carta de presentación en modo full-bleed.
 * La web controla padding y márgenes internos del documento.
 */
async function capturePdf(page, meta) {
    const raw = await (0, capture_1.capturePdf)(page, { mode: "full-bleed" });
    return (0, pdf_metadata_1.embedPdfMetadata)(raw, meta);
}
