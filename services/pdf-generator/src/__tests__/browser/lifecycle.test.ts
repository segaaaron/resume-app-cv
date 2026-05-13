const mockOn = jest.fn()
const mockVersion = jest.fn().mockResolvedValue("Chrome/120")
const mockBrowser = { version: mockVersion, on: mockOn }
const mockLaunch = jest.fn().mockResolvedValue(mockBrowser)

jest.mock("puppeteer-core", () => ({ __esModule: true, default: { launch: mockLaunch } }))

describe("lifecycle", () => {
  let createBrowser: any, getBrowser: any, ensureHealthyBrowser: any

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    mockLaunch.mockResolvedValue(mockBrowser)
    mockVersion.mockResolvedValue("Chrome/120")
    mockOn.mockImplementation(() => {})
    process.env.PUPPETEER_EXECUTABLE_PATH = "/usr/bin/chromium"
    const mod = require("../../browser/lifecycle")
    createBrowser = mod.createBrowser
    getBrowser = mod.getBrowser
    ensureHealthyBrowser = mod.ensureHealthyBrowser
  })

  describe("createBrowser", () => {
    it("launches with the configured path", async () => {
      const b = await createBrowser()
      expect(mockLaunch).toHaveBeenCalledWith(expect.objectContaining({ executablePath: "/usr/bin/chromium" }))
      expect(b).toBe(mockBrowser)
    })

    it("throws when PUPPETEER_EXECUTABLE_PATH is missing", async () => {
      delete process.env.PUPPETEER_EXECUTABLE_PATH
      await expect(createBrowser()).rejects.toThrow("PUPPETEER_EXECUTABLE_PATH not set")
    })

    it("throws descriptively when puppeteer.launch fails", async () => {
      mockLaunch.mockRejectedValueOnce(new Error("spawn ENOENT"))
      await expect(createBrowser()).rejects.toThrow("spawn ENOENT")
    })
  })

  describe("getBrowser", () => {
    it("returns a browser", async () => {
      expect(await getBrowser()).toBe(mockBrowser)
    })

    it("returns the same instance on repeated calls", async () => {
      const b1 = await getBrowser()
      const b2 = await getBrowser()
      expect(mockLaunch).toHaveBeenCalledTimes(1)
      expect(b1).toBe(b2)
    })
  })

  describe("ensureHealthyBrowser", () => {
    it("returns browser when version() resolves", async () => {
      expect(await ensureHealthyBrowser()).toBe(mockBrowser)
    })

    it("reconnects and returns new browser when version() rejects", async () => {
      mockVersion.mockRejectedValueOnce(new Error("crashed"))
      const b = await ensureHealthyBrowser()
      expect(b).toBe(mockBrowser)
      expect(mockLaunch).toHaveBeenCalledTimes(2)
    })
  })

  describe("handleDisconnect (browser 'disconnected' event)", () => {
    it("clears browserPromise so next request relaunches Chrome", async () => {
      // First call sets browserPromise
      await getBrowser()
      expect(mockLaunch).toHaveBeenCalledTimes(1)

      // Simulate Chrome disconnecting — fire the 'disconnected' handler
      const disconnectHandler = mockOn.mock.calls.find(([event]: [string]) => event === "disconnected")?.[1]
      expect(disconnectHandler).toBeDefined()
      disconnectHandler()

      // Next getBrowser() must relaunch
      await getBrowser()
      expect(mockLaunch).toHaveBeenCalledTimes(2)
    })
  })
})
