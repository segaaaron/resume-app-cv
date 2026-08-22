import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { TRIVIAL_EDIT_SIMILARITY, COSMETIC_REWORD_SIMILARITY, isCosmeticReword, isTrivialEdit } from "@/lib/services/ai/shared/text-similarity"
import { buildAtsReport, type BuildReportInput } from "@/lib/ats/build-report"

const emptyWriting = () => ({
  clicheBullets: [], weakVerbBullets: [], duplicateBullets: [], dateInconsistency: null,
  bulletBalance: [], mergeCandidates: [], chronology: null, futureDates: [], yearsClaim: null,
  nearDuplicates: [], bulletRanking: [], incompleteEducation: [], orphanFragments: [],
  metrics: { level: "ok", findings: [] }, degreeInSkills: [], hasLink: true,
}) as never

const reportInput = (over: Partial<BuildReportInput> = {}): BuildReportInput => ({
  score: 72, categories: [], writing: emptyWriting(),
  content: { totalBullets: 0, quantifiedBullets: 0, quantificationPct: 0, weakOpenerBullets: 0, metriclessBullets: [] } as never,
  missingKeywords: [], listedOnlyKeywords: [], matchedKeywords: [],
  missingSoftSkills: [], matchedSoftSkills: [], unmetRequirements: [],
  templateSafety: "safe", recruiterFixes: [],
  ...over,
})

/**
 * En el ATS no hay nada quemado: se muestra lo que la IA responde.
 *
 * Las habilidades blandas de `missingSoftSkills` —una lista determinista de
 * palabras— se sumaban a la tarjeta con `suggestion: ""`, y la pantalla les ponía
 * encima un texto fijo: "Demostrar en un bullet". Eso no lo escribió ningún
 * modelo. Le decía al usuario QUÉ le falta sin decirle CÓMO, que es exactamente
 * lo que vino a buscar, y encima con cara de consejo.
 *
 * Regla del CEO (2026-08-19): si no hay consejo real, no hay tarjeta. La palabra
 * que falta ya vive en la sección de keywords.
 */
const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8")
const PANEL = "components/editor/ATSScorePanel.tsx"
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "")

describe("nada quemado disfrazado de consejo", () => {
  /**
   * La regla se mudó y se volvió estructural.
   *
   * Las blandas ya no son una lista aparte con un consejo pegado: son TÉRMINOS de
   * la sección «blandas» del informe, con su conteo en la vacante y en el CV. No
   * hay un texto fijo que rellenar, porque no hay hueco donde ponerlo — el consejo
   * aparece cuando tailor escribe la línea, no antes.
   */
  /**
   * ANTES ESTE TEST BUSCABA LA LÍNEA LITERAL en `build-report.ts`, con su
   * `.map((t) => termOf(t, true, "soft"))` y todo. Verde con la sección de
   * blandas vacía; rojo por renombrar una variable. Ahora se ejecuta el informe
   * y se lee qué términos salen.
   */
  it("las blandas salen del informe como términos, con su conteo a los dos lados", () => {
    const r = buildAtsReport(reportInput({
      matchedSoftSkills: ["Trabajo en equipo"],
      missingSoftSkills: ["Negociación"],
      jobDescription: "Buscamos trabajo en equipo y negociación.",
    }))
    const soft = r.terms.filter((t) => t.section === "soft")
    expect(soft.map((t) => t.term).sort()).toEqual(["Negociación", "Trabajo en equipo"])
    // La demostrada la dice el CV; la que falta, no. Ése es el dato, y es
    // verificable leyendo — no un texto fijo pegado a una lista.
    expect(soft.find((t) => t.term === "Trabajo en equipo")?.cv).toBeGreaterThan(0)
    expect(soft.find((t) => t.term === "Negociación")?.cv).toBe(0)
  })

  /** Y ningún término trae un consejo fabricado colgando. */
  it("ningún término llega con texto de relleno", () => {
    const r = buildAtsReport(reportInput({ missingSoftSkills: ["Negociación"] }))
    for (const t of r.terms) {
      expect(Object.keys(t)).toEqual(expect.not.arrayContaining(["suggestion", "advice", "hint"]))
    }
  })

  it("ya no se fabrica una lista de blandas sin consejo", () => {
    expect(code(PANEL)).not.toMatch(/\.map\(\(skill\) => \(\{ skill, suggestion: "" \}\)\)/)
  })

  /** El texto fijo no puede volver a usarse COMO consejo (sí como etiqueta de botón). */
  it("el texto fijo no se usa de reemplazo de la respuesta de la IA", () => {
    expect(code(PANEL)).not.toContain('?? t("soft_skill_demonstrate")')
  })
})

/**
 * La vara del 90%, que es una sola.
 *
 * "Si tiene un 90% de similitud para arriba, descartado como mejora" — CEO. Ese
 * descarte lo hace `isTrivialEdit`. El otro número, más bajo, NO descarta por
 * parecido: sólo habilita la pregunta de si se cambiaron palabras por sinónimos
 * sin agregar nada, y tiene tres salidas que protegen la mejora real.
 */
describe("la vara de similitud", () => {
  it("descarta como mejora a partir del 90%", () => {
    expect(TRIVIAL_EDIT_SIMILARITY).toBe(0.9)
    expect(isTrivialEdit("Gestioné la cartera vencida del banco", "Gestioné la cartera vencida del banco.")).toBe(true)
  })

  it("el otro número no descarta por parecido: es un piso de análisis", () => {
    expect(COSMETIC_REWORD_SIMILARITY).toBeLessThan(TRIVIAL_EDIT_SIMILARITY)
  })

  /** Enriquecer con vocabulario del oficio NO es cosmético: agrega sin quitar. */
  it("no bloquea una mejora que suma vocabulario del oficio", () => {
    expect(isCosmeticReword(
      "Realicé arqueo de caja",
      "Realicé arqueo de caja cuadrando efectivo, comprobantes y diferencias bajo control interno",
    )).toBe(false)
  })

  /**
   * Pero un cambio de sinónimos sobre una frase CASI IDÉNTICA sigue sin ser una
   * mejora. Medido: el guard es más angosto de lo que parece — sólo alcanza a
   * casi-copias, así que dos frases que difieren de verdad nunca se descartan.
   */
  it("sigue descartando el cambio de sinónimos sobre una casi-copia", () => {
    const current = "Implemented TCA architecture and design patterns to improve code modularity and maintainability, while leading code reviews that helped reduce technical debt."
    const suggested = "• Implemented TCA architecture and design patterns to strengthen code modularity and maintainability, while leading code reviews that reduced technical debt."
    expect(isCosmeticReword(current, suggested)).toBe(true)
  })

  /** Dos frases que difieren de verdad NUNCA llegan a evaluarse como cosméticas. */
  it("una reescritura con otras palabras ni siquiera se analiza", () => {
    expect(isCosmeticReword(
      "Ayudé a reducir los tiempos de espera del equipo comercial",
      "Contribuí a disminuir los tiempos de espera del equipo comercial",
    )).toBe(false)
  })
})
