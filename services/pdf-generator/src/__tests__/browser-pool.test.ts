// Set env before importing the module
process.env.PUPPETEER_EXECUTABLE_PATH = "/usr/bin/chromium"

// ---------------------------------------------------------------------------
// Puppeteer mock — shared mutable state so tests can reconfigure
// ---------------------------------------------------------------------------
const mockPageClose = jest.fn().mockResolvedValue(undefined)
const mockPage = { close: mockPageClose }
const mockBrowserVersion = jest.fn().mockResolvedValue("Chrome/120")
const mockBrowserNewPage = jest.fn().mockResolvedValue(mockPage)
const mockBrowserOn = jest.fn()
const mockBrowser = {
  version: mockBrowserVersion,
  newPage: mockBrowserNewPage,
  on: mockBrowserOn,
}
const mockLaunch = jest.fn().mockResolvedValue(mockBrowser)

jest.mock("puppeteer-core", () => ({
  __esModule: true,
  default: { launch: mockLaunch },
}))

import { withPage, activePageCount, queueDepth } from "../browser-pool"

// Reset mock functions (not state we can't touch like browserPromise) before each test
beforeEach(() => {
  jest.clearAllMocks()
  mockPageClose.mockResolvedValue(undefined)
  mockBrowserVersion.mockResolvedValue("Chrome/120")
  mockBrowserNewPage.mockResolvedValue(mockPage)
  mockBrowserOn.mockImplementation(() => {})
  mockLaunch.mockResolvedValue(mockBrowser)
  process.env.PUPPETEER_EXECUTABLE_PATH = "/usr/bin/chromium"
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("browser-pool", () => {
  describe("withPage", () => {
    it("executes fn with a page and resolves the return value", async () => {
      const fn = jest.fn().mockResolvedValue("result")
      const result = await withPage(fn)
      expect(result).toBe("result")
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it("calls page.close() after fn resolves", async () => {
      const fn = jest.fn().mockResolvedValue(undefined)
      await withPage(fn)
      expect(mockPageClose).toHaveBeenCalled()
    })

    it("calls page.close() even when fn throws (finally block)", async () => {
      const fn = jest.fn().mockRejectedValue(new Error("render error"))
      await expect(withPage(fn)).rejects.toThrow("render error")
      expect(mockPageClose).toHaveBeenCalled()
    })
  })

  describe("health check reconnect", () => {
    it("reconnects when browser.version() times out and logs a warning", async () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})

      let versionCallCount = 0
      mockBrowserVersion.mockImplementation(() => {
        versionCallCount++
        if (versionCallCount === 1) {
          return Promise.reject(new Error("health timeout"))
        }
        return Promise.resolve("Chrome/120")
      })

      // Second launch returns a second browser that is healthy
      const secondMockPage = { close: jest.fn().mockResolvedValue(undefined) }
      const secondMockBrowser = {
        version: jest.fn().mockResolvedValue("Chrome/120"),
        newPage: jest.fn().mockResolvedValue(secondMockPage),
        on: jest.fn(),
      }
      // First call returns potentially-unhealthy browser, second call returns healthy one
      mockLaunch
        .mockResolvedValueOnce(mockBrowser)
        .mockResolvedValueOnce(secondMockBrowser)

      const fn = jest.fn().mockResolvedValue("ok")
      const result = await withPage(fn)
      expect(result).toBe("ok")
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("health check failed, reconnecting"),
        expect.anything(),
      )
      warnSpy.mockRestore()
    })
  })

  describe("concurrency", () => {
    it("runs two concurrent withPage calls successfully", async () => {
      let resolve1!: () => void
      const blocker = new Promise<void>((r) => { resolve1 = r })
      const fn1 = jest.fn().mockReturnValue(blocker)
      const fn2 = jest.fn().mockResolvedValue("fast")

      const prom1 = withPage(fn1)
      const prom2 = withPage(fn2)

      await prom2   // fn2 completes first
      resolve1()    // unblock fn1
      await prom1

      expect(fn1).toHaveBeenCalledTimes(1)
      expect(fn2).toHaveBeenCalledTimes(1)
    })
  })

  describe("exports", () => {
    it("activePageCount returns a number", () => {
      expect(typeof activePageCount()).toBe("number")
    })

    it("queueDepth returns a number", () => {
      expect(typeof queueDepth()).toBe("number")
    })
  })
})
