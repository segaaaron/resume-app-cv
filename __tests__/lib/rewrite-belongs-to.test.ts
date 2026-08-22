import { describe, it, expect } from "vitest"
import { rewriteBelongsTo } from "@/lib/services/ai/shared/text-similarity"

/**
 * EL CASO MEDIDO. Set STRONG contra la API real, 2026-08-20: el modelo devolvió
 * para el índice 0 una reescritura de la viñeta 1. Aplicarla borraba la línea de
 * las 15 camas y dejaba la de reingresos escrita dos veces.
 */
const NURSE = [
  "Managed post-operative care for 15 beds",
  "Reduced readmissions from 9% to 4% over two years",
]
const MISPLACED =
  "Reduced readmissions from 9% to 4% over two years by tracking post-operative follow-up needs and reinforcing discharge instructions based on patient status."

describe("rewriteBelongsTo", () => {
  it("caza el caso medido: la reescritura es de la 1 y venía como la 0", () => {
    expect(rewriteBelongsTo(MISPLACED, NURSE, 0)).toBe(1)
  })

  it("deja quieta una reescritura bien puesta", () => {
    expect(rewriteBelongsTo(
      "Managed post-operative care across 15 beds, coordinating wound checks and pain control at every round.",
      NURSE, 0,
    )).toBe(0)
  })

  /**
   * El error opuesto es peor que el defecto: las viñetas de un mismo puesto
   * hablan del mismo trabajo y se parecen entre sí. Mover una por ruido
   * sobrescribiría una línea sana.
   */
  it("no reasigna entre líneas del mismo oficio que sólo se parecen", () => {
    const cashier = [
      "Atendí operaciones de ventanilla entre depósitos y retiros",
      "Cuadré la caja al cierre verificando comprobantes",
    ]
    expect(rewriteBelongsTo(
      "Atendí operaciones de ventanilla entre depósitos, retiros y cobro de servicios, verificando documentos.",
      cashier, 0,
    )).toBe(0)
  })

  it("aguanta un índice fuera de rango sin inventar destino", () => {
    expect(rewriteBelongsTo("texto cualquiera sin relación alguna", NURSE, 9)).toBe(9)
  })

  it("no opina cuando no hay con qué comparar", () => {
    expect(rewriteBelongsTo("", NURSE, 0)).toBe(0)
    expect(rewriteBelongsTo(MISPLACED, [], 0)).toBe(0)
  })
})
