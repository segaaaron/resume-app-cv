import { describe, it, expect } from "vitest"
import { buildActionPlan, textSignature, matchesApplied, isReadyToSend, READY_SCORE } from "@/lib/ats/action-plan"

/**
 * El panel ATS era un pozo sin fondo.
 *
 * Reportado con capturas: tres fuentes opinaban sobre el MISMO bullet sin saber
 * una de la otra —una proponía fusionar dos líneas, otra reescribir una de
 * ellas—, había ítems que sólo criticaban sin ofrecer botón, y al aplicar un
 * arreglo la corrida siguiente proponía una variante del texto que el propio
 * modelo acababa de escribir. El usuario nunca podía terminar, y nunca sabía si
 * su CV ya estaba listo para enviar.
 */
const item = (over: Partial<Parameters<typeof buildActionPlan>[0][number]> = {}) => ({
  target: "job1:0", source: "bullet" as const, severity: "medium" as const, actionable: true, ...over,
})

describe("un objetivo, una tarea", () => {
  it("no muestra dos órdenes sobre el mismo bullet", () => {
    const out = buildActionPlan([
      item({ target: "job1:0", source: "merge" }),
      item({ target: "job1:0", source: "bullet" }),
    ])
    expect(out).toHaveLength(1)
  })

  /** Un defecto que descalifica gana sobre "podrías pulir esto". */
  it("gana la fuente de más impacto", () => {
    const out = buildActionPlan([
      item({ target: "job1:0", source: "bullet" }),
      item({ target: "job1:0", source: "critical" }),
    ])
    expect(out[0].source).toBe("critical")
  })

  it("no toca tareas de objetivos distintos", () => {
    const out = buildActionPlan([item({ target: "job1:0" }), item({ target: "job1:1" }), item({ target: "summary" })])
    expect(out).toHaveLength(3)
  })
})

describe("nada sin salida", () => {
  it("descarta lo que sólo critica y no ofrece botón", () => {
    const out = buildActionPlan([item({ target: "a", actionable: false }), item({ target: "b" })])
    expect(out.map((i) => i.target)).toEqual(["b"])
  })
})

describe("lo aplicado no vuelve", () => {
  const APPLIED = textSignature(
    "Cumplí los KPI comerciales mensuales mediante prospección, gestión activa de clientes y cierre de ventas",
  )

  it("reconoce el texto aunque vuelva reordenado", () => {
    expect(matchesApplied(
      "Cumplí mediante prospección y gestión activa de clientes los KPI comerciales mensuales, con cierre de ventas",
      [APPLIED],
    )).toBe(true)
  })

  it("lo saca de la lista en la corrida siguiente", () => {
    const out = buildActionPlan([
      item({ target: "job1:0", proposedText: "Cumplí los KPI comerciales mensuales mediante prospección, gestión activa de clientes y cierre de ventas" }),
      item({ target: "job1:1", proposedText: "Generé leads mediante alianzas con instituciones financieras del sector" }),
    ], [APPLIED])
    expect(out.map((i) => i.target)).toEqual(["job1:1"])
  })

  /** La dirección segura del error: esconder de más le tapa una mejora real. */
  it("no confunde una propuesta DISTINTA con una ya aplicada", () => {
    expect(matchesApplied("Diseñé el proceso de evaluación crediticia usado por toda la sucursal", [APPLIED])).toBe(false)
  })

  it("sin memoria previa no descarta nada", () => {
    const out = buildActionPlan([item({ proposedText: "cualquier texto de prueba con varias palabras" })], [])
    expect(out).toHaveLength(1)
  })
})

describe("el final que el panel no tenía", () => {
  it("declara el CV listo con score alto y sin críticos", () => {
    expect(isReadyToSend(READY_SCORE, 0)).toBe(true)
    expect(isReadyToSend(92, 0)).toBe(true)
  })

  /** Un crítico pendiente no se compensa con un buen número. */
  it("no lo declara listo si queda algo crítico", () => {
    expect(isReadyToSend(95, 1)).toBe(false)
  })

  it("no lo declara listo por debajo del umbral", () => {
    expect(isReadyToSend(READY_SCORE - 1, 0)).toBe(false)
    expect(isReadyToSend(null, 0)).toBe(false)
  })
})
