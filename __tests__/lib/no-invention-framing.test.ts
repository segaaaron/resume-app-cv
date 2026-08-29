import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
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
 * «no completes lo que el documento no trae» es literal y correcto ahí, porque
 * no está redactando nada — está transcribiendo.
 */
const PROSA = [
  "AIBulletModule",
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

describe("la extracción conserva la REGLA, no el vocabulario", () => {
  /**
   * Transcribir un PDF no es redactar: si el documento no trae el teléfono, no
   * hay nada que derivar y completarlo sería fabricar información del usuario.
   * Esa regla se queda — lo que se fue es la palabra, que arrastraba el marco a
   * los módulos que SÍ redactan.
   */
  it("AIImportModule sigue prohibiendo completar lo que el documento no trae", () => {
    expect(read("AIImportModule")).toContain("guess or complete missing data")
  })
})

describe("ningún servicio de IA conserva el vocabulario viejo", () => {
  /**
   * El barrido es sobre `lib/services/ai/**` — los servicios y sus modelos.
   * Fuera de ahí no se tocó nada: el resto del proyecto usa esas palabras en
   * contextos que no son prompts (el blog lista «Reinventé» como verbo de acción
   * válido para un CV, y eso es correcto).
   */
  /**
   * ── EL BARRIDO SE DERIVA, NO SE ENUMERA (CEO, 2026-08-25) ────────────────
   *
   *   «Esa palabrita, para servicios y especialmente para las AI, no se debería
   *    usar porque nos generaron problemas en el pasado.»
   *
   * Y este guard listaba DOS carpetas a mano —`modules` y `shared`—, así que
   * `AIService.ts` y `OpenAIClientAdapter.ts`, que viven en la raíz de
   * `lib/services/ai`, nunca se miraron. Una carpeta nueva tampoco se habría
   * mirado. Un guard que enumera su propio alcance protege lo que alguien se
   * acordó de escribir, y el olvido es justamente lo que hay que atrapar.
   *
   * Se recorre el árbol entero. Un archivo nuevo entra al barrido por existir.
   */
  const todosLosTs = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? todosLosTs(join(dir, e.name))
        : e.name.endsWith(".ts") ? [join(dir, e.name)] : [])

  it("el barrido cubre TODO lib/services/ai, no una lista de carpetas", () => {
    const raiz = join(process.cwd(), "lib/services/ai")
    const archivos = todosLosTs(raiz)
    // Si alguien mueve el árbol, el guard no puede quedarse mirando un vacío.
    expect(archivos.length).toBeGreaterThan(10)
    const sucios = archivos
      .filter((f) => /\binvent[a-z]*\b|hallucinat/i.test(readFileSync(f, "utf8")))
      .map((f) => f.slice(raiz.length + 1))
    expect(sucios).toEqual([])
  })
})
