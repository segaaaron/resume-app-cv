// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }))

import { toast } from "sonner"

const mockToastError = toast.error as ReturnType<typeof vi.fn>

function setLang(lang: string) {
  Object.defineProperty(document.documentElement, "lang", { value: lang, configurable: true })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  setLang("es")
})

async function getApiFetch() {
  const mod = await import("@/lib/apiFetch")
  return mod.apiFetch
}

describe("apiFetch", () => {
  it("returns response on 200 without toast", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }))
    const apiFetch = await getApiFetch()
    const res = await apiFetch("/api/test")
    expect(res.status).toBe(200)
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it("returns response on 400 without toast (4xx = component handles)", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 400 }))
    const apiFetch = await getApiFetch()
    const res = await apiFetch("/api/test")
    expect(res.status).toBe(400)
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it("returns response on 422 without toast", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 422 }))
    const apiFetch = await getApiFetch()
    const res = await apiFetch("/api/test")
    expect(res.status).toBe(422)
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it("returns response on 500 AND shows server_error toast (ES)", async () => {
    setLang("es")
    global.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 500 }))
    const apiFetch = await getApiFetch()
    const res = await apiFetch("/api/test")
    expect(res.status).toBe(500)
    expect(mockToastError).toHaveBeenCalledWith("Algo salió mal. Inténtalo de nuevo.")
  })

  it("returns response on 503 AND shows service_unavailable toast (ES)", async () => {
    setLang("es")
    global.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 503 }))
    const apiFetch = await getApiFetch()
    const res = await apiFetch("/api/test")
    expect(res.status).toBe(503)
    expect(mockToastError).toHaveBeenCalledWith("Servicio no disponible. Intenta en unos minutos.")
  })

  it("shows server_error toast in EN when lang=en", async () => {
    setLang("en")
    global.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 500 }))
    const apiFetch = await getApiFetch()
    await apiFetch("/api/test")
    expect(mockToastError).toHaveBeenCalledWith("Something went wrong. Please try again.")
  })

  it("throws and shows network_error toast when fetch throws", async () => {
    setLang("es")
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    const apiFetch = await getApiFetch()
    await expect(apiFetch("/api/test")).rejects.toThrow("network_error")
    expect(mockToastError).toHaveBeenCalledWith("Sin conexión. Verifica tu internet.")
  })

  it("silent:true — no toast on 500", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 500 }))
    const apiFetch = await getApiFetch()
    const res = await apiFetch("/api/test", { silent: true })
    expect(res.status).toBe(500)
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it("silent:true — no toast on network error, still throws", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    const apiFetch = await getApiFetch()
    await expect(apiFetch("/api/test", { silent: true })).rejects.toThrow("network_error")
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it("passes RequestInit options to fetch", async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }))
    global.fetch = mockFetch
    const apiFetch = await getApiFetch()
    await apiFetch("/api/test", { method: "POST", headers: { "X-Test": "1" } })
    // apiFetch attaches an AbortSignal for its timeout handling
    expect(mockFetch).toHaveBeenCalledWith("/api/test", expect.objectContaining({
      method: "POST",
      headers: { "X-Test": "1" },
      signal: expect.any(AbortSignal),
    }))
  })
})

/**
 * THE HOLE THIS COVERS. These three failures never reach the server, so
 * `handleError` cannot write a row and the Service Errors panel is the only
 * place they can ever appear. Before this, a 30s timeout on an AI endpoint —
 * the slow ones, the ones that hit the ceiling — produced no record anywhere:
 * the button "did nothing" and we could not count it.
 */
describe("apiFetch — failures the server cannot record", () => {
  async function withReporter() {
    const spy = vi.fn()
    vi.doMock("@/lib/client-error-reporter", () => ({ reportUxFailure: spy }))
    const mod = await import("@/lib/apiFetch")
    return { apiFetch: mod.apiFetch, spy }
  }

  it("records a timeout, with the ceiling that actually applied", async () => {
    global.fetch = vi.fn().mockRejectedValue(new DOMException("Timeout", "TimeoutError"))
    const { apiFetch, spy } = await withReporter()
    await expect(apiFetch("/api/ai/improve-bullet")).rejects.toThrow()
    // 120s, not 30s: a model-backed endpoint. Reporting the real ceiling matters —
    // the panel is where we would notice these endpoints creeping past it.
    expect(spy).toHaveBeenCalledWith("request_timeout", expect.objectContaining({ timeoutMs: 120000 }))
  })

  it("records the ordinary 30s ceiling for a non-model endpoint", async () => {
    global.fetch = vi.fn().mockRejectedValue(new DOMException("Timeout", "TimeoutError"))
    const { apiFetch, spy } = await withReporter()
    await expect(apiFetch("/api/resumes")).rejects.toThrow()
    expect(spy).toHaveBeenCalledWith("request_timeout", expect.objectContaining({ timeoutMs: 30000 }))
  })

  it("does NOT record a user-initiated abort — nothing failed", async () => {
    global.fetch = vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError"))
    const { apiFetch, spy } = await withReporter()
    await expect(apiFetch("/api/ai/improve-bullet")).rejects.toThrow()
    expect(spy).not.toHaveBeenCalled()
  })

  it("records a network failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    const { apiFetch, spy } = await withReporter()
    await expect(apiFetch("/api/resumes")).rejects.toThrow("network_error")
    expect(spy).toHaveBeenCalledWith("request_network_failed", expect.any(Object))
  })

  it.each([502, 503, 504])("records a %i from the proxy — Next never ran", async (status) => {
    global.fetch = vi.fn().mockResolvedValue(new Response("", { status }))
    const { apiFetch, spy } = await withReporter()
    await apiFetch("/api/resumes")
    expect(spy).toHaveBeenCalledWith("request_gateway_error", expect.objectContaining({ status }))
  })

  it("does NOT record a 500 — that one is ours and already has a server row", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response("", { status: 500 }))
    const { apiFetch, spy } = await withReporter()
    await apiFetch("/api/resumes")
    expect(spy).not.toHaveBeenCalled()
  })
})

// ── Per-endpoint timeout ceiling ────────────────────────────────────────────────
// The flat 30s ceiling sat below what the server needs for a model call: the browser
// aborted while the server finished the work and we paid for every token of a result
// nobody was listening for. These lock the two tiers in place.

describe("apiFetch: timeout ceiling per endpoint", () => {
  it("gives model-backed endpoints room to finish (they cost money to abandon)", async () => {
    const { defaultTimeoutFor } = await import("@/lib/apiFetch")
    expect(defaultTimeoutFor("/api/ai/ats-score")).toBe(120_000)
    expect(defaultTimeoutFor("/api/ai/tailor-cv")).toBe(120_000)
    expect(defaultTimeoutFor("/api/resumes/import")).toBe(120_000)
  })

  it("covers PDF renders and thumbnails, which go out to the screenshot microservice", async () => {
    const { defaultTimeoutFor } = await import("@/lib/apiFetch")
    expect(defaultTimeoutFor("/api/resumes/abc123/pdf?locale=es")).toBe(120_000)
    expect(defaultTimeoutFor("/api/cover-letters/abc123/pdf")).toBe(120_000)
    expect(defaultTimeoutFor("/api/resumes/abc123/thumbnail?locale=es")).toBe(120_000)
  })

  it("leaves ordinary endpoints at 30s — a slow save is a real failure", async () => {
    const { defaultTimeoutFor } = await import("@/lib/apiFetch")
    expect(defaultTimeoutFor("/api/resumes")).toBe(30_000)
    expect(defaultTimeoutFor("/api/user/profile")).toBe(30_000)
    expect(defaultTimeoutFor("https://www.valhallaresume.com/api/resumes")).toBe(30_000)
  })

  it("works on absolute URLs too", async () => {
    const { defaultTimeoutFor } = await import("@/lib/apiFetch")
    expect(defaultTimeoutFor("https://www.valhallaresume.com/api/ai/ats-score")).toBe(120_000)
  })

  it("an explicit timeoutMs still wins over the per-endpoint default", async () => {
    const spy = vi.fn()
    vi.doMock("@/lib/client-error-reporter", () => ({ reportUxFailure: spy }))
    global.fetch = vi.fn().mockRejectedValue(new DOMException("Timeout", "TimeoutError"))
    const { apiFetch } = await import("@/lib/apiFetch")
    await expect(apiFetch("/api/ai/ats-score", { timeoutMs: 5_000 })).rejects.toThrow()
    expect(spy).toHaveBeenCalledWith("request_timeout", expect.objectContaining({ timeoutMs: 5_000 }))
  })
})
