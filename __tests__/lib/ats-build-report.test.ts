import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { buildAtsReport, type BuildReportInput } from "@/lib/ats/build-report"
import {
  allChecks,
  criticalChecks,
  findDuplicateCheckIds,
  isActionable,
  isReadyToSend,
  openChecks,
  tailorWorkload,
  applyAllPlan,
  weavableTerms,
  REPORT_SECTIONS,
} from "@/lib/ats/report"
import type { WritingChecks } from "@/lib/ats/writing-checks"

/**
 * EL ENSAMBLADOR. Los ocho productores entran sueltos y sale UN informe.
 *
 * Cada uno sigue calculando lo suyo; lo que cambia es que ya no llegan sueltos al
 * panel para que cada tarjeta decida por su cuenta qué pintar. Estos tests
 * verifican las tres reglas sobre datos reales, no sobre un objeto inventado.
 */
const emptyWriting = (over: Partial<WritingChecks> = {}): WritingChecks => ({
  clicheBullets: [],
  weakVerbBullets: [],
  duplicateBullets: [],
  dateInconsistency: null,
  bulletBalance: [],
  mergeCandidates: [],
  chronology: null,
  futureDates: [],
  yearsClaim: null,
  nearDuplicates: [],
  bulletRanking: [],
  incompleteEducation: [],
  orphanFragments: [],
  metrics: { level: "ok", findings: [] } as unknown as WritingChecks["metrics"],
  degreeInSkills: [],
  hasLink: true,
  ...over,
})


const input = (over: Partial<BuildReportInput> = {}): BuildReportInput => ({
  score: 72,
  categories: [
    { category: "hardSkills", coveragePct: 60, weight: .45, share: .45, points: 27, recoverable: 18, basis: "chosen" },
    { category: "softSkills", coveragePct: 80, weight: .10, share: .10, points: 8, recoverable: 2, basis: "chosen" },
    { category: "title", coveragePct: 100, weight: .15, share: .15, points: 15, recoverable: 0, basis: "chosen" },
    { category: "sections", coveragePct: 100, weight: .10, share: .10, points: 10, recoverable: 0, basis: "convention" },
    { category: "mustHaves", coveragePct: 50, weight: .20, share: .20, points: 10, recoverable: 10, basis: "chosen" },
  ],
  writing: emptyWriting(),
  missingKeywords: [],
  listedOnlyKeywords: [],
  matchedKeywords: [],
  missingSoftSkills: [],
  matchedSoftSkills: [],
  unmetRequirements: [],
  templateSafety: "safe",
  recruiterFixes: [],
  ...over,
})

describe("el informe sale entero", () => {
  it("trae las seis secciones siempre, aunque estén vacías", () => {
    const r = buildAtsReport(input())
    expect(r.sections.map((s) => s.id)).toEqual([...REPORT_SECTIONS])
  })

  it("no inventa ids repetidos con datos reales", () => {
    const r = buildAtsReport(input({
      writing: emptyWriting({
        futureDates: [
          { targetId: "j1", jobTitle: "Cajero", value: "2030" } as never,
          { targetId: "j2", jobTitle: "Analista", value: "2031" } as never,
        ],
      }),
    }))
    expect(findDuplicateCheckIds(r)).toEqual([])
  })

  it("respeta el puntaje que le dan: no lo recalcula", () => {
    expect(buildAtsReport(input({ score: 91 })).score).toBe(91)
  })
})

describe("cada sección declara si mueve el número", () => {
  const r = buildAtsReport(input())

  it("las que puntúan traen su cobertura real", () => {
    expect(r.sections.find((s) => s.id === "hard")?.coveragePct).toBe(60)
    expect(r.sections.find((s) => s.id === "soft")?.coveragePct).toBe(80)
    expect(r.sections.find((s) => s.id === "search")?.coveragePct).toBe(100)
  })

  /**
   * La mitad que faltaba del defecto reportado con captura: no alcanza con que
   * un consejo no sume puntos, hay que poder DECIRLO al lado del hallazgo.
   *
   * ── ACTUALIZADO (CEO, 2026-08-25) ──────────────────────────────────────────
   *
   * «Consejos» SÍ mueve el número y decía que no. `impact` —las viñetas que
   * declaran un resultado medible— vale 0.08 del puntaje y no tenía sección:
   * se cobraba y no aparecía en el informe, mientras esta sección se anunciaba
   * gratis con chequeos adentro que sí pesan. Ahora declara su categoría; lo que
   * no mueve el número lo sigue diciendo cada tarjeta por su cuenta.
   */
  it("vocabulario no puntúa y lo dice; consejos declara la categoría que sí cobra", () => {
    expect(r.sections.find((s) => s.id === "tips")?.scoreCategory).toBe("impact")
    expect(r.sections.find((s) => s.id === "other")?.scoreCategory).toBeNull()
    expect(r.sections.find((s) => s.id === "other")?.coveragePct).toBeNull()
  })
})

describe("los requisitos obligatorios no se pierden", () => {
  /**
   * El diseño no tiene una sección para ellos y son el 20% del puntaje — la única
   * categoría que explica por qué un CV no puede llegar a 100. Entran como
   * chequeo de «hard» con su peso real en vez de quedar afuera.
   */
  it("entran como chequeo crítico con los puntos que valen", () => {
    const r = buildAtsReport(input({ unmetRequirements: ["Licenciatura", "3 años en banca"] }))
    const req = allChecks(r).find((c) => c.id === "hard.requirements")
    expect(req?.state).toBe("crit")
    expect(req?.weight).toBe(10)
    expect(req?.evidence).toEqual(["Licenciatura", "3 años en banca"])
  })

  it("y sin requisitos incumplidos no aparece ningún chequeo fantasma", () => {
    expect(allChecks(buildAtsReport(input()))).toHaveLength(0)
  })
})

describe("un dueño por hallazgo", () => {
  /**
   * El mes sólo lo sabe el candidato. Unificar el formato sí lo podemos hacer;
   * inventar un mes que no está, no. La diferencia decide si hay botón.
   */
  it("las fechas sin mes son del usuario, no hay botón que las adivine", () => {
    const r = buildAtsReport(input({
      writing: emptyWriting({
        dateInconsistency: {
          formats: ["2015", "06/2017"],
          jobsMissingMonth: [
            { jobTitle: "Cajero", dates: ["2015"] },
            { jobTitle: "Analista", dates: ["2016", "2018"] },
          ],
        },
      }),
    }))
    const c = allChecks(r).find((x) => x.id === "search.dates")
    expect(c?.owner).toBe("user")
    expect(c?.action).toBeUndefined()
    // El puesto Y la fecha: el chip con el cargo solo se leía como un tema del
    // CV, no como el defecto. Reportado con captura.
    expect(c?.evidence).toEqual(["Cajero · 2015", "Analista · 2016 – 2018"])
    expect(c?.titleKey).toBe("check.dates_mixed_bare")
    expect(isActionable(c!)).toBe(true)
  })


  /**
   * LOS DOS TESTS QUE ESTABAN ACÁ SE FUERON CON SU HALLAZGO.
   *
   * Comprobaban que `search.listed_only` fuera del ejecutor y no se contara dos
   * veces. Los escribí en la ronda anterior y cerraban un defecto real — pero la
   * solución de fondo no era ajustarle el dueño al hallazgo: era que el hallazgo
   * no existiera. Era la tercera voz diciendo lo que la tabla de términos ya
   * dice con su conteo y el ejecutor ya resuelve con su botón.
   *
   * Lo que afirmaban vive ahora en `one-owner-per-fact.test.ts`, ejecutando el
   * informe y verificando algo más fuerte: que NINGÚN hallazgo reclame un
   * término como propio.
   */

  it("con el mes puesto, unificar el formato sí es automático", () => {
    const r = buildAtsReport(input({
      writing: emptyWriting({ dateInconsistency: { formats: ["06/2017", "2017-06"], jobsMissingMonth: [] } }),
    }))
    const c = allChecks(r).find((x) => x.id === "search.dates")
    expect(c?.owner).toBe("auto")
    expect(c?.action).toEqual({ kind: "fix_dates" })
    expect(c?.titleKey).toBe("check.dates_mixed")
    // Las clases del detector viajan como claves para que el panel las diga en
    // el idioma del usuario: «year» llegaba crudo a un panel en español.
    expect(c?.params?.formats).toBe(["06/2017", "2017-06"].join("\u0000"))
  })

  it("tailor recibe sólo lo suyo, y viene con el objetivo apuntado", () => {
    const r = buildAtsReport(input({
      writing: emptyWriting({
        nearDuplicates: [{ targetId: "j1", jobTitle: "Cajero", index: 2, text: "a", otherIndex: 0, otherText: "b" } as never],
        yearsClaim: { claimed: 7, actual: 11 } as never,
      }),
    }))
    const work = tailorWorkload(r)
    expect(work.map((c) => c.id)).toEqual(["tips.near_dup.j1.2"])
    expect(work[0].action).toEqual({ kind: "rewrite_bullet", targetId: "j1", index: 2 })
  })
})

describe("sin salida no se muestra", () => {
  it("todo hallazgo emitido tiene botón o dueño humano", () => {
    const r = buildAtsReport(input({
      unmetRequirements: ["Licenciatura"],
      listedOnlyKeywords: ["Salesforce"],
      templateSafety: "caution",
      writing: emptyWriting({
        chronology: { kind: "reverse_order", firstShown: "Cajero", mostRecent: "Jefe" } as never,
        degreeInSkills: ["Ingeniería Comercial"],
        hasLink: false,
        incompleteEducation: [{ index: 0, school: "UMSA", missingDegree: true, missingDates: false } as never],
        orphanFragments: [{ targetId: "j1", jobTitle: "Cajero", index: 3, text: "5%.", previousText: "Subí" } as never],
      }),
      recruiterFixes: [{ issue: "Resumen repetido", severity: "high", action: { kind: "rewrite_summary" } }],
    }))
    const emitted = allChecks(r)
    expect(emitted.length).toBeGreaterThan(6)
    for (const c of emitted) {
      expect(isActionable(c), `${c.id} no tiene salida`).toBe(true)
    }
  })
})

describe("los términos se pueden auditar leyendo", () => {
  /**
   * «Lo pide 4 veces, tu CV lo dice 0» se verifica leyendo. «Te falta esta skill»
   * hay que creerlo — y creer es exactamente lo que el CEO dejó de hacer.
   */
  it("cuenta apariciones a los dos lados", () => {
    const r = buildAtsReport(input({
      jobDescription: "Buscamos Salesforce. Experiencia en Salesforce y Excel. Salesforce avanzado.",
      resumeText: "Manejo de Excel para reportes mensuales.",
      matchedKeywords: ["Excel"],
      missingKeywords: ["Salesforce"],
    }))
    const sf = r.terms.find((t) => t.term === "Salesforce")
    const xl = r.terms.find((t) => t.term === "Excel")
    expect(sf?.jd).toBe(3)
    expect(sf?.cv).toBe(0)
    expect(xl?.jd).toBe(1)
    expect(xl?.cv).toBe(1)
  })

  it("marca el que sólo vive en la lista de habilidades", () => {
    const r = buildAtsReport(input({
      matchedKeywords: ["Salesforce"],
      listedOnlyKeywords: ["Salesforce"],
      resumeText: "Salesforce",
      jobDescription: "Salesforce",
    }))
    expect(r.terms.find((t) => t.term === "Salesforce")?.listOnly).toBe(true)
  })

  /** Acentos y mayúsculas no son parte de la identidad de un término. */
  it("cuenta sin que el acento cambie el resultado", () => {
    const r = buildAtsReport(input({
      jobDescription: "Gestión de cartera. GESTIÓN comercial.",
      matchedKeywords: ["gestion"],
      resumeText: "gestion",
    }))
    expect(r.terms.find((t) => t.term === "gestion")?.jd).toBe(2)
  })

  it("no cuenta una palabra dentro de otra", () => {
    const r = buildAtsReport(input({
      jobDescription: "Trabajo en reactivación de cuentas",
      missingKeywords: ["React"],
    }))
    expect(r.terms.find((t) => t.term === "React")?.jd).toBe(0)
  })
})

describe("la contradicción de la captura, cerrada", () => {
  /**
   * REVISADO (2026-08-21, segundo reporte con captura del CEO).
   *
   * La versión anterior de este test afirmaba que 100 + un hallazgo del
   * reclutador NO está listo para mandar, y que ese hallazgo es `crit`. Cerraba
   * a medias la contradicción de la primera captura: explicaba por qué el 100 no
   * cubre la redacción, y dejaba puesta la etiqueta CRÍTICA sobre un juicio de
   * ESTILO del modelo — el mismo rótulo que lleva «tu CV no tiene email».
   *
   * El CEO volvió sobre lo mismo: «no veo la necesidad de decir crítico si marca
   * 100». Tiene razón, y el hallazgo no se pierde: sigue emitido, con su botón,
   * en el nivel que le corresponde. Lo que se va es la etiqueta que volvía
   * sospechoso un hallazgo cierto.
   */
  it("100 con un reparo de redacción se sigue mostrando, pero no como crítico", () => {
    const r = buildAtsReport(input({
      score: 100,
      recruiterFixes: [{ issue: "El resumen aparece tres veces", severity: "high", action: { kind: "rewrite_summary" } }],
    }))
    expect(r.score).toBe(100)
    const c = allChecks(r).find((x) => x.id.startsWith("tips.recruiter"))
    // Sigue ahí, y con salida: el hallazgo era bueno.
    expect(c?.state).toBe("warn")
    expect(isActionable(c!)).toBe(true)
    // Ya no bloquea, y ya no hay un rojo peleando con el 100 de arriba.
    expect(criticalChecks(r)).toHaveLength(0)
    expect(isReadyToSend(r)).toBe(true)
  })

  /**
   * Y LO QUE SÍ SIGUE BLOQUEANDO. La regla no se aflojó para todo: un hecho que
   * te saca de la lista frena el «listo para enviar» aunque el puntaje diga 100,
   * porque el puntaje mide coincidencia con la vacante y no mide que puedan
   * llamarte por teléfono.
   */
  it("pero un hecho que te saca de la lista sigue frenando el envío con 100", () => {
    const r = buildAtsReport(input({
      score: 100,
      structure: { hasEmail: false, hasPhone: true } as unknown as BuildReportInput["structure"],
    }))
    expect(r.score).toBe(100)
    expect(criticalChecks(r).map((c) => c.id)).toContain("search.no_email")
    expect(isReadyToSend(r)).toBe(false)
  })

  it("100 y nada abierto sí lo está", () => {
    const r = buildAtsReport(input({ score: 100 }))
    expect(openChecks(r)).toHaveLength(0)
    expect(isReadyToSend(r)).toBe(true)
  })

  it("avisa de sobre-optimización pasado el umbral", () => {
    expect(buildAtsReport(input({ score: 84 })).overOptimised).toBe(true)
    expect(buildAtsReport(input({ score: 79 })).overOptimised).toBe(false)
  })
})

describe("lo que cazó el pase de QA", () => {
  /**
   * `hard` y `soft` recibían la MISMA lista completa de términos, así que la
   * tabla se pintaba dos veces — el cruce que este rediseño vino a terminar,
   * reaparecido adentro del rediseño.
   */
  it("cada término declara su sección", () => {
    const r = buildAtsReport(input({
      matchedKeywords: ["Excel"],
      missingKeywords: ["Salesforce"],
      matchedSoftSkills: ["Negociación"],
      missingSoftSkills: ["Liderazgo"],
    }))
    const bySection = (s: string) => r.terms.filter((x) => x.section === s).map((x) => x.term)
    expect(bySection("hard")).toEqual(["Excel", "Salesforce"])
    expect(bySection("soft")).toEqual(["Negociación", "Liderazgo"])
  })

  /**
   * Antes las viñetas se derivaban de `metriclessBullets`, que por definición son
   * las que NO tienen cifra: `metric` salía siempre en falso y el panel habría
   * informado «ninguna viñeta tiene número» sobre un CV lleno de números.
   */
  it("las viñetas llegan medidas de afuera, no derivadas de las que no tienen cifra", () => {
    const r = buildAtsReport(input({
      bullets: [
        { targetId: "j1", index: 0, text: "Atendí 120 clientes", verb: true, metric: true, keywords: ["Excel"], words: 3 },
        { targetId: "j1", index: 1, text: "Responsable de caja", verb: false, metric: false, keywords: [], words: 3 },
      ],
    }))
    expect(r.bullets.map((b) => b.metric)).toEqual([true, false])
    expect(r.bullets.map((b) => b.verb)).toEqual([true, false])
  })

  it("y sin viñetas provistas, la lista queda vacía en vez de mentir", () => {
    expect(buildAtsReport(input()).bullets).toEqual([])
  })
})

describe("ningún botón que no haga nada", () => {
  /**
   * VISTO EN EL NAVEGADOR, no en un test: siete chequeos llevaban
   * `action: { kind: "manual" }`. El modal los daba por accionables y les pintaba
   * un botón «Aplicar» que, al llegar al despachador, no coincidía con ninguna
   * rama y se iba en silencio.
   *
   * Un diagnóstico sin salida es una crítica sin puerta; un diagnóstico con un
   * botón que no hace nada es peor — el usuario cree que lo resolvió.
   */
  it("el ensamblador no emite acciones `manual`", () => {
    const src = readFileSync("lib/ats/build-report.ts", "utf8")
    expect(src).not.toContain('kind: "manual"')
  })

  it("y todo hallazgo con acción tiene un tipo que el panel sabe ejecutar", () => {
    const EXECUTABLE = new Set(["rewrite_bullet", "rewrite_summary", "add_skill", "fix_dates", "replace_text", "remove_duplicates"])
    const r = buildAtsReport(input({
      unmetRequirements: ["X"],
      listedOnlyKeywords: ["Salesforce"],
      templateSafety: "caution",
      writing: emptyWriting({
        chronology: { kind: "reverse_order", firstShown: "A", mostRecent: "B" } as never,
        degreeInSkills: ["Ing."],
        hasLink: false,
        dateInconsistency: { formats: ["2015", "06/2017"], jobsMissingMonth: [] },
        nearDuplicates: [{ targetId: "j1", jobTitle: "C", index: 1, text: "a", otherIndex: 0, otherText: "b" } as never],
      }),
      typos: [{ keyword: "Salesforce", typed: "Salesfore" }],
    }))
    for (const c of allChecks(r)) {
      if (!c.action) continue
      expect(EXECUTABLE.has(c.action.kind), `${c.id} usa una acción que nadie ejecuta: ${c.action.kind}`).toBe(true)
    }
  })
})

describe("el ensamblador no diagnostica", () => {
  /**
   * Si empieza a juzgar el CV hay dos verdades otra vez, que es exactamente el
   * defecto que la auditoría encontró. Recibe hallazgos y les asigna lugar.
   */
  it("no lee el CV ni decide si algo está mal", () => {
    const src = readFileSync("lib/ats/build-report.ts", "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^[ \t]*\/\/.*$/gm, "")
    expect(src).not.toContain("analyzeWriting")
    expect(src).not.toContain("assessResumeContent")
    expect(src).not.toContain("computeATSMatch")
    expect(src).not.toContain("SCORE_WEIGHTS")
  })
})

/**
 * «CRÍTICO» TIENE UN SOLO SIGNIFICADO, Y NO LO DECIDE EL MODELO.
 *
 * Reportado con captura, con la nota en 100: «CRÍTICO · no mueve el número»
 * sobre un resumen repetido. El hallazgo era cierto —el resumen estaba tres
 * veces— y la etiqueta lo volvió sospechoso, que es peor que no mostrarlo.
 *
 * La causa es doble y las dos están acá: el prompt llama `criticalFixes` al
 * campo y la escala tiene DOS valores, así que todo lo que sea un poco peor que
 * el resto vuelve como "high"; y ese "high" se mapeaba directo a `crit`, el
 * mismo rótulo que lleva «tu CV no tiene email».
 */
describe("qué puede llamarse crítico", () => {
  const recruiter = (severity: "high" | "medium") =>
    buildAtsReport(input({
      recruiterFixes: [{
        issue: "Resumen repetido tres veces",
        why: "El reclutador lo nota",
        fix: "Dejalo una vez",
        severity,
        action: { kind: "rewrite_summary" },
      }] as unknown as BuildReportInput["recruiterFixes"],
    }))

  it("un juicio de estilo del modelo NO es crítico, aunque diga high", () => {
    const c = allChecks(recruiter("high")).find((x) => x.id.startsWith("tips.recruiter"))
    expect(c).toBeDefined()
    expect(c?.state).toBe("warn")
  })

  /** Sigue emitiéndose y con su botón: el hallazgo era bueno, la etiqueta no. */
  it("pero se sigue mostrando, con salida", () => {
    const c = allChecks(recruiter("high")).find((x) => x.id.startsWith("tips.recruiter"))
    expect(c?.owner).toBe("tailor")
    expect(isActionable(c!)).toBe(true)
  })

  /**
   * Y deja de bloquear «listo para enviar». Un CV que cubre la vacante y cuyo
   * único reparo es de estilo pasa el filtro — decir lo contrario con 100 arriba
   * es lo que hizo desconfiar del panel entero.
   */
  it("y no bloquea el listo para enviar", () => {
    const r = recruiter("high")
    expect(criticalChecks(r).map((c) => c.id)).not.toContain("tips.recruiter.0")
  })

  /**
   * LO QUE SIGUE SIENDO CRÍTICO. Un CV sin email no está listo aunque saque 100:
   * el puntaje mide coincidencia con la vacante y no mide que puedan llamarte.
   * Esos valen 0 puntos y frenan igual — por eso la insignia lo dice.
   */
  it("un hecho que te saca de la lista sí lo es, aunque no mueva el puntaje", () => {
    const r = buildAtsReport(input({
      structure: { hasEmail: false, hasPhone: true } as unknown as BuildReportInput["structure"],
    }))
    const c = allChecks(r).find((x) => x.id === "search.no_email")
    expect(c?.state).toBe("crit")
    expect(c?.weight).toBe(0)
  })
})

/**
 * LA SECCIÓN QUE COBRABA SIN DECIR POR QUÉ.
 *
 * «Searchability 25% — no me dice nada de cómo subirlo» (CEO, con captura,
 * 2026-08-22). Los seis chequeos de `search` son condicionales y en un CV limpio
 * no dispara ninguno: quedaba el número solo. Lo que ese número mide es el
 * CARGO, y era lo único que no se decía.
 */
describe("el cargo de la vacante contra el del CV", () => {
  const conTitulo = (coveragePct: number, extra: Partial<BuildReportInput> = {}) =>
    input({
      categories: [
        { category: "title", coveragePct, weight: .15, share: .15, points: 4, recoverable: 11, basis: "chosen" },
      ],
      posting: { jobTitle: "iOS Developer", hardSkills: [], softSkills: [], mustHaves: [] },
      cvTitles: ["Mobile Engineer", "Web Developer"],
      ...extra,
    })

  it("con el cargo lejos, emite un hallazgo que lo nombra", () => {
    const c = allChecks(buildAtsReport(conTitulo(25))).find((x) => x.id === "search.title")
    expect(c).toBeDefined()
    expect(c?.params?.wanted).toBe("iOS Developer")
    expect(c?.params?.current).toBe("Mobile Engineer")
    expect(c?.evidence).toEqual(["Mobile Engineer", "Web Developer"])
  })

  /**
   * REPORTADO CON CAPTURA (2026-08-24): la tarjeta mostraba «iOS Developer»
   * cuatro veces. La lista es el titular del perfil MÁS el cargo de cada
   * puesto, y un CV con tres puestos del mismo cargo la repetía entera. Cuatro
   * copias no informan más que una.
   */
  it("no repite el mismo cargo aunque esté en cuatro puestos", () => {
    const c = allChecks(
      buildAtsReport(conTitulo(25, { cvTitles: ["iOS Developer", "iOS developer", "IOS DEVELOPER", "iOS  Developer"] })),
    ).find((x) => x.id === "search.title")
    expect(c?.evidence).toEqual(["iOS Developer"])
  })

  it("dice los puntos que están en juego, no cero", () => {
    const c = allChecks(buildAtsReport(conTitulo(25))).find((x) => x.id === "search.title")
    expect(c?.weight).toBe(11)
  })

  it("con el cargo ya cubierto, calla", () => {
    const c = allChecks(buildAtsReport(conTitulo(100))).find((x) => x.id === "search.title")
    expect(c).toBeUndefined()
  })

  it("sin vacante extraída, calla — no inventa un cargo objetivo", () => {
    const c = allChecks(buildAtsReport(conTitulo(25, { posting: undefined }))).find((x) => x.id === "search.title")
    expect(c).toBeUndefined()
  })
})

/**
 * UN PUESTO, UNA VOZ.
 *
 * Reportado con captura: seis tarjetas para tres puestos —«lleva 11 viñetas» y
 * «lleva 11; para su antigüedad, 4-6»—, las dos sin salida. El dato es uno.
 */
describe("el volumen de viñetas se dice una sola vez y con tijera", () => {
  const once = () => Array.from({ length: 11 }, (_, i) => `Línea ${i} del puesto con contenido suficiente`)
  const conPuesto = () =>
    input({
      writing: emptyWriting({
        bulletBalance: [{ targetId: "job-1", jobTitle: "iOS Developer", count: 11, min: 4, max: 6, kind: "too_many" }] as WritingChecks["bulletBalance"],
        bulletRanking: [{
          targetId: "job-1",
          jobTitle: "iOS Developer",
          strongest: once().slice(0, 6).map((text, index) => ({ index, text, score: 1 })),
          weakest: once().slice(6).map((text, i) => ({ index: i + 6, text, score: 0 })),
          weakestHidden: 0,
        }] as unknown as WritingChecks["bulletRanking"],
      }),
    })

  it("emite exactamente el excedente, ni una tarjeta más", () => {
    const cortes = allChecks(buildAtsReport(conPuesto())).filter((c) => c.id.startsWith("tips.cut."))
    expect(cortes.length).toBe(5)
  })

  it("y calla las dos tarjetas que decían el mismo dato sin salida", () => {
    const ids = allChecks(buildAtsReport(conPuesto())).map((c) => c.id)
    expect(ids).not.toContain("tips.balance.job-1")
    expect(ids).not.toContain("tips.role_range.job-1")
  })

  it("cada corte nombra su línea y trae acción", () => {
    const cortes = allChecks(buildAtsReport(conPuesto())).filter((c) => c.id.startsWith("tips.cut."))
    for (const c of cortes) {
      expect(c.evidence?.[0]).toBeTruthy()
      expect(c.action?.targetId).toBe("job-1")
      expect(typeof c.action?.index).toBe("number")
    }
  })

  it("«aplicar todo» NUNCA borra una línea del CV", () => {
    const report = buildAtsReport(conPuesto())
    const plan = applyAllPlan(report, new Set(), new Set())
    expect(plan.checkIds.filter((id) => id.startsWith("tips.cut."))).toEqual([])
  })
})

/**
 * «LOS ATS NO SUBEN CASI TODOS LOS SKILLS QUE TENGO» (CEO, 2026-08-22).
 *
 * La tabla de términos se armaba SÓLO con lo que la vacante pide, así que todo lo
 * que el candidato sabe y esta oferta no nombra no aparecía en ninguna parte. Y
 * la sección donde eso vive —«Otras palabras clave»— existía desde el rediseño
 * con su texto explicativo y CERO contenido: ningún productor le mandaba un
 * término. Un balde declarado y nunca llenado.
 */
describe("las habilidades propias que la vacante no pide", () => {
  const conSkills = (over: Partial<BuildReportInput> = {}) =>
    buildAtsReport(input({
      matchedKeywords: ["Swift"],
      missingKeywords: ["GraphQL"],
      cvSkills: ["Swift", "Kotlin", "Fastlane"],
      resumeText: "Swift Kotlin Fastlane",
      evidenceText: "Kotlin",
      ...over,
    }))

  it("aparecen, y en la sección que no mueve el puntaje", () => {
    const otros = conSkills().terms.filter((t) => t.section === "other").map((t) => t.term)
    expect(otros).toEqual(["Kotlin", "Fastlane"])
  })

  it("no se duplica lo que la vacante SÍ pide", () => {
    const swift = conSkills().terms.filter((t) => t.term === "Swift")
    expect(swift.length).toBe(1)
    expect(swift[0].section).toBe("hard")
  })

  it("se distingue la que una viñeta respalda de la que sólo está en la lista", () => {
    const otros = conSkills().terms.filter((t) => t.section === "other")
    expect(otros.find((t) => t.term === "Kotlin")?.listOnly).toBe(false)
    expect(otros.find((t) => t.term === "Fastlane")?.listOnly).toBe(true)
  })

  /**
   * No mueven el puntaje, así que NO son trabajo del ejecutor. Meterlas ahí le
   * daría al usuario renglones que no pueden mover el número — el mismo defecto
   * de contar lo que no se cobra, del otro lado.
   */
  it("y nunca entran al trabajo del ejecutor", () => {
    const r = conSkills()
    const terms = weavableTerms(r).map((t) => t.term)
    expect(terms).not.toContain("Kotlin")
    expect(terms).not.toContain("Fastlane")
  })
})

/**
 * CORTAR SEGÚN LA POSICIÓN, NO SEGÚN LA REDACCIÓN.
 *
 *   «Según la posición que se ingresa, elimina bullets que no son necesarios
 *    para esa posición... da sugerencias de eliminar y reemplazar por otro
 *    bullet acorde a la posición.» (CEO, 2026-08-22)
 *
 * El ranking de `bullet-strength` mide verbo, cifra y largo: no sabe nada de la
 * oferta. Con once líneas podía proponer cortar una bien escrita sobre Swift y
 * dejar viva una que no le sirve a este puesto.
 */
describe("qué línea se ofrece cortar primero", () => {
  const seis = (n: number) => Array.from({ length: n }, (_, i) => `Línea ${i} con contenido suficiente para el puesto`)

  /** Once líneas: seis se quedan, cinco sobran. Dos no aterrizan ningún término. */
  const conRelevancia = () =>
    buildAtsReport(input({
      missingKeywords: ["GraphQL", "Swift"],
      jobDescription: "Buscamos GraphQL GraphQL GraphQL y Swift",
      writing: emptyWriting({
        bulletRanking: [{
          targetId: "job-1",
          jobTitle: "iOS Developer",
          strongest: seis(6).map((text, index) => ({ index, text, score: 1 })),
          // Las flojas por REDACCIÓN, de la más floja a la menos floja.
          weakest: [6, 7, 8, 9, 10].map((index) => ({ index, text: `Línea ${index} con contenido suficiente para el puesto`, score: 0 })),
          weakestHidden: 0,
        }] as unknown as WritingChecks["bulletRanking"],
        bulletBalance: [{ targetId: "job-1", jobTitle: "iOS Developer", count: 11, min: 4, max: 6, kind: "too_many" }] as WritingChecks["bulletBalance"],
      }),
      // La 9 y la 10 son las únicas que NO aterrizan un término de la vacante.
      bullets: [6, 7, 8, 9, 10].map((index) => ({
        targetId: "job-1", index, text: `Línea ${index} con contenido suficiente para el puesto`,
        verb: true, metric: false, words: 8,
        keywords: index >= 9 ? [] : ["Swift"],
      })),
    }))

  it("las que no dicen nada de lo que la vacante pide van primero", () => {
    const cortes = allChecks(conRelevancia()).filter((c) => c.id.startsWith("tips.cut."))
    expect(cortes[0].id).toBe("tips.cut.job-1.9")
    expect(cortes[1].id).toBe("tips.cut.job-1.10")
  })

  it("y se les dice esa razón, no «es de las más flojas»", () => {
    const cortes = allChecks(conRelevancia()).filter((c) => c.id.startsWith("tips.cut."))
    expect(cortes[0].titleKey).toBe("check.cut_irrelevant")
    expect(cortes.find((c) => c.id === "tips.cut.job-1.6")?.titleKey).toBe("check.cut_bullet")
  })

  /** Cortar deja un hueco. Lo que va en su lugar sale del informe, no del aire. */
  it("cada corte propone con qué reemplazarla: el término más pedido que falta", () => {
    const cortes = allChecks(conRelevancia()).filter((c) => c.id.startsWith("tips.cut."))
    expect(cortes[0].params?.replacement).toBe("GraphQL")
  })

  it("sin términos faltantes no promete un reemplazo", () => {
    const r = buildAtsReport(input({
      missingKeywords: [],
      writing: emptyWriting({
        bulletRanking: [{
          targetId: "job-1", jobTitle: "iOS Developer",
          strongest: seis(6).map((text, index) => ({ index, text, score: 1 })),
          weakest: [{ index: 6, text: "Línea 6 con contenido suficiente", score: 0 }],
          weakestHidden: 0,
        }] as unknown as WritingChecks["bulletRanking"],
      }),
    }))
    const cortes = allChecks(r).filter((c) => c.id.startsWith("tips.cut."))
    expect(cortes.length).toBeGreaterThan(0)
    expect(cortes[0].params?.replacement).toBeUndefined()
  })
})

/**
 * QUÉ FUSIÓN OFRECER PRIMERO — LA QUE LE SIRVE A ESTE PUESTO.
 *
 *   «Para unir algo, la IA que sugiera cosas según el puesto que solicita.»
 *   (CEO, 2026-08-22)
 *
 * QUIÉN propone el par lo sigue decidiendo el coseno de embeddings, que es la
 * única señal que separó los pares reales de los distintos. Lo que faltaba era
 * CUÁL PRIMERO: fusionar libera un renglón, y conviene liberarlo donde ninguna
 * de las dos líneas le habla a la vacante.
 */
describe("el orden de las fusiones lo decide la vacante", () => {
  const b = (index: number, keywords: string[]) => ({
    targetId: "job-1", index, text: `Línea ${index}`, verb: true, metric: false, words: 8, keywords,
  })
  const r = () =>
    buildAtsReport(input({
      writing: emptyWriting({
        mergeCandidates: [
          // Primero en la entrada, pero las dos SÍ le hablan al puesto.
          { targetId: "job-1", jobTitle: "iOS", indexes: [0, 1], texts: ["Línea 0", "Línea 1"] },
          // Segundo en la entrada, y ninguna de las dos aporta al puesto.
          { targetId: "job-1", jobTitle: "iOS", indexes: [2, 3], texts: ["Línea 2", "Línea 3"] },
        ] as unknown as WritingChecks["mergeCandidates"],
      }),
      bullets: [b(0, ["Swift"]), b(1, ["Swift"]), b(2, []), b(3, [])],
    }))

  it("el par que no le sirve al puesto se ofrece primero", () => {
    const ids = allChecks(r()).filter((c) => c.id.startsWith("tips.merge.")).map((c) => c.id)
    expect(ids[0]).toBe("tips.merge.job-1.2.3")
  })

  it("y la tarjeta dice esa razón, no sólo «se parecen»", () => {
    const cards = allChecks(r()).filter((c) => c.id.startsWith("tips.merge."))
    expect(cards[0].titleKey).toBe("check.merge_pair_offtarget")
    expect(cards[1].titleKey).toBe("check.merge_pair")
  })
})
