// lib/ats/panel-report.ts
//
// EL ADAPTADOR. Lo único que traduce lo que el panel ya tiene al informe.
//
// Vive separado de `build-report.ts` a propósito: aquél sabe de secciones, dueños
// y salidas, y no debe saber nada de la forma de `ATSScoreResult`. Éste sabe de
// la forma que devuelve el servidor, y no decide nada. Si se mezclaran, cambiar
// un campo de la respuesta obligaría a tocar las reglas del informe, que es
// exactamente el acoplamiento que dejó ocho sistemas opinando sueltos.
//
// TAMPOCO CALCULA. Todo lo que entra ya fue calculado por alguien: el matcher, el
// análisis del reclutador, los chequeos deterministas que corren con cada tecla.
// La única cuenta que hace es la de requisitos incumplidos, y la delega en
// `refineMissingRequirements`, que ya existe y ya sabe que "Ingeniería Comercial,
// Administración o afines" es UN requisito escrito en tres renglones.

import type { ATSContentQuality } from "@/lib/services/ai/shared/ai-types"
import type { CategoryBreakdown } from "./score-breakdown"
import type { WritingChecks } from "./writing-checks"
import { refineMissingRequirements } from "./requirement-satisfied"
import { parseBullets } from "@/lib/services/ai/shared/bullets"
import { hasAnyMetric } from "@/lib/services/ai/shared/ai-helpers"
import { WEAK_OPENERS } from "@/lib/services/ai/shared/bullet-quality"
import type { ReportBullet } from "./report"
import { buildAtsReport, type BuildReportInput, type RecruiterFix } from "./build-report"
import { verifiedRecruiterFixes, verifyContextOf } from "./recruiter-verified"
import { reportUxFailure } from "@/lib/client-error-reporter"
import type { AtsReport } from "./report"

/**
 * El CV como texto plano, sólo para contar apariciones por término.
 *
 * No se usa para juzgar nada — para eso están los chequeos, que leen la
 * estructura. Acá alcanza con el texto porque la pregunta es "¿cuántas veces lo
 * dice?", y ésa se contesta leyendo.
 */
function resumeTextOf(sectionData: Record<string, unknown>): string {
  const parts: string[] = []
  const summary = sectionData.summary
  if (typeof summary === "string") parts.push(summary)

  const work = sectionData.workExperience
  if (Array.isArray(work)) {
    for (const j of work as Array<{ jobTitle?: string; employer?: string; description?: string }>) {
      parts.push(j.jobTitle ?? "", j.employer ?? "", j.description ?? "")
    }
  }
  const skills = sectionData.skills
  if (Array.isArray(skills)) {
    for (const s of skills as Array<{ name?: string }>) parts.push(s.name ?? "")
  }
  const certs = sectionData.certifications
  if (Array.isArray(certs)) {
    for (const c of certs as Array<{ name?: string }>) parts.push(c.name ?? "")
  }
  return parts.filter(Boolean).join("\n")
}

/**
 * La anatomía de cada viñeta: verbo · cifra · keyword.
 *
 * Se mide acá y no en el ensamblador porque el ensamblador no lee el CV. Y no se
 * deriva de `assessResumeContent`, que sólo devuelve las viñetas SIN cifra: con
 * eso, `metric` salía siempre en falso y el panel habría informado «ninguna
 * viñeta tiene número» sobre un CV lleno de números. Lo cazó el pase de QA.
 *
 * Las tres señales salen de los mismos módulos que usan los guards del servidor.
 * Reimplementarlas habría creado una cuarta opinión sobre si una línea tiene cifra.
 */
function bulletsOf(sectionData: Record<string, unknown>, terms: readonly string[]): ReportBullet[] {
  const work = Array.isArray(sectionData.workExperience)
    ? (sectionData.workExperience as Array<{ id?: string; description?: string }>)
    : []
  const norm = (x: string) => x.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
  const out: ReportBullet[] = []

  for (const job of work) {
    const lines = parseBullets(job.description ?? "")
    lines.forEach((text, index) => {
      const clean = text.toLowerCase().replace(/^[\s•·▪◦‣∙●○*–—-]+/, "").trim()
      const hay = norm(text)
      out.push({
        targetId: job.id ?? "",
        index,
        text,
        verb: !!clean && !WEAK_OPENERS.some((o) => clean.startsWith(o)),
        metric: hasAnyMetric(text),
        keywords: terms.filter((term) => {
          const escaped = norm(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          return new RegExp(`\\b${escaped}\\b`).test(hay)
        }),
        words: text.trim().split(/\s+/).filter(Boolean).length,
      })
    })
  }
  return out
}

/**
 * Lo que el adaptador necesita del análisis, y nada más.
 *
 * No es `ATSScoreResult` a propósito: el panel maneja su propia forma con los
 * campos opcionales —el análisis puede llegar a medias mientras tailor todavía
 * corre— y atar el adaptador al tipo del servidor obligaba a castear en el borde,
 * que es donde un `as` esconde justo el campo que llegó vacío.
 */
export interface PanelResultLike {
  score: number
  matchedKeywords?: string[]
  missingKeywords?: string[]
  listedOnlyKeywords?: string[]
  missingSoftSkills?: string[]
  demonstratedSoftSkills?: string[]
  templateSafety?: "safe" | "caution"
  scoreBreakdown?: { categories: CategoryBreakdown[] } | null
  extractedKeywords?: { jobTitle?: string; hardSkills?: string[]; softSkills?: string[]; mustHaves?: string[] } | null
  analysis?: { criticalFixes?: RecruiterFix[]; verdict?: string } | null
  typoWarnings?: { keyword: string; typed: string }[]
}

/**
 * Lo que se puede afirmar leyendo los datos estructurados, y sólo eso.
 *
 * Multi-columna, encabezados no estándar y contacto en cabecera son preguntas
 * sobre el ARCHIVO renderizado: `signals.ts` las contesta sobre el texto que un
 * parser extrajo, y correrlas sobre una concatenación nuestra daría siempre
 * limpio en la primera y siempre ausente en la segunda — un falso aprobado y un
 * falso fallo a la vez. Ésas viven en la verificación contra el PDF real.
 */
function structureOf(sectionData: Record<string, unknown>): NonNullable<BuildReportInput["structure"]> {
  const pd = (sectionData.personalDetails ?? {}) as { email?: string; phone?: string }
  const rows = (k: string) => (Array.isArray(sectionData[k]) ? (sectionData[k] as unknown[]) : [])

  const SECTIONS: Array<[string, string]> = [
    ["workExperience", "experience"],
    ["education", "education"],
    ["skills", "skills"],
  ]
  const emptySections = SECTIONS.filter(([key]) => rows(key).length === 0).map(([, name]) => name)

  // Glifos que el USUARIO escribió al principio de una línea. El "• " que el
  // producto guarda no cuenta: lo pone `parseBullets` y no llega al PDF.
  const DECORATIVE = /^[→⇒➤➔✔✓★●◆■▪]/u
  let decorativeGlyphs = 0
  for (const j of rows("workExperience") as Array<{ description?: string }>) {
    for (const line of parseBullets(j.description ?? "")) {
      if (DECORATIVE.test(line.trim())) decorativeGlyphs++
    }
  }

  return {
    hasEmail: !!pd.email?.trim(),
    hasPhone: !!pd.phone?.trim(),
    emptySections,
    decorativeGlyphs,
  }
}

/**
 * Cuántas viñetas aguanta cada puesto, según su antigüedad.
 *
 * Un tope único para todos —el `BULLETS_PER_ROLE_MAX` de hoy— trata igual al
 * puesto actual que a uno de hace diez años, y no son lo mismo: el reclutador
 * lee el de arriba y saltea los de abajo. El rango sale del diseño aprobado.
 *
 * Y el PISO importa tanto como el techo: un puesto con una sola línea se lee como
 * si el candidato no hubiera hecho nada ahí — el caso del contrato corto.
 */
const ROLE_RANGE: Array<{ maxAgeYears: number; min: number; max: number }> = [
  { maxAgeYears: 0, min: 4, max: 6 },    // el actual
  { maxAgeYears: 5, min: 3, max: 4 },    // el anterior
  { maxAgeYears: Infinity, min: 2, max: 3 }, // los viejos
]

function roleBalance(sectionData: Record<string, unknown>): Array<{ targetId: string; jobTitle: string; count: number; min: number; max: number }> {
  const work = Array.isArray(sectionData.workExperience)
    ? (sectionData.workExperience as Array<{ id?: string; jobTitle?: string; description?: string; endDate?: string; currentlyWorking?: boolean }>)
    : []
  const thisYear = new Date().getFullYear()
  const out: Array<{ targetId: string; jobTitle: string; count: number; min: number; max: number }> = []

  for (const j of work) {
    const count = parseBullets(j.description ?? "").length
    if (count === 0) continue
    const end = j.currentlyWorking ? thisYear : Number((j.endDate ?? "").match(/(19|20)\d{2}/)?.[0] ?? thisYear)
    const age = Math.max(0, thisYear - end)
    const band = ROLE_RANGE.find((r) => age <= r.maxAgeYears) ?? ROLE_RANGE[ROLE_RANGE.length - 1]
    if (count > band.max || count < band.min) {
      out.push({ targetId: j.id ?? "", jobTitle: j.jobTitle ?? "", count, min: band.min, max: band.max })
    }
  }
  return out
}

/**
 * Huecos entre puestos, contados en meses.
 *
 * Un reclutador lo mira; un matcher de keywords no lo ve. Sólo se reporta a
 * partir de seis meses: por debajo de eso es una mudanza o dos semanas entre
 * contratos, y avisar de eso es ruido que enseña a ignorar el panel.
 */
function employmentGaps(sectionData: Record<string, unknown>): Array<{ months: number; after: string; before: string }> {
  const work = Array.isArray(sectionData.workExperience)
    ? (sectionData.workExperience as Array<{ jobTitle?: string; startDate?: string; endDate?: string; currentlyWorking?: boolean }>)
    : []
  const months = (v: string | undefined): number | null => {
    if (!v) return null
    const y = Number(v.match(/(19|20)\d{2}/)?.[0] ?? 0)
    if (!y) return null
    const m = Number(v.match(/\b(0?[1-9]|1[0-2])\b/)?.[0] ?? 1)
    return y * 12 + (m - 1)
  }
  const rows = work
    .map((j) => ({ title: j.jobTitle ?? "", from: months(j.startDate), to: j.currentlyWorking ? Infinity : months(j.endDate) }))
    .filter((r): r is { title: string; from: number; to: number } => r.from !== null && r.to !== null)
    .sort((a, b) => a.from - b.from)

  const out: Array<{ months: number; after: string; before: string }> = []
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1]
    const cur = rows[i]
    if (prev.to === Infinity) continue
    const gap = cur.from - prev.to
    if (gap >= 6) out.push({ months: gap, after: prev.title, before: cur.title })
  }
  return out
}

export interface PanelReportInput {
  result: PanelResultLike
  writing: WritingChecks
  content: ATSContentQuality
  sectionData: Record<string, unknown>
  jobDescription: string
  /** La credibilidad, ya calculada por el panel. Acá no se recalcula. */
  credibility?: { score: number; findings: readonly { key: string; band: string; count: number }[] }
  /**
   * Firmas de lo que el usuario ya aceptó.
   *
   * LO APLICADO NO VUELVE. El análisis no tiene memoria: cada corrida lee el CV
   * de cero y un modelo al que se le pide mejorar prosa siempre encuentra otra
   * variante, así que le proponía el resumen que él acababa de reescribir —para
   * siempre. Se filtra acá, en la entrada al informe, y no en cada tarjeta.
   */
  isAlreadyAccepted?: (text?: string | null) => boolean
}

/** Traduce la respuesta del servidor + los chequeos vivos a UN informe. */
export function buildPanelReport(input: PanelReportInput): AtsReport {
  const { result, writing, content, sectionData, jobDescription } = input
  const accepted = input.isAlreadyAccepted ?? (() => false)

  // Un requisito ya cubierto no es una brecha. Sin este refinado, "Ingeniería
  // Comercial, Administración de Empresas, Marketing o afines" contaba como tres
  // incumplidos con el título en el CV — medido: techo 84 contra 97 real.
  const unmetRequirements = refineMissingRequirements(
    [...(result.extractedKeywords?.mustHaves ?? [])],
    sectionData,
  )

  /**
   * EL ÚNICO CANAL DONDE EL MODELO AFIRMABA SIN QUE NADIE COMPROBARA.
   *
   * «El que manda es el ATS» (CEO, 2026-08-21). Los otros siete productores del
   * informe salen de mediciones deterministas; éste llegaba del modelo con un
   * solo filtro —que el usuario no lo hubiera aceptado ya— y de ahí a pantalla.
   * Por eso llegó a verse «"…" en , índice 3»: el modelo perdió el nombre del
   * puesto y lo mostramos con la coma colgando.
   *
   * Ahora cada hallazgo se contrasta contra el CV antes de existir. Lo que se
   * comprueba son HECHOS —la línea existe, la cita está en el documento, la
   * frase está entera—, nunca si el consejo es bueno: eso es del modelo.
   */
  const verifyCtx = verifyContextOf(sectionData, resumeTextOf(sectionData))
  const verified = verifiedRecruiterFixes(
    (result.analysis?.criticalFixes ?? [])
      .filter((f) => !accepted(f.fix))
      .map((f) => ({ issue: f.issue, severity: f.severity, fix: f.fix, action: f.action })),
    verifyCtx,
  )
  const recruiterFixes: RecruiterFix[] = verified.kept

  /**
   * CUANDO EL ÁRBITRO SE LO COME TODO, ESO SE REGISTRA.
   *
   * El recuento por motivo existía y no lo leía nadie — un comentario prometía
   * que servía «para vigilar que el filtro no se coma lo bueno» y el número no
   * llegaba a ninguna parte. Peor que no tenerlo.
   *
   * SÓLO cuando no sobrevive NINGUNO, y por dos razones. Es el único caso que el
   * usuario nota —pagó el uso y ve la sección vacía— y es el único que no puede
   * explicarse por un CV normal: que caiga alguno es el guard haciendo su
   * trabajo; que caigan todos apunta al prompt o a un CV editado entre el
   * análisis y la lectura. Registrar cada descarte parcial llenaría el panel de
   * ruido y taparía justo esto.
   *
   * Va por `reportUxFailure` y no por el logger del servidor: esto corre en el
   * navegador, dentro del `useMemo` del panel, y el servidor no lo ve.
   */
  const rejectedTotal =
    verified.rejected.missing_target + verified.rejected.quote_not_in_cv + verified.rejected.broken_reference
  if (rejectedTotal > 0 && verified.kept.length === 0) {
    reportUxFailure("recruiter_findings_all_dropped", {
      dropped: rejectedTotal,
      missingTarget: verified.rejected.missing_target,
      quoteNotInCv: verified.rejected.quote_not_in_cv,
      brokenReference: verified.rejected.broken_reference,
    })
  }

  const terms = [
    ...(result.matchedKeywords ?? []),
    ...(result.missingKeywords ?? []),
    ...(result.demonstratedSoftSkills ?? []),
    ...(result.missingSoftSkills ?? []),
  ]

  return buildAtsReport({
    score: result.score,
    categories: result.scoreBreakdown?.categories ?? [],
    writing,
    content,
    missingKeywords: result.missingKeywords ?? [],
    listedOnlyKeywords: result.listedOnlyKeywords ?? [],
    matchedKeywords: result.matchedKeywords ?? [],
    missingSoftSkills: result.missingSoftSkills ?? [],
    matchedSoftSkills: result.demonstratedSoftSkills ?? [],
    unmetRequirements,
    templateSafety: result.templateSafety ?? "safe",
    recruiterFixes,
    // La vacante y la lectura general viajan DENTRO del informe. El panel leía
    // las dos del crudo del servidor, y todo lo que salía por esa puerta llegaba
    // a pantalla sin haber pasado por ninguna verificación.
    posting: result.extractedKeywords
      ? {
          jobTitle: result.extractedKeywords.jobTitle ?? "",
          hardSkills: result.extractedKeywords.hardSkills ?? [],
          softSkills: result.extractedKeywords.softSkills ?? [],
          mustHaves: result.extractedKeywords.mustHaves ?? [],
        }
      : undefined,
    verdict: result.analysis?.verdict?.trim() || undefined,
    jobDescription,
    resumeText: resumeTextOf(sectionData),
    bullets: bulletsOf(sectionData, terms),
    typos: result.typoWarnings ?? [],
    credibility: input.credibility,
    structure: structureOf(sectionData),
    roleBalance: roleBalance(sectionData),
    gaps: employmentGaps(sectionData),
  })
}
