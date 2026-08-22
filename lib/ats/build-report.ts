// lib/ats/build-report.ts
//
// DONDE LOS OCHO PRODUCTORES SE VUELVEN UNO.
//
// Cada uno sigue calculando lo suyo —el matcher, el análisis del reclutador, los
// chequeos de redacción, el contenido— y está bien que así sea: son preguntas
// distintas y algunas cuestan una llamada y otras son gratis. Lo que estaba mal
// era que los OCHO llegaran sueltos al panel y cada tarjeta decidiera por su
// cuenta qué pintar. Acá se juntan una sola vez, con sección, dueño y salida.
//
// ESTE ARCHIVO NO DIAGNOSTICA. No mira el CV ni decide si algo está mal: recibe
// hallazgos ya calculados y les asigna lugar. Si empieza a juzgar, hay dos
// verdades otra vez y volvemos al defecto que la auditoría encontró.
//
// EL MAPEO DE SECCIONES A CATEGORÍAS DEL PUNTAJE, y por qué es el que es:
//
//   search  → title       la parte de "¿te encuentran?" que HOY puntúa es la
//                         coincidencia de cargo. Fechas, encabezados y contacto
//                         viven acá también, pero no mueven el número: se dicen
//                         con peso 0 en vez de inventarles uno.
//   hard    → hardSkills  y los requisitos obligatorios entran como CHEQUEOS de
//                         esta sección, con su peso real. El diseño no tiene una
//                         sección para ellos y son el 20% del puntaje: dejarlos
//                         afuera habría sido perder la única categoría que explica
//                         por qué un CV no puede llegar a 100.
//   soft    → softSkills
//   other   → null        no tenemos una categoría de "vocabulario del rubro".
//                         Se muestra sin puntaje en vez de fingir uno.
//   format  → sections    lo que hoy mide que el documento parsee entero.
//   tips    → null        lo que mira la persona después del filtro. Peso 0 y
//                         DICHO en pantalla: es la mitad que faltaba del defecto
//                         reportado con captura, donde 100 y "arreglos críticos"
//                         convivían sin que nada explicara cómo.
//
// El modelo de puntaje sigue siendo el de `scoring-config.ts` y cambiarlo es una
// decisión de producto abierta. Este archivo no la prejuzga: lee las categorías
// que existan y no inventa ninguna.

import type { CvFixAction } from "@/lib/services/ai/shared/ai-types"
import type { ReportPosting } from "./report"
import { verdictContradictions } from "./verdict-contradiction"
import type { CategoryBreakdown, ScoreCategory } from "./score-breakdown"
import type { BareYearRole, WritingChecks } from "./writing-checks"
import type { ATSContentQuality } from "@/lib/services/ai/shared/ai-types"
import {
  OVER_OPTIMISATION_SCORE,
  REPORT_SECTIONS,
  type AtsReport,
  type ReportBullet,
  type ReportCheck,
  type ReportSection,
  type ReportSectionId,
  type ReportTerm,
} from "./report"

/** Qué categoría del puntaje respalda cada sección. `null` = no mueve el número. */
const SECTION_CATEGORY: Record<ReportSectionId, ScoreCategory | null> = {
  search: "title",
  hard: "hardSkills",
  soft: "softSkills",
  other: null,
  format: "sections",
  tips: null,
}

/** Un hallazgo del análisis del reclutador, tal como llega hoy. */
/**
 * El texto del hallazgo llega del modelo y a veces arranca cortado.
 *
 * Visto en pantalla el 2026-08-21: una tarjeta titulaba «, bullet [1]: "Diseñar e
 * implementar…"». El modelo había empezado la frase nombrando el puesto, y algo
 * río arriba le cortó la cabeza dejando la coma. Un título que empieza con una
 * coma se lee como un error del producto, no del modelo — y el usuario no
 * distingue entre los dos.
 */
function cleanIssue(issue: string): string {
  const t = issue.replace(/^[\s,;:.\-–—]+/, "").trim()
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : issue.trim()
}

export interface RecruiterFix {
  issue: string
  severity?: string
  fix?: string
  action?: CvFixAction
}

export interface BuildReportInput {
  score: number
  /** Del desglose que ya calcula `score-breakdown.ts`. No se recalcula nada. */
  categories: readonly CategoryBreakdown[]
  writing: WritingChecks
  content: ATSContentQuality
  /** Términos que la vacante pide y el CV no dice. */
  missingKeywords: readonly string[]
  /** Los que dice, pero sólo en la lista de habilidades: una afirmación sin respaldo. */
  listedOnlyKeywords: readonly string[]
  matchedKeywords: readonly string[]
  missingSoftSkills: readonly string[]
  matchedSoftSkills: readonly string[]
  /** Requisitos duros que la vacante declara y el CV no cubre. */
  unmetRequirements: readonly string[]
  templateSafety: "safe" | "caution"
  /** Los hallazgos del análisis del reclutador, ya filtrados por quien llama. */
  recruiterFixes: readonly RecruiterFix[]
  /** La vacante extraída. Viaja por el informe para que el panel no lea el crudo. */
  posting?: ReportPosting
  /** La lectura general del reclutador. Misma razón que `posting`. */
  verdict?: string
  /** Palabras que el CV escribe mal y que la vacante busca bien escritas. */
  typos?: readonly { keyword: string; typed: string }[]
  /** La nota de credibilidad, ya calculada. Este archivo no la recalcula. */
  credibility?: { score: number; findings: readonly { key: string; band: string; count: number }[] }
  /** Contacto y secciones, leídos de los datos estructurados. */
  structure?: {
    hasEmail: boolean
    hasPhone: boolean
    emptySections: readonly string[]
    /** Viñetas del usuario que abren con un glifo raro (flechas, checks). */
    decorativeGlyphs: number
  }
  /**
   * Lo que un parser REAL extrajo del PDF exportado, si el usuario lo verificó.
   *
   * Estos chequeos no se pueden calcular sobre los datos estructurados sin mentir:
   * «¿parsea a dos columnas?» o «¿el contacto quedó en la cabecera?» son preguntas
   * sobre el ARCHIVO RENDERIZADO. Correr las señales de `signals.ts` sobre una
   * concatenación nuestra daría siempre limpio en multi-columna y siempre ausente
   * en encabezados — un falso aprobado y un falso fallo a la vez.
   *
   * Así que aparecen sólo cuando hay medición real. Es nuestra evidencia más
   * fuerte y nadie más la tiene: renderizamos el PDF y leemos lo que sale.
   */
  /** Puestos fuera del rango de viñetas que su antigüedad admite. */
  roleBalance?: readonly { targetId: string; jobTitle: string; count: number; min: number; max: number }[]
  /** Huecos de empleo de seis meses o más. */
  gaps?: readonly { months: number; after: string; before: string }[]
  verified?: {
    formatIssues: readonly string[]
    missingSections: readonly string[]
    hasEmail: boolean
    hasPhone: boolean
    wordCount: number
    pageCount?: number
  }
  /** El texto de la vacante, sólo para contar apariciones por término. */
  jobDescription?: string
  /** El texto del CV, para el mismo conteo del otro lado. */
  resumeText?: string
  /**
   * Las viñetas con su anatomía ya medida.
   *
   * Las provee quien llama y no se derivan acá: `assessResumeContent` sólo
   * devuelve las que NO tienen cifra, así que derivarlas de ahí daba `metric`
   * siempre en falso — lógica muerta que habría informado «ninguna viñeta tiene
   * número» sobre un CV lleno de números. Lo cazó el pase de QA.
   */
  bullets?: readonly ReportBullet[]
}

/** Cuántas veces aparece el término, por palabra completa y sin acentos. */
function countOccurrences(haystack: string, term: string): number {
  if (!haystack || !term.trim()) return 0
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
  const escaped = norm(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return (norm(haystack).match(new RegExp(`\\b${escaped}\\b`, "g")) ?? []).length
}

function coverageOf(categories: readonly CategoryBreakdown[], id: ScoreCategory | null): number | null {
  if (!id) return null
  const cat = categories.find((c) => c.category === id)
  return cat ? Math.round(cat.coveragePct) : null
}

/** Puntos que aún se pueden recuperar en esa categoría, redondeados. */
function recoverableOf(categories: readonly CategoryBreakdown[], id: ScoreCategory | null): number {
  if (!id) return 0
  const cat = categories.find((c) => c.category === id)
  return cat ? Math.round(cat.recoverable) : 0
}

/**
 * «Cajero · 2015 – 2020». El puesto Y la fecha, en una línea.
 *
 * Función suelta y exportada a propósito: nombrar sólo el cargo llegó a pantalla
 * y el test que lo cubría se limitaba a leer que la línea existiera en el código
 * —verde con el defecto puesto—. Acá se puede ejecutar y leer lo que sale.
 */
export function bareYearEvidence(roles: readonly BareYearRole[]): string[] {
  return roles.map((r) => (r.dates.length > 0 ? `${r.jobTitle} · ${r.dates.join(" – ")}` : r.jobTitle))
}

export function buildAtsReport(input: BuildReportInput): AtsReport {
  const checks: ReportCheck[] = []
  const push = (c: ReportCheck) => checks.push(c)

  // ── search ─────────────────────────────────────────────────────────────────
  //
  // Las fechas nombran los puestos. "Tus fechas mezclan formatos" mandaba al
  // usuario a buscar el problema puesto por puesto — la parte que una persona
  // hace peor sobre su propio CV.
  const dates = input.writing.dateInconsistency
  if (dates) {
    push({
      id: "search.dates",
      section: "search",
      state: "warn",
      weight: 0,
      // Dos hallazgos distintos bajo un mismo detector. Cuando hay un año pelado
      // el defecto NO es «mezclás formatos» —eso es la consecuencia—, es que a
      // esas fechas les falta el mes, que es lo único que él puede arreglar.
      titleKey: dates.jobsMissingMonth.length > 0 ? "check.dates_mixed_bare" : "check.dates_mixed",
      detailKey: dates.jobsMissingMonth.length > 0 ? "check.dates_mixed_bare_detail" : "check.dates_mixed_detail",
      // Las clases de formato son jerga del detector («year», «mm/yyyy»): viajan
      // como claves para que el panel las diga en el idioma del usuario.
      params: { formats: dates.formats.join("\u0000") },
      // El mes sólo lo sabe él. Unificar el formato sí lo podemos hacer, pero no
      // podemos inventar un mes que no está.
      owner: dates.jobsMissingMonth.length > 0 ? "user" : "auto",
      action: dates.jobsMissingMonth.length > 0 ? undefined : { kind: "fix_dates" },
      // El puesto Y la fecha. Sólo el puesto se leía como un tema del CV, no como
      // el defecto: «Marketing Digital / Community Manager» no le dice a nadie que
      // el problema es un 2023 sin mes. Los dos datos salen del CV, sin traducir.
      evidence: bareYearEvidence(dates.jobsMissingMonth),
    })
  }

  for (const edu of input.writing.incompleteEducation) {
    push({
      id: `search.education.${edu.index}`,
      section: "search",
      state: "warn",
      weight: 0,
      titleKey: edu.missingDegree ? "check.education_no_degree" : "check.education_no_dates",
      params: { school: edu.school },
      owner: "user",
      evidence: [edu.school],
    })
  }

  // ── LO QUE ESTABA ACÁ, Y POR QUÉ SE FUE ──────────────────────────────────
  //
  // Un hallazgo «N habilidades están sólo en la lista» con sus N chips. Era la
  // TERCERA voz diciendo lo mismo: la tabla de términos ya las agrupa bajo «sólo
  // en la lista» con su conteo auditable a los dos lados, y el ejecutor ya les
  // da una tarjeta con el botón que las escribe dentro de una viñeta.
  //
  // Este no aportaba una responsabilidad propia — enumeraba lo que la tabla
  // enumera, sin el conteo que la vuelve verificable y sin el botón que la
  // resuelve —, y encima llegó a pintar «esto sólo lo sabés vos» sobre términos
  // que tenían salida veinte líneas más abajo. Un dato, un dueño, un lugar.
  //
  // `listedOnlyKeywords` sigue entrando al informe: es lo que marca `listOnly`
  // en cada término (más abajo), y de ahí salen la tabla y el ejecutor.

  // Una errata cuesta la keyword entera: el matcher busca la palabra bien
  // escrita y no la encuentra. Es el arreglo más barato del panel — una palabra.
  for (const w of input.typos ?? []) {
    push({
      id: `search.typo.${w.typed.toLowerCase()}`,
      section: "search",
      state: "warn",
      weight: 0,
      titleKey: "check.typo",
      params: { typed: w.typed, keyword: w.keyword },
      owner: "auto",
      action: { kind: "replace_text", value: w.typed, replacement: w.keyword },
      evidence: [w.typed],
    })
  }

  // ── search: lo que se puede afirmar desde los datos estructurados ─────────
  //
  // Sólo esto. Multi-columna, encabezados no estándar y contacto en cabecera son
  // preguntas sobre el ARCHIVO, no sobre los datos: contestarlas desde acá sería
  // inventar una respuesta.
  const st = input.structure
  if (st && !st.hasEmail) {
    push({
      id: "search.no_email",
      section: "search",
      state: "crit",
      weight: 0,
      titleKey: "check.no_email",
      owner: "user",
    })
  }
  if (st && !st.hasPhone) {
    push({
      id: "search.no_phone",
      section: "search",
      state: "warn",
      weight: 0,
      titleKey: "check.no_phone",
      owner: "user",
    })
  }
  for (const name of st?.emptySections ?? []) {
    push({
      id: `search.empty_section.${name}`,
      section: "search",
      state: "warn",
      weight: 0,
      titleKey: "check.empty_section",
      params: { section: name },
      owner: "user",
      evidence: [name],
    })
  }
  if (st && st.decorativeGlyphs > 0) {
    push({
      id: "format.decorative_glyphs",
      section: "format",
      state: "warn",
      weight: 0,
      titleKey: "check.decorative_glyphs",
      params: { count: st.decorativeGlyphs },
      owner: "user",
    })
  }

  // ── format: lo que midió el parser sobre el PDF REAL ──────────────────────
  const v = input.verified
  if (v) {
    v.formatIssues.slice(0, 6).forEach((issue, i) => {
      push({
        id: `format.real.${i}`,
        section: "format",
        state: "warn",
        weight: 0,
        titleKey: "check.real_format",
        params: { issue },
        owner: "user",
      })
    })
    /**
     * `contact` NO se reporta como sección faltante, y `summary` tampoco.
     *
     * Visto en el navegador: nuestras plantillas no rotulan «Contacto» como
     * encabezado —los datos van bajo el nombre—, así que el detector de secciones
     * lo daba por ausente en TODOS los CV. Un hallazgo que se dispara siempre no
     * informa: enseña a ignorar el panel.
     *
     * La pregunta que sí importa de ese par ya está contestada bien, y con el
     * dato real: si el parser extrajo o no el email del PDF.
     */
    const ALWAYS_UNLABELLED = new Set(["contact", "summary"])
    for (const name of v.missingSections.filter((n) => !ALWAYS_UNLABELLED.has(n))) {
      push({
        id: `search.real_missing_section.${name}`,
        section: "search",
        state: "crit",
        weight: 0,
        titleKey: "check.real_missing_section",
        // El nombre viene en inglés del detector; se traduce en la clave.
        params: { section: name },
        owner: "user",
        evidence: [name],
      })
    }
    // El contacto que el CV tiene y el parser NO encontró: el caso más caro del
    // panel — un candidato al que nadie puede responderle.
    if (st?.hasEmail && !v.hasEmail) {
      push({
        id: "search.email_not_extracted",
        section: "search",
        state: "crit",
        weight: 0,
        titleKey: "check.email_not_extracted",
        owner: "user",
      })
    }
    if (typeof v.pageCount === "number" && v.pageCount > 1 && v.wordCount < 450) {
      // Una segunda página con poco texto: el reclutador la abre y encuentra tres
      // líneas. Casi siempre se arregla apretando el interlineado o la plantilla.
      push({
        id: "format.orphan_page",
        section: "format",
        state: "warn",
        weight: 0,
        titleKey: "check.orphan_page",
        params: { words: v.wordCount },
        owner: "user",
      })
    }
  }

  // ── hard ───────────────────────────────────────────────────────────────────
  //
  // Los requisitos obligatorios entran como chequeo de esta sección con su peso
  // real: son el 20% del puntaje y la única categoría que explica un techo.
  if (input.unmetRequirements.length > 0) {
    push({
      id: "hard.requirements",
      section: "hard",
      state: "crit",
      weight: recoverableOf(input.categories, "mustHaves"),
      titleKey: "check.requirements_unmet",
      detailKey: "check.requirements_ceiling",
      // El techo: por qué este CV NO puede llegar a 100 en esta vacante. Ninguna
      // keyword ni reescritura mueve un requisito duro, así que sin decirlo el
      // usuario persigue puntos que no existen.
      params: {
        count: input.unmetRequirements.length,
        ceiling: Math.max(0, 100 - recoverableOf(input.categories, "mustHaves")),
      },
      owner: "user",
      evidence: [...input.unmetRequirements],
    })
  }

  // ── format ─────────────────────────────────────────────────────────────────
  if (input.templateSafety === "caution") {
    push({
      id: "format.template",
      section: "format",
      state: "warn",
      weight: 0,
      titleKey: "check.template_multicolumn",
      owner: "user",
    })
  }

  if (input.writing.chronology) {
    push({
      id: "format.chronology",
      section: "format",
      state: "warn",
      weight: 0,
      titleKey: "check.chronology_reversed",
      params: { first: input.writing.chronology.firstShown, recent: input.writing.chronology.mostRecent },
      // Reordenar los puestos SÍ se puede hacer solo, y el panel ya sabe hacerlo.
      owner: "auto",
      action: { kind: "fix_dates" },
    })
  }

  for (const f of input.writing.futureDates) {
    push({
      id: `format.future_date.${f.targetId}`,
      section: "format",
      state: "warn",
      weight: 0,
      titleKey: "check.future_date",
      params: { job: f.jobTitle, value: f.value },
      owner: "user",
      evidence: [f.jobTitle],
    })
  }

  // Una línea cortada al importar: la cola de la de arriba, partida por un salto
  // de página. Un renglón que dice "5%." solo es lo más obviamente roto que un
  // reclutador puede ver.
  for (const o of input.writing.orphanFragments) {
    push({
      id: `format.orphan.${o.targetId}.${o.index}`,
      section: "format",
      state: "crit",
      weight: 0,
      titleKey: "check.orphan_fragment",
      params: { job: o.jobTitle },
      owner: "auto",
      action: { kind: "rewrite_bullet", targetId: o.targetId, index: o.index },
      evidence: [o.text],
    })
  }

  // ── tips ───────────────────────────────────────────────────────────────────
  //
  // Peso 0 y dicho en voz alta. Alguien arregló diez cosas, vio la nota quieta y
  // concluyó que el panel mentía — no mentía, callaba.
  for (const n of input.writing.nearDuplicates) {
    push({
      id: `tips.near_dup.${n.targetId}.${n.index}`,
      section: "tips",
      state: "warn",
      weight: 0,
      titleKey: "check.near_duplicate",
      params: { job: n.jobTitle },
      owner: "tailor",
      action: { kind: "rewrite_bullet", targetId: n.targetId, index: n.index },
      evidence: [n.text, n.otherText],
    })
  }

  /**
   * Dos líneas que cuentan el mismo trabajo. La tercera opción.
   *
   * Borrar pierde lo que el candidato hizo; reescribir una no alcanza a la otra.
   * Sólo se ofrece sobre un puesto que ya carga más líneas de las que un
   * reclutador lee, y sobre dos líneas cortas sin cifra — el par lo propone el
   * coseno porque «¿es el mismo trabajo?» es una pregunta temática, y la decide
   * quien hizo el trabajo, no el modelo.
   */
  for (const m of input.writing.mergeCandidates) {
    push({
      id: `tips.merge.${m.targetId}.${m.indexes[0]}.${m.indexes[1]}`,
      section: "tips",
      state: "warn",
      weight: 0,
      titleKey: "check.merge_pair",
      params: { job: m.jobTitle },
      owner: "tailor",
      action: { kind: "rewrite_bullet", targetId: m.targetId, index: m.indexes[0] },
      evidence: [...m.texts],
    })
  }

  /**
   * Cuál sobra, nombrada.
   *
   * El aviso decía «este puesto tiene demasiadas viñetas» y dejaba al candidato
   * decidir cuál cortar — la parte que una persona hace peor sobre su propio CV.
   * Acá van las que diluyen, dichas por su nombre.
   */
  for (const r of input.writing.bulletRanking) {
    if (r.weakest.length === 0) continue
    push({
      id: `tips.dilutes.${r.targetId}`,
      section: "tips",
      state: "warn",
      weight: 0,
      titleKey: "check.dilutes",
      params: { job: r.jobTitle, count: r.weakest.length },
      owner: "tailor",
      action: { kind: "rewrite_bullet", targetId: r.targetId, index: r.weakest[0].index },
      evidence: r.weakest.map((w) => w.text),
    })
  }

  for (const b of input.writing.bulletBalance) {
    push({
      id: `tips.balance.${b.targetId}`,
      section: "tips",
      state: "warn",
      weight: 0,
      titleKey: b.kind === "none" ? "check.role_no_bullets" : "check.role_too_many_bullets",
      params: { job: b.jobTitle, count: b.count },
      // Cuántas líneas lleva un puesto no se arregla reescribiendo una: se
      // arregla cortando, y cuál cortar lo dice `tips.dilutes` con su botón.
      owner: "user",
      evidence: [b.jobTitle],
    })
  }

  for (const r of input.roleBalance ?? []) {
    push({
      id: `tips.role_range.${r.targetId}`,
      section: "tips",
      state: "warn",
      weight: 0,
      titleKey: r.count > r.max ? "check.role_over" : "check.role_under",
      params: { job: r.jobTitle, count: r.count, min: r.min, max: r.max },
      owner: "user",
      evidence: [r.jobTitle],
    })
  }

  for (const g of input.gaps ?? []) {
    push({
      id: `tips.gap.${g.after}.${g.before}`.replace(/\s+/g, "_"),
      section: "tips",
      state: "warn",
      weight: 0,
      titleKey: "check.employment_gap",
      params: { months: g.months, after: g.after, before: g.before },
      owner: "user",
    })
  }

  if (input.writing.yearsClaim) {
    push({
      id: "tips.years_claim",
      section: "tips",
      state: "warn",
      weight: 0,
      titleKey: "check.years_claim",
      params: { claimed: input.writing.yearsClaim.claimed, actual: input.writing.yearsClaim.actual },
      owner: "user",
    })
  }

  if (!input.writing.hasLink) {
    push({
      id: "tips.no_link",
      section: "tips",
      state: "warn",
      weight: 0,
      titleKey: "check.no_link",
      owner: "user",
    })
  }

  if (input.writing.degreeInSkills.length > 0) {
    push({
      id: "tips.degree_in_skills",
      section: "tips",
      state: "warn",
      weight: 0,
      titleKey: "check.degree_in_skills",
      owner: "user",
      evidence: [...input.writing.degreeInSkills],
    })
  }

  // Los hallazgos del reclutador. Llegan del modelo, así que su texto viaja tal
  // cual y el peso es 0: juzgan la redacción, y la redacción no está en el puntaje.
  // UN DUEÑO POR OBJETIVO. Un hallazgo del reclutador que dice «agregá esta
  // habilidad» apunta al mismo objetivo que la fila de esa habilidad en la tabla
  // de términos — que además la muestra con su conteo a los dos lados y con los
  // dos botones. Dejar los dos sería el cruce que este rediseño vino a terminar,
  // reaparecido con otra cara. Gana la tabla, que dice más con menos.
  //
  // Y NINGÚN HALLAZGO SIN SALIDA — la regla, aplicada al caso que la rompía.
  //
  // El modelo devuelve el hallazgo y, cuando puede, la acción que lo cierra.
  // Cuando no puede, lo que llegaba al panel era un reproche sin botón: el CEO
  // veía «13 sin resolver» junto a «resolver 1 pendiente», y los otros doce no
  // se podían resolver desde ninguna parte. Un hallazgo así no informa: ocupa
  // lugar y deja al candidato adivinando qué línea tocar.
  //
  // Lo concreto que esos hallazgos nombran —verbos débiles, líneas repetidas,
  // infinitivos, viñetas sin cifra— YA son chequeos deterministas de este mismo
  // informe, con su línea apuntada y su botón. Y la lectura general del
  // reclutador sigue entera arriba, en el veredicto. Así que lo que no trae
  // acción no se emite: no se pierde nada, y deja de haber trabajo sin salida.
  input.recruiterFixes
    .filter((f) => !!f.action && f.action.kind !== "add_skill" && f.action.kind !== "manual")
    .forEach((f, i) => {
    push({
      id: `tips.recruiter.${i}`,
      section: "tips",
      // NUNCA `crit`, aunque el modelo diga "high".
      //
      // «Crítico» en este panel tiene un significado y es duro: hay algo que te
      // saca de la lista —no tenés email, el parser no lo extrae, falta una
      // sección entera—. Los otros seis emisores de `crit` son hechos
      // verificables de ese tipo. Éste es un JUICIO DE ESTILO del modelo, y
      // además nace inclinado: el campo del prompt se llama `criticalFixes` y la
      // escala tiene dos valores, así que todo lo que sea un poco peor que el
      // resto vuelve como "high".
      //
      // Reportado con captura: «CRÍTICO · no mueve el número» sobre un resumen
      // repetido, con 100 arriba. El hallazgo era CIERTO y útil —el resumen
      // estaba tres veces— y la etiqueta lo volvió sospechoso. Sigue emitiéndose,
      // con su botón, en el nivel que le corresponde.
      state: "warn",
      weight: 0,
      titleKey: "check.recruiter_raw",
      params: { issue: cleanIssue(f.issue) },
      owner: "tailor",
      action: f.action,
    })
  })

  /**
   * De la credibilidad sólo salen los DOS hallazgos que ningún otro chequeo dice.
   *
   * El resto —orden invertido, fecha futura, años que no cuadran, duplicados,
   * fechas mezcladas, el título como habilidad, educación incompleta— ya está
   * arriba con su sección y su botón. Emitirlos otra vez sería el cruce que este
   * informe existe para cerrar, así que la credibilidad aporta su NOTA y nada más.
   */
  const OWNED_ELSEWHERE = new Set([
    "reverse_order", "future_date", "years_contradiction", "duplicates",
    "mixed_dates", "degree_as_skill", "incomplete_education", "overloaded_roles",
  ])
  for (const f of input.credibility?.findings ?? []) {
    if (OWNED_ELSEWHERE.has(f.key)) continue
    push({
      id: `tips.credibility.${f.key}`,
      section: "tips",
      state: f.band === "trust" ? "crit" : "warn",
      weight: 0,
      titleKey: `check.cred_${f.key}`,
      params: { count: f.count },
      owner: "user",
    })
  }

  // ── términos ───────────────────────────────────────────────────────────────
  //
  // El conteo a los dos lados es lo que vuelve el informe AUDITABLE: "lo pide 4
  // veces, tu CV lo dice 0" se verifica leyendo; "te falta esta skill" hay que
  // creerlo.
  const listedOnly = new Set(input.listedOnlyKeywords.map((s) => s.toLowerCase()))
  const termOf = (term: string, matched: boolean, section: ReportTerm["section"]): ReportTerm => ({
    term,
    section,
    jd: countOccurrences(input.jobDescription ?? "", term),
    cv: matched ? Math.max(1, countOccurrences(input.resumeText ?? "", term)) : 0,
    listOnly: listedOnly.has(term.toLowerCase()),
  })
  const terms: ReportTerm[] = [
    ...input.matchedKeywords.map((t) => termOf(t, true, "hard")),
    ...input.missingKeywords.map((t) => termOf(t, false, "hard")),
    ...input.matchedSoftSkills.map((t) => termOf(t, true, "soft")),
    ...input.missingSoftSkills.map((t) => termOf(t, false, "soft")),
  ]

  // ── viñetas ────────────────────────────────────────────────────────────────
  //
  // Verbo · cifra · keyword, por línea. Las tres señales ya existían sueltas en
  // tres lugares; juntas por línea convierten "mejorá tus viñetas" en "a ésta le
  // falta el número", que es una instrucción.
  // ── secciones ──────────────────────────────────────────────────────────────
  const sections: ReportSection[] = REPORT_SECTIONS.map((id) => ({
    id,
    scoreCategory: SECTION_CATEGORY[id],
    coveragePct: coverageOf(input.categories, SECTION_CATEGORY[id]),
    checks: checks.filter((c) => c.section === id),
  }))

  return {
    score: input.score,
    sections,
    terms,
    bullets: [...(input.bullets ?? [])],
    overOptimised: input.score >= OVER_OPTIMISATION_SCORE,
    posting: input.posting,
    /**
     * EL VEREDICTO, SÓLO SI NO CONTRADICE AL INFORME.
     *
     * Último canal que llegaba del modelo sin contrastarse. Es prosa y no se
     * puede volver un chequeo, pero sí se puede comprobar UNA cosa: que no
     * niegue un término que el matcher contó en el CV. Si lo niega, no se
     * muestra — la tabla de al lado dice lo contrario, y un panel que se
     * contradice a la vista hace desconfiar también de lo que tiene bien.
     *
     * Se decide ACÁ y no en `panel-report` porque acá los términos ya son
     * `ReportTerm` con su conteo; allá todavía son nombres sueltos.
     */
    verdict: input.verdict && verdictContradictions(input.verdict, terms).length === 0
      ? input.verdict
      : undefined,
    credibility: {
      score: input.credibility?.score ?? 100,
      // La peor banda ABIERTA, en el orden en que el lector las siente.
      band: (["trust", "authenticity", "polish"] as const).find((b) =>
        (input.credibility?.findings ?? []).some((f) => f.band === b),
      ) ?? null,
    },
  }
}
