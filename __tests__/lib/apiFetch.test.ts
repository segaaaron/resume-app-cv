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
