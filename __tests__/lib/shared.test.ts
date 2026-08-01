// __tests__/lib/shared.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextResponse } from "next/server"
import { AppError } from "@/lib/services/auth/AppError"

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/csrf", () => ({ checkOrigin: vi.fn() }))
// Capture logger.error so we can assert which failures reach the Service Errors sink.
const { errorSpy } = vi.hoisted(() => ({ errorSpy: vi.fn() }))
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({ error: errorSpy, info: () => {}, warn: () => {}, debug: () => {} }),
}))

import { requireAuth, handleError } from "@/lib/controllers/shared"
import { auth } from "@/lib/auth"
import { checkOrigin } from "@/lib/csrf"

beforeEach(() => vi.clearAllMocks())

describe("requireAuth", () => {
  it("no session → returns 401 NextResponse", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    const result = await requireAuth(new Request("http://localhost"))
    expect(result).toBeInstanceOf(NextResponse)
    const body = await (result as NextResponse).json()
    expect(body).toEqual({ error: "Unauthorized" })
    expect((result as NextResponse).status).toBe(401)
  })

  it("bad origin → returns 403 NextResponse", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" } } as never)
    vi.mocked(checkOrigin).mockReturnValue(false)
    const result = await requireAuth(new Request("http://localhost"))
    expect(result).toBeInstanceOf(NextResponse)
    const body = await (result as NextResponse).json()
    expect(body).toEqual({ error: "Forbidden" })
    expect((result as NextResponse).status).toBe(403)
  })

  it("valid session + origin → returns { userId }", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "u1" } } as never)
    vi.mocked(checkOrigin).mockReturnValue(true)
    const result = await requireAuth(new Request("http://localhost"))
    expect(result).toEqual({ userId: "u1" })
  })
})

describe("handleError", () => {
  it("AppError → JSON response with code and status", async () => {
    const res = handleError(new AppError("not_found", 404))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body).toEqual({ error: "not_found" })
  })

  it("AppError with extra → spreads extra into response body", async () => {
    const res = handleError(new AppError("invalid", 400, { attemptsLeft: 3 }))
    const body = await res.json()
    expect(body).toEqual({ error: "invalid", attemptsLeft: 3 })
  })

  it("unknown error → 500 server_error", async () => {
    const res = handleError(new Error("boom"))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({ error: "server_error" })
  })

  it("LOGS a 4xx AppError too — the panel must surface ALL server errors, with status", () => {
    handleError(new AppError("invalid_input", 400), {
      req: new Request("https://x.test/api/ai/generate-cover-letter", { method: "POST" }),
      userId: "u9",
    })
    expect(errorSpy).toHaveBeenCalledTimes(1)
    const [message, ctx] = errorSpy.mock.calls[0]
    expect(message).toBe("invalid_input")
    expect(ctx).toMatchObject({ status: 400, source: "ai", route: "/api/ai/generate-cover-letter", userId: "u9" })
  })

  it("LOGS a 429 quota rejection so the admin sees who was blocked", () => {
    handleError(new AppError("quota_exceeded", 429), {
      req: new Request("https://x.test/api/ai/tailor-cv", { method: "POST" }),
    })
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls[0][1]).toMatchObject({ status: 429, source: "ai" })
  })

  it("LOGS a 5xx AppError so it reaches the Service Errors panel", () => {
    handleError(new AppError("invalid_response_format", 500), {
      req: new Request("https://x.test/api/ai/review-cv", { method: "POST" }),
      userId: "u1",
    })
    expect(errorSpy).toHaveBeenCalledTimes(1)
    const [message, ctx] = errorSpy.mock.calls[0]
    expect(message).toBe("invalid_response_format")
    expect(ctx).toMatchObject({ status: 500, source: "ai", route: "/api/ai/review-cv", userId: "u1" })
  })

  it("LOGS an unhandled throw with its real message", () => {
    handleError(new Error("openai timeout"), { req: new Request("https://x.test/api/ai/tailor-cv", { method: "POST" }) })
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls[0][0]).toBe("openai timeout")
    expect(errorSpy.mock.calls[0][1]).toMatchObject({ source: "ai" })
  })
})
