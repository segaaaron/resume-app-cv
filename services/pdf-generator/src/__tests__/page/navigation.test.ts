import { gotoAndWaitForContent } from "../../page/navigation"
import type { Page } from "puppeteer-core"

const mockGoto = jest.fn().mockResolvedValue(null)
const mockWaitForSelector = jest.fn().mockResolvedValue(null)
const mockPage = { goto: mockGoto, waitForSelector: mockWaitForSelector } as unknown as Page

beforeEach(() => jest.clearAllMocks())

describe("gotoAndWaitForContent", () => {
  it("navigates and waits for selector", async () => {
    await gotoAndWaitForContent(mockPage, "https://app.test/print", ".content")
    expect(mockGoto).toHaveBeenCalledWith("https://app.test/print", expect.objectContaining({ waitUntil: "networkidle0" }))
    expect(mockWaitForSelector).toHaveBeenCalledWith(".content", expect.any(Object))
  })

  it("throws and logs descriptive error when goto fails", async () => {
    mockGoto.mockRejectedValueOnce(new Error("net::ERR_CONNECTION_REFUSED"))
    const spy = jest.spyOn(console, "error").mockImplementation(() => {})
    await expect(gotoAndWaitForContent(mockPage, "https://app.test/print", ".content")).rejects.toThrow("net::ERR_CONNECTION_REFUSED")
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Failed to load"))
    spy.mockRestore()
  })

  it("detects timeout in goto and uses networkidle0 hint", async () => {
    mockGoto.mockRejectedValueOnce(new Error("Navigation timeout exceeded"))
    const spy = jest.spyOn(console, "error").mockImplementation(() => {})
    await expect(gotoAndWaitForContent(mockPage, "https://app.test/print", ".content")).rejects.toThrow()
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("networkidle0"))
    spy.mockRestore()
  })

  it("throws descriptive error when selector is not found after navigation", async () => {
    mockWaitForSelector.mockRejectedValueOnce(new Error("Waiting for selector `.content` failed"))
    await expect(gotoAndWaitForContent(mockPage, "https://app.test/print", ".content")).rejects.toThrow(
      "Content selector \".content\" not found"
    )
  })

  it("error message includes template mount hint when selector not found", async () => {
    mockWaitForSelector.mockRejectedValueOnce(new Error("timeout"))
    await expect(gotoAndWaitForContent(mockPage, "https://app.test/print", ".resume")).rejects.toThrow(
      "print token is valid"
    )
  })
})
