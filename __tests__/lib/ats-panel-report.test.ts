import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { buildPanelReport, type PanelReportInput } from "@/lib/ats/panel-report"
import { allChecks, criticalChecks, isReadyToSend, openChecks } from "@/lib/ats/report"
import type { ATSScoreResult } from "@/lib/services/ai/shared/ai-types"
import { analyzeWriting, type WritingChecks } from "@/lib/ats/writing-checks"

/**
 * EL ADAPTADOR. Único punto donde la respuesta del servidor se vuelve informe.
 *
 * Lo que estos tests fijan no es el mapeo campo a campo —eso lo dice el tipo—
 * sino las tres cosas que costaron sesiones y que un refactor silencioso podría
 * deshacer: los requisitos agrupados, lo aplicado que no vuelve, y que el
 * adaptador no calcule nada por su cuenta.
 */
const writing = (over: Partial<WritingChecks> = {}): WritingChecks => ({
  clicheBullets: [], weakVerbBullets: [], duplicateBullets: [], dateInconsistency: null,
  bulletBalance: [], mergeCandidates: [], chronology: null, futureDates: [], yearsClaim: null,
  nearDuplicates: [], bulletRanking: [], incompleteEducation: [], orphanFragments: [],
  metrics: { level: "ok", findings: [] } as unknown as WritingChecks["metrics"],
  degreeInSkills: [], hasLink: true,
  ...over,
})


const result = (over: Partial<ATSScoreResult> = {}): ATSScoreResult => ({
  score: 72,
  label: "",
  summary: "",
  strengths: [],
  gaps: [],
  matchedKeywords: [],
  missingKeywords: [],
  listedOnlyKeywords: [],
  missingSoftSkills: [],
  demonstratedSoftSkills: [],
  suggestions: [],
  templateSafety: "safe",
  scoreBreakdown: {
    score: 72,
    skipped: [],
    categories: [
      { category: "hardSkills", coveragePct: 60, weight: .45, share: .45, points: 27, recoverable: 18, basis: "chosen" },
      { category: "mustHaves", coveragePct: 50, weight: .20, share: .20, points: 10, recoverable: 10, basis: "chosen" },
    ],
  },
  ...over,
} as ATSScoreResult)

const input = (over: Partial<PanelReportInput> = {}): PanelReportInput => ({
  result: result(),
  writing: writing(),
  sectionData: {},
  jobDescription: "",
  ...over,
})

describe("los requisitos: una lista de alternativas es UN requisito", () => {
  /**
   * MEDIDO: «Ingeniería Comercial, Administración de Empresas, Marketing o
   * afines» contaba como tres incumplidos con el título en el CV, y el techo de
   * la nota salía 84 cuando el real era 97.
   */
  it("una lista de alternativas con el título en el CV no deja brecha", () => {
    const r = buildPanelReport(input({
      result: result({
        extractedKeywords: {
          hardSkills: [], softSkills: [], jobTitle: "",
          mustHaves: ["Ingeniería Comercial, Administración de Empresas, Marketing o afines"],
        },
      }),
      sectionData: {
        education: [{ degree: "Licenciatura en Ingeniería Comercial", institution: "UMSA" }],
      },
    }))
    expect(allChecks(r).find((c) => c.id === "hard.requirements")).toBeUndefined()
  })

  /**
   * Y el error OPUESTO, que es el que hay que cuidar: una credencial cubierta no
   * puede tapar una exigencia técnica distinta. «Manejo de negociación» no
   * satisface «Manejo avanzado de Salesforce».
   */
  it("una credencial cubierta no tapa un requisito técnico ausente", () => {
    const r = buildPanelReport(input({
      result: result({
        extractedKeywords: {
          hardSkills: [], softSkills: [], jobTitle: "",
          mustHaves: ["Ingeniería Comercial o afines", "Manejo avanzado de Salesforce"],
        },
      }),
      sectionData: { education: [{ degree: "Licenciatura en Ingeniería Comercial", institution: "UMSA" }] },
    }))
    const req = allChecks(r).find((c) => c.id === "hard.requirements")
    expect(req?.evidence).toEqual(["Manejo avanzado de Salesforce"])
  })

  it("y un requisito realmente ausente sí aparece, con sus puntos", () => {
    const r = buildPanelReport(input({
      result: result({
        extractedKeywords: { hardSkills: [], softSkills: [], jobTitle: "", mustHaves: ["Manejo avanzado de Salesforce"] },
      }),
      sectionData: { education: [] },
    }))
    const req = allChecks(r).find((c) => c.id === "hard.requirements")
    expect(req?.state).toBe("crit")
    expect(req?.weight).toBe(10)
  })
})

describe("lo aplicado no vuelve", () => {
  /**
   * El análisis no tiene memoria: cada corrida lee el CV de cero y un modelo al
   * que se le pide mejorar prosa siempre encuentra otra variante. Reportado: se
   * aplicaba el arreglo del resumen y la corrida siguiente proponía una variante
   * del párrafo que el propio modelo acababa de escribir.
   */
  it("un hallazgo cuyo texto ya fue aceptado no entra al informe", () => {
    const fixes = [
      { issue: "Resumen repetido", severity: "high", fix: "Texto ya aceptado", action: { kind: "rewrite_summary" as const } },
      { issue: "Viñeta sin verbo", severity: "medium", fix: "Otro texto", action: { kind: "rewrite_summary" as const } },
    ]
    const r = buildPanelReport(input({
      result: result({ analysis: { criticalFixes: fixes } as never }),
      isAlreadyAccepted: (t) => t === "Texto ya aceptado",
    }))
    const issues = allChecks(r).filter((c) => c.id.startsWith("tips.recruiter.")).map((c) => c.params?.issue)
    expect(issues).toEqual(["Viñeta sin verbo"])
  })

  it("sin memoria declarada, entran todos", () => {
    const r = buildPanelReport(input({
      result: result({
        analysis: { criticalFixes: [
          { issue: "A", severity: "high", action: { kind: "rewrite_summary" } },
          { issue: "B", severity: "low", action: { kind: "rewrite_summary" } },
        ] } as never,
      }),
    }))
    expect(openChecks(r).filter((c) => c.id.startsWith("tips.recruiter."))).toHaveLength(2)
  })

  /**
   * NINGÚN HALLAZGO SIN SALIDA (CEO, 2026-08-21).
   *
   * Un hallazgo del reclutador sin acción llegaba al panel como un reproche sin
   * botón: se veía «13 sin resolver» al lado de «resolver 1 pendiente», y los
   * otros doce no se cerraban desde ninguna parte. Lo concreto que nombran ya
   * son chequeos deterministas con su línea apuntada, y la lectura general sigue
   * entera en el veredicto.
   */
  it("un hallazgo sin acción no entra: sería trabajo sin salida", () => {
    const r = buildPanelReport(input({
      result: result({
        analysis: { criticalFixes: [
          { issue: "Sin salida", severity: "high" },
          { issue: "Con salida", severity: "high", action: { kind: "rewrite_summary" } },
        ] } as never,
      }),
    }))
    const issues = allChecks(r).filter((c) => c.id.startsWith("tips.recruiter.")).map((c) => c.params?.issue)
    expect(issues).toEqual(["Con salida"])
  })
})

describe("el conteo por término sale del CV real", () => {
  it("cuenta el término en resumen, puestos y habilidades", () => {
    const r = buildPanelReport(input({
      jobDescription: "Buscamos Excel avanzado. Excel para reportes.",
      result: result({ matchedKeywords: ["Excel"] }),
      sectionData: {
        summary: "Analista con Excel",
        workExperience: [{ jobTitle: "Analista", description: "• Reportes en Excel mensuales" }],
        skills: [{ name: "Excel" }],
      },
    }))
    const term = r.terms.find((t) => t.term === "Excel")
    expect(term?.jd).toBe(2)
    expect(term?.cv).toBe(3)
  })
})

describe("la anatomía de las viñetas se mide sobre el CV entero", () => {
  /**
   * No sobre `metriclessBullets`, que son por definición las que NO tienen cifra.
   * Derivarlas de ahí daba `metric` siempre en falso.
   */
  it("distingue la que tiene cifra de la que no", () => {
    const r = buildPanelReport(input({
      result: result({ matchedKeywords: ["Excel"] }),
      sectionData: {
        workExperience: [{
          id: "j1",
          description: "• Atendí 120 operaciones por día en Excel\n• Responsable de la caja del turno",
        }],
      },
    }))
    expect(r.bullets).toHaveLength(2)
    expect(r.bullets[0]).toMatchObject({ metric: true, verb: true, keywords: ["Excel"] })
    expect(r.bullets[1]).toMatchObject({ metric: false, verb: false, keywords: [] })
  })
})

describe("la contradicción de la captura, de punta a punta", () => {
  it("100 con un crítico del reclutador no está listo, y el crítico no mueve el número", () => {
    const r = buildPanelReport(input({
      result: result({
        score: 100,
        analysis: {
          criticalFixes: [{ issue: "El resumen aparece tres veces", severity: "high", action: { kind: "rewrite_summary" } }],
        } as never,
      }),
    }))
    expect(r.score).toBe(100)
    expect(isReadyToSend(r)).toBe(false)
    expect(criticalChecks(r)[0].weight).toBe(0)
    // «Consejos» declara `impact` desde 2026-08-25: la categoría existía en el
    // puntaje y no tenía sección. Lo que NO mueve el número —este crítico del
    // reclutador— lo sigue diciendo su propio peso, que es el assert de arriba.
    expect(r.sections.find((s) => s.id === "tips")?.scoreCategory).toBe("impact")
  })
})

describe("el adaptador no decide ni calcula", () => {
  /**
   * Traduce una forma a otra. Si empieza a juzgar el CV, vuelve a haber dos
   * verdades — que es el defecto que la auditoría del panel encontró.
   */
  it("no llama a ningún motor de análisis", () => {
    const src = readFileSync("lib/ats/panel-report.ts", "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^[ \t]*\/\/.*$/gm, "")
    expect(src).not.toContain("analyzeWriting")
    expect(src).not.toContain("assessResumeContent")
    expect(src).not.toContain("computeATSMatch")
    expect(src).not.toContain("computeCredibility")
  })

  it("respeta el puntaje del servidor tal cual", () => {
    expect(buildPanelReport(input({ result: result({ score: 37 }) })).score).toBe(37)
  })
})

describe("lo que se puede afirmar desde los datos, y lo que no", () => {
  /**
   * `looksMultiColumn` cuenta líneas con seis espacios a cada lado y `hasSection`
   * busca ETIQUETAS de sección en el texto. Las dos están escritas para lo que un
   * parser extrajo de un PDF. Sobre una concatenación nuestra darían siempre
   * limpio la primera y siempre ausente la segunda — un falso aprobado y un falso
   * fallo a la vez, que es peor que no decir nada.
   */
  it("el adaptador no corre las señales de PDF sobre datos estructurados", () => {
    const src = readFileSync("lib/ats/panel-report.ts", "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^[ \t]*\/\/.*$/gm, "")
    expect(src).not.toContain("computeResumeSignals")
    expect(src).not.toContain("looksMultiColumn")
    expect(src).not.toContain("findNonStandardSectionHeadings")
  })

  it("sí afirma lo que los datos dicen: contacto y secciones vacías", () => {
    const r = buildPanelReport(input({ sectionData: { personalDetails: {}, workExperience: [], education: [], skills: [] } }))
    const ids = allChecks(r).map((c) => c.id)
    expect(ids).toContain("search.no_email")
    expect(ids).toContain("search.no_phone")
    expect(ids).toContain("search.empty_section.experience")
  })

  it("y se calla cuando el CV los tiene", () => {
    const r = buildPanelReport(input({
      sectionData: {
        personalDetails: { email: "a@b.com", phone: "+591 700" },
        workExperience: [{ id: "j1", description: "• Atendí clientes" }],
        education: [{ degree: "X" }],
        skills: [{ name: "Excel" }],
      },
    }))
    const ids = allChecks(r).map((c) => c.id)
    expect(ids).not.toContain("search.no_email")
    expect(ids).not.toContain("search.empty_section.experience")
  })
})

/**
 * LO QUE SE PERDIÓ AL BORRAR LA VERIFICACIÓN DEL PDF, dicho y no escondido.
 *
 * Acá vivía el caso más caro que el panel sabía detectar: el email ESTÁ en el CV
 * y el parser no lo saca del PDF exportado — el candidato manda una postulación
 * a la que nadie puede responder. Se detectaba con `search.email_not_extracted`,
 * que sólo existía si había una medición sobre el archivo real.
 *
 * La causa que hacía desaparecer texto del PDF —`letterSpacing` por encima de lo
 * que el extractor tolera— ya no puede ocurrir: se corrigió en las 62 plantillas
 * que la tenían y hay un guard que lo impide (`template-parseable-text`). Eso
 * cubre la causa conocida y medida.
 *
 * NO CUBRE OTRAS. Una fuente que no embeba sus glifos, o un render que falle de
 * otro modo, volvería a perder el contacto y hoy nadie lo vería. Queda anotado
 * como el precio de haber sacado el bloque, no como un problema resuelto.
 */

describe("el equilibrio de viñetas depende de la antigüedad", () => {
  /**
   * Un tope único trata igual al puesto actual que a uno de hace diez años, y no
   * son lo mismo: el reclutador lee el de arriba y saltea los de abajo.
   */
  const year = new Date().getFullYear()

  it("seis viñetas están bien en el puesto actual", () => {
    const cv = { workExperience: [{ id: "j1", jobTitle: "Cajero", currentlyWorking: true, description: Array.from({ length: 6 }, (_, i) => `• Atendí la ventanilla número ${i} y cuadré su caja al cierre`).join("\n") }] }
    const r = buildPanelReport(input({ sectionData: cv, writing: analyzeWriting(cv) }))
    expect(allChecks(r).map((c) => c.id)).not.toContain("tips.balance.j1")
  })

  /**
   * ── EL AVISO SE CONVIRTIÓ EN TIJERA (2026-08-22) ─────────────────────────
   *
   * Antes esto emitía `tips.role_range.j1` —«lleva 6; para su antigüedad, 2-3»—
   * con la nota «esto sólo lo sabés vos». El CEO lo reportó con captura: un
   * dato repetido y sin salida. Ahora el mismo puesto recibe UNA tarjeta por
   * línea de sobra, con la línea nombrada y el botón que la corta.
   */
  it("y en uno de hace diez años el excedente se ofrece para cortar, con su línea", () => {
    const cv = { workExperience: [{ id: "j1", jobTitle: "Cajero", endDate: `06/${year - 10}`, description: Array.from({ length: 6 }, (_, i) => `• Atendí la ventanilla número ${i} y cuadré su caja al cierre`).join("\n") }] }
    const r = buildPanelReport(input({ sectionData: cv, writing: analyzeWriting(cv) }))
    const cortes = allChecks(r).filter((x) => x.id.startsWith("tips.cut.j1."))
    expect(cortes.length).toBe(3)
    for (const c of cortes) expect(c.evidence?.[0]).toMatch(/^Atendí la ventanilla/)
    // Y la voz vieja, la que no llevaba a ningún lado, se calla.
    expect(allChecks(r).map((c) => c.id)).not.toContain("tips.balance.j1")
  })

  /** El piso importa igual: un puesto con una línea se lee como si no hubiera hecho nada. */
  /**
   * ── UNA TARJETA, UN PRODUCTOR (2026-08-25) ────────────────────────────────
   *
   * El aviso de volumen salía de DOS lugares —`bulletBalance` acá y un
   * `roleBalance` propio del adaptador— que medían lo mismo, y había un filtro
   * para que no se pisaran. Ahora lo produce `analyzeWriting` y sólo él, así que
   * el id es `tips.balance.*` y el rango viaja dentro del mismo hallazgo.
   */
  it("una sola línea en el puesto actual también se avisa", () => {
    const cv = { workExperience: [{ id: "j1", jobTitle: "Cajero", currentlyWorking: true, description: "• Atendí la ventanilla y cuadré la caja al cierre del turno" }] }
    const r = buildPanelReport(input({ sectionData: cv, writing: analyzeWriting(cv) }))
    const c = allChecks(r).find((x) => x.id === "tips.balance.j1")
    expect(c?.titleKey).toBe("check.role_under")
    expect(c?.params).toMatchObject({ count: 1, min: 4, max: 6 })
  })
})

describe("los huecos de empleo", () => {
  it("reporta un hueco de más de seis meses entre dos puestos", () => {
    const r = buildPanelReport(input({
      sectionData: {
        workExperience: [
          { id: "j1", jobTitle: "Cajero", startDate: "01/2018", endDate: "01/2020", description: "• x" },
          { id: "j2", jobTitle: "Analista", startDate: "06/2021", endDate: "01/2023", description: "• y" },
        ],
      },
    }))
    const c = allChecks(r).find((x) => x.id.startsWith("tips.gap."))
    expect(c?.params?.months).toBe(17)
    expect(c?.owner).toBe("user")
  })

  /** Bajo seis meses es una mudanza o dos semanas entre contratos: avisar es ruido. */
  it("calla un hueco corto", () => {
    const r = buildPanelReport(input({
      sectionData: {
        workExperience: [
          { id: "j1", jobTitle: "Cajero", startDate: "01/2018", endDate: "01/2020", description: "• x" },
          { id: "j2", jobTitle: "Analista", startDate: "04/2020", endDate: "01/2023", description: "• y" },
        ],
      },
    }))
    expect(allChecks(r).filter((x) => x.id.startsWith("tips.gap."))).toEqual([])
  })
})

/**
 * Visto en pantalla el 2026-08-21: una tarjeta titulaba «, bullet [1]: "…"».
 * Un título que empieza con una coma se lee como un error del producto.
 */
describe("el texto del hallazgo no llega cortado", () => {
  it("le saca la puntuación de adelante y lo empieza en mayúscula", () => {
    const r = buildPanelReport(input({
      // La cita TIENE que estar en el CV: desde `recruiter-verified.ts` un
      // hallazgo que cita texto que el documento no dice ya no llega al panel.
      // Con el fixture vacío este test probaba el árbitro sin querer, no la
      // limpieza del texto, que es lo suyo.
      sectionData: { workExperience: [{ id: "j1", jobTitle: "Marketing", description: "• Diseñar e implementar campañas de fidelización." }] },
      result: result({
        analysis: { criticalFixes: [
          { issue: ', bullet [1]: "Diseñar e implementar campañas"', severity: "high", action: { kind: "rewrite_summary" } },
        ] } as never,
      }),
    }))
    const issue = allChecks(r).find((c) => c.id.startsWith("tips.recruiter."))?.params?.issue
    expect(issue).toBe('Bullet [1]: "Diseñar e implementar campañas"')
  })
})
