import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { buildAtsReport, type BuildReportInput } from "@/lib/ats/build-report"
import { allChecks } from "@/lib/ats/report"

/** Entrada mínima del informe: sólo importa lo que cada test cambia. */
const reportInput = (over: Partial<BuildReportInput> = {}): BuildReportInput => ({
  score: 72,
  categories: [],
  writing: {
    clicheBullets: [], weakVerbBullets: [], duplicateBullets: [], dateInconsistency: null,
    bulletBalance: [], mergeCandidates: [], chronology: null, futureDates: [], yearsClaim: null,
    nearDuplicates: [], bulletRanking: [], incompleteEducation: [], orphanFragments: [],
    metrics: { level: "ok", findings: [] }, degreeInSkills: [], hasLink: true,
  } as never,
  content: { totalBullets: 0, quantifiedBullets: 0, quantificationPct: 0, weakOpenerBullets: 0, metriclessBullets: [] } as never,
  missingKeywords: [], listedOnlyKeywords: [], matchedKeywords: [],
  missingSoftSkills: [], matchedSoftSkills: [], unmetRequirements: [],
  templateSafety: "safe", recruiterFixes: [],
  ...over,
})

/**
 * "El ATS muestra lo que falta, tailor lo soluciona. Sin nada que se contradiga
 * ni se repita." — CEO, 2026-08-20.
 *
 * El mismo defecto se contaba en DOS tarjetas: "3 líneas repiten algo que ya
 * dijiste" en Credibilidad y "El mismo logro, escrito dos veces" más abajo; "tus
 * fechas usan más de un formato" en Credibilidad y otra vez en Chequeos de
 * estructura. El usuario leía dos avisos del mismo problema en la misma pantalla
 * y no podía saber si eran uno o dos.
 *
 * La tarjeta que ADEMÁS lo arregla se queda con el hallazgo. Credibilidad reporta
 * lo que no tiene dónde más ir.
 */
const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8")
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "")
const PANEL = "components/editor/ATSScorePanel.tsx"

describe("cada hallazgo, en un solo lugar", () => {
  /**
   * La regla se mudó al ensamblador y se amplió: la credibilidad no aporta NINGÚN
   * hallazgo que ya tenga chequeo propio. De sus diez claves, ocho tienen dueño en
   * otra sección y sólo dos —líneas vacías y saturación de métricas— viajan como
   * chequeo, porque nadie más las dice.
   */
  it("credibilidad no repite lo que ya es un chequeo", () => {
    const build = code("lib/ats/build-report.ts")
    expect(build).toMatch(/OWNED_ELSEWHERE = new Set\(\[/)
    for (const k of ["reverse_order", "future_date", "years_contradiction", "duplicates", "mixed_dates", "degree_as_skill"]) {
      expect(build, `${k} debería tener dueño en otra sección`).toContain(`"${k}"`)
    }
  })

  /** Y las tarjetas dueñas siguen ahí: sacar de un lado no puede perder el dato. */
  /**
   * Las tarjetas dueñas se volvieron secciones del informe. El dato no se perdió:
   * los duplicados son `tips.near_dup.*`, la fusión `tips.merge.*` y las líneas
   * que diluyen `tips.dilutes.*` — cada una con su acción apuntada al puesto y al
   * índice, que es más de lo que la tarjeta decía.
   */
  it.each([
    ["duplicados", "tips.near_dup."],
    ["fusión", "tips.merge."],
    ["líneas que diluyen", "tips.dilutes."],
  ])("el hallazgo dueño de %s existe en el informe", (_n, id) => {
    expect(readFileSync(join(process.cwd(), "lib/ats/build-report.ts"), "utf8")).toContain(id)
  })


  /**
   * El inventario completo de bloques del panel. Si alguien agrega uno, este test
   * lo obliga a decidir a qué lado pertenece —lo que falta, o la solución— en vez
   * de sumarlo en silencio y volver a la pantalla de la que el CEO se quejó.
   */
  /**
   * El inventario baja a medida que el riel toma cada bloque. `ats-gaps` y
   * `ats-skills` ya se fueron: el primero vive como el hallazgo
   * `hard.requirements` —con el techo de la nota adentro— y el segundo como la
   * tabla de términos, que además dice el conteo a los dos lados.
   *
   * Agregar un bloque nuevo acá sigue obligando a decidir de qué lado va, y
   * sacarlo obliga a declarar adónde se fue. Las dos direcciones fallan solas.
   */
  it("el panel ya no tiene ningún bloque propio", () => {
    expect(read(PANEL)).not.toMatch(/id="ats-[a-z]+"/)
  })


  /**
   * ESTE TEST VERIFICABA UN COMENTARIO.
   *
   * Decía `expect(src).toContain("se fue al riel")` — una frase en prosa dentro
   * del código fuente. Pasaba en verde con los bloques rotos, borrados o
   * duplicados, y bastaba con reformular el comentario para ponerlo en rojo sin
   * haber tocado una línea de lógica. Un test así no protege nada: da una
   * confianza que no existe, y es parte de por qué los defectos de este panel
   * llegan a la pantalla del CEO con la suite entera en verde.
   *
   * Reemplazado por lo que de verdad importaba comprobar: que el hallazgo al que
   * migró el bloque de requisitos EXISTA y siga siendo del informe. Se ejecuta.
   */
  it("los requisitos viven como hallazgo del informe, no como bloque del panel", () => {
    const r = buildAtsReport(reportInput({ unmetRequirements: ["Manejo avanzado de Salesforce"] }))
    const check = allChecks(r).find((c) => c.id === "hard.requirements")
    expect(check).toBeDefined()
    expect(check?.state).toBe("crit")
    expect(check?.evidence).toContain("Manejo avanzado de Salesforce")
  })

  it("y sin requisitos incumplidos no se inventa el hallazgo", () => {
    const r = buildAtsReport(reportInput({ unmetRequirements: [] }))
    expect(allChecks(r).map((c) => c.id)).not.toContain("hard.requirements")
  })
})
