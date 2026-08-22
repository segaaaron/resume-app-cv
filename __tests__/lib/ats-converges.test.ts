import { describe, it, expect } from "vitest"
import { analyzeWriting } from "@/lib/ats/writing-checks"
import { isImprovableLine, rankRoleBullets, KEEP_PER_ROLE } from "@/lib/ats/bullet-strength"
import { buildAtsReport, type BuildReportInput } from "@/lib/ats/build-report"
import { allChecks } from "@/lib/ats/report"
import type { ATSContentQuality } from "@/lib/services/ai/shared/ai-types"

/**
 * EL PANEL TIENE QUE TERMINARSE.
 *
 * ── LA PREGUNTA DEL CEO, TEXTUAL (2026-08-21) ──────────────────────────────
 *
 *   «Si se resuelve lo que pide tailor, su score puede subir hasta 100, y cuando
 *    vuelva a ejecutar con los cambios el mismo CV ya podré ver resultados en
 *    verde… ¿o es un bucle infinito donde resolvés uno y te manda más y más, así
 *    por cada revisión del ATS?»
 *
 * Era un bucle infinito, y en un sitio concreto. `rankRoleBullets` ORDENA las
 * líneas de un puesto y devuelve las que caen del sexto lugar hacia abajo. Es un
 * ranking, no una vara: en un puesto de nueve líneas siempre sobran tres, y
 * cuando el usuario reescribe la peor y ésta sube, OTRA ocupa su lugar.
 *
 * Estos tests CORREN el bucle sobre las funciones reales. Un test que leyera el
 * código no puede contestar «¿termina?».
 */

/** Nueve líneas SIN un solo defecto de redacción: verbo en pasado, concretas. */
const NUEVE_BUENAS = [
  "Diseñé campañas de conversión para B2B y B2C con seguimiento en CRM",
  "Negocié contratos anuales con clientes corporativos del rubro retail",
  "Coordiné al equipo de prospección sobre la cartera del sur del país",
  "Analicé el embudo de ventas y ajusté la pauta según el costo por registro",
  "Implementé el tablero de indicadores comerciales que usa la gerencia",
  "Capacité a los ejecutivos nuevos en el uso del CRM y su reportería",
  "Recuperé cuentas inactivas mediante una campaña de reactivación por correo",
  "Presenté los resultados trimestrales al comité comercial de la empresa",
  "Segmenté la base de clientes por rubro y tamaño para priorizar visitas",
]

const rolWith = (bullets: string[]) => ({
  id: "job-1",
  jobTitle: "Ejecutivo Comercial",
  employer: "Acme",
  startDate: "2020-01",
  endDate: "2024-01",
  description: bullets.map((b) => `• ${b}`).join("\n"),
})

const emptyContent = () => ({
  totalBullets: 0, quantifiedBullets: 0, quantificationPct: 0,
  weakOpenerBullets: 0, metriclessBullets: [],
}) as unknown as ATSContentQuality

const reportFor = (bullets: string[]) =>
  buildAtsReport({
    score: 90,
    categories: [],
    writing: analyzeWriting({ workExperience: [rolWith(bullets)] }),
    content: emptyContent(),
    missingKeywords: [], listedOnlyKeywords: [], matchedKeywords: [],
    missingSoftSkills: [], matchedSoftSkills: [], unmetRequirements: [],
    templateSafety: "safe",
    recruiterFixes: [],
  } as BuildReportInput)

const dilutes = (bullets: string[]) =>
  allChecks(reportFor(bullets)).filter((c) => c.id.startsWith("tips.dilutes"))

describe("el ranking por sí solo nunca se vacía — por eso hacía falta una vara", () => {
  /**
   * Esto documenta el MOTOR, no un defecto: `rankRoleBullets` contesta «cuáles
   * son las más débiles», y esa pregunta siempre tiene respuesta mientras sobren
   * líneas. El defecto era colgarle un botón de reescribir.
   */
  it("un puesto con nueve líneas siempre tiene tres al fondo del ranking", () => {
    const r = rankRoleBullets([{ id: "job-1", jobTitle: "X", bullets: NUEVE_BUENAS }])
    expect(r[0].weakest.length).toBe(NUEVE_BUENAS.length - KEEP_PER_ROLE)
  })
})

describe("el panel no pide reescribir lo que reescribir no arregla", () => {
  it("nueve líneas bien escritas no generan ninguna tarea de reescritura", () => {
    expect(dilutes(NUEVE_BUENAS)).toEqual([])
  })

  /**
   * EL ERROR SIMÉTRICO. Callar un defecto real sería peor que el bucle: el
   * usuario se queda con una línea mala y sin quien se la arregle.
   */
  it("pero una línea con un defecto real sí lo genera", () => {
    const conDefecto = [...NUEVE_BUENAS.slice(0, 8), "Responsable de ventas"]
    expect(dilutes(conDefecto).length).toBe(1)
  })

  it("y la tarea nombra sólo las líneas mejorables, no las nueve", () => {
    const conDefecto = [...NUEVE_BUENAS.slice(0, 8), "Responsable de ventas"]
    expect(dilutes(conDefecto)[0].evidence).toEqual(["Responsable de ventas"])
  })
})

describe("el bucle termina: arreglar una NO destapa la siguiente", () => {
  /**
   * LA PREGUNTA DEL CEO, EJECUTADA. Se arranca con tres líneas defectuosas, se
   * reescribe una por ronda y se vuelve a analizar el CV entero — que es lo que
   * hace el panel al re-analizar. Antes: siempre tres. Ahora tiene que bajar.
   */
  it("cada arreglo baja el trabajo pendiente hasta cero", () => {
    let bullets = [
      ...NUEVE_BUENAS.slice(0, 6),
      "Responsable de ventas",
      "Encargado del área",
      "Participé en la mejora continua de los procesos comerciales del área",
    ]
    const serie: number[] = []
    for (let ronda = 0; ronda < 6; ronda++) {
      const abiertas = dilutes(bullets)[0]?.evidence ?? []
      serie.push(abiertas.length)
      if (abiertas.length === 0) break
      // El usuario aplica la reescritura de la primera línea señalada.
      const i = bullets.indexOf(abiertas[0])
      bullets = bullets.map((b, k) =>
        k === i ? "Reactivé cuentas dormidas del sur y recuperé su facturación mensual" : b)
    }
    // Estrictamente decreciente y termina en cero: eso es que el bucle cierra.
    expect(serie[serie.length - 1]).toBe(0)
    for (let i = 1; i < serie.length; i++) expect(serie[i]).toBeLessThan(serie[i - 1])
  })

  /** Y la línea con la que se reemplaza no vuelve a ser señalada. */
  it("la línea reescrita no reaparece como trabajo", () => {
    const buena = "Reactivé cuentas dormidas del sur y recuperé su facturación mensual"
    expect(isImprovableLine(buena)).toBe(false)
  })
})

/**
 * EL DIAL NO PROMETE PUNTOS QUE EL PROPIO PANEL DECLARA IMPOSIBLES.
 *
 * ── LA CONTRADICCIÓN, MEDIDA ───────────────────────────────────────────────
 *
 * «No tenemos información errónea hacia el usuario» (CEO, 2026-08-21).
 *
 * Sobre un CV con UN requisito duro sin cumplir:
 *
 *   dial:                          «+25 recuperables»
 *   de esos, del requisito:         19
 *   alcanzables trabajando:          6
 *   techo que declara la tarjeta:   81
 *
 * La tarjeta `hard.requirements` dice, con estas palabras, «ninguna reescritura
 * lo cambia: es un requisito que cumplís o no» — y el dial contaba esos puntos
 * como recuperables igual. Dos números en la misma pantalla, contradiciéndose, y
 * el más grande era el falso.
 */
describe("el dial promete sólo lo alcanzable", () => {
  const cat = (category: string, coveragePct: number, weight: number, share: number) => ({
    category, coveragePct, weight, share,
    points: Math.round(share * coveragePct),
    recoverable: Math.round(share * (100 - coveragePct)),
    basis: "chosen" as const,
  })

  // Duras casi cubiertas; UN requisito duro sin cumplir.
  const categories = [
    cat("hardSkills", 92, 0.45, 0.45 / 1.08),
    cat("mustHaves", 0, 0.20, 0.20 / 1.08),
    cat("title", 100, 0.15, 0.15 / 1.08),
    cat("softSkills", 100, 0.10, 0.10 / 1.08),
    cat("sections", 100, 0.10, 0.10 / 1.08),
    cat("impact", 60, 0.08, 0.08 / 1.08),
  ] as never

  const con = (unmet: string[]) =>
    buildAtsReport({
      score: 75, categories,
      writing: analyzeWriting({ workExperience: [rolWith(NUEVE_BUENAS.slice(0, 4))] }),
      content: emptyContent(),
      missingKeywords: [], listedOnlyKeywords: [], matchedKeywords: [],
      missingSoftSkills: [], matchedSoftSkills: [], unmetRequirements: unmet,
      templateSafety: "safe", recruiterFixes: [],
    } as BuildReportInput)

  it("los puntos del requisito que no puede cumplir no se cuentan como recuperables", () => {
    const conRequisito = con(["Título en Ingeniería Comercial"])
    const mustGap = Math.round((0.20 / 1.08) * 100)
    const todo = (categories as unknown as { recoverable: number }[])
      .reduce((s, c) => s + c.recoverable, 0)
    expect(conRequisito.recoverable).toBe(todo - mustGap)
  })

  /**
   * Y el dial nunca puede prometer más de lo que el techo permite. Ésta es la
   * comprobación que ata los dos números: mientras se cumpla, no pueden volver a
   * contradecirse aunque cambien los pesos.
   */
  it("lo prometido cabe dentro del techo que declara la tarjeta crítica", () => {
    const r = con(["Título en Ingeniería Comercial"])
    const crit = allChecks(r).find((c) => c.id === "hard.requirements")
    expect(crit, "la tarjeta del techo tiene que existir").toBeDefined()
    const techo = Number(crit!.params!.ceiling)
    expect(r.score + r.recoverable).toBeLessThanOrEqual(techo)
  })

  it("sin requisitos sin cumplir, el número no cambia", () => {
    const sinRequisito = con([])
    const todo = (categories as unknown as { category: string; recoverable: number }[])
      .filter((c) => c.category !== "mustHaves")
      .reduce((s, c) => s + c.recoverable, 0)
    expect(sinRequisito.recoverable).toBe(todo)
  })
})
