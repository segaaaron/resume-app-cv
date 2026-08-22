import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"

/**
 * NINGUNA PLANTILLA DE CARTA ESCRIBE EN UN IDIOMA FIJO.
 *
 * ── EL DEFECTO (reportado con captura, 2026-08-22) ─────────────────────────
 *
 *   «Si bien tenemos esta plantilla, dice "Asunto" y estamos en inglés.»
 *
 * Once de las 53 plantillas tenían la palabra QUEMADA en el JSX. Y lo peor: la
 * clave ya existía en los dos idiomas (`cover_letter_editor.subject_label` =
 * "Asunto" / "Subject") y esas plantillas nunca la consultaron — el mismo
 * archivo pedía `salutation_generic` por `t()` dos líneas más abajo, así que la
 * carta saludaba en inglés y etiquetaba en español.
 *
 * Este guard LEE EL CÓDIGO a propósito: el defecto es una omisión, y una
 * plantilla nueva que vuelva a quemar la palabra no cambia ningún
 * comportamiento observable hasta que un usuario la elige.
 */
const DIR = "components/cover-letter/templates"

/** Palabras de una carta que NUNCA pueden ir quemadas: existen en ambos idiomas. */
const HARDCODED = [
  /\bAsunto\b/,
  /\bEstimado\b/,
  /\bAtentamente\b/,
  /\bCordialmente\b/,
  /\bSaludos cordiales\b/,
]

describe("las plantillas de carta no queman etiquetas en español", () => {
  const files = readdirSync(DIR).filter((f) => f.endsWith(".tsx"))

  it("hay plantillas que revisar (si esto falla, el guard dejó de mirar)", () => {
    expect(files.length).toBeGreaterThan(40)
  })

  for (const f of files) {
    it(`${f} no lleva una etiqueta quemada`, () => {
      const src = readFileSync(`${DIR}/${f}`, "utf8")
      for (const re of HARDCODED) expect(src).not.toMatch(re)
    })
  }
})
