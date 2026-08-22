import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

/**
 * NINGUNA PLANTILLA PUEDE EXPORTAR TEXTO QUE EL ATS NO SEPA LEER.
 *
 * ── EL DEFECTO, Y CÓMO APARECIÓ ────────────────────────────────────────────
 *
 * El CEO preguntó para qué servía el bloque «verificá contra tu PDF real», que
 * marcaba 100 estimado contra 80 medido en su CV. La respuesta estaba en el
 * texto que ese bloque mostraba y no sabía explicar: su cargo salía del PDF como
 *
 *     I N G E N I E R O   C O M E R C I A L
 *
 * Un filtro que lee eso NO encuentra «Ingeniero Comercial». El título del puesto
 * pesa .15 del puntaje — la segunda categoría más cara. Ahí estaban los 20
 * puntos, y la plantilla que lo causaba se llama «ATS Cardinal · ATS-safe serif».
 *
 * ── EL UMBRAL ESTÁ MEDIDO, NO ESTIMADO ─────────────────────────────────────
 *
 * Se generó un PDF con Chrome headless —el mismo motor que usa el microservicio
 * de exportación— con catorce valores de `letterSpacing`, y se extrajo con
 * `pdf-parse`, el mismo extractor del producto:
 *
 *     0.20em  →  "INGENIERO COMERCIAL"          se lee entero
 *     0.215em →  "INGENIERO COMERCIAL"          se lee entero
 *     0.22em  →  "I N G E N I E R O  C O M..."  ROTO
 *     0.30em  →  "I N G E N I E R O  C O M..."  ROTO
 *
 * El corte está entre 0.215 y 0.22. El tope se pone en 0.20 para dejar margen:
 * el espaciado real depende también de la fuente y del cuerpo, y no se midieron
 * todas las combinaciones del catálogo.
 *
 * ── ALCANCE QUE TENÍA ──────────────────────────────────────────────────────
 *
 * 123 valores en 62 de las 132 plantillas — casi medio catálogo exportaba algún
 * texto ilegible para un ATS, en un producto que se vende como ATS-friendly.
 */

/** Medido: rompe desde 0.22em. Con margen para fuentes y cuerpos no probados. */
const MAX_TRACKING_EM = 0.2

const DIR = join(process.cwd(), "components/resume/templates")

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith(".tsx") ? [join(dir, e.name)] : [],
  )
}

describe("el texto de las plantillas sobrevive al PDF", () => {
  const files = walk(DIR)

  it("hay plantillas que revisar", () => {
    expect(files.length).toBeGreaterThan(100)
  })

  /**
   * Un `letterSpacing` por encima del tope hace que el extractor meta un espacio
   * entre cada letra. La palabra deja de existir para el filtro — y da igual que
   * el humano la lea perfecta en pantalla.
   */
  it("ninguna separa las letras más allá de lo que el extractor tolera", () => {
    const offenders: string[] = []
    for (const f of files) {
      const src = readFileSync(f, "utf8")
      for (const m of src.matchAll(/letterSpacing:\s*"(-?[\d.]+)em"/g)) {
        const em = Number(m[1])
        if (em > MAX_TRACKING_EM) offenders.push(`${f.split("/").pop()}: ${m[1]}em`)
      }
    }
    expect(offenders).toEqual([])
  })

  /**
   * Y en `px`, que es la otra forma de escribirlo. A los cuerpos que usan estas
   * plantillas (9–13px), 3px ya supera el 0.2em del tope.
   */
  it("tampoco en píxeles", () => {
    const offenders: string[] = []
    for (const f of files) {
      const src = readFileSync(f, "utf8")
      for (const m of src.matchAll(/letterSpacing:\s*"(-?[\d.]+)px"/g)) {
        if (Number(m[1]) > 2) offenders.push(`${f.split("/").pop()}: ${m[1]}px`)
      }
    }
    expect(offenders).toEqual([])
  })
})
