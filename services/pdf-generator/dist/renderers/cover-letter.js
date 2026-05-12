"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderCoverLetterPdf = renderCoverLetterPdf;
const pdf_lib_1 = require("pdf-lib");
const cookie_forwarder_1 = require("../cookie-forwarder");
const print_helpers_1 = require("../print-helpers");
const WRAPPER_SELECTOR = ".cover-letter-page";
async function renderCoverLetterPdf(page, opts) {
    await (0, print_helpers_1.setA4Viewport)(page);
    await (0, cookie_forwarder_1.applyCookies)(page, opts.cookieHeader, opts.appUrl);
    await (0, print_helpers_1.gotoAndWaitForContent)(page, opts.printUrl, WRAPPER_SELECTOR);
    await page.emulateMediaType("print");
    await (0, print_helpers_1.waitForFonts)(page);
    await (0, print_helpers_1.waitForImages)(page);
    await page.evaluate(() => {
        const el = document.querySelector(".cover-letter-page");
        if (!el)
            return;
        el.style.setProperty("min-height", "0", "important");
        el.style.setProperty("height", "auto", "important");
    });
    const rawPdf = await page.pdf({
        preferCSSPageSize: true,
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return embedPdfMetadata(Buffer.from(rawPdf), { title: opts.letterTitle, author: opts.candidateName });
}
async function embedPdfMetadata(pdfBuffer, meta) {
    try {
        const pdfDoc = await pdf_lib_1.PDFDocument.load(pdfBuffer);
        if (meta.title)
            pdfDoc.setTitle(meta.title);
        if (meta.author)
            pdfDoc.setAuthor(meta.author);
        pdfDoc.setProducer("ReadyCV");
        pdfDoc.setCreator("ReadyCV — readycvv.com");
        pdfDoc.setCreationDate(new Date());
        const bytes = await pdfDoc.save();
        return Buffer.from(bytes);
    }
    catch {
        return pdfBuffer;
    }
}
