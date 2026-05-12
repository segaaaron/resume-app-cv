// Mock pdf-lib
jest.mock("pdf-lib", () => ({
  PDFDocument: {
    load: jest.fn().mockResolvedValue({
      setTitle: jest.fn(),
      setAuthor: jest.fn(),
      setProducer: jest.fn(),
      setCreator: jest.fn(),
      setCreationDate: jest.fn(),
      save: jest.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70])), // %PDF
    }),
  },
}))

// Mock cookie-forwarder
jest.mock("../../cookie-forwarder", () => ({
  applyCookies: jest.fn().mockResolvedValue(undefined),
}))

// Mock print-helpers
jest.mock("../../print-helpers", () => ({
  setA4Viewport: jest.fn().mockResolvedValue(undefined),
  waitForFonts: jest.fn().mockResolvedValue(undefined),
  waitForImages: jest.fn().mockResolvedValue(undefined),
  gotoAndWaitForContent: jest.fn().mockResolvedValue(undefined),
}))

import { PDFDocument } from "pdf-lib"
import { renderCoverLetterPdf } from "../../renderers/cover-letter"
import { setA4Viewport, waitForFonts, waitForImages, gotoAndWaitForContent } from "../../print-helpers"
import { applyCookies } from "../../cookie-forwarder"

const RAW_PDF = Buffer.from("%PDF-1.4 cover-letter-test")

function makeMockPage() {
  return {
    setViewport: jest.fn().mockResolvedValue(undefined),
    setCookie: jest.fn().mockResolvedValue(undefined),
    goto: jest.fn().mockResolvedValue(null),
    waitForSelector: jest.fn().mockResolvedValue(null),
    emulateMediaType: jest.fn().mockResolvedValue(undefined),
    evaluate: jest.fn().mockResolvedValue(null),
    pdf: jest.fn().mockResolvedValue(RAW_PDF),
  }
}

describe("renderCoverLetterPdf", () => {
  beforeEach(() => jest.clearAllMocks())

  it("calls setA4Viewport, applyCookies, gotoAndWaitForContent, emulateMediaType, evaluate, pdf()", async () => {
    const page = makeMockPage()
    const opts = {
      printUrl: "https://app.readycvv.com/print/cover-letter/1",
      cookieHeader: "session=xyz",
      appUrl: "https://app.readycvv.com",
      candidateName: "Jane Doe",
      letterTitle: "Application Letter",
    }
    const result = await renderCoverLetterPdf(page as never, opts)
    expect(setA4Viewport).toHaveBeenCalledWith(page)
    expect(applyCookies).toHaveBeenCalledWith(page, opts.cookieHeader, opts.appUrl)
    expect(gotoAndWaitForContent).toHaveBeenCalledWith(page, opts.printUrl, ".cover-letter-page")
    expect(page.emulateMediaType).toHaveBeenCalledWith("print")
    expect(waitForFonts).toHaveBeenCalledWith(page)
    expect(waitForImages).toHaveBeenCalledWith(page)
    // The evaluate call sets min-height:0 and height:auto on .cover-letter-page
    expect(page.evaluate).toHaveBeenCalledTimes(1)
    expect(page.pdf).toHaveBeenCalledWith(expect.objectContaining({ preferCSSPageSize: true, printBackground: true }))
    expect(Buffer.isBuffer(result)).toBe(true)
  })

  it("does not throw when .cover-letter-page element does not exist in DOM (evaluate returns null)", async () => {
    const page = makeMockPage()
    page.evaluate.mockResolvedValue(null)
    const opts = {
      printUrl: "https://app.readycvv.com/print/cover-letter/1",
      cookieHeader: "",
      appUrl: "https://app.readycvv.com",
    }
    await expect(renderCoverLetterPdf(page as never, opts)).resolves.toBeDefined()
    expect(page.evaluate).toHaveBeenCalledTimes(1)
  })

  it("returns raw PDF buffer when embedPdfMetadata (pdf-lib) fails", async () => {
    const page = makeMockPage()
    ;(PDFDocument.load as jest.Mock).mockRejectedValueOnce(new Error("PDF load error"))
    const opts = {
      printUrl: "https://app.readycvv.com/print/cover-letter/1",
      cookieHeader: "",
      appUrl: "https://app.readycvv.com",
    }
    const result = await renderCoverLetterPdf(page as never, opts)
    expect(Buffer.isBuffer(result)).toBe(true)
    expect(result.toString()).toBe("%PDF-1.4 cover-letter-test")
  })
})
