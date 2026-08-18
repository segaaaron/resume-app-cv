import { describe, it, expect, vi, beforeEach } from "vitest"

// El recolector era un `rewrite`, o sea un proxy ciego: la petición llegaba a Umami desde
// NUESTRO servidor, y como Umami ubica al visitante por IP, archivaba a todos como
// "(Unknown)" — 98% del panel.

vi.mock("@/lib/logger", () => ({ createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) }))

import { POST } from "@/app/api/send/route"

const send = (headers: Record<string, string> = {}) =>
  new Request("https://app.test/api/send", {
    method: "POST",
    body: JSON.stringify({ type: "event", payload: { website: "w1" } }),
    headers: { "content-type": "application/json", ...headers },
  })

beforeEach(() => {
  vi.clearAllMocks()
  global.fetch = vi.fn().mockResolvedValue(new Response("ok", { status: 200, headers: { "content-type": "text/plain" } }))
})

describe("proxy del recolector de Umami", () => {
  it("reenvía la IP del visitante — sin esto el país es (Unknown)", async () => {
    await POST(send({ "x-forwarded-for": "190.129.1.10, 10.0.0.5" }))
    const init = vi.mocked(global.fetch).mock.calls[0][1] as RequestInit
    const headers = init.headers as Record<string, string>
    // La PRIMERA de la lista es el cliente; las siguientes son los saltos intermedios.
    expect(headers["X-Forwarded-For"]).toBe("190.129.1.10")
    expect(headers["X-Real-IP"]).toBe("190.129.1.10")
  })

  it("cae a x-real-ip cuando no hay cadena", async () => {
    await POST(send({ "x-real-ip": "8.8.8.8" }))
    const headers = (vi.mocked(global.fetch).mock.calls[0][1] as RequestInit).headers as Record<string, string>
    expect(headers["X-Forwarded-For"]).toBe("8.8.8.8")
  })

  it("reenvía el user-agent — el mismo agujero, pero en navegador y dispositivo", async () => {
    await POST(send({ "user-agent": "Mozilla/5.0 (iPhone)" }))
    const headers = (vi.mocked(global.fetch).mock.calls[0][1] as RequestInit).headers as Record<string, string>
    expect(headers["User-Agent"]).toContain("iPhone")
  })

  it("manda el cuerpo tal cual", async () => {
    await POST(send())
    const init = vi.mocked(global.fetch).mock.calls[0][1] as RequestInit
    expect(JSON.parse(init.body as string)).toMatchObject({ type: "event" })
  })

  it("sin IP no falla: el evento se manda igual", async () => {
    const res = await POST(send())
    expect(res.status).toBe(200)
    const headers = (vi.mocked(global.fetch).mock.calls[0][1] as RequestInit).headers as Record<string, string>
    expect(headers["X-Forwarded-For"]).toBeUndefined()
  })

  it("si el recolector no responde, la navegación NO se rompe", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"))
    const res = await POST(send())
    expect(res.status).toBe(204)
  })
})

describe("tope del cuerpo — la ruta es pública y sin sesión", () => {
  const bigBody = (opts: { declare?: number; actual: number }) =>
    new Request("https://app.test/api/send", {
      method: "POST",
      body: "x".repeat(opts.actual),
      headers: {
        "content-type": "application/json",
        ...(opts.declare ? { "content-length": String(opts.declare) } : {}),
      },
    })

  it("descarta un cuerpo que se DECLARA enorme sin llegar a reenviarlo", async () => {
    const res = await POST(bigBody({ declare: 17 * 1024, actual: 10 }))
    expect(res.status).toBe(204)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("descarta un cuerpo grande aunque content-length mienta u omita", async () => {
    const res = await POST(bigBody({ actual: 17 * 1024 }))
    expect(res.status).toBe(204)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("un evento de tamaño normal sigue pasando", async () => {
    const res = await POST(send())
    expect(res.status).toBe(200)
    expect(global.fetch).toHaveBeenCalled()
  })
})
