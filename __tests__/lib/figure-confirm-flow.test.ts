import { describe, it, expect } from "vitest"
import { runWriteGate } from "@/lib/ats/write-gate"
import { readFileSync } from "node:fs"
import { tailorResolutions } from "@/lib/ats/tailor-resolutions"
import type { AtsReport } from "@/lib/ats/report"
import { join } from "node:path"
import { hardCodedFactKind } from "@/lib/services/ai/shared/ai-helpers"

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
    expect(hardCodedFactKind("Reduje la mora un 30% gestionando la cartera", CV)).toBe("figure")
  })

  it("un placeholder sigue siendo placeholder", () => {
    expect(hardCodedFactKind("Reduje la mora un [X%] gestionando la cartera", CV)).toBe("placeholder")
  })

  /**
   * OJO con el alcance real: `TECH_BUZZWORDS` es una lista TECNICA. Una marca de
   * otro rubro ("Temenos" en un CV bancario) no cae por esta via — la frena la
   * regla del prompt, no el guard. No es lo que se toco hoy, pero conviene que
   * quede escrito: este test cubre lo que el guard SI puede ver.
   */
  it("una marca tecnica que el candidato no declaro sigue siendo invento", () => {
    expect(hardCodedFactKind("Gestione la cartera desplegando en Kubernetes", CV)).toBe("brand")
  })

  it("una reescritura limpia no dispara nada", () => {
    expect(hardCodedFactKind("Negocie acuerdos de pago con clientes en mora temprana", CV)).toBeNull()
  })

  /** La cifra que el candidato SI declaro nunca fue el problema. */
  it("no marca una cifra que ya esta en el CV", () => {
    expect(hardCodedFactKind("Coordine un equipo de 3 analistas", "Coordine un equipo de 3 analistas")).toBeNull()
  })

  /**
   * ── LO QUE ESTE CASO DOCUMENTABA ERA UN AGUJERO (medido, 2026-08-25) ──────
   *
   * Decía que un rango sólo se acusa si lleva una de las nueve unidades de
   * `METRIC_REGEX`, y que «clientes» no está en la lista — así que
   * «entre 50 y 100 clientes» daba `null` y entraba al CV SIN que el candidato
   * confirmara nada. Es justo lo contrario de la regla de la casa: «un rango que
   * el usuario ajusta es suyo; un número que decidió el modelo, no».
   *
   * El defecto se vio con el CV del CEO: una reescritura con «10 to 15 edge
   * cases per sprint» pasaba con `needsFigureConfirm: false`.
   *
   * La pregunta tiene un solo dueño ahora —`unsourcedFigures`— y la vara no es
   * una lista de unidades sino si el número CUANTIFICA: lo sigue una palabra.
   */
  it("cualquier cifra que cuantifique y el CV no respalde se manda a confirmar", () => {
    expect(hardCodedFactKind("Atendi entre 50 y 100 clientes", "Atendi clientes")).toBe("figure")
    expect(hardCodedFactKind("Atendi entre 20 y 30 usuarios", "Atendi clientes")).toBe("figure")
  })

  /** Y un dígito que no mide nada no es una afirmación: no se acusa. */
  it("un dígito suelto no es una cifra afirmada", () => {
    expect(hardCodedFactKind("Mantengo el parser alert(1) al dia", "Mantengo el parser")).toBe(null)
  })
})

describe("el camino completo, de tailor a la tarjeta", () => {
  /**
   * ESTOS TESTS LEÍAN EL CÓDIGO. Buscaban cadenas como
   * `toContain("const kind = hardCodedFactKind(text, groundingSource)")` — una
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
    terms: [], bullets: [], overOptimised: false, recoverable: 0, credibility: { score: 100, band: null },
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
  /**
   * El descarte ya no vive en el módulo: desde F0 lo aplica el motor, y el
   * ejecutor sólo DECLARA que quiere esa regla. Se comprueba donde ahora ocurre.
   */
  it("placeholder y marca se siguen cayendo sin preguntar", () => {
    expect(read("lib/ats/write-gate.ts"))
      .toMatch(/kind === "placeholder" \|\| kind === "brand"/)
    expect(read("lib/services/ai/modules/AITailorModule.ts"), "el ejecutor dejó de pedir la regla")
      .toContain("nothing_burned")
  })

  it("y el aviso existe en los dos idiomas", () => {
    for (const loc of ["es", "en"]) {
      const m = JSON.parse(read(`messages/${loc}.json`)).editor.ats
      expect(m.reason_confirm_figure_hint, loc).toBeTruthy()
    }
  })
})

/**
 * EL AGUJERO DEL CHIP, CERRADO Y MEDIDO (2026-08-25).
 *
 * ── LO QUE SE MIDIÓ ────────────────────────────────────────────────────────
 *
 * Con la lista cerrada de nueve unidades, una reescritura con «clarifying 10 to
 * 15 edge cases per sprint» salía del motor con `needsFigureConfirm: FALSE`: el
 * número que eligió el modelo entraba al CV sin que nadie se lo confirmara al
 * candidato. Es lo contrario de la regla de la casa — «un rango que el usuario
 * ajusta es suyo; un número que decidió el modelo, no».
 *
 * La vara ya no es qué unidad lleva, sino si el número CUANTIFICA: lo sigue una
 * palabra. Y la pregunta tiene un solo dueño, `unsourcedFigures`, que además
 * compara por dígitos — «1.400» y «1,400» son la misma cifra en dos locales.
 */
describe("cualquier rango sin respaldo se manda a confirmar", () => {
  const CV = "Implemented iOS Security practices across Swift and SwiftUI feature work by clarifying edge cases during sprint planning."

  it("un rango con una unidad que ninguna lista previó", () => {
    const v = runWriteGate({
      text: "Implemented iOS Security practices across Swift and SwiftUI, clarifying 10 to 15 edge cases per sprint for secure delivery.",
      original: CV, source: CV, figurePolicy: "confirm", language: "en",
    }, ["figure_policy"])
    expect(v.ok && v.needsFigureConfirm).toBe(true)
  })

  it("y la misma cifra escrita en otro locale no se acusa dos veces", () => {
    const fuente = "Procesé 1.400 transacciones por turno"
    const v = runWriteGate({
      text: "Procesé 1,400 transacciones por turno con cuadre diario",
      original: fuente, source: fuente, figurePolicy: "confirm", language: "es",
    }, ["figure_policy"])
    expect(v.ok && v.needsFigureConfirm).toBe(false)
  })

  it("donde la política es descartar, un número inventado no pasa", () => {
    const v = runWriteGate({
      text: "Atendí entre 50 y 100 clientes por día en ventanilla",
      original: "Atendí clientes en ventanilla", source: "Atendí clientes en ventanilla",
      figurePolicy: "drop", language: "es",
    }, ["figure_policy"])
    expect(v.ok).toBe(false)
  })
})
