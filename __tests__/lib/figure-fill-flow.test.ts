// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { withFigureSlots, slotsFilled, FIGURE_SLOT } from "@/lib/ats/figure-slots"

/**
 * LA CIFRA LA ESCRIBE EL CANDIDATO, ANTES DE APLICAR.
 *
 * ── EL DEFECTO (reportado con captura, 2026-08-25) ─────────────────────────
 *
 * El aviso «confirmá la cifra» era un cartel amarillo y nada más: el botón
 * aplicaba igual, con el número que eligió el modelo. Un dato sobre el candidato
 * que él nunca confirmó, escrito en su CV.
 *
 * Estos casos cubren el contrato que la pantalla de confirmación consume: qué
 * se pinta con hueco, cuándo se puede aplicar, y que al CV nunca entre un `___`.
 */
describe("el contrato del hueco de la cifra", () => {
  const ACTUAL = "Implemented iOS Security practices across Swift and SwiftUI feature work."
  const PROPUESTA = "Implemented iOS Security practices across Swift and SwiftUI, clarifying 12 edge cases per sprint."

  it("la cifra que el CV no respalda se pinta como hueco, y el resto queda igual", () => {
    const { text, slots } = withFigureSlots(PROPUESTA, ACTUAL)
    expect(slots).toEqual(["12"])
    expect(text).toContain(FIGURE_SLOT)
    // El sustantivo NO se come: el hueco reemplaza el número, no lo que mide.
    expect(text).toContain("edge cases per sprint")
  })

  it("mientras quede un hueco, no se puede aplicar", () => {
    const { text } = withFigureSlots(PROPUESTA, ACTUAL)
    expect(slotsFilled(text)).toBe(false)
  })

  it("con el número escrito por el candidato, sí", () => {
    const { text } = withFigureSlots(PROPUESTA, ACTUAL)
    expect(slotsFilled(text.replace(FIGURE_SLOT, "40"))).toBe(true)
  })

  it("una propuesta que no inventa ninguna cifra no pide nada", () => {
    const sinCifra = "Implemented iOS Security practices across Swift and SwiftUI, clarifying edge cases each sprint."
    const { text, slots } = withFigureSlots(sinCifra, ACTUAL)
    expect(slots).toEqual([])
    expect(slotsFilled(text)).toBe(true)
  })

  /** La cifra que el candidato YA declaró no es un hueco: es su dato. */
  it("no pide confirmar lo que el CV ya dice", () => {
    const conDato = "Reduced crash reports by 10% across releases"
    const { slots } = withFigureSlots(conDato, "Cut crash reports by 10% last year")
    expect(slots).toEqual([])
  })
})

/**
 * LO ESCRITO PERTENECE AL TEXTO SOBRE EL QUE SE ESCRIBIÓ.
 *
 * ── EL DEFECTO (pase de QA, 2026-08-25) ────────────────────────────────────
 *
 * La pantalla de confirmación muestra la reescritura recomendada Y sus
 * alternativas, y cambiar de ángulo no desmonta el componente. Si lo tipeado
 * sobreviviera al cambio, alguien elegía la alternativa B y se le escribía la A
 * con su número — y sin el hueco a la vista para notarlo, porque al elegir una
 * alternativa la pregunta de la cifra se retira.
 *
 * La regla es derivada, no un efecto que limpia: el texto editado guarda SOBRE
 * QUÉ propuesta se escribió, y sólo vale para ésa.
 */
describe("un número escrito no se muda a otra propuesta", () => {
  const mostrado = (edit: { base: string; text: string } | null, propuesta: string, conHueco: string) =>
    edit?.base === propuesta ? edit.text : conHueco

  it("mientras la propuesta es la misma, se ve lo que el candidato escribió", () => {
    const A = "Clarifying 12 edge cases per sprint"
    expect(mostrado({ base: A, text: "Clarifying 40 edge cases per sprint" }, A, "Clarifying ___ edge cases per sprint"))
      .toBe("Clarifying 40 edge cases per sprint")
  })

  it("al cambiar de ángulo, lo tipeado deja de aplicarse", () => {
    const A = "Clarifying 12 edge cases per sprint"
    const B = "Reviewed release blockers with the team each sprint"
    expect(mostrado({ base: A, text: "Clarifying 40 edge cases per sprint" }, B, B)).toBe(B)
  })
})
