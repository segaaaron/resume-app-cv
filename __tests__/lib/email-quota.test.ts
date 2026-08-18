import { describe, it, expect, vi, beforeEach } from "vitest"

const upsert = vi.fn()
vi.mock("@/lib/db", () => ({ db: { emailQuota: { upsert: (...a: unknown[]) => upsert(...a) } } }))
vi.mock("@/lib/logger", () => ({ createLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }) }))

import { parseQuotaValue, readQuotaHeaders, periodOf, recordQuota, resolveMonthlyLimit, RESEND_FREE_MONTHLY_LIMIT } from "@/lib/services/email/quota"

beforeEach(() => upsert.mockReset())

describe("parseQuotaValue — el formato de la cabecera NO está documentado", () => {
  it("lee un número suelto", () => {
    expect(parseQuotaValue("412")).toEqual({ used: 412, limit: null })
  })

  it("lee 'usados/tope' si Resend lo escribe así", () => {
    expect(parseQuotaValue("412/3000")).toEqual({ used: 412, limit: 3000 })
  })

  it("tolera espacios y separadores de miles", () => {
    expect(parseQuotaValue(" 1,412 / 3,000 ")).toEqual({ used: 1412, limit: 3000 })
  })

  // Un cero se lee en el panel como "no mandamos nada" — la conclusión contraria a
  // la verdad. Ante un formato desconocido hay que decir "no sé", no "cero".
  it("devuelve null (NO cero) cuando no entiende el formato", () => {
    for (const raw of ["", "   ", "sin datos", null, undefined]) {
      expect(parseQuotaValue(raw as string), String(raw)).toEqual({ used: null, limit: null })
    }
  })
})

describe("readQuotaHeaders", () => {
  it("lee la cuota mensual sin importar mayúsculas en el nombre", () => {
    expect(readQuotaHeaders({ "X-Resend-Monthly-Quota": "120" })?.monthlyUsed).toBe(120)
    expect(readQuotaHeaders({ "x-resend-monthly-quota": "120" })?.monthlyUsed).toBe(120)
  })

  it("guarda el crudo aunque no se pueda parsear — el dato no se pierde", () => {
    const r = readQuotaHeaders({ "x-resend-monthly-quota": "formato-raro" })
    expect(r?.monthlyRaw).toBe("formato-raro")
    expect(r?.monthlyUsed).toBeNull()
  })

  // La cabecera diaria SOLO se envía a cuentas del plan gratuito: su ausencia es la
  // señal de que la cuenta ya es de pago, y por eso se conserva.
  it("conserva la cuota diaria cuando viene, y null cuando no", () => {
    expect(readQuotaHeaders({ "x-resend-monthly-quota": "10", "x-resend-daily-quota": "4" })?.dailyRaw).toBe("4")
    expect(readQuotaHeaders({ "x-resend-monthly-quota": "10" })?.dailyRaw).toBeNull()
  })

  it("sin cabeceras no inventa una lectura", () => {
    expect(readQuotaHeaders(null)).toBeNull()
    expect(readQuotaHeaders({})).toBeNull()
    expect(readQuotaHeaders({ "content-type": "application/json" })).toBeNull()
  })
})

describe("periodOf — en UTC, para que un cambio de zona no parta un mes", () => {
  it("formatea YYYY-MM con cero a la izquierda", () => {
    expect(periodOf(new Date("2026-08-18T10:00:00Z"))).toBe("2026-08")
    expect(periodOf(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01")
  })

  it("el último instante del mes en UTC sigue siendo ese mes", () => {
    expect(periodOf(new Date("2026-08-31T23:59:59Z"))).toBe("2026-08")
    expect(periodOf(new Date("2026-09-01T00:00:00Z"))).toBe("2026-09")
  })
})

describe("recordQuota", () => {
  it("acumula en la fila del mes y cuenta la observación", async () => {
    await recordQuota({ "x-resend-monthly-quota": "412/3000" }, new Date("2026-08-18T10:00:00Z"))
    expect(upsert).toHaveBeenCalledTimes(1)
    const arg = upsert.mock.calls[0][0] as {
      where: { period: string }
      create: { observations: number; monthlyUsed: number }
      update: { observations: { increment: number } }
    }
    expect(arg.where.period).toBe("2026-08")
    expect(arg.create.observations).toBe(1)
    expect(arg.create.monthlyUsed).toBe(412)
    expect(arg.update.observations).toEqual({ increment: 1 })
  })

  it("sin cabecera de cuota no escribe nada", async () => {
    await recordQuota({ "content-type": "application/json" })
    await recordQuota(null)
    expect(upsert).not.toHaveBeenCalled()
  })

  // Corre pegado a un envío: perder la contabilidad no puede impedir que salga un
  // código de verificación.
  it("un fallo de base NO se propaga al envío", async () => {
    upsert.mockRejectedValueOnce(new Error("db caída"))
    await expect(recordQuota({ "x-resend-monthly-quota": "5" })).resolves.toBeUndefined()
  })
})

describe("resolveMonthlyLimit — de dónde sale el denominador", () => {
  it("si Resend declara el tope, manda el suyo", () => {
    expect(resolveMonthlyLimit({ monthlyLimit: 50000, dailyRaw: null })).toBe(50000)
    expect(resolveMonthlyLimit({ monthlyLimit: 50000, dailyRaw: "3" })).toBe(50000)
  })

  it("cuenta gratuita sin tope declarado usa el tope del plan gratis", () => {
    // La cabecera diaria solo llega a cuentas gratuitas: es la señal de que son 3.000.
    expect(resolveMonthlyLimit({ monthlyLimit: null, dailyRaw: "12" })).toBe(RESEND_FREE_MONTHLY_LIMIT)
  })

  // ESTE es el que impide la alarma falsa: una cuenta de pago con 4.000 envíos legítimos
  // pintaba la barra en rojo y decía "tope alcanzado" porque se suponían 3.000.
  it("cuenta de pago sin tope declarado devuelve null, NO 3000", () => {
    expect(resolveMonthlyLimit({ monthlyLimit: null, dailyRaw: null })).toBeNull()
  })
})
