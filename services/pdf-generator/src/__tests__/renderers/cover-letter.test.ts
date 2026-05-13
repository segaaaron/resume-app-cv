jest.mock("../../cookie-forwarder", () => ({ applyCookies: jest.fn().mockResolvedValue(undefined) }))
jest.mock("../../page/setup", () => ({ setA4Viewport: jest.fn().mockResolvedValue(undefined), emulateMediaType: jest.fn().mockResolvedValue(undefined) }))
jest.mock("../../page/navigation", () => ({ gotoAndWaitForContent: jest.fn().mockResolvedValue(undefined) }))
jest.mock("../../page/assets", () => ({ waitForFonts: jest.fn().mockResolvedValue(undefined), waitForImages: jest.fn().mockResolvedValue(undefined) }))
jest.mock("../../lib/pdf-metadata", () => ({ embedPdfMetadata: jest.fn().mockImplementation((buf: Buffer) => Promise.resolve(buf)) }))

import { renderCoverLetterPdf } from "../../renderers/cover-letter"
import type { Page } from "puppeteer-core"

const mockEvaluate = jest.fn().mockResolvedValue(undefined)
const mockPdf = jest.fn().mockResolvedValue(Buffer.from("%PDF-1.4"))
const mockPage = { evaluate: mockEvaluate, pdf: mockPdf } as unknown as Page

const OPTS = { printUrl: "https://app.test/cover-letter/1/print", cookieHeader: "", appUrl: "https://app.test", candidateName: "Jane", letterTitle: "Cover Letter" }

describe("renderCoverLetterPdf", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns a Buffer", async () => {
    const result = await renderCoverLetterPdf(mockPage, OPTS)
    expect(Buffer.isBuffer(result)).toBe(true)
  })

  it("calls page.pdf with print settings", async () => {
    await renderCoverLetterPdf(mockPage, OPTS)
    expect(mockPdf).toHaveBeenCalledWith(expect.objectContaining({ printBackground: true }))
  })

  it("calls evaluate to reset element height", async () => {
    await renderCoverLetterPdf(mockPage, OPTS)
    expect(mockEvaluate).toHaveBeenCalledTimes(1)
  })

  it("calls embedPdfMetadata with letter title and author", async () => {
    const { embedPdfMetadata } = require("../../lib/pdf-metadata")
    await renderCoverLetterPdf(mockPage, OPTS)
    expect(embedPdfMetadata).toHaveBeenCalledWith(expect.any(Buffer), { title: "Cover Letter", author: "Jane" })
  })

  it("evaluate callback sets min-height:0 and height:auto on .cover-letter-page", async () => {
    // Capture the evaluate callback and run it against a mock DOM element
    let capturedCallback: (() => void) | null = null
    mockEvaluate.mockImplementationOnce((fn: () => void) => { capturedCallback = fn; return Promise.resolve() })

    await renderCoverLetterPdf(mockPage, OPTS)

    // Simulate a DOM environment for the captured callback
    const mockEl = { style: { setProperty: jest.fn() } }
    const origQS = (global as any).document?.querySelector
    ;(global as any).document = { querySelector: jest.fn().mockReturnValue(mockEl) }
    capturedCallback!()
    expect(mockEl.style.setProperty).toHaveBeenCalledWith("min-height", "0", "important")
    expect(mockEl.style.setProperty).toHaveBeenCalledWith("height", "auto", "important")
    if (origQS !== undefined) (global as any).document.querySelector = origQS
  })

  it("evaluate callback is safe when .cover-letter-page element not found", async () => {
    let capturedCallback: (() => void) | null = null
    mockEvaluate.mockImplementationOnce((fn: () => void) => { capturedCallback = fn; return Promise.resolve() })

    await renderCoverLetterPdf(mockPage, OPTS)

    ;(global as any).document = { querySelector: jest.fn().mockReturnValue(null) }
    expect(() => capturedCallback!()).not.toThrow()
  })
})
