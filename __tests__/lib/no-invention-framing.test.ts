import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * LA IA NO INVENTA. LO PROHIBIDO ES EL DATO QUEMADO.
 *
 * ── LA REGLA, EN PALABRAS DEL CEO (2026-08-21, tercera vez) ────────────────
 *
 *   «Lo que para mí es un invento es cuando creás información QUEMADA. Lo que la
 *    IA genera no son inventadas: son mejoras que te da según la información que
 *    tiene. Quitá eso de todo el proyecto.»
 *
 * Diez prompts arrancaban con «REGLAS CRÍTICAS ANTI-ALUCINACIÓN» y repetían
 * «NUNCA inventes una cifra». Ese encuadre se aplicó de más durante meses:
 * bastaba que una salida sonara a logro para tratarla como invención, y el
 * producto devolvía viñetas peladas — «Realicé arqueo.» a un cajero.
 *
 * La línea no pasa por quién escribe la frase, sino por DE DÓNDE SALE EL DATO:
 * una cifra de un ejemplo está quemada; el resultado que el candidato contó,
 * escrito con el verbo que le corresponde, es el producto.
 *
 * ── LA EXCEPCIÓN, Y ES DELIBERADA ──────────────────────────────────────────
 *
 * Los módulos de EXTRACCIÓN sí deben decirlo. `AIImportModule` lee un PDF y
 * transcribe: si el documento no trae el teléfono, no hay que fabricar uno. Ahí
 * «no inventes» es literal y correcto, porque no está redactando nada.
 */
const PROSA = [
  "AIBulletModule",
  "AITailorModule",
  "AIReviewModule",
  "AISummaryModule",
  "AICoverLetterModule",
  "AISkillBulletModule",
]

const VIEJO = [
  "ANTI-HALLUCINATION",
  "ANTI-ALUCINACIÓN",
  "NUNCA inventes",
  "NEVER invent",
  "sin inventar",
  "without inventing",
]

/**
 * Se lee el código SIN comentarios: varios explican el arreglo citando la regla
 * vieja, y contarlos sería contar la propia documentación del cambio.
 */
const read = (m: string) =>
  readFileSync(join(process.cwd(), `lib/services/ai/modules/${m}.ts`), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "")

describe("ningún prompt que redacta el CV usa el marco de la invención", () => {
  for (const m of PROSA) {
    it(m, () => {
      const src = read(m)
      for (const v of VIEJO) {
        expect(src, `${m} todavía dice "${v}"`).not.toContain(v)
      }
    })
  }
})

describe("y todos leen la doctrina compartida", () => {
  for (const m of PROSA) {
    it(m, () => {
      expect(read(m), `${m} no cita la doctrina`).toContain("noHardCodedFactsRule")
    })
  }
})

describe("la extracción SÍ lo conserva, y es correcto", () => {
  /**
   * Transcribir un PDF no es redactar. Si el documento no trae el dato, no hay
   * nada que derivar — inventarlo ahí sí sería fabricar información del usuario.
   */
  it("AIImportModule sigue prohibiendo completar lo que el documento no trae", () => {
    expect(read("AIImportModule")).toContain("NEVER invent")
  })
})
