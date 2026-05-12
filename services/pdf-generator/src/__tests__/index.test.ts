// Mock heavy dependencies before any imports
jest.mock("../browser-pool", () => ({
  activePageCount: jest.fn().mockReturnValue(0),
  queueDepth: jest.fn().mockReturnValue(0),
  withPage: jest.fn().mockImplementation((fn: (p: unknown) => Promise<unknown>) => fn({})),
}))

jest.mock("../renderers/resume", () => ({
  renderResumePdf: jest.fn().mockResolvedValue(Buffer.from("%PDF-1.4 resume")),
}))

jest.mock("../renderers/cover-letter", () => ({
  renderCoverLetterPdf: jest.fn().mockResolvedValue(Buffer.from("%PDF-1.4 cover-letter")),
}))

import { buildApp } from "../index"
import { renderResumePdf } from "../renderers/resume"
import { renderCoverLetterPdf } from "../renderers/cover-letter"

const SECRET = "test-secret"

function makeApp() {
  process.env.PDF_SERVICE_SECRET = SECRET
  return buildApp()
}

describe("GET /health", () => {
  it("returns 200 with status ok, activePages and queueDepth — no auth required", async () => {
    const app = makeApp()
    const res = await app.inject({ method: "GET", url: "/health" })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body).toMatchObject({ status: "ok", activePages: expect.any(Number), queueDepth: expect.any(Number) })
  })
})

describe("POST /generate-pdf — authentication", () => {
  it("returns 401 when no Authorization header", async () => {
    const app = makeApp()
    const res = await app.inject({
      method: "POST",
      url: "/generate-pdf",
      payload: { printUrl: "https://app.readycvv.com/print/123" },
    })
    expect(res.statusCode).toBe(401)
    expect(JSON.parse(res.body)).toMatchObject({ error: "unauthorized" })
  })

  it("returns 401 when Authorization Bearer token is wrong", async () => {
    const app = makeApp()
    const res = await app.inject({
      method: "POST",
      url: "/generate-pdf",
      headers: { authorization: "Bearer wrong-token" },
      payload: { printUrl: "https://app.readycvv.com/print/123" },
    })
    expect(res.statusCode).toBe(401)
    expect(JSON.parse(res.body)).toMatchObject({ error: "unauthorized" })
  })
})

describe("POST /generate-pdf — validation", () => {
  it("returns 400 when printUrl is missing", async () => {
    const app = makeApp()
    const res = await app.inject({
      method: "POST",
      url: "/generate-pdf",
      headers: { authorization: `Bearer ${SECRET}` },
      payload: {},
    })
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body)).toMatchObject({ error: "missing printUrl" })
  })
})

describe("POST /generate-pdf — rendering", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(renderResumePdf as jest.Mock).mockResolvedValue(Buffer.from("%PDF-1.4 resume"))
    ;(renderCoverLetterPdf as jest.Mock).mockResolvedValue(Buffer.from("%PDF-1.4 cover-letter"))
  })

  it("calls renderResumePdf when stretchPages is true and returns PDF bytes", async () => {
    const app = makeApp()
    const res = await app.inject({
      method: "POST",
      url: "/generate-pdf",
      headers: {
        authorization: `Bearer ${SECRET}`,
        "content-type": "application/json",
      },
      payload: {
        printUrl: "https://app.readycvv.com/print/resume/1",
        cookies: "",
        stretchPages: true,
        candidateName: "John Doe",
        resumeTitle: "My Resume",
      },
    })
    expect(res.statusCode).toBe(200)
    expect(res.headers["content-type"]).toMatch(/application\/pdf/)
    expect(renderResumePdf).toHaveBeenCalledTimes(1)
    expect(renderCoverLetterPdf).not.toHaveBeenCalled()
  })

  it("calls renderCoverLetterPdf when stretchPages is false and returns PDF bytes", async () => {
    const app = makeApp()
    const res = await app.inject({
      method: "POST",
      url: "/generate-pdf",
      headers: {
        authorization: `Bearer ${SECRET}`,
        "content-type": "application/json",
      },
      payload: {
        printUrl: "https://app.readycvv.com/print/cover-letter/1",
        cookies: "",
        stretchPages: false,
        candidateName: "Jane Doe",
        letterTitle: "Cover Letter",
      },
    })
    expect(res.statusCode).toBe(200)
    expect(res.headers["content-type"]).toMatch(/application\/pdf/)
    expect(renderCoverLetterPdf).toHaveBeenCalledTimes(1)
    expect(renderResumePdf).not.toHaveBeenCalled()
  })

  it("returns 500 with detail:timeout when renderer throws a timeout error", async () => {
    const app = makeApp()
    ;(renderResumePdf as jest.Mock).mockRejectedValue(new Error("Timeout: generate-pdf after 45000ms"))
    const res = await app.inject({
      method: "POST",
      url: "/generate-pdf",
      headers: {
        authorization: `Bearer ${SECRET}`,
        "content-type": "application/json",
      },
      payload: {
        printUrl: "https://app.readycvv.com/print/resume/1",
        cookies: "",
        stretchPages: true,
      },
    })
    expect(res.statusCode).toBe(500)
    const body = JSON.parse(res.body)
    expect(body).toMatchObject({ error: "render failed", detail: "timeout" })
  })

  it("returns 500 with detail message on generic render error", async () => {
    const app = makeApp()
    ;(renderResumePdf as jest.Mock).mockRejectedValue(new Error("Page crashed"))
    const res = await app.inject({
      method: "POST",
      url: "/generate-pdf",
      headers: {
        authorization: `Bearer ${SECRET}`,
        "content-type": "application/json",
      },
      payload: {
        printUrl: "https://app.readycvv.com/print/resume/1",
        cookies: "",
        stretchPages: true,
      },
    })
    expect(res.statusCode).toBe(500)
    const body = JSON.parse(res.body)
    expect(body).toMatchObject({ error: "render failed", detail: "Page crashed" })
  })
})
