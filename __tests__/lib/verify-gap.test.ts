// La causa de la diferencia se MIDE, no se supone.
//
// El panel afirmaba «cambiá a una plantilla de una columna» sin mirar la
// plantilla — y se lo dijo a un CV que ya estaba en una. Reportado con captura
// por el CEO el 2026-08-21.
import { describe, it, expect } from "vitest"
import { verifyGapCause, FAITHFUL_MAX_DELTA } from "@/lib/ats/verify-gap"

const base = { estimated: 100, real: 80, templateSafety: null, parseIssues: [] as string[] }

describe("de qué es la diferencia entre el estimado y el PDF real", () => {
  it("no culpa al diseño cuando la plantilla es de una columna", () => {
    expect(verifyGapCause({ ...base, parseIssues: ["Faltan encabezados"] })).toBe("parse")
    expect(verifyGapCause(base)).toBe("scale")
  })

  it("culpa al diseño SÓLO cuando la plantilla penaliza", () => {
    expect(verifyGapCause({ ...base, templateSafety: "caution" })).toBe("layout")
  })

  /** Con la plantilla en falta, el consejo del diseño gana aunque haya hallazgos. */
  it("la plantilla manda sobre los hallazgos del parser", () => {
    expect(verifyGapCause({ ...base, templateSafety: "caution", parseIssues: ["x"] })).toBe("layout")
  })

  it("una diferencia chica no se explica: es ruido entre dos varas", () => {
    expect(verifyGapCause({ ...base, real: 100 - FAITHFUL_MAX_DELTA + 1, templateSafety: "caution" })).toBe("faithful")
    // Justo en el umbral ya se explica: 8 puntos no son ruido.
    expect(verifyGapCause({ ...base, real: 100 - FAITHFUL_MAX_DELTA })).toBe("scale")
  })
})
