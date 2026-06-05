"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock("../../cookie-forwarder", () => ({ applyCookies: jest.fn().mockResolvedValue(undefined) }));
jest.mock("../../page/setup", () => ({ setA4Viewport: jest.fn().mockResolvedValue(undefined), emulateMediaType: jest.fn().mockResolvedValue(undefined) }));
jest.mock("../../page/navigation", () => ({ gotoAndWaitForContent: jest.fn().mockResolvedValue(undefined) }));
jest.mock("../../page/assets", () => ({ waitForFonts: jest.fn().mockResolvedValue(undefined), waitForImages: jest.fn().mockResolvedValue(undefined) }));
jest.mock("../../lib/pdf-metadata", () => ({ embedPdfMetadata: jest.fn().mockImplementation((buf) => Promise.resolve(buf)) }));
const cover_letter_1 = require("../../renderers/cover-letter");
const mockEvaluate = jest.fn().mockResolvedValue(undefined);
const mockPdf = jest.fn().mockResolvedValue(Buffer.from("%PDF-1.4"));
const mockPage = { evaluate: mockEvaluate, pdf: mockPdf };
const OPTS = { printUrl: "https://app.test/cover-letter/1/print", cookieHeader: "", appUrl: "https://app.test", candidateName: "Jane", letterTitle: "Cover Letter" };
describe("renderCoverLetterPdf", () => {
    beforeEach(() => jest.clearAllMocks());
    it("returns a Buffer", async () => {
        const result = await (0, cover_letter_1.renderCoverLetterPdf)(mockPage, OPTS);
        expect(Buffer.isBuffer(result)).toBe(true);
    });
    it("calls page.pdf with print settings", async () => {
        await (0, cover_letter_1.renderCoverLetterPdf)(mockPage, OPTS);
        expect(mockPdf).toHaveBeenCalledWith(expect.objectContaining({ printBackground: true }));
    });
    it("calls evaluate twice: frame flush + height reset", async () => {
        await (0, cover_letter_1.renderCoverLetterPdf)(mockPage, OPTS);
        expect(mockEvaluate).toHaveBeenCalledTimes(2);
    });
    it("calls embedPdfMetadata with letter title and author", async () => {
        const { embedPdfMetadata } = require("../../lib/pdf-metadata");
        await (0, cover_letter_1.renderCoverLetterPdf)(mockPage, OPTS);
        expect(embedPdfMetadata).toHaveBeenCalledWith(expect.any(Buffer), { title: "Cover Letter", author: "Jane" });
    });
    it("evaluate callback sets min-height:0 and height:auto on .cover-letter-page", async () => {
        // Call 1: frame flush (setTimeout 0) — just resolve
        mockEvaluate.mockImplementationOnce(() => Promise.resolve());
        // Call 2: height reset — capture callback + args
        let capturedCallback = null;
        mockEvaluate.mockImplementationOnce((fn, ...args) => {
            capturedCallback = () => fn(...args);
            return Promise.resolve();
        });
        await (0, cover_letter_1.renderCoverLetterPdf)(mockPage, OPTS);
        const mockEl = { style: { setProperty: jest.fn() } };
        global.document = { querySelector: jest.fn().mockReturnValue(mockEl) };
        capturedCallback();
        expect(mockEl.style.setProperty).toHaveBeenCalledWith("min-height", "0", "important");
        expect(mockEl.style.setProperty).toHaveBeenCalledWith("height", "auto", "important");
        delete global.document;
    });
    it("evaluate callback is safe when .cover-letter-page element not found", async () => {
        mockEvaluate.mockImplementationOnce(() => Promise.resolve());
        let capturedCallback = null;
        mockEvaluate.mockImplementationOnce((fn, ...args) => {
            capturedCallback = () => fn(...args);
            return Promise.resolve();
        });
        await (0, cover_letter_1.renderCoverLetterPdf)(mockPage, OPTS);
        global.document = { querySelector: jest.fn().mockReturnValue(null) };
        expect(() => capturedCallback()).not.toThrow();
        delete global.document;
    });
});
