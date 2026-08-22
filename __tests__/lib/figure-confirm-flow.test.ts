import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { tailorResolutions } from "@/lib/ats/tailor-resolutions"
import type { AtsReport } from "@/lib/ats/report"
import { join } from "node:path"
import { hallucinationKind } from "@/lib/services/ai/shared/ai-helpers"

/**
 * Una cifra propuesta se CONFIRMA; no se tira.
 *
 * Regla corregida por el CEO (2026-08-20): "no inventes" siempre quiso decir NO
 * LA QUEMES VOS. Antes, cualquier disparo del guard mataba la reescritura entera
 * — y la causa mas comun era justamente una cifra que el candidato no habia
 * escrito, aunque el tamano del trabajo que el mismo describio la hiciera
 * evidente. Se perdia una linea mejor en todo lo demas por un numero que el
 * conoce y confirma en un clic.
 *
 * Lo que se sigue tirando sin preguntar: el placeholder (un "[X%]" jamas puede
 * llegar al CV impreso) y la marca que el candidato no declaro (eso si es un
 * hecho falso sobre el).
 */
const CV = "Gestione la cartera vencida del banco y negocie acuerdos de pago con clientes."
const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8")

describe("por que se disparo el guard", () => {
  it("una cifra sin respaldo se marca como cifra, no como invento", () => {
    expect(hallucinationKind("Reduje la mora un 30% gestionando la cartera", CV)).toBe("figure")
  })

  it("un placeholder sigue siendo placeholder", () => {
    expect(hallucinationKind("Reduje la mora un [X%] gestionando la cartera", CV)).toBe("placeholder")
  })

  /**
   * OJO con el alcance real: `TECH_BUZZWORDS` es una lista TECNICA. Una marca de
   * otro rubro ("Temenos" en un CV bancario) no cae por esta via — la frena la
   * regla del prompt, no el guard. No es lo que se toco hoy, pero conviene que
   * quede escrito: este test cubre lo que el guard SI puede ver.
   */
  it("una marca tecnica que el candidato no declaro sigue siendo invento", () => {
    expect(hallucinationKind("Gestione la cartera desplegando en Kubernetes", CV)).toBe("brand")
  })

  it("una reescritura limpia no dispara nada", () => {
    expect(hallucinationKind("Negocie acuerdos de pago con clientes en mora temprana", CV)).toBeNull()
  })

  /** La cifra que el candidato SI declaro nunca fue el problema. */
  it("no marca una cifra que ya esta en el CV", () => {
    expect(hallucinationKind("Coordine un equipo de 3 analistas", "Coordine un equipo de 3 analistas")).toBeNull()
  })
})

describe("el camino completo, de tailor a la tarjeta", () => {
  /**
   * ESTOS TESTS LEÍAN EL CÓDIGO. Buscaban cadenas como
   * `toContain("const kind = hallucinationKind(text, groundingSource)")` — una
   * línea literal, con su nombre de variable y todo. Pasaban en verde con el
   * puente desconectado, y se ponían en rojo por renombrar `kind`. Ahora se
   * ejecuta el puente y se lee la bandera que sale del otro lado.
   */
  const REWRITE = "Ejecuté estrategias comerciales y aumenté las ventas entre un 15% y 20%."

  const reportWith = (checkId: string): AtsReport => ({
    score: 70,
    sections: [{ id: "tips", scoreCategory: null, coveragePct: null, checks: [
      { id: checkId, section: "tips", state: "warn", weight: 0, titleKey: "k", owner: "tailor",
        action: { kind: "rewrite_bullet", targetId: "j1", index: 0 } },
    ] }],
    terms: [], bullets: [], overOptimised: false, credibility: { score: 100, band: null },
  })

  const resolve = (needsFigureConfirm: boolean) =>
    tailorResolutions(
      reportWith("c1"),
      { rewrites: [{ checkId: "c1", text: REWRITE, needsFigureConfirm }] } as never,
      () => "Implementar estrategias comerciales.",
    )

  it("la bandera llega intacta hasta la tarjeta", () => {
    const [r] = resolve(true)
    expect(r).toBeDefined()
    expect(r.needsFigureConfirm).toBe(true)
    expect(r.text).toBe(REWRITE)
  })

  /** Y no se pega sola: una reescritura sin cifra dudosa no pide confirmación. */
  it("una reescritura que no la necesita no la lleva", () => {
    const [r] = resolve(false)
    expect(r.needsFigureConfirm).toBeFalsy()
  })

  /**
   * ÉSTE SÍ MIRA EL CÓDIGO, y es a propósito: comprueba una AUSENCIA — que los
   * dos tipos que se descartan sin preguntar sigan descartándose. De una rama
   * que no existe no hay comportamiento que ejecutar.
   */
  it("placeholder y marca se siguen cayendo sin preguntar", () => {
    expect(read("lib/services/ai/modules/AITailorModule.ts"))
      .toMatch(/kind === "placeholder" \|\| kind === "brand"/)
  })

  it("y el aviso existe en los dos idiomas", () => {
    for (const loc of ["es", "en"]) {
      const m = JSON.parse(read(`messages/${loc}.json`)).editor.ats
      expect(m.reason_confirm_figure_hint, loc).toBeTruthy()
    }
  })
})
