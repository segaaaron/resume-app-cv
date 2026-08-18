import { describe, it, expect, vi, beforeEach } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"

const SRC = join(process.cwd(), "lib/services/email/ResendEmailService.ts")

// Un envío que llame a la API por su cuenta vuelve a tirar la cabecera de cuota Y a
// tragarse los rechazos de Resend, que es exactamente el agujero que esto cerró. El
// guard LEE EL CÓDIGO porque el defecto es una omisión: no hay comportamiento que
// observar en un método que todavía no existe.
describe("un solo punto de salida de correo", () => {
  const src = readFileSync(SRC, "utf8")

  it("la API de Resend se llama en UN solo lugar", () => {
    const calls = src.match(/resend!?\.emails\.send\(/g) ?? []
    expect(calls.length, "cada envío debe pasar por deliver()").toBe(1)
  })

  it("esa única llamada vive dentro de deliver()", () => {
    const start = src.indexOf("async function deliver(")
    const end = src.indexOf("export class ResendEmailService")
    expect(start).toBeGreaterThan(-1)
    expect(src.indexOf("resend!.emails.send(")).toBeGreaterThan(start)
    expect(src.indexOf("resend!.emails.send(")).toBeLessThan(end)
  })

  it("deliver registra la cuota y mira el error que Resend devuelve sin lanzar", () => {
    const body = src.slice(src.indexOf("async function deliver("), src.indexOf("export class ResendEmailService"))
    expect(body).toContain("recordQuota(res.headers)")
    expect(body).toContain("res.error")
  })
})

// ---- Comportamiento ----

const send = vi.fn()
const recordQuota = vi.fn()
const error = vi.fn()

vi.mock("@/lib/resend", () => ({
  resend: { emails: { send: (...a: unknown[]) => send(...a) } },
  emailEnabled: () => true,
}))
vi.mock("@/lib/services/email/quota", () => ({ recordQuota: (...a: unknown[]) => recordQuota(...a) }))
vi.mock("@/lib/logger", () => ({ createLogger: () => ({ error: (...a: unknown[]) => error(...a), warn: vi.fn(), info: vi.fn() }) }))

beforeEach(() => {
  send.mockReset(); recordQuota.mockReset(); error.mockReset()
})

describe("cada envío alimenta la cuota", () => {
  it("pasa las cabeceras de la respuesta al registro", async () => {
    const { ResendEmailService } = await import("@/lib/services/email/ResendEmailService")
    send.mockResolvedValue({ data: { id: "1" }, error: null, headers: { "x-resend-monthly-quota": "42" } })
    await new ResendEmailService().sendRegistrationOtp("a@b.com", "Ana", "123456")
    expect(recordQuota).toHaveBeenCalledWith({ "x-resend-monthly-quota": "42" })
  })

  // El SDK NO lanza cuando la API rechaza: devuelve { data: null, error }. Antes esto
  // se perdía en silencio y el panel no mostraba nada.
  it("un rechazo de la API queda registrado como error", async () => {
    const { ResendEmailService } = await import("@/lib/services/email/ResendEmailService")
    send.mockResolvedValue({
      data: null,
      error: { name: "monthly_quota_exceeded", message: "quota exceeded" },
      headers: { "x-resend-monthly-quota": "3000/3000" },
    })
    await new ResendEmailService().sendRegistrationOtp("a@b.com", "Ana", "123456")
    expect(error).toHaveBeenCalled()
    // Y la cuota se registra IGUAL: cuando el rechazo es por tope agotado, ese es
    // justamente el dato que más falta hace en el panel.
    expect(recordQuota).toHaveBeenCalledWith({ "x-resend-monthly-quota": "3000/3000" })
  })

  it("un fallo de red no propaga la excepción al llamador", async () => {
    const { ResendEmailService } = await import("@/lib/services/email/ResendEmailService")
    send.mockRejectedValue(new Error("ECONNRESET"))
    await expect(new ResendEmailService().sendRegistrationOtp("a@b.com", "Ana", "1")).resolves.toBeUndefined()
    expect(error).toHaveBeenCalled()
  })

  it("el correo NO expone la dirección completa en el log", async () => {
    const { ResendEmailService } = await import("@/lib/services/email/ResendEmailService")
    send.mockRejectedValue(new Error("boom"))
    await new ResendEmailService().sendRegistrationOtp("miguel@example.com", "M", "1")
    expect(JSON.stringify(error.mock.calls)).not.toContain("miguel@example.com")
  })
})
