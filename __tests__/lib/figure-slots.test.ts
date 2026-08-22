import { describe, it, expect } from "vitest"
import { unsourcedFigures, withFigureSlots, slotsFilled, FIGURE_SLOT } from "@/lib/ats/figure-slots"

/**
 * Una cifra sin respaldo se PREGUNTA, no se tira.
 *
 * Antes: si el modelo proponía "Reduje la mora un 30%" y ese 30% no estaba en el
 * CV, la sugerencia entera se descartaba en silencio. La reescritura solía ser
 * mejor que la línea original en todo lo demás, y el usuario perdía la mejora
 * completa por un número que él sí conoce.
 *
 * Decisión del CEO (2026-08-19): mostrarla, marcar dónde va la cifra y pedirle el
 * dato. La herramienta sabe DÓNDE una métrica pega — que es lo que el usuario no
 * sabe — y él sabe CUÁL es.
 *
 * Lo que no cambia: al CV nunca entra un número que el usuario no escribió.
 */
const CV = "Gestioné la cartera vencida del banco y negocié acuerdos de pago. Coordiné un equipo de 3 analistas desde 2019."

describe("qué cifras no respalda el CV", () => {
  it("marca la que el modelo agregó", () => {
    expect(unsourcedFigures("Reduje la mora un 30% gestionando la cartera vencida", CV)).toEqual(["30%"])
  })

  it("NO marca la que el candidato sí declaró", () => {
    expect(unsourcedFigures("Coordiné un equipo de 3 analistas", CV)).toEqual([])
  })

  /** "1.400" y "1,400" son la misma cifra en dos locales, no un invento. */
  it("no confunde el separador decimal con otro número", () => {
    expect(unsourcedFigures("Gestioné 1.400 cuentas", "Gestioné 1,400 cuentas")).toEqual([])
  })

  /** Un año es contexto temporal, no una métrica de impacto. */
  it("ignora los años", () => {
    expect(unsourcedFigures("Desde 2019 lidero el equipo", CV)).toEqual([])
    expect(unsourcedFigures("En 2024 asumí la jefatura", CV)).toEqual([])
  })

  it("junta varias sin repetir", () => {
    const out = unsourcedFigures("Subí ventas 20% y reduje costos 20% sobre 15 cuentas", CV)
    expect(out).toContain("20%")
    expect(out.filter((f) => f === "20%")).toHaveLength(1)
    expect(out).toContain("15")
  })
})

describe("el hueco que se pinta en pantalla", () => {
  it("reemplaza la cifra sin respaldo y conserva el resto del texto", () => {
    const { text, slots } = withFigureSlots("Reduje la mora un 30% gestionando la cartera vencida", CV)
    expect(slots).toEqual(["30%"])
    expect(text).toContain(FIGURE_SLOT)
    expect(text).not.toContain("30%")
    // La mejora sobrevive: es justo lo que antes se perdía entero.
    expect(text).toContain("gestionando la cartera vencida")
  })

  it("deja intacta una reescritura que no inventa ninguna cifra", () => {
    const original = "Negocié acuerdos de pago con clientes en mora temprana"
    const { text, slots } = withFigureSlots(original, CV)
    expect(slots).toEqual([])
    expect(text).toBe(original)
  })

  /** La condición para habilitar el botón: sin huecos no se aplica. */
  it("sabe cuándo todavía falta el dato", () => {
    expect(slotsFilled(`Reduje la mora un ${FIGURE_SLOT}`)).toBe(false)
    expect(slotsFilled("Reduje la mora un 18%")).toBe(true)
  })

  /**
   * LO QUE NUNCA PUEDE PASAR: que el hueco llegue al CV. El marcador existe sólo
   * para la pantalla — es la regla que impide un "[X%]" impreso delante de un
   * reclutador.
   */
  it("el marcador no es un corchete: nunca se confunde con texto final", () => {
    expect(FIGURE_SLOT).not.toContain("[")
    expect(FIGURE_SLOT).not.toContain("]")
  })
})
