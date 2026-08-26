import { describe, it, expect } from "vitest"
import { roleBudget, hasRoomForBullet, roleBand } from "@/lib/ats/role-budget"
import { weakestBullet, rankByImpact } from "@/lib/ats/bullet-impact"
import { buildAtsReport, type BuildReportInput } from "@/lib/ats/build-report"
import { allChecks, applyAllPlan, findDuplicateCheckIds, solvableChecks } from "@/lib/ats/report"
import { DECORATIVE_OPENER, stripDecorativeOpener } from "@/lib/services/ai/shared/bullets"
import type { WritingChecks } from "@/lib/ats/writing-checks"
import { analyzeWriting } from "@/lib/ats/writing-checks"
import { computeCredibility } from "@/lib/ats/credibility"

/**
 * LOS DOS DUEÑOS NUEVOS, Y EL CASO REPORTADO CON CAPTURA.
 *
 * Cubre exactamente lo que el CEO reportó el 2026-08-25: que el panel borraba la
 * línea MÁS fuerte de dos gemelas, y que ofrecía agregar una viñeta a un puesto
 * que ya estaba lleno para después pedirle borrarla.
 */

const bullets = (n: number) => Array.from({ length: n }, (_, i) => `• Línea ${i + 1} con contenido suficiente`).join("\n")

describe("roleBudget — un solo dueño de «¿cabe otra línea?»", () => {
  it("el techo depende de la antigüedad del puesto", () => {
    expect(roleBand({ currentlyWorking: true }, 2026).max).toBe(6)
    expect(roleBand({ endDate: "10/2023" }, 2026).max).toBe(4)
    expect(roleBand({ endDate: "10/2015" }, 2026).max).toBe(3)
  })

  it("un puesto en su techo no tiene lugar, y lo dice", () => {
    const lleno = { description: bullets(6), currentlyWorking: true }
    expect(roleBudget(lleno, 2026).state).toBe("full")
    expect(roleBudget(lleno, 2026).room).toBe(0)
    expect(hasRoomForBullet(lleno, 2026)).toBe(false)
  })

  /**
   * EL `<=` CONTRA EL `>=`, que era el bucle: con seis líneas el escritor de
   * habilidades consideraba el puesto cómodo y escribía la séptima, y el chequeo
   * de estructura pedía borrarla. Las dos preguntas dan lo mismo o no hay arreglo.
   */
  it("lo que sobra y lo que cabe no pueden ser ciertos a la vez", () => {
    for (const n of [0, 3, 5, 6, 7, 11]) {
      const b = roleBudget({ description: bullets(n), currentlyWorking: true }, 2026)
      expect(b.room > 0 && b.surplus > 0).toBe(false)
    }
  })

  it("un puesto recargado reporta el excedente, no lugar negativo", () => {
    const b = roleBudget({ description: bullets(9), currentlyWorking: true }, 2026)
    expect(b.room).toBe(0)
    expect(b.surplus).toBe(3)
    expect(b.state).toBe("over")
  })
})

describe("weakestBullet — la que menos aporta a ESTA vacante", () => {
  const conTermino = { index: 0, text: "Implementé Core Data y bajé el consumo del listado", keywords: ["Core Data"] }
  const sinTermino = { index: 1, text: "Colaboré con el equipo en reuniones de seguimiento semanales", keywords: [] }

  it("la que no aterriza ningún término de la vacante es la primera en caer", () => {
    expect(weakestBullet([conTermino, sinTermino])?.index).toBe(1)
    // Y el orden en que se entregan no cambia la respuesta.
    expect(weakestBullet([sinTermino, conTermino])?.index).toBe(1)
  })

  it("un término exigido pesa más que uno deseable", () => {
    const exigido = { index: 0, text: "Escribí pruebas con XCTest en cada release", keywords: ["XCTest"] }
    const deseable = { index: 1, text: "Documenté el flujo de despliegue del equipo", keywords: ["Confluence"] }
    const pesos = (t: string) => (t === "XCTest" ? 1.5 : 0.5)
    expect(rankByImpact([exigido, deseable], pesos)[0].index).toBe(1)
  })

  it("si ninguna se puede sacrificar, la respuesta es que no hay", () => {
    const fuerte = { index: 0, text: "Implementé Core Data y bajé el consumo del listado un 20%", keywords: ["Core Data"] }
    const otra = { index: 1, text: "Migré la capa de red a async/await en toda la app", keywords: ["async/await"] }
    expect(weakestBullet([fuerte, otra])).toBeNull()
  })
})

const emptyWriting = (over: Partial<WritingChecks> = {}): WritingChecks => ({
  clicheBullets: [], weakVerbBullets: [], duplicateBullets: [], dateInconsistency: null,
  bulletBalance: [], mergeCandidates: [], chronology: null, futureDates: [], yearsClaim: null,
  nearDuplicates: [], bulletRanking: [], incompleteEducation: [], orphanFragments: [],
  metrics: { level: "ok", findings: [] } as unknown as WritingChecks["metrics"],
  degreeInSkills: [], hasLink: true, ...over,
})

const input = (over: Partial<BuildReportInput> = {}): BuildReportInput => ({
  score: 72,
  categories: [
    { category: "hardSkills", coveragePct: 60, weight: .45, share: .45, points: 27, recoverable: 18, basis: "chosen" },
    { category: "impact", coveragePct: 40, weight: .08, share: .08, points: 3, recoverable: 5, basis: "chosen" },
  ],
  writing: emptyWriting(),
  missingKeywords: [], listedOnlyKeywords: [], matchedKeywords: [],
  missingSoftSkills: [], matchedSoftSkills: [], unmetRequirements: [],
  templateSafety: "safe", recruiterFixes: [], ...over,
})

/**
 * EL CASO DE LA CAPTURA. Dos gemelas: la de arriba lleva la cifra y el término
 * del puesto; la de abajo es la versión pelada. El detector marca la SEGUNDA
 * —esa es su pregunta, «¿cuál es la copia?»— y el informe tiene que decidir la
 * otra: cuál sobra.
 */
describe("de dos líneas gemelas se borra la que menos aporta", () => {
  const RICA = "Implementé Core Data para almacenamiento local, mejorando la experiencia un 5%"
  const POBRE = "Implementé Core Data para almacenamiento local, mejorando la experiencia"

  const informe = (indiceDeLaRica: number) => buildAtsReport(input({
    writing: emptyWriting({
      nearDuplicates: [{
        targetId: "job-1", jobTitle: "iOS Developer",
        // Lo que el detector marca: siempre la segunda del documento.
        index: 1, text: indiceDeLaRica === 1 ? RICA : POBRE,
        otherIndex: 0, otherText: indiceDeLaRica === 1 ? POBRE : RICA,
      }] as unknown as WritingChecks["nearDuplicates"],
    }),
    bullets: [
      { targetId: "job-1", index: 0, text: indiceDeLaRica === 1 ? POBRE : RICA, verb: true, metric: indiceDeLaRica !== 1, words: 12, keywords: ["Core Data"] },
      { targetId: "job-1", index: 1, text: indiceDeLaRica === 1 ? RICA : POBRE, verb: true, metric: indiceDeLaRica === 1, words: 12, keywords: ["Core Data"] },
    ],
  }))

  it("con la rica escrita segunda, se borra la primera", () => {
    const c = allChecks(informe(1)).find((x) => x.id.startsWith("tips.near_dup"))
    expect(c?.action?.index).toBe(0)
    expect(c?.evidence?.[0]).toBe(POBRE)
  })

  it("con la rica escrita primera, se borra la segunda", () => {
    const c = allChecks(informe(0)).find((x) => x.id.startsWith("tips.near_dup"))
    expect(c?.action?.index).toBe(1)
    expect(c?.evidence?.[0]).toBe(POBRE)
  })

  it("y ofrece fusionar cuando las dos viven en el mismo puesto", () => {
    const c = allChecks(informe(1)).find((x) => x.id.startsWith("tips.near_dup"))
    expect(typeof c?.params?.otherIndex).toBe("number")
  })
})

/**
 * LA CIFRA QUE FALTA. La categoría `impact` puntuaba y no emitía un solo
 * hallazgo: el panel dibujaba la banda 60-70% y no daba ninguna salida.
 */
describe("pedir una cifra, pero sólo hasta la banda", () => {
  const vinetas = (conCifra: number, total: number) =>
    Array.from({ length: total }, (_, i) => ({
      targetId: "job-1", index: i, text: `Línea ${i} con contenido suficiente para el puesto`,
      verb: true, metric: i < conCifra, words: 9, keywords: i === 0 ? ["Swift"] : [],
    }))

  it("por debajo del piso pide cifra, y con su peso real", () => {
    const r = buildAtsReport(input({ bullets: vinetas(0, 5) }))
    const metricas = allChecks(r).filter((c) => c.id.startsWith("tips.metric."))
    expect(metricas.length).toBeGreaterThan(0)
    expect(metricas[0].weight).toBeGreaterThan(0)
    /**
     * CON BOTÓN, y del motor correcto. El ejecutor puede proponer el tamaño como
     * RANGO —es la doctrina— y la pantalla de confirmación lo pinta como un hueco
     * que el candidato completa: hasta que no escriba el número no se puede
     * aplicar. Lo que se reportó con captura era otra cosa: el botón llamaba a
     * `improve-bullet`, que tiene PROHIBIDO poner una cifra, así que prometía lo
     * que su propio motor no podía dar.
     */
    expect(metricas[0].owner).toBe("tailor")
    expect(metricas[0].action).toMatchObject({ kind: "rewrite_bullet" })
  })

  it("dentro de la banda no pide ninguna: llenar de números lee fabricado", () => {
    const r = buildAtsReport(input({ bullets: vinetas(4, 6) }))
    expect(allChecks(r).filter((c) => c.id.startsWith("tips.metric."))).toHaveLength(0)
  })

  it("no pide cifra sobre una línea que otra tarjeta ya reclamó", () => {
    const r = buildAtsReport(input({
      bullets: vinetas(0, 5),
      writing: emptyWriting({
        orphanFragments: [{ targetId: "job-1", jobTitle: "iOS", index: 0, text: "Línea 0 con contenido suficiente para el puesto", previousText: "x" }] as unknown as WritingChecks["orphanFragments"],
      }),
    }))
    const metricas = allChecks(r).filter((c) => c.id.startsWith("tips.metric."))
    expect(metricas.some((c) => c.action?.index === 0)).toBe(false)
  })
})

/**
 * LOS TRES QUE ENCONTRÓ QA SOBRE ESTE MISMO CAMBIO, con candado.
 *
 * Ninguno lo habría cazado el gate: `tsc`, los 3.651 tests y el build estaban en
 * verde con los tres adentro.
 */
describe("los huecos que QA encontró en lo recién escrito", () => {
  /**
   * El índice de una viñeta es LOCAL a su puesto. Medir con él y reconstruir el
   * dueño buscando por índice y texto colapsaba dos puestos en una tarjeta.
   */
  it("dos puestos con la misma línea en la misma posición dan dos tarjetas distintas", () => {
    const linea = "Coordiné el cierre diario del turno con el equipo de sala"
    const r = buildAtsReport(input({
      bullets: [
        { targetId: "job-A", index: 0, text: linea, verb: true, metric: false, words: 10, keywords: ["Agile"] },
        { targetId: "job-B", index: 0, text: linea, verb: true, metric: false, words: 10, keywords: [] },
      ],
    }))
    const ids = allChecks(r).filter((c) => c.id.startsWith("tips.metric.")).map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain("tips.metric.job-B.0")
  })

  /**
   * El aviso de volumen y el del rango contaban lo mismo con topes distintos. Que
   * midan igual es la mitad; la otra es que no se digan dos veces.
   */
  /**
   * ── CERRADO DE RAÍZ (2026-08-25) ─────────────────────────────────────────
   *
   * La primera versión de esto separaba DOS tarjetas con un filtro, porque el
   * dato lo producían dos lugares. Eso es un parche: el arreglo es que haya UN
   * productor. `bulletBalance` trae ahora el rango y `roleBalance` desapareció,
   * así que la tarjeta es una sola y dice las dos cosas.
   */
  it("un puesto recargado recibe UNA sola tarjeta de volumen, con su rango adentro", () => {
    const r = buildAtsReport(input({
      writing: emptyWriting({
        bulletBalance: [{ targetId: "job-1", jobTitle: "iOS Developer", count: 7, min: 4, max: 6, kind: "too_many" }] as unknown as WritingChecks["bulletBalance"],
      }),
    }))
    const volumen = allChecks(r).filter((c) => c.id.startsWith("tips.balance.") || c.id.startsWith("tips.role_range."))
    expect(volumen).toHaveLength(1)
    expect(volumen[0].id).toBe("tips.balance.job-1")
    expect(volumen[0].titleKey).toBe("check.role_over")
    expect(volumen[0].params).toMatchObject({ count: 7, min: 4, max: 6 })
  })
})

/**
 * DE PUNTA A PUNTA, POR `analyzeWriting`, y no inyectando el resultado.
 *
 * QA marcó el hueco: los dos casos de arriba entran por `buildAtsReport` con
 * `bulletBalance` ya armado a mano, así que si alguien vuelve a aplanar el
 * cálculo interno ningún test lo atrapa. Éste ejecuta la función de verdad.
 *
 * Y fija la distinción que el mismo pase destapó: la BANDA aconseja, el TECHO
 * DURO castiga. Cuatro líneas en un puesto viejo es lo que la doctrina de la casa
 * recomienda escribir — se sugiere recortar, no se cobra.
 */
describe("el consejo mira la banda; la confianza mira el techo duro", () => {
  const puestoViejo = (n: number) => ({
    workExperience: [{
      id: "job-1", jobTitle: "Cajero", employer: "Banco", startDate: "01/2014", endDate: "06/2018",
      description: Array.from({ length: n }, (_, i) => `• Línea ${i + 1} con contenido suficiente para el puesto`).join("\n"),
    }],
  })

  it("un puesto viejo con cuatro líneas recibe el consejo de recortar", () => {
    const w = analyzeWriting(puestoViejo(4))
    expect(w.bulletBalance.find((b) => b.kind === "too_many")?.count).toBe(4)
  })

  it("…y NO le cuesta un punto de confianza: es lo que el producto recomienda", () => {
    const w = analyzeWriting(puestoViejo(4))
    expect(computeCredibility(w).findings.some((f) => f.key === "overloaded_roles")).toBe(false)
  })

  it("pasado el techo que nadie discute, ahí sí cuesta", () => {
    const w = analyzeWriting(puestoViejo(8))
    expect(computeCredibility(w).findings.some((f) => f.key === "overloaded_roles")).toBe(true)
  })
})

/**
 * NINGÚN HALLAZGO SIN PUERTA — los dos de «¿te encuentran?» que la tenían cerrada.
 *
 * Reportado con captura (CEO, 2026-08-25): las tarjetas explicaban bien el
 * problema y cerraban con «esto sólo lo sabés vos: escribilo en el editor».
 */
describe("el cargo y el término viejo tienen botón", () => {
  it("el cargo que la vacante busca se escribe en el titular, y es determinista", () => {
    const r = buildAtsReport(input({
      posting: { jobTitle: "iOS Application Developer", hardSkills: [], softSkills: [], mustHaves: [] },
      categories: [{ category: "title", coveragePct: 40, weight: .15, share: .15, points: 6, recoverable: 9, basis: "chosen" }],
      cvTitles: ["iOS Developer"],
    }))
    const c = allChecks(r).find((x) => x.id === "search.title")
    expect(c?.owner).toBe("auto")
    expect(c?.action).toEqual({ kind: "set_title", value: "iOS Application Developer" })
  })

  it("el término que sólo vive en un puesto viejo se resuelve en el ejecutor", () => {
    const r = buildAtsReport(input({
      staleTerms: [{ term: "iOS Security", jobTitle: "iOS Developer", year: 2016 }],
    }))
    const c = allChecks(r).find((x) => x.id === "search.stale.iOS Security")
    expect(c?.owner).toBe("tailor")
    expect(c?.action).toEqual({ kind: "weave_term", value: "iOS Security" })
    // Y por lo tanto entra al trabajo que el ejecutor puede cerrar.
    expect(solvableChecks(r).some((x) => x.id === c?.id)).toBe(true)
  })
})

/**
 * «APLICAR TODO» NO PUEDE DISPARAR N LLAMADAS AL MODELO.
 *
 * Cazado por QA sobre este mismo cambio: al darle botón a `search.stale.*`, el
 * hallazgo entró solo al plan masivo. Cada uno es una llamada, una cuota y una
 * confirmación — y el modal es UNO, así que con cuatro términos viejos se pagaban
 * cuatro y sobrevivía una. Es la misma regla que el botón ya aplicaba a los
 * términos que faltan: se agregan, no se tejen.
 */
describe("aplicar todo no teje términos", () => {
  const conViejos = () => buildAtsReport(input({
    staleTerms: [
      { term: "iOS Security", jobTitle: "iOS Developer", year: 2016 },
      { term: "Objective-C", jobTitle: "iOS Developer", year: 2016 },
    ],
  }))

  it("los términos viejos NO entran al plan masivo", () => {
    const plan = applyAllPlan(conViejos(), new Set(), new Set())
    expect(plan.checkIds.some((id) => id.startsWith("search.stale."))).toBe(false)
  })

  it("pero siguen siendo trabajo del ejecutor, de a uno", () => {
    expect(solvableChecks(conViejos()).filter((c) => c.action?.kind === "weave_term")).toHaveLength(2)
  })
})

/**
 * NINGÚN HALLAZGO SIN PUERTA — el tercero, y el último que la tenía cerrada.
 *
 * De los `owner: "user"` que quedaban, éste era el único cuyo arreglo NO depende
 * de un dato que sólo el usuario tenga (el correo, el teléfono, las fechas, un
 * hueco de empleo): quitar el glifo del principio es una operación de texto.
 */
describe("el símbolo raro del principio se quita solo", () => {
  it("el hallazgo trae su acción determinista", () => {
    const r = buildAtsReport(input({
      structure: { hasEmail: true, hasPhone: true, emptySections: [], decorativeGlyphs: 3 },
    }))
    const c = allChecks(r).find((x) => x.id === "format.decorative_glyphs")
    expect(c?.owner).toBe("auto")
    expect(c?.action).toEqual({ kind: "strip_glyphs" })
  })

  it("el detector y el arreglo miran el MISMO conjunto de símbolos", () => {
    for (const glifo of ["→", "⇒", "➤", "➔", "✔", "✓", "★", "●", "◆", "■", "▪"]) {
      const linea = `${glifo} Coordiné el cierre diario del turno`
      // Lo que el chequeo cuenta como decorativo…
      expect(DECORATIVE_OPENER.test(linea)).toBe(true)
      // …es exactamente lo que el arreglo sabe sacar.
      expect(stripDecorativeOpener(linea)).toBe("Coordiné el cierre diario del turno")
    }
  })

  it("no toca el marcador del producto ni el texto", () => {
    expect(stripDecorativeOpener("• Coordiné el cierre")).toBe("• Coordiné el cierre")
    expect(stripDecorativeOpener("Coordiné el cierre → sin incidencias")).toBe("Coordiné el cierre → sin incidencias")
  })
})

/**
 * TRES LÍNEAS PARECIDAS SON TRES PARES, Y NO PUEDEN SER DOS TARJETAS IGUALES.
 *
 * Preexistente, medido ejecutando el detector: con tres líneas que se parecen
 * devuelve (1,0), (2,0) y (2,1). El id de la tarjeta lo pone la línea que se
 * borra, así que dos pares distintos producían el MISMO id — y la lista se pinta
 * por id: el usuario veía un hallazgo menos de los que el informe creía tener, y
 * el segundo podía apuntar a una línea que el primero ya borró.
 */
describe("las gemelas no repiten tarjeta sobre la misma línea", () => {
  const L = [
    "Implementé Core Data para almacenamiento local y offline",
    "Implementé Core Data para almacenamiento local sin conexión",
    "Implementé Core Data para el almacenamiento local del listado",
  ]
  const r = () => buildAtsReport(input({
    writing: emptyWriting({
      nearDuplicates: [
        { targetId: "job-1", jobTitle: "iOS", index: 1, text: L[1], otherIndex: 0, otherText: L[0] },
        { targetId: "job-1", jobTitle: "iOS", index: 2, text: L[2], otherIndex: 0, otherText: L[0] },
        { targetId: "job-1", jobTitle: "iOS", index: 2, text: L[2], otherIndex: 1, otherText: L[1] },
      ] as unknown as WritingChecks["nearDuplicates"],
    }),
    bullets: L.map((text, index) => ({ targetId: "job-1", index, text, verb: true, metric: false, words: 8, keywords: [] })),
  }))

  it("ningún id repetido", () => {
    expect(findDuplicateCheckIds(r())).toEqual([])
  })

  it("y ninguna línea aparece en dos tarjetas de gemelas", () => {
    const usadas = allChecks(r())
      .filter((c) => c.id.startsWith("tips.near_dup"))
      .flatMap((c) => [c.action?.index, c.params?.otherIndex])
    expect(new Set(usadas).size).toBe(usadas.length)
  })
})

/**
 * «APLICAR TODO» NO ABRE CINCO PANTALLAS A LA VEZ.
 *
 * Una reescritura que propone una cifra abre la pantalla donde el candidato
 * escribe el número, y esa pantalla es UNA: aplicar cinco de golpe abría cinco y
 * sobrevivía la última. Es el mismo Blocker que QA encontró con el tejido de
 * términos, un día antes, por otra puerta.
 */
describe("aplicar todo no apila confirmaciones", () => {
  const conDos = () => buildAtsReport(input({
    writing: emptyWriting({
      nearDuplicates: [
        { targetId: "job-1", jobTitle: "iOS", index: 1, text: "Implementé Core Data para el almacenamiento local del listado", otherIndex: 0, otherText: "Implementé Core Data para almacenamiento local y offline" },
      ] as unknown as WritingChecks["nearDuplicates"],
    }),
    bullets: [0, 1].map((index) => ({
      targetId: "job-1", index, text: `Implementé Core Data ${index}`, verb: true, metric: false, words: 8, keywords: [],
    })),
  }))

  it("la que todavía no está escrita queda fuera del plan masivo", () => {
    const r = conDos()
    const id = allChecks(r).find((c) => c.id.startsWith("tips.near_dup"))!.id
    // Sin texto listo: aplicarla dispararía una llamada al modelo por cabeza.
    expect(applyAllPlan(r, new Set(), new Set()).checkIds).not.toContain(id)
  })

  it("y con su texto ya escrito, entra", () => {
    const r = conDos()
    const id = allChecks(r).find((c) => c.id.startsWith("tips.near_dup"))!.id
    expect(applyAllPlan(r, new Set(), new Set(), new Set([id])).checkIds).toContain(id)
  })
})
