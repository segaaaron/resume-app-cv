import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import {
  LETTER_BODY_PT, LETTER_BODY_LH, LETTER_PARAGRAPH_GAP,
} from "@/components/cover-letter/templates/_metrics"

/**
 * Una carta de presentación entra en UNA página. Medido, no supuesto.
 *
 * Se midió en navegador la altura real de las 55 plantillas con cartas de largo
 * creciente. Antes de este contrato, con 301 palabras —la mitad del rango que el
 * prompt le ORDENA escribir a la IA— 27 de 55 producían un PDF de dos páginas, y
 * cuatro (`verso`, `meridian`, `lumen`, `codex`) no sostenían ni 200 palabras.
 * Con 377 palabras fallaban 40 de 55. Después: 0 de 55.
 *
 * La causa no era la IA escribiendo de más. Era que cada plantilla decidía por su
 * cuenta el tamaño y el interlineado del cuerpo — y seis ni siquiera decidían:
 * lo HEREDABAN del documento, quedando en 12pt con interlineado 1.75 sin que
 * nadie lo eligiera.
 *
 * Este test no mide páginas: en Node no hay motor de maquetado. Protege las
 * DECISIONES de las que salió el número, que es lo que se puede romper sin darse
 * cuenta desde acá.
 */
const DIR = "components/cover-letter/templates"
const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8")
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "")

/**
 * Las 12 que no pasan por `LetterBody`. Definen su tipografía con clases de
 * Tailwind y TODAS sostenían 443 palabras o más antes del cambio, así que
 * tocarlas era riesgo visual sin ganancia. `newspaper` además maqueta a dos
 * columnas, que es su diseño y no una omisión.
 */
const TAILWIND_TYPOGRAPHY = new Set([
  "ArchitectTemplate", "DiagonalTemplate", "ExecutiveBoldTemplate", "GradientHorizonTemplate",
  "MaterialCardTemplate", "MinimalLineTemplate", "MonogramTemplate", "NewspaperTemplate",
  "SidebarTemplate", "SplitTemplate", "TimelineTemplate", "TwoToneTemplate",
])

const templates = () =>
  readdirSync(join(process.cwd(), DIR)).filter((f) => f.endsWith(".tsx") && f !== "LetterBody.tsx")

describe("el contrato tipográfico de la carta", () => {
  /**
   * 10pt es el cuerpo mínimo de una carta formal y 1.45 el interlineado mínimo
   * cómodo para texto corrido. Por debajo, la carta entra pero no se lee; por
   * encima de 11pt / 1.6, las plantillas con encabezado grande vuelven a
   * desbordar. Los topes salen de la medición, no del gusto.
   */
  it("mantiene el cuerpo en el rango legible que además entra", () => {
    expect(LETTER_BODY_PT).toBeGreaterThanOrEqual(10)
    expect(LETTER_BODY_PT).toBeLessThanOrEqual(11)
    expect(LETTER_BODY_LH).toBeGreaterThanOrEqual(1.4)
    expect(LETTER_BODY_LH).toBeLessThanOrEqual(1.6)
    expect(LETTER_PARAGRAPH_GAP).toBeLessThanOrEqual(14)
  })

  /**
   * La separación entre párrafos va como clase literal porque Tailwind genera su
   * CSS escaneando el código: una clase compuesta con una constante no existiría
   * en la hoja final. Este test es el que ata la constante a la clase.
   */
  it("la clase de separación coincide con la constante", () => {
    expect(read(`${DIR}/LetterBody.tsx`)).toContain(`[&>p]:mb-[${LETTER_PARAGRAPH_GAP}px]`)
  })

  it("LetterBody impone la tipografía y deja el resto a la plantilla", () => {
    const src = strip(read(`${DIR}/LetterBody.tsx`))
    // El style de la plantilla se aplica DESPUÉS: color y peso son su identidad.
    expect(src).toMatch(/fontSize:[^,]*LETTER_BODY_PT/)
    expect(src).toMatch(/lineHeight: LETTER_BODY_LH,\s*\.\.\.style/)
    expect(src).toContain("DOMPurify.sanitize")
  })
})

describe("ninguna plantilla vuelve a decidir sola el largo del cuerpo", () => {
  it("todas las que no usan Tailwind pasan por LetterBody", () => {
    for (const f of templates()) {
      const name = f.replace(".tsx", "")
      const src = strip(read(`${DIR}/${f}`))
      if (!src.includes("content.body")) continue
      if (TAILWIND_TYPOGRAPHY.has(name)) continue
      // La familia Ltr* usa LBody, que lee las mismas constantes.
      const usesShared = src.includes("<LetterBody") || src.includes("<LBody")
      expect(usesShared, `${name} renderiza el cuerpo a mano`).toBe(true)
    }
  })

  /**
   * El defecto original: un `dangerouslySetInnerHTML` suelto es una plantilla
   * decidiendo por su cuenta — y, en seis casos, no decidiendo nada y heredando
   * 12pt del documento.
   */
  it("nadie escribe el cuerpo con dangerouslySetInnerHTML por su cuenta", () => {
    const offenders = templates().filter((f) => {
      const name = f.replace(".tsx", "")
      if (TAILWIND_TYPOGRAPHY.has(name)) return false
      return strip(read(`${DIR}/${f}`)).includes("dangerouslySetInnerHTML")
    })
    expect(offenders).toEqual([])
  })

  it("la familia Ltr pasa las constantes, no números sueltos", () => {
    for (const f of templates()) {
      const src = strip(read(`${DIR}/${f}`))
      const tag = src.match(/<LBody[^/>]*\/>/)
      if (!tag) continue
      expect(tag[0], f).toContain("fs={LETTER_BODY_PT}")
      expect(tag[0], f).toContain("lh={LETTER_BODY_LH}")
    }
  })
})
