// Mock pdf-lib so we don't need a real PDF document
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
import { renderResumePdf } from "../../renderers/resume"
import { setA4Viewport, waitForFonts, waitForImages, gotoAndWaitForContent } from "../../print-helpers"
import { applyCookies } from "../../cookie-forwarder"

const RAW_PDF = Buffer.from("%PDF-1.4 test")

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

describe("renderResumePdf", () => {
  beforeEach(() => jest.clearAllMocks())

  it("calls setA4Viewport, applyCookies, gotoAndWaitForContent, emulateMediaType, evaluate, pdf()", async () => {
    const page = makeMockPage()
    const opts = {
      printUrl: "https://app.readycvv.com/print/resume/1",
      cookieHeader: "session=abc",
      appUrl: "https://app.readycvv.com",
      candidateName: "John Doe",
      resumeTitle: "My Resume",
    }
    const result = await renderResumePdf(page as never, opts)
    expect(setA4Viewport).toHaveBeenCalledWith(page)
    expect(applyCookies).toHaveBeenCalledWith(page, opts.cookieHeader, opts.appUrl)
    expect(gotoAndWaitForContent).toHaveBeenCalledWith(page, opts.printUrl, expect.stringContaining(".resume-pages"))
    expect(page.emulateMediaType).toHaveBeenCalledWith("print")
    expect(waitForFonts).toHaveBeenCalledWith(page)
    expect(waitForImages).toHaveBeenCalledWith(page)
    expect(page.evaluate).toHaveBeenCalled()
    expect(page.pdf).toHaveBeenCalledWith(expect.objectContaining({ preferCSSPageSize: true, printBackground: true }))
    expect(Buffer.isBuffer(result)).toBe(true)
  })

  it("returns the raw PDF buffer when pdf-lib fails to load (catch silently)", async () => {
    const page = makeMockPage()
    ;(PDFDocument.load as jest.Mock).mockRejectedValueOnce(new Error("Corrupted PDF"))
    const opts = {
      printUrl: "https://app.readycvv.com/print/resume/1",
      cookieHeader: "",
      appUrl: "https://app.readycvv.com",
    }
    const result = await renderResumePdf(page as never, opts)
    expect(Buffer.isBuffer(result)).toBe(true)
    // Should have fallen back to raw PDF bytes
    expect(result.toString()).toBe("%PDF-1.4 test")
  })

  it("fixLayout: evaluate called even when .resume-pages does not exist (evaluate returns null)", async () => {
    const page = makeMockPage()
    // evaluate returning null simulates wrapper not found inside the browser evaluate
    page.evaluate.mockResolvedValue(null)
    const opts = {
      printUrl: "https://app.readycvv.com/print/resume/1",
      cookieHeader: "",
      appUrl: "https://app.readycvv.com",
    }
    // Should not throw
    await expect(renderResumePdf(page as never, opts)).resolves.toBeDefined()
    expect(page.evaluate).toHaveBeenCalled()
  })
})
