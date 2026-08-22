import { describe, it, expect } from "vitest"
import { hasRepeatedContent, fixesRepetition } from "@/lib/ats/repeated-content"

/**
 * "Lo aplico, lo guarda, y en cada vuelta del ATS me lo muestra otra vez."
 *
 * Reportado con capturas. El resumen del candidato estaba DUPLICADO, el panel lo
 * detectaba bien, y el texto que ofrecía para arreglarlo venía TAMBIÉN duplicado.
 * El usuario lo aplicaba, guardaba, corría el ATS de nuevo y el mismo defecto
 * seguía ahí — porque nunca se había ido. Un botón que devuelve el problema gasta
 * el clic, el uso y la paciencia.
 *
 * Nadie comprobaba lo evidente: que el arreglo arregle.
 */
const DUP =
  "He trabajado en ventas, asesoría comercial y marketing digital con foco en generación de leads y seguimiento de oportunidades. " +
  "Competente en prospección, gestión de cartera y cierre de ventas con técnicas de upselling. " +
  "He trabajado en ventas, asesoría comercial y marketing digital con foco en generación de leads y seguimiento de oportunidades. " +
  "Competente en prospección, gestión de cartera y cierre de ventas con técnicas de upselling."

const CLEAN =
  "Ingeniero Comercial con experiencia en prospección activa, gestión de cartera de clientes y cierre de ventas. " +
  "He trabajado en marketing digital con foco en generación de leads y seguimiento de oportunidades comerciales."

describe("un texto que se dice dos veces", () => {
  it("caza el resumen duplicado del caso reportado", () => {
    expect(hasRepeatedContent(DUP)).toBe(true)
  })

  it("no marca un texto que sólo comparte vocabulario", () => {
    expect(hasRepeatedContent(CLEAN)).toBe(false)
  })

  /** El modelo repite con una coma distinta: comparar literal deja pasar el caso. */
  it("reconoce la repetición aunque cambie la puntuación", () => {
    const a = "Gestioné la cartera vencida del banco y negocié acuerdos de pago con clientes."
    expect(hasRepeatedContent(`${a} ${a.replace(/,/g, "").replace(".", "")}`)).toBe(true)
  })

  /**
   * EL CASO QUE EXIGE COMPARAR POR PALABRAS Y NO POR CONJUNTO EXACTO: el modelo
   * repite la frase con una palabra de más. Una comparación estricta la deja
   * pasar, y es justo la forma en que la repetición llega en la práctica.
   */
  it("caza la repetición aunque la segunda vez agregue una palabra", () => {
    const a = "Gestioné la cartera vencida del banco y negocié acuerdos de pago con clientes morosos"
    const b = "Gestioné la cartera vencida del banco corporativo y negocié acuerdos de pago con clientes morosos"
    expect(hasRepeatedContent(`${a}. ${b}.`)).toBe(true)
  })

  it("no se confunde con un texto corto", () => {
    expect(hasRepeatedContent("Cajera con experiencia en atención.")).toBe(false)
    expect(hasRepeatedContent("")).toBe(false)
  })
})

describe("que el arreglo arregle", () => {
  it("rechaza el arreglo que sigue duplicado — el bucle reportado", () => {
    expect(fixesRepetition(DUP, DUP)).toBe(false)
  })

  it("acepta el que sí lo resuelve", () => {
    expect(fixesRepetition(DUP, CLEAN)).toBe(true)
  })

  /** Si el original no repetía, esta comprobación no opina: no es su trabajo. */
  it("no se mete cuando el defecto era otro", () => {
    expect(fixesRepetition(CLEAN, CLEAN)).toBe(true)
  })
})
