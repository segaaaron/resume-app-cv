import { setA4Viewport, emulateMediaType } from "../../page/setup"
import { A4_WIDTH_PX, A4_HEIGHT_PX } from "../../constants"
import type { Page } from "puppeteer-core"

const mockSetViewport = jest.fn().mockResolvedValue(undefined)
const mockEmulateMediaType = jest.fn().mockResolvedValue(undefined)
const mockPage = { setViewport: mockSetViewport, emulateMediaType: mockEmulateMediaType } as unknown as Page

describe("setA4Viewport", () => {
  it("sets A4 dimensions", async () => {
    await setA4Viewport(mockPage)
    expect(mockSetViewport).toHaveBeenCalledWith({ width: A4_WIDTH_PX, height: A4_HEIGHT_PX, deviceScaleFactor: 1 })
  })
})

describe("emulateMediaType", () => {
  it("switches to print media", async () => {
    await emulateMediaType(mockPage)
    expect(mockEmulateMediaType).toHaveBeenCalledWith("print")
  })
})
