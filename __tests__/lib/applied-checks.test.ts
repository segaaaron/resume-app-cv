import { describe, it, expect } from "vitest"
import { appliedIdsFrom, fingerprintOfCheck } from "@/lib/ats/panel-actions"
import type { ReportCheck } from "@/lib/ats/report"

/**
 * UN HALLAZGO QUE VUELVE RECUPERA SU BOTÓN.
 *
 * El defecto: «aplicado» era un conjunto de ids que sólo sumaba, y los ids son
 * estables. Pegar otra vez una viñeta con flecha devolvía el hallazgo con el
 * mismo id, la tarjeta lo pintaba en verde y no ofrecía botón — callejón hasta
 * recargar el editor.
 */
const check = (over: Partial<ReportCheck> = {}): ReportCheck => ({
  id: "format.decorative_glyphs",
  section: "format",
  state: "warn",
  weight: 0,
  titleKey: "check.decorative_glyphs",
  params: { count: 3 },
  owner: "auto",
  ...over,
} as ReportCheck)

describe("appliedIdsFrom", () => {
  it("sigue cerrado mientras el informe lo describa igual", () => {
    const c = check()
    const marks = new Map([[c.id, fingerprintOfCheck(c)]])
    expect(appliedIdsFrom(marks, [c]).has(c.id)).toBe(true)
  })

  it("el mismo id señalando OTRA cosa es un hallazgo nuevo: recupera su botón", () => {
    const antes = check({ params: { count: 3 } })
    const marks = new Map([[antes.id, fingerprintOfCheck(antes)]])
    const vuelve = check({ params: { count: 1 } })
    expect(appliedIdsFrom(marks, [vuelve]).has(vuelve.id)).toBe(false)
  })

  it("también cuando cambia la línea que apunta", () => {
    const antes = check({ id: "tips.metric.job-1.2", evidence: ["Coordiné el cierre del turno"] })
    const marks = new Map([[antes.id, fingerprintOfCheck(antes)]])
    const vuelve = check({ id: "tips.metric.job-1.2", evidence: ["Atendí a los clientes del mostrador"] })
    expect(appliedIdsFrom(marks, [vuelve]).has(vuelve.id)).toBe(false)
  })

  it("y cuando el hallazgo se agrava: aviso y crítico no son el mismo", () => {
    const antes = check({ state: "warn" })
    const marks = new Map([[antes.id, fingerprintOfCheck(antes)]])
    expect(appliedIdsFrom(marks, [check({ state: "crit" })]).has(antes.id)).toBe(false)
  })

  /**
   * El caso del reclutador: su hallazgo NO se recalcula al teclear, viene
   * congelado del último análisis. Mientras siga igual, sigue cerrado — es la
   * razón por la que esta memoria existe.
   */
  it("un hallazgo que ya no está en el informe se conserva marcado", () => {
    const c = check({ id: "tips.recruiter.0" })
    const marks = new Map([[c.id, fingerprintOfCheck(c)]])
    expect(appliedIdsFrom(marks, []).has(c.id)).toBe(true)
  })

  it("sin marcas, nada está cerrado", () => {
    expect(appliedIdsFrom(new Map(), [check()]).size).toBe(0)
  })
})
