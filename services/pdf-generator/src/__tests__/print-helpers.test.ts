import { withTimeout, waitForFonts, waitForImages, gotoAndWaitForContent } from "../print-helpers"
import type { Page } from "puppeteer-core"
import { FONTS_TIMEOUT_MS } from "../constants"

// ---------------------------------------------------------------------------
// withTimeout
// ---------------------------------------------------------------------------

describe("withTimeout", () => {
  it("resolves with value when promise resolves before timeout", async () => {
    const result = await withTimeout(Promise.resolve(42), 1000, "test")
    expect(result).toBe(42)
  })

  it("rejects with timeout message when promise is slower than timeout", async () => {
    // Use a never-resolving promise so the withTimeout timer fires first
    const slow = new Promise<never>(() => {}) // intentionally never resolves
    await expect(withTimeout(slow, 50, "slow-op")).rejects.toThrow("Timeout: slow-op after 50ms")
  })

  it("propagates original rejection when promise rejects before timeout", async () => {
    const failing = Promise.reject(new Error("original error"))
    await expect(withTimeout(failing, 1000, "test")).rejects.toThrow("original error")
  })
})

// ---------------------------------------------------------------------------
// waitForFonts
// ---------------------------------------------------------------------------

describe("waitForFonts", () => {
  it("does not warn when fonts.ready resolves quickly", async () => {
    jest.useFakeTimers()
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})
    const mockPage = {
      evaluate: jest.fn().mockResolvedValue(undefined),
    } as unknown as Page
    await waitForFonts(mockPage)
    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it("warns and does not throw when fonts timeout", async () => {
    jest.useFakeTimers()
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})
    // evaluate never resolves — simulates fonts.ready hang
    const mockPage = {
      evaluate: jest.fn().mockReturnValue(new Promise(() => {})),
    } as unknown as Page

    const fontsPromise = waitForFonts(mockPage)
    // Advance timers to fire the internal setTimeout for FONTS_TIMEOUT_MS
    jest.runAllTimers()
    await fontsPromise

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(`fonts not ready after ${FONTS_TIMEOUT_MS}ms`),
    )
    warnSpy.mockRestore()
    jest.clearAllTimers()
    jest.useRealTimers()
  })
})

// ---------------------------------------------------------------------------
// waitForImages
// ---------------------------------------------------------------------------

describe("waitForImages", () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it("resolves immediately when there are no images (evaluate returns [])", async () => {
    const mockPage = {
      evaluate: jest.fn().mockResolvedValue(undefined),
    } as unknown as Page
    // evaluate resolves immediately — Promise.race wins before the timeout fires
    await expect(waitForImages(mockPage, 3000)).resolves.toBeUndefined()
  })

  it("resolves when images complete quickly (evaluate resolves before timeout)", async () => {
    const mockPage = {
      evaluate: jest.fn().mockResolvedValue(undefined),
    } as unknown as Page
    // evaluate resolves immediately — no need to advance timers
    await expect(waitForImages(mockPage, 3000)).resolves.toBeUndefined()
  })

  it("warns and resolves on timeout without throwing", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})
    // Simulate images never ready (evaluate never resolves)
    const mockPage = {
      evaluate: jest.fn().mockReturnValue(new Promise(() => {})),
    } as unknown as Page
    const p = waitForImages(mockPage, 3000)
    jest.runAllTimers()
    await expect(p).resolves.toBeUndefined()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("images not ready after 3000ms"))
    warnSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// gotoAndWaitForContent
// ---------------------------------------------------------------------------

describe("gotoAndWaitForContent", () => {
  it("resolves when goto succeeds and selector is found", async () => {
    const mockPage = {
      goto: jest.fn().mockResolvedValue(null),
      waitForSelector: jest.fn().mockResolvedValue(null),
    } as unknown as Page
    await expect(
      gotoAndWaitForContent(mockPage, "https://example.com", ".content"),
    ).resolves.toBeUndefined()
    expect(mockPage.goto).toHaveBeenCalledWith("https://example.com", expect.objectContaining({ waitUntil: "domcontentloaded" }))
    expect(mockPage.waitForSelector).toHaveBeenCalledWith(".content", expect.any(Object))
  })

  it("propagates error when page.goto throws", async () => {
    const mockPage = {
      goto: jest.fn().mockRejectedValue(new Error("Navigation failed")),
      waitForSelector: jest.fn(),
    } as unknown as Page
    await expect(
      gotoAndWaitForContent(mockPage, "https://example.com", ".content"),
    ).rejects.toThrow("Navigation failed")
  })
})
