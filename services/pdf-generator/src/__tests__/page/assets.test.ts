import { waitForFonts, waitForImages, evaluateImages } from "../../page/assets"
import { FONTS_TIMEOUT_MS } from "../../constants"
import type { Page } from "puppeteer-core"

describe("waitForFonts", () => {
  afterEach(() => { jest.clearAllTimers(); jest.useRealTimers() })

  it("resolves without warning when fonts load quickly", async () => {
    jest.useFakeTimers()
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})
    const page = { evaluate: jest.fn().mockResolvedValue(undefined) } as unknown as Page
    await waitForFonts(page)
    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it("warns when fonts time out", async () => {
    jest.useFakeTimers()
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})
    const page = { evaluate: jest.fn().mockReturnValue(new Promise(() => {})) } as unknown as Page
    const p = waitForFonts(page)
    jest.runAllTimers()
    await p
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(`${FONTS_TIMEOUT_MS}ms`))
    warnSpy.mockRestore()
  })
})

describe("waitForImages", () => {
  afterEach(() => { jest.clearAllTimers(); jest.useRealTimers() })

  it("resolves when evaluate resolves immediately", async () => {
    const page = { evaluate: jest.fn().mockResolvedValue(undefined) } as unknown as Page
    await expect(waitForImages(page, 3000)).resolves.toBeUndefined()
  })

  it("warns and resolves on timeout", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})
    let callCount = 0
    // First call returns false (images not ready); second call returns 0 (brokenCount)
    const page = {
      evaluate: jest.fn().mockImplementation(() => Promise.resolve(callCount++ === 0 ? false : 0)),
    } as unknown as Page
    await waitForImages(page, 50)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("50ms"))
    warnSpy.mockRestore()
  }, 3000)
})

describe("evaluateImages (browser-side fn, tested in Node with mocked document)", () => {
  afterEach(() => { delete (global as any).document })

  it("resolves immediately when all images are already complete", async () => {
    ;(global as any).document = { images: [{ complete: true }, { complete: true }] }
    await expect(evaluateImages()).resolves.toEqual([])
  })

  it("resolves when incomplete image fires onload", async () => {
    const img: any = { complete: false, onload: null, onerror: null }
    ;(global as any).document = { images: [img] }
    const p = evaluateImages()
    img.onload()
    await expect(p).resolves.toBeDefined()
  })

  it("resolves when incomplete image fires onerror", async () => {
    const img: any = { complete: false, onload: null, onerror: null }
    ;(global as any).document = { images: [img] }
    const p = evaluateImages()
    img.onerror()
    await expect(p).resolves.toBeDefined()
  })

  it("resolves immediately with empty array when document has no images", async () => {
    ;(global as any).document = { images: [] }
    await expect(evaluateImages()).resolves.toEqual([])
  })
})
