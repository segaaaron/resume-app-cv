// __tests__/lib/shared.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextResponse } from "next/server"
import { AppError } from "@/lib/services/auth/AppError"

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/csrf", () => ({ checkOrigin: vi.fn() }))

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
})
