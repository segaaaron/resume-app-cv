const mockSetTitle = jest.fn()
const mockSetAuthor = jest.fn()
const mockSetProducer = jest.fn()
const mockSetCreator = jest.fn()
const mockSetCreationDate = jest.fn()
const mockSave = jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3]))
const mockDoc = {
  setTitle: mockSetTitle, setAuthor: mockSetAuthor, setProducer: mockSetProducer,
  setCreator: mockSetCreator, setCreationDate: mockSetCreationDate, save: mockSave,
}
const mockLoad = jest.fn().mockResolvedValue(mockDoc)

jest.mock("pdf-lib", () => ({ PDFDocument: { load: mockLoad } }))

import { embedPdfMetadata } from "../../lib/pdf-metadata"

const FAKE = Buffer.from("%PDF-1.4 fake")

beforeEach(() => jest.clearAllMocks())

describe("embedPdfMetadata", () => {
  it("returns a Buffer", async () => {
    mockLoad.mockResolvedValueOnce(mockDoc)
    const result = await embedPdfMetadata(FAKE, { title: "CV", author: "Jane" })
    expect(Buffer.isBuffer(result)).toBe(true)
  })

  it("sets title when provided", async () => {
    mockLoad.mockResolvedValueOnce(mockDoc)
    await embedPdfMetadata(FAKE, { title: "My CV" })
    expect(mockSetTitle).toHaveBeenCalledWith("My CV")
  })

  it("does not call setTitle when title is undefined", async () => {
    mockLoad.mockResolvedValueOnce(mockDoc)
    await embedPdfMetadata(FAKE, {})
    expect(mockSetTitle).not.toHaveBeenCalled()
  })

  it("falls back to original buffer when pdf-lib throws", async () => {
    mockLoad.mockRejectedValueOnce(new Error("corrupt"))
    const result = await embedPdfMetadata(FAKE, { title: "CV" })
    expect(result).toBe(FAKE)
  })

  it("warns with reason when pdf-lib throws", async () => {
    mockLoad.mockRejectedValueOnce(new Error("invalid xref table"))
    const spy = jest.spyOn(console, "warn").mockImplementation(() => {})
    await embedPdfMetadata(FAKE, { title: "CV" })
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("invalid xref table"))
    spy.mockRestore()
  })

  it("always sets producer and creator", async () => {
    mockLoad.mockResolvedValueOnce(mockDoc)
    await embedPdfMetadata(FAKE, {})
    expect(mockSetProducer).toHaveBeenCalledWith("ReadyCV")
    expect(mockSetCreator).toHaveBeenCalledWith("ReadyCV — readycvv.com")
  })
})
