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

  it("calls evaluate twice: frame flush + height reset", async () => {
    await renderCoverLetterPdf(mockPage, OPTS)
    expect(mockEvaluate).toHaveBeenCalledTimes(2)
  })

  it("calls embedPdfMetadata with letter title and author", async () => {
    const { embedPdfMetadata } = require("../../lib/pdf-metadata")
    await renderCoverLetterPdf(mockPage, OPTS)
    expect(embedPdfMetadata).toHaveBeenCalledWith(expect.any(Buffer), { title: "Cover Letter", author: "Jane" })
  })

  it("evaluate callback sets min-height:0 and height:auto on .cover-letter-page", async () => {
    // Call 1: frame flush (setTimeout 0) — just resolve
    mockEvaluate.mockImplementationOnce(() => Promise.resolve())
    // Call 2: height reset — capture callback + args
    let capturedCallback: (() => void) | null = null
    mockEvaluate.mockImplementationOnce((fn: (selector: string) => void, ...args: unknown[]) => {
      capturedCallback = () => fn(...(args as [string]))
      return Promise.resolve()
    })

    await renderCoverLetterPdf(mockPage, OPTS)

    const mockEl = { style: { setProperty: jest.fn() } }
    ;(global as any).document = { querySelector: jest.fn().mockReturnValue(mockEl) }
    capturedCallback!()
    expect(mockEl.style.setProperty).toHaveBeenCalledWith("min-height", "0", "important")
    expect(mockEl.style.setProperty).toHaveBeenCalledWith("height", "auto", "important")
    delete (global as any).document
  })

  it("evaluate callback is safe when .cover-letter-page element not found", async () => {
    mockEvaluate.mockImplementationOnce(() => Promise.resolve())
    let capturedCallback: (() => void) | null = null
    mockEvaluate.mockImplementationOnce((fn: (selector: string) => void, ...args: unknown[]) => {
      capturedCallback = () => fn(...(args as [string]))
      return Promise.resolve()
    })

    await renderCoverLetterPdf(mockPage, OPTS)

    ;(global as any).document = { querySelector: jest.fn().mockReturnValue(null) }
    expect(() => capturedCallback!()).not.toThrow()
    delete (global as any).document
  })
})
