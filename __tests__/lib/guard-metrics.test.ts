import { describe, it, expect, vi, beforeEach } from "vitest"
import { readFileSync } from "node:fs"

/**
 * Los guards tiran reescrituras enteras y nadie sabía cuántas.
 *
 * Los contadores existían y salían por `logger.warn`, que en `lib/logger.ts` sólo
 * escribe en consola — únicamente `error` llega al sink de ErrorLog. En la
 * práctica: la pregunta "¿cuánto valor se está comiendo el guard?" no tenía
 * respuesta sin medir a mano, y por eso una regla mal escrita pudo aplicarse de
 * más durante meses sin que nada lo delatara.
 */
const sink = vi.fn()

vi.mock("@/lib/logger", () => ({
  createLogger: (service: string) => ({
    info: () => {},
    warn: () => {},
    error: (message: string, context?: Record<string, unknown>) => sink({ service, message, context }),
  }),
}))

const { reportGuardDrops } = await import("@/lib/services/ai/shared/guard-metrics")

const base = { endpoint: "tailor-cv", offered: 10, kept: 7, hardCoded: 1, figureLoss: 1, trivial: 1 }

describe("reportGuardDrops", () => {
  beforeEach(() => sink.mockClear())

  it("no escribe nada cuando la corrida no descartó nada", () => {
    reportGuardDrops({ ...base, kept: 10, hardCoded: 0, figureLoss: 0, trivial: 0 })
    expect(sink).not.toHaveBeenCalled()
  })

  it("aparece como su propio servicio en el panel, no mezclado con errores reales", () => {
    reportGuardDrops(base)
    expect(sink).toHaveBeenCalledTimes(1)
    expect(sink.mock.calls[0][0].service).toBe("ai-guard")
  })

  /**
   * `fingerprint` es sha1(servicio|endpoint|mensaje). Con los números adentro del
   * texto, cada corrida daría una huella distinta y el panel no agruparía nada:
   * mil filas sueltas en vez de una tendencia.
   */
  it("mantiene el mensaje fijo y manda los números por contexto", () => {
    reportGuardDrops(base)
    reportGuardDrops({ ...base, offered: 40, kept: 20, trivial: 18 })
    const [a, b] = sink.mock.calls
    expect(a[0].message).toBe(b[0].message)
    expect(a[0].message).not.toMatch(/\d/)
  })

  it("lleva el denominador: 3 de 4 y 3 de 40 no son el mismo producto", () => {
    reportGuardDrops(base)
    const ctx = sink.mock.calls[0][0].context
    expect(ctx.offered).toBe(10)
    expect(ctx.kept).toBe(7)
    expect(ctx.dropped).toBe(3)
    expect(ctx.dropRate).toBe(0.3)
    expect(ctx.figureLoss).toBe(1)
  })
})

describe("el sink de ErrorLog es el único camino durable", () => {
  // Si alguien 'arregla' esto bajándolo a warn, la medición desaparece en
  // silencio: la corrida sigue verde y el panel queda vacío para siempre.
  it("logger.warn no persiste — por eso esto usa error", () => {
    const src = readFileSync("lib/logger.ts", "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^[ \t]*\/\/.*$/gm, "")
    // `error` abre bloque y persiste; `warn` es una sola sentencia a consola.
    expect(src).toMatch(/if \(level === "error"\) \{[\s\S]{0,160}persistError\(/)
    expect(src).toMatch(/if \(level === "warn"\)\s+console\.warn\(line\)\s*\n/)
  })
})
