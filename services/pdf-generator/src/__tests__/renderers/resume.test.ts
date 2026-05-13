jest.mock("../../cookie-forwarder", () => ({ applyCookies: jest.fn().mockResolvedValue(undefined) }))
jest.mock("../../page/setup", () => ({ setA4Viewport: jest.fn().mockResolvedValue(undefined), emulateMediaType: jest.fn().mockResolvedValue(undefined) }))
jest.mock("../../page/navigation", () => ({ gotoAndWaitForContent: jest.fn().mockResolvedValue(undefined) }))
jest.mock("../../page/assets", () => ({ waitForFonts: jest.fn().mockResolvedValue(undefined), waitForImages: jest.fn().mockResolvedValue(undefined) }))
jest.mock("../../renderers/fix-layout", () => ({ fixLayout: jest.fn().mockResolvedValue(undefined) }))
jest.mock("../../lib/pdf-metadata", () => ({ embedPdfMetadata: jest.fn().mockImplementation((buf: Buffer) => Promise.resolve(buf)) }))

import { renderResumePdf } from "../../renderers/resume"
import type { Page } from "puppeteer-core"

const mockPdf = jest.fn().mockResolvedValue(Buffer.from("%PDF-1.4"))
const mockPage = { pdf: mockPdf } as unknown as Page

const OPTS = { printUrl: "https://app.test/resume/1/print", cookieHeader: "", appUrl: "https://app.test", candidateName: "Jane", resumeTitle: "My CV" }

describe("renderResumePdf", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns a Buffer", async () => {
    const result = await renderResumePdf(mockPage, OPTS)
    expect(Buffer.isBuffer(result)).toBe(true)
  })

  it("calls page.pdf with print settings", async () => {
    await renderResumePdf(mockPage, OPTS)
    expect(mockPdf).toHaveBeenCalledWith(expect.objectContaining({ printBackground: true, preferCSSPageSize: true }))
  })

  it("calls fixLayout before capturing PDF", async () => {
    const { fixLayout } = require("../../renderers/fix-layout")
    await renderResumePdf(mockPage, OPTS)
    expect(fixLayout).toHaveBeenCalledWith(mockPage)
  })

  it("calls embedPdfMetadata with title and author", async () => {
    const { embedPdfMetadata } = require("../../lib/pdf-metadata")
    await renderResumePdf(mockPage, OPTS)
    expect(embedPdfMetadata).toHaveBeenCalledWith(expect.any(Buffer), { title: "My CV", author: "Jane" })
  })
})
