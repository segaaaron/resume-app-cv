import { describe, it, expect } from "vitest"
import { assessDescription, assessResumeContent, opensNominally, opensWeakly } from "@/lib/services/ai/shared/bullet-quality"

describe("assessDescription", () => {
  it("returns an empty assessment for an empty description", () => {
    const r = assessDescription("")
    expect(r.bullets).toEqual([])
    expect(r.quantificationRatio).toBe(0)   // not NaN
    expect(r.missingMetricIndices).toEqual([])
  })

  it("indexes bullets by their real position", () => {
    const r = assessDescription("• Alpha\n• Beta\n• Gamma")
    expect(r.bullets.map((b) => b.index)).toEqual([0, 1, 2])
  })

  it("finds the figures a bullet states", () => {
    const r = assessDescription([
      "• Cut crash rate 20% by refactoring the sync layer",
      "• Rebuilt the billing service on a modular architecture",
      "• Mentored 5 engineers through the migration",
    ].join("\n"))
    expect(r.bullets.map((b) => b.hasMetric)).toEqual([true, false, true])
    expect(r.quantificationRatio).toBeCloseTo(2 / 3)
    expect(r.missingMetricIndices).toEqual([1])
  })

  it("reports a fully quantified description", () => {
    const r = assessDescription("• Cut costs 30%\n• Grew revenue 2x")
    expect(r.quantificationRatio).toBe(1)
    expect(r.missingMetricIndices).toEqual([])
  })

  it("reports a description with no figures at all", () => {
    const r = assessDescription("• Built the app\n• Fixed the bugs")
    expect(r.quantificationRatio).toBe(0)
    expect(r.missingMetricIndices).toEqual([0, 1])
  })

  it("does not count a bracket placeholder as a figure", () => {
    // These were banned everywhere; if one survives from an old CV it must not
    // certify the bullet as quantified.
    const r = assessDescription("• Improved engagement among [N users]")
    expect(r.bullets[0].hasMetric).toBe(false)
  })

  it("spots duty openers in both languages", () => {
    const r = assessDescription([
      "• Responsible for the payment module",
      "• Cut crash rate 20% by refactoring",
      "• Encargado de las pruebas del equipo",
    ].join("\n"))
    expect(r.weakOpenerIndices).toEqual([0, 2])
  })

  it("does not flag a duty word that appears mid-sentence", () => {
    const r = assessDescription("• Owned the release process and helped with onboarding")
    expect(r.weakOpenerIndices).toEqual([])
  })

  it("reads bullets whatever marker they carry", () => {
    const r = assessDescription("- Cut costs 30%\n* Grew revenue 2x\nShipped 3 releases")
    expect(r.bullets).toHaveLength(3)
    expect(r.quantificationRatio).toBe(1)
  })

  it("counts a metric the hallucination check ignores", () => {
    // "5 engineers" is a real figure but is NOT in METRIC_REGEX, which stays
    // narrow on purpose. This is what ANY_METRIC_REGEX exists for.
    expect(assessDescription("• Mentored 5 engineers").bullets[0].hasMetric).toBe(true)
    expect(assessDescription("• Shipped 3 releases").bullets[0].hasMetric).toBe(true)
    expect(assessDescription("• Worked across 4 countries").bullets[0].hasMetric).toBe(true)
  })
})

describe("assessResumeContent", () => {
  it("aggregates quantification + weak openers across all work experience", () => {
    const sectionData = {
      workExperience: [
        { description: "• Increased sales 32%\n• Responsible for the team" },
        { description: "• Led 5 engineers" },
      ],
    }
    const r = assessResumeContent(sectionData)
    expect(r.totalBullets).toBe(3)
    expect(r.quantifiedBullets).toBe(2)          // "32%" and "5 engineers"
    expect(r.quantificationPct).toBe(67)          // 2/3
    expect(r.weakOpenerBullets).toBe(1)           // "Responsible for the team"
    // The weak bullet is surfaced LOCATED (text + job + index) so the UI can
    // offer an inline honest rewrite. No id/jobTitle in this fixture → "".
    expect(r.metriclessBullets).toEqual([
      { text: "Responsible for the team", targetId: "", jobTitle: "", index: 1, weakOpener: true },
    ])
  })

  it("is NaN-free and zeroed when there is no work experience", () => {
    const r = assessResumeContent({})
    expect(r).toEqual({ totalBullets: 0, quantifiedBullets: 0, quantificationPct: 0, weakOpenerBullets: 0, metriclessBullets: [] })
  })

  it("does not throw on a malformed (non-array) workExperience", () => {
    // sectionData is client-controlled — a non-array must degrade, not 500.
    expect(() => assessResumeContent({ workExperience: "oops" as unknown })).not.toThrow()
    expect(assessResumeContent({ workExperience: 42 as unknown }).totalBullets).toBe(0)
  })
})

/**
 * LA APERTURA NOMINAL — la regla que se derivó, con sus casos permanentes.
 *
 * ── EL AGUJERO (reportado con captura, CEO 2026-08-27) ──────────────────────
 *
 * El CV de producción llevaba «Active use of AI-assisted development tools…» y
 * nadie la arreglaba nunca: `weakVerbBullets` salía vacío e `isImprovableLine`
 * decía NO. Sin defecto no hay tarjeta, sin tarjeta el ejecutor no recibe la
 * línea, y si el reclutador la señalaba el árbitro la descartaba como «no tiene
 * defecto».
 *
 * `WEAK_OPENERS` ENUMERA frases y la lista siguiente siempre llega tarde
 * —«Ongoing maintenance of», «A point of view on»… son infinitas—, así que la
 * regla se DERIVA de la gramática: la línea no arranca con el verbo del trabajo
 * y el sintagma que la encabeza queda anclado por su determinante o preposición.
 *
 * ── POR QUÉ ESTOS CASOS Y NO OTROS ──────────────────────────────────────────
 *
 * Son los que la medición usó para elegir la vara, y quedan fijos para que nadie
 * la afloje sin volver a pasarlos. Dos cosas que costaron caro:
 *
 *   · NO SE ADIVINA EL IDIOMA. La primera versión lo deducía con `/[áéíóúñ]/`, y
 *     medio currículum latinoamericano se escribe sin tildes: una línea española
 *     caía por la rama inglesa, donde «de» no es preposición. Peor, mi propia
 *     sonda lo tapó pasando el idioma a mano cuando el código real nunca lo pasa.
 *   · LA VENTANA DE LA PREPOSICIÓN ES DE DOS PALABRAS, y ese número salió de la
 *     medición: con tres, «Reduje el tiempo DE cierre contable» caía como
 *     nominal, porque un pretérito irregular no lleva tilde.
 */
describe("una línea que abre con un sintagma nominal, no con el trabajo", () => {
  const NOMINALES = [
    "Active use of AI-assisted development tools to accelerate Swift refactoring",
    "A point of view on using AI-assisted development tools to speed up Swift",
    "Responsibility for the migration of the payment module to a new provider",
    "Ongoing maintenance of the internal documentation used by the mobile team",
    "Responsabilidad de la atencion al cliente en el mostrador principal",
    "Uso constante de sistemas de facturacion para el cierre del turno",
  ]
  const SANAS = [
    "Integrated advanced debugging tools to optimize app responsiveness",
    "Resolved critical bugs to improve app stability and user experience",
    "Led a team of eight through the migration to a new payment provider",
    "Built the internal tooling used by the mobile team every sprint",
    "Wrote the onboarding guide for new engineers joining the team",
    "Coordiné la compra de insumos de oficina con tres proveedores",
    "Gestioné la agenda médica de los profesionales del consultorio",
    "Reduje el tiempo de cierre contable de cinco días a dos",
    "Capacité a dos compañeros nuevos en el sistema interno",
  ]

  it("las detecta SIN que nadie le diga el idioma — así la llama el código real", () => {
    for (const l of NOMINALES) expect(opensNominally(l), l).toBe(true)
  })

  it("y no toca una línea que abre con el trabajo, en ninguno de los dos idiomas", () => {
    for (const l of SANAS) expect(opensNominally(l), l).toBe(false)
  })

  it("«Reduje el tiempo DE cierre contable» NO es nominal: el pretérito irregular no lleva tilde", () => {
    // El caso que fijó la ventana en dos palabras. Con tres, caía.
    expect(opensNominally("Reduje el tiempo de cierre contable de cinco días a dos")).toBe(false)
  })

  it("y `opensWeakly` junta las dos formas de abrir mal: la lista y la derivada", () => {
    expect(opensWeakly("Responsible for the migration of the payment module")).toBe(true)
    expect(opensWeakly("Active use of AI-assisted development tools to accelerate work")).toBe(true)
    expect(opensWeakly("Resolved critical bugs to improve app stability")).toBe(false)
  })
})
