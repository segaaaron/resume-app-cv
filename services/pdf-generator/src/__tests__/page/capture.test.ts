import { capturePdf } from "../../page/capture"
import type { Page } from "puppeteer-core"

const mockPdf = jest.fn().mockResolvedValue(Buffer.from("%PDF-1.4 test"))
const mockPage = { pdf: mockPdf } as unknown as Page

beforeEach(() => jest.clearAllMocks())

describe("capturePdf — full-bleed mode", () => {
  it("calls page.pdf with margin 0 on all sides", async () => {
    await capturePdf(mockPage, { mode: "full-bleed" })
    expect(mockPdf).toHaveBeenCalledWith(expect.objectContaining({
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    }))
  })

  it("always enables printBackground", async () => {
    await capturePdf(mockPage, { mode: "full-bleed" })
    expect(mockPdf).toHaveBeenCalledWith(expect.objectContaining({ printBackground: true }))
  })

  it("uses preferCSSPageSize to respect @page CSS rule", async () => {
    await capturePdf(mockPage, { mode: "full-bleed" })
    expect(mockPdf).toHaveBeenCalledWith(expect.objectContaining({ preferCSSPageSize: true }))
  })

  it("returns a Buffer", async () => {
    const result = await capturePdf(mockPage, { mode: "full-bleed" })
    expect(Buffer.isBuffer(result)).toBe(true)
  })

  it("does NOT set displayHeaderFooter in full-bleed mode", async () => {
    await capturePdf(mockPage, { mode: "full-bleed" })
    const call = mockPdf.mock.calls[0][0]
    expect(call.displayHeaderFooter).toBeUndefined()
  })
})

describe("capturePdf — header-footer mode", () => {
  it("sets displayHeaderFooter: true", async () => {
    await capturePdf(mockPage, { mode: "header-footer" })
    expect(mockPdf).toHaveBeenCalledWith(expect.objectContaining({ displayHeaderFooter: true }))
  })

  it("applies physical margins for header/footer isolation", async () => {
    await capturePdf(mockPage, { mode: "header-footer" })
    const call = mockPdf.mock.calls[0][0]
    expect(call.margin.top).toBe("2cm")
    expect(call.margin.bottom).toBe("2cm")
  })

  it("uses custom headerTemplate when provided", async () => {
    const header = "<div>Custom Header</div>"
    await capturePdf(mockPage, { mode: "header-footer", headerTemplate: header })
    expect(mockPdf).toHaveBeenCalledWith(expect.objectContaining({ headerTemplate: header }))
  })

  it("uses custom footerTemplate when provided", async () => {
    const footer = "<div>Custom Footer</div>"
    await capturePdf(mockPage, { mode: "header-footer", footerTemplate: footer })
    expect(mockPdf).toHaveBeenCalledWith(expect.objectContaining({ footerTemplate: footer }))
  })

  it("uses default footer with .pageNumber when no footerTemplate provided", async () => {
    await capturePdf(mockPage, { mode: "header-footer" })
    const call = mockPdf.mock.calls[0][0]
    expect(call.footerTemplate).toContain("pageNumber")
    expect(call.footerTemplate).toContain("totalPages")
  })

  it("returns a Buffer", async () => {
    const result = await capturePdf(mockPage, { mode: "header-footer" })
    expect(Buffer.isBuffer(result)).toBe(true)
  })
})

describe("capturePdf — architectural contract", () => {
  it("full-bleed never sets margins >0 (web owns all spacing)", async () => {
    await capturePdf(mockPage, { mode: "full-bleed" })
    const { margin } = mockPdf.mock.calls[0][0]
    Object.values(margin).forEach((v) => expect(v).toBe("0"))
  })

  it("header-footer never sets margin 0 (Puppeteer owns physical spacing)", async () => {
    await capturePdf(mockPage, { mode: "header-footer" })
    const { margin } = mockPdf.mock.calls[0][0]
    expect(margin.top).not.toBe("0")
    expect(margin.bottom).not.toBe("0")
  })
})
