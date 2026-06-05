"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedPdfMetadata = embedPdfMetadata;
// pdf-generator microservice only
const pdf_lib_1 = require("pdf-lib");
const constants_1 = require("../constants");
/**
 * Embeds title, author, producer, and creator metadata into a PDF buffer.
 * Falls back to the original buffer if pdf-lib fails to parse or save.
 */
async function embedPdfMetadata(pdfBuffer, meta) {
    try {
        const doc = await pdf_lib_1.PDFDocument.load(pdfBuffer);
        if (meta.title)
            doc.setTitle(meta.title);
        if (meta.author)
            doc.setAuthor(meta.author);
        doc.setProducer(constants_1.PDF_PRODUCER);
        doc.setCreator(constants_1.PDF_CREATOR);
        doc.setCreationDate(new Date());
        return Buffer.from(await doc.save());
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[pdf-metadata] Failed to embed metadata — returning raw buffer. Reason: ${msg}`);
        return pdfBuffer;
    }
}
