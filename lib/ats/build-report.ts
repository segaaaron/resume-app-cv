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
import { isImprovableLine, rankRoleBullets, KEEP_PER_ROLE } from "./bullet-strength"
import { compareImpact, impactOf, rankByImpact, type WeightOf } from "./bullet-impact"
import { weightOf as postingWeightOf } from "./posting-priority"
import { QUANTIFICATION_BAND } from "./scoring-config"
import { normalizeTerm } from "./vocabulary"
import { CREDIBILITY_PENALTIES } from "./scoring-config"
import type { CategoryBreakdown, ScoreCategory } from "./score-breakdown"
import type { BareYearRole, WritingChecks } from "./writing-checks"
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
/**
 * Cuántas cifras se piden de una vez. Pedir ocho es pedir un CV fabricado, y el
 * usuario abandona la lista antes de la tercera.
 */
const MAX_METRIC_ASKS = 3

const SECTION_CATEGORY: Record<ReportSectionId, ScoreCategory | null> = {
  search: "title",
  hard: "hardSkills",
  soft: "softSkills",
  other: null,
  format: "sections",
  /**
   * CONSEJOS SÍ MUEVE EL PUNTAJE, y decía que no.
   *
   * `impact` —viñetas que declaran un resultado medible— vale 0.08 y no tenía
   * sección: se cobraba en el número y no aparecía en ninguna parte del informe.
   * Mientras tanto esta sección se anunciaba «no mueve el puntaje» con chequeos
   * adentro que sí pesan (las líneas repetidas cobran, la cifra que falta cobra).
   * Dos mentiras que se tapaban entre sí.
   *
   * Es su categoría natural: acá viven las viñetas, y el panel de calidad que va
   * debajo dibuja exactamente esa cobertura. Un chequeo que no mueve el número
   * lo sigue diciendo por su cuenta —cada tarjeta declara sus puntos o su cero—,
   * así que nada se pierde al nombrar la categoría de la sección.
   */
  tips: "impact",
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
  /**
   * EL EJEMPLO DESARROLLADO — una línea terminada, con cifras de muestra.
   *
   * Se lo pedimos al modelo desde siempre (`needsFromYou`), el modelo lo escribe,
   * viaja hasta el cliente… y este ensamblador mapeaba únicamente `fix`. Es decir:
   * pagábamos tokens por la mejor parte de la respuesta y la borrábamos antes de
   * que el usuario la viera.
   *
   * NO es texto aplicable y no puede serlo: viaja en su propio campo, la tarjeta
   * lo pinta como ejemplo, y el botón de aplicar sólo mira `fixHint`.
   */
  example?: string
  action?: CvFixAction
}

export interface BuildReportInput {
  score: number
  /** Del desglose que ya calcula `score-breakdown.ts`. No se recalcula nada. */
  categories: readonly CategoryBreakdown[]
  writing: WritingChecks
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
  /**
   * Los cargos que el CV declara, del más reciente al más viejo.
   *
   * `title` es el 25% de «¿te encuentran?» y era la única categoría que puntuaba
   * sin emitir un solo hallazgo: el usuario leía «Searchability 25%» y debajo no
   * había nada que hacer. Para decirle qué cambiar hay que nombrar lo que HOY
   * dice su CV, no sólo lo que la vacante pide.
   */
  cvTitles?: readonly string[]
  /** Años que suman las fechas del CV. Para la brecha de F2, que informa y no cobra. */
  cvYears?: number
  /** Términos que el CV sólo demuestra en puestos viejos (F3). Informan; no cobran. */
  staleTerms?: readonly { term: string; jobTitle: string; year: number }[]
  /**
   * Las habilidades que el CV declara, tal como el usuario las escribió.
   *
   * ── EL DEFECTO (reportado, 2026-08-22) ────────────────────────────────────
   *
   *   «Los ATS no suben casi todos los skills que tengo, sólo me marca estos.»
   *
   * Y era cierto: la tabla de términos se arma SÓLO con lo que la vacante pide.
   * Todo lo que el candidato sabe y esta oferta no nombra no aparecía en ninguna
   * parte del informe — ni como algo que tiene, ni como algo que no cuenta acá.
   *
   * La sección «Otras palabras clave» existía para esto desde el rediseño, con
   * su texto explicativo escrito («vocabulario del oficio: ayuda a que te
   * encuentren, no mueve el puntaje») y CERO contenido: ningún productor le
   * mandaba nunca un término. Un balde declarado y jamás llenado.
   */
  cvSkills?: readonly string[]
  /** Foto cargada y datos personales que en varios mercados se piden NO poner. */
  personalData?: { hasPhoto: boolean; sensitive: readonly string[] }
  /** Términos que el CV repite tanto que se lee escrito para la máquina. */
  stuffedTerms?: readonly { term: string; count: number; sharePct: number }[]
  /** Viñetas escritas en pasiva: el trabajo existe y el autor desaparece. */
  passiveBullets?: readonly { targetId: string; jobTitle: string; index: number; text: string }[]
  /** Huecos de empleo de seis meses o más. */
  gaps?: readonly { months: number; after: string; before: string }[]
  /** El texto de la vacante, sólo para contar apariciones por término. */
  jobDescription?: string
  /** El texto del CV, para el mismo conteo del otro lado. */
  resumeText?: string
  /** Sólo la experiencia laboral: una habilidad que aparece acá está DEMOSTRADA. */
  evidenceText?: string
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
/**
 * Los cargos del CV, una vez cada uno.
 *
 * La lista de origen es el titular del perfil MÁS el cargo de cada puesto, así
 * que un CV con tres puestos del mismo cargo repetía la misma ficha cuatro
 * veces (reportado con captura, 2026-08-24). `normalizeTerm` es el mismo juez
 * con el que el matcher decide si el CV dice un término de la vacante: si para
 * el puntaje dos escrituras son el mismo cargo, para la evidencia también.
 * Se conserva el texto tal como el usuario lo escribió la primera vez.
 */
function dedupeTitles(titles: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of titles) {
    const text = raw.trim()
    if (!text) continue
    const key = normalizeTerm(text)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(text)
  }
  return out
}

export function bareYearEvidence(roles: readonly BareYearRole[]): string[] {
  return roles.map((r) => (r.dates.length > 0 ? `${r.jobTitle} · ${r.dates.join(" – ")}` : r.jobTitle))
}

export function buildAtsReport(input: BuildReportInput): AtsReport {
  const checks: ReportCheck[] = []
  const push = (c: ReportCheck) => checks.push(c)

  /**
   * LO QUE CADA LÍNEA LE APORTA A ESTA VACANTE, en un solo lugar.
   *
   * `input.bullets[].keywords` son los términos de la oferta que esa línea
   * aterriza, contados con el mismo matcher que puntúa — no es una heurística
   * nueva ni cuesta una llamada. Con esto responden igual las tres decisiones
   * que sacrifican una línea: cuál gemela se borra, cuál se corta por volumen y
   * cuál se reemplaza cuando el puesto está lleno.
   */
  const keywordsAt = (targetId: string, index: number): readonly string[] =>
    (input.bullets ?? []).find((b) => b.targetId === targetId && b.index === index)?.keywords ?? []
  /**
   * El peso del término. Sale de la MISMA medición sobre el texto del aviso que
   * usa el puntaje (`posting-priority`), así que la línea que aterriza lo que la
   * vacante EXIGE pesa más que la que aterriza un «deseable». Sin mapa —el
   * re-cálculo instantáneo no siempre lo tiene— todas pesan 1: falla abierto.
   */
  const weightOfTerm: WeightOf = (term) => postingWeightOf(term, input.posting?.hardWeights)

  // ── search ─────────────────────────────────────────────────────────────────
  //
  // Las fechas nombran los puestos. "Tus fechas mezclan formatos" mandaba al
  // usuario a buscar el problema puesto por puesto — la parte que una persona
  // hace peor sobre su propio CV.
  /**
   * EL CARGO. La única parte de «¿te encuentran?» que mueve el número, y no
   * emitía ni un hallazgo.
   *
   * ── EL DEFECTO (reportado con captura, 2026-08-22) ────────────────────────
   *
   * «Searchability 25% — no me dice nada de cómo subirlo.» Y era literal: los
   * seis chequeos de esta sección son condicionales (fechas mezcladas, educación
   * incompleta, erratas, contacto, secciones vacías) y en un CV limpio no
   * dispara ninguno. La sección quedaba con su párrafo introductorio, un 25% y
   * cero salidas — un número que cobra sin decir por qué.
   *
   * Lo que ese 25% mide es la coincidencia de CARGO: la vacante busca «iOS
   * Developer» y el CV se titula de otra manera. Es lo más barato de arreglar de
   * todo el panel —una línea de texto— y era lo único que no se decía.
   *
   * La palabra sigue siendo suya: el botón abre la confirmación con el antes y el
   * después, y escribe sólo el TITULAR. Ver el bloque del `owner` más abajo.
   */
  const wantedTitle = input.posting?.jobTitle?.trim() ?? ""
  const titleCoverage = coverageOf(input.categories, "title")
  if (wantedTitle && titleCoverage !== null && titleCoverage < 100) {
    push({
      id: "search.title",
      section: "search",
      // El peso REAL, no 0. Es la mitad del defecto: la tarjeta que sí puede
      // mover el número tiene que decir cuánto, o se lee como un consejo más.
      weight: recoverableOf(input.categories, "title"),
      state: titleCoverage < 50 ? "crit" : "warn",
      titleKey: "check.title_mismatch",
      detailKey: "check.title_mismatch_detail",
      params: { wanted: wantedTitle, current: input.cvTitles?.[0]?.trim() || "" },
      /**
       * Y AHORA TIENE BOTÓN. Reportado con captura (CEO, 2026-08-25): la tarjeta
       * explicaba bien el problema y cerraba con «esto sólo lo sabés vos:
       * escribilo en el editor». Escribir el cargo que la vacante busca en el
       * TITULAR es determinista, no necesita modelo, y es literalmente lo que la
       * tarjeta aconseja hacer a mano.
       *
       * Toca el titular y NADA más: los cargos de los puestos son historia
       * laboral y no se reescriben nunca —«nunca reclames un cargo que no
       * tuviste» sigue entero—. El titular es cómo se presenta hoy, y pasa por la
       * confirmación que muestra el antes y el después.
       */
      owner: "auto",
      action: { kind: "set_title", value: wantedTitle },
      // Lo que HOY dice el CV, nombrado. Sin esto el aviso manda a buscar el
      // problema puesto por puesto, que es la parte que una persona hace peor
      // sobre su propio CV.
      //
      // SIN REPETIR (reportado con captura, 2026-08-24): la lista es el titular
      // del perfil MÁS el cargo de cada puesto, así que un CV con tres puestos
      // del mismo cargo mostraba la misma ficha cuatro veces. Cuatro copias no
      // informan más que una: hacen dudar de si el panel está contando algo.
      // Se deduplica con `normalizeTerm` —el mismo juez que usa el matcher para
      // decidir si dos términos son el mismo— y se muestra el cargo tal como el
      // usuario lo escribió la primera vez.
      evidence: dedupeTitles(input.cvTitles ?? []).slice(0, 4),
    })
  }

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
      detailKey: "check.decorative_glyphs_detail",
      params: { count: st.decorativeGlyphs },
      /**
       * Y ESTE SÍ SE ARREGLA SOLO. Decía «esto sólo lo sabés vos: escribilo en
       * el editor» sobre lo único de esa lista que NO depende de un dato que el
       * usuario tenga en la cabeza: quitar la flecha con la que abrió la línea es
       * determinista, no cuesta una llamada, y el producto ya pone su propio
       * marcador de viñeta — el glifo del usuario queda duplicando ese trabajo.
       *
       * Toca el PRINCIPIO de la línea y nada más: el texto no se reescribe.
       */
      owner: "auto",
      action: { kind: "strip_glyphs" },
    })
  }

  // ── EL BLOQUE DE LA MEDICIÓN SOBRE EL PDF REAL SE FUE ────────────────────
  //
  // Producía los hallazgos `format.real.*` a partir de lo que un parser extraía
  // del PDF exportado. Dependía de que el usuario apretara «Verificar» —o de un
  // render automático en cada análisis, que costaba un Chrome headless por
  // corrida— y lo que devolvía era un número que él tenía que interpretar solo.
  //
  // Lo que ese camino detectaba de verdad era texto que el parser no puede leer,
  // y eso ahora se PREVIENE en el origen: ninguna plantilla puede exportar con un
  // `letterSpacing` que rompa las palabras. Medido y con guard
  // (`template-parseable-text.test.ts`). Prevenir en la plantilla es mejor que
  // avisarle al candidato de un defecto que no es suyo.

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
  /**
   * DOS LÍNEAS QUE DICEN LO MISMO, Y LO QUE CUESTA.
   *
   * Antes salía con `weight: 0` —«no mueve el puntaje»— y era falso: la
   * credibilidad ya cobraba `duplicatePair` por cada par (con tope
   * `duplicateCap`). Un hallazgo que cuesta puntos y se anuncia como gratis se
   * lee como un consejo opcional, y el usuario lo saltea. El peso sale de la
   * MISMA constante que cobra, repartido entre los pares para no prometer más
   * de lo que el tope puede devolver: la tarjeta y el número no pueden discrepar.
   */
  const dupPairs = input.writing.nearDuplicates.length
  const dupRefund =
    dupPairs > 0
      ? Math.floor(
          Math.min(dupPairs * CREDIBILITY_PENALTIES.duplicatePair.value, CREDIBILITY_PENALTIES.duplicateCap.value) /
            dupPairs,
        )
      : 0
  /**
   * CUÁL DE LAS DOS SE VA, Y POR QUÉ NO ERA LA QUE SE IBA.
   *
   * ── EL DEFECTO (reportado con captura, 2026-08-25) ────────────────────────
   *
   *   «Parece que me aconseja borrar el más fuerte… debería decirme borrar al
   *    más débil o el que menos aporta.»
   *
   * `writing-checks` marca la línea REPETIDA —la segunda en orden del documento,
   * o el lado `b` del par semántico—, que es la pregunta «¿cuál es la copia?».
   * La pregunta que la tarjeta hace es otra: «¿cuál sobra?». Entre una línea con
   * cifra y su versión pelada, el orden del documento decidía cuál moría.
   *
   * Acá se decide con la única vara que este informe tiene para eso
   * (`bullet-impact`): primero lo que le aporta a ESTA vacante, después la
   * redacción, y el orden del documento sólo como desempate — así que un empate
   * exacto sigue borrando la segunda, como antes.
   */
  const twinsOf = (n: (typeof input.writing.nearDuplicates)[number]) => {
    const lados = [
      // PRIMERO LA MARCADA COMO REPETIDA. El orden de esta lista ES el desempate:
      // `compareImpact` no rompe empates y `sort` es estable, así que dos líneas
      // que miden igual dejan como víctima a la que el detector ya señalaba —el
      // comportamiento anterior—. Este cambio sólo mueve los casos donde una de
      // las dos es medible peor, que es exactamente lo reportado.
      { order: 0, targetId: n.targetId, jobTitle: n.jobTitle, index: n.index, text: n.text },
      { order: 1, targetId: n.otherTargetId ?? n.targetId, jobTitle: n.otherJobTitle ?? n.jobTitle, index: n.otherIndex, text: n.otherText },
    ]
    const ranked = rankByImpact(
      lados.map((l) => ({ index: l.order, text: l.text, keywords: keywordsAt(l.targetId, l.index) })),
      weightOfTerm,
    )
    const victima = lados[ranked[0].index] ?? lados[1]
    const sobrevive = lados.find((l) => l !== victima) ?? lados[0]
    return { victima, sobrevive }
  }

  /**
   * UNA LÍNEA, UNA TARJETA — también acá.
   *
   * ── EL DEFECTO (barrido de cierre, 2026-08-25; PREEXISTENTE) ──────────────
   *
   * El detector devuelve TODOS los pares que se parecen, y con tres líneas
   * parecidas eso son tres pares: (1,0), (2,0) y (2,1). Medido ejecutándolo. Como
   * el id de la tarjeta lo pone la línea que se borra, dos pares distintos
   * producían DOS TARJETAS CON EL MISMO id — y la lista se pinta por id, así que
   * React sólo dibuja una y el usuario ve un hallazgo menos de los que el informe
   * cree tener. Peor: la segunda podía apuntar a una línea que la primera ya
   * borró.
   *
   * Cada línea entra en UN par: el primero que la nombre, de cualquiera de los
   * dos lados. Los demás se saltean — no se pierde información, porque la línea
   * ya tiene su tarjeta y resolverla cambia el CV que el próximo análisis lee.
   */
  const reclamadasPorGemelas = new Set<string>()
  for (const n of input.writing.nearDuplicates) {
    const { victima, sobrevive } = twinsOf(n)
    const claveV = `${victima.targetId}::${victima.index}`
    const claveS = `${sobrevive.targetId}::${sobrevive.index}`
    if (reclamadasPorGemelas.has(claveV) || reclamadasPorGemelas.has(claveS)) continue
    reclamadasPorGemelas.add(claveV)
    reclamadasPorGemelas.add(claveS)
    const across = victima.targetId !== sobrevive.targetId
    push({
      id: `tips.near_dup.${victima.targetId}.${victima.index}`,
      section: "tips",
      state: "warn",
      weight: dupRefund,
      // Cruzando puestos NOMBRA LOS DOS. «En Cajero hay dos líneas iguales» sobre
      // una línea que está en Cajero y otra en Vendedor manda a buscar dentro de
      // un puesto algo que no está ahí.
      titleKey: across ? "check.near_duplicate_across" : "check.near_duplicate",
      /**
       * FUSIONAR TAMBIÉN ES SALIDA, y sólo dentro del mismo puesto.
       *
       * ── LA ORDEN (CEO, 2026-08-25) ──────────────────────────────────────
       *
       *   «Si hay duplicidad con los bullets, sugerir fusionar o borrar uno.»
       *
       * Borrar pierde el matiz que la otra línea traía; fusionar lo conserva. Se
       * ofrece con el índice de la gemela que sobrevive, que es lo único que el
       * panel necesita para armar el pedido. CRUZANDO PUESTOS NO: unir una línea
       * de un trabajo con la de otro reescribe la historia laboral, y ésa es una
       * regla que el buscador de fusiones ya tenía escrita.
       */
      params: across
        ? { job: victima.jobTitle, otherJob: sobrevive.jobTitle }
        : { job: victima.jobTitle, otherIndex: sobrevive.index },
      owner: "tailor",
      action: { kind: "rewrite_bullet", targetId: victima.targetId, index: victima.index },
      // LA QUE SE VA, PRIMERO. La tarjeta pinta la evidencia en orden y su botón
      // borra la del `action`: mostrarlas al revés dice, sin decirlo, que se
      // llevará la otra.
      evidence: [victima.text, sobrevive.text],
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
  /**
   * Y EL ORDEN LO DECIDE LA VACANTE, no sólo el parecido.
   *
   * ── LA ORDEN (CEO, 2026-08-22) ────────────────────────────────────────────
   *
   *   «Para unir algo, la IA que sugiera cosas según el puesto que solicita; así
   *    será mejor unir cosas, pero en base a la IA.»
   *
   * QUIÉN propone el par ya lo decide un modelo: el coseno de embeddings, que
   * mide relación temática —«¿es el mismo trabajo?»— y es la única señal que
   * separó los pares reales de los distintos (medido: reales 0.498–0.632,
   * distintos 0.325–0.551; ningún umbral de palabras compartidas lo lograba).
   * Eso NO cambia.
   *
   * Lo que faltaba es CUÁL PRIMERO. Fusionar libera un renglón, y el renglón se
   * libera para esta vacante: el par que más conviene unir es aquel cuyas DOS
   * líneas no dicen nada de lo que la oferta pide. Unir dos líneas que sí le
   * hablan al puesto gasta la acción en el lugar equivocado.
   *
   * La señal sale del mismo sitio que todo lo demás del informe —los términos
   * que cada viñeta aterriza, contados por el matcher que puntúa— y cuesta cero
   * llamadas.
   */
  const bulletKeywordCount = new Map<string, number>()
  for (const b of input.bullets ?? []) bulletKeywordCount.set(`${b.targetId}.${b.index}`, b.keywords.length)
  const sirveAlPuesto = (targetId: string, index: number) => (bulletKeywordCount.get(`${targetId}.${index}`) ?? 0) > 0

  const mergeOrdenado = [...input.writing.mergeCandidates].sort((a, b) => {
    const pa = (sirveAlPuesto(a.targetId, a.indexes[0]) ? 1 : 0) + (sirveAlPuesto(a.targetId, a.indexes[1]) ? 1 : 0)
    const pb = (sirveAlPuesto(b.targetId, b.indexes[0]) ? 1 : 0) + (sirveAlPuesto(b.targetId, b.indexes[1]) ? 1 : 0)
    return pa - pb
  })

  for (const m of mergeOrdenado) {
    // Cuántas de las dos le hablan a esta vacante. Lo dice la tarjeta: «ninguna
    // de las dos dice lo que el puesto pide» es una razón que el candidato puede
    // juzgar; «se parecen» no le dice si le conviene.
    const sirven = (sirveAlPuesto(m.targetId, m.indexes[0]) ? 1 : 0) + (sirveAlPuesto(m.targetId, m.indexes[1]) ? 1 : 0)
    push({
      id: `tips.merge.${m.targetId}.${m.indexes[0]}.${m.indexes[1]}`,
      section: "tips",
      state: "warn",
      weight: 0,
      titleKey: sirven === 0 && (input.bullets ?? []).length > 0 ? "check.merge_pair_offtarget" : "check.merge_pair",
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
  /**
   * QUÉ CORTAR, DICHO POR SU NOMBRE — y con el botón que lo corta.
   *
   * ── EL DEFECTO (reportado con captura, 2026-08-22) ────────────────────────
   *
   * «Si tengo más bullets de lo normal debería sugerirme borrar los más débiles
   * o los que no cuadran para esta posición.» En pantalla había lo contrario:
   * DOS tarjetas por puesto diciendo el mismo dato con otras palabras —«iOS
   * Developer lleva 11 viñetas» y «iOS Developer lleva 11; para su antigüedad,
   * 4-6»— las dos con «esto sólo lo sabés vos: escribilo en el editor». Seis
   * tarjetas para tres puestos, ninguna con salida.
   *
   * Un puesto con once líneas tiene un problema de VOLUMEN y se arregla
   * CORTANDO. Eso ya estaba escrito acá; lo que faltaba era la tijera.
   *
   * ── POR QUÉ ESTO SÍ CONVERGE, Y EL RANKING NO ─────────────────────────────
   *
   * `tips.dilutes` ofrecía REESCRIBIR las últimas del ranking, y reescribir no
   * saca a una línea del último puesto: otra ocupa su lugar y el panel devuelve
   * la misma cantidad para siempre — el bucle infinito que ya se pagó una vez.
   *
   * Cortar sí cierra: se emite EXACTAMENTE el excedente (`count - max`), cada
   * línea que se corta baja el conteo, y al llegar al tope no queda ninguna. El
   * número de tarjetas sólo puede bajar.
   */
  const cutIndexes = new Map<string, Set<number>>()
  /**
   * EL TOPE DEPENDE DE LA ANTIGÜEDAD, y por eso el ranking hay que pedirlo con
   * el tope de ESE puesto.
   *
   * `writing.bulletRanking` ordena con el tope global (6), así que un puesto de
   * hace diez años con cinco líneas —donde se leen tres— no aparecía ahí y se
   * quedaba con la tarjeta sin salida que se reportó: «iOS Developer lleva 5;
   * para su antigüedad, 3-4». Rankear de nuevo con el tope de la banda es
   * gratis: `rankRoleBullets` es puro y las líneas ya viajan en el informe.
   */
  const rankWithKeep = (targetId: string, jobTitle: string, keep: number) => {
    const lines = (input.bullets ?? [])
      .filter((b) => b.targetId === targetId)
      .sort((a, b) => a.index - b.index)
      .map((b) => b.text)
    if (lines.length === 0) return null
    return rankRoleBullets([{ id: targetId, jobTitle, bullets: lines }], keep)[0] ?? null
  }

  /** Cada puesto que carga de más, con el tope que le corresponde. Una entrada por puesto. */
  const overloaded = new Map<string, { jobTitle: string; count: number; max: number }>()
  for (const r of input.writing.bulletRanking) {
    overloaded.set(r.targetId, {
      jobTitle: r.jobTitle,
      count: r.strongest.length + r.weakest.length + r.weakestHidden,
      max: KEEP_PER_ROLE,
    })
  }
  for (const b of input.writing.bulletBalance) {
    if (b.kind !== "too_many") continue
    // El más exigente de los dos topes manda: el de la banda es el que el
    // reclutador aplica, y es siempre igual o más estricto que el global con el
    // que `bulletRanking` ordenó.
    const prev = overloaded.get(b.targetId)
    overloaded.set(b.targetId, {
      jobTitle: b.jobTitle || prev?.jobTitle || "",
      count: b.count,
      max: Math.min(b.max, prev?.max ?? b.max),
    })
  }

  for (const [targetId, role] of overloaded) {
    const { jobTitle, count, max } = role
    const surplus = count - max
    if (surplus <= 0) continue
    const ranked = rankWithKeep(targetId, jobTitle, max)
      ?? input.writing.bulletRanking.find((x) => x.targetId === targetId)
      ?? null
    if (!ranked) continue
    /**
     * PRIMERO LO QUE NO SIRVE PARA ESTA VACANTE, DESPUÉS LO FLOJO.
     *
     * ── LA ORDEN (CEO, 2026-08-22) ────────────────────────────────────────
     *
     *   «Según la posición que se ingresa, elimina bullets que no son
     *    necesarios para esa posición... da sugerencias de eliminar y
     *    reemplazar por otro bullet acorde a la posición.»
     *
     * El ranking de `bullet-strength` mide REDACCIÓN —verbo, cifra, largo— y no
     * sabe nada de la oferta. Así que con once líneas podía proponer cortar una
     * bien escrita sobre Swift y dejar una floja que no le sirve a este puesto.
     * Cortar es la decisión más cara del panel: la que se corta primero tiene
     * que ser la que NO le habla a esta vacante.
     *
     * La relevancia ya está calculada y auditada: `report.bullets[].keywords`
     * son los términos de la oferta que esa línea aterriza, contados con el
     * mismo matcher que puntúa. Cero llamadas al modelo, cero heurística nueva.
     */
    const landsNothing = new Set(
      (input.bullets ?? [])
        .filter((b) => b.targetId === targetId && b.keywords.length === 0)
        .map((b) => b.index),
    )
    /**
     * Y SE ORDENA CON LA MISMA VARA QUE DECIDE CUÁL GEMELA SE BORRA.
     *
     * Esto ordenaba a mano —relevancia sí/no, y el resto lo dejaba al orden del
     * ranking— mientras el borrado de repetidas ordenaba de otra manera. Dos
     * respuestas para «¿cuál sobra?» es exactamente la clase de defecto que este
     * informe existe para cerrar, así que las dos preguntan a `bullet-impact`.
     * Ahí la relevancia pesa por término (un exigido vale más que un deseable),
     * que a mano no se podía hacer.
     */
    const porRelevancia = [...ranked.weakest]
      .map((w) => ({ w, i: impactOf({ index: w.index, text: w.text, keywords: keywordsAt(targetId, w.index) }, weightOfTerm) }))
      .sort((a, b) => compareImpact(a.i, b.i))
      .map((x) => x.w)
    /**
     * Y NO SE OFRECE CORTAR UNA LÍNEA QUE OTRA TARJETA YA RECLAMÓ.
     *
     * ── MEDIDO (2026-08-22, buscándolo a propósito) ──────────────────────────
     *
     * Un puesto recargado con dos líneas casi iguales producía DOS tarjetas sobre
     * el mismo renglón: «fusionala con la 2» y «cortala». Consejos que se
     * anulan: si la corta, la fusión queda sin objeto; si la fusiona, el corte
     * apunta a una línea que ya no existe. Es anterior a los chequeos de hoy — el
     * corte por relevancia lo heredó del corte por ranking.
     *
     * NO se pierde el corte: se SALTEA esa línea y se toma la siguiente del
     * ranking, así que el excedente se sigue cubriendo entero y el puesto llega
     * igual a su tope. Duplicar y fusionar también bajan el conteo, así que el
     * volumen queda resuelto por el camino que ya tenía dueño.
     */
    const yaReclamadas = new Set(
      checks
        .filter((c) => c.action?.kind === "rewrite_bullet" && c.action.targetId === targetId && typeof c.action.index === "number")
        .map((c) => c.action?.index as number),
    )
    const r = { targetId, jobTitle, weakest: porRelevancia.filter((w) => !yaReclamadas.has(w.index)) }
    const cuts = r.weakest.slice(0, surplus)
    if (cuts.length === 0) continue

    /**
     * CON QUÉ REEMPLAZARLA, y sin escribir nada que el candidato no pueda
     * respaldar.
     *
     * Cortar deja un hueco, y decirle «cortá» sin decirle «poné esto» es media
     * instrucción. Lo que va en su lugar NO se improvisa: es un término que ESTA
     * vacante pide y su CV no dice, tomado del mismo informe, y lo escribe el
     * ejecutor con la maquinaria que ya existe (la misma que teje un término
     * dentro de una viñeta). El candidato confirma; nadie afirma nada por él.
     *
     * Si no falta ningún término, no se sugiere reemplazo: la línea sobra por
     * volumen y basta con cortarla.
     */
    const faltante = [...input.missingKeywords]
      .sort((a, b) => countOccurrences(input.jobDescription ?? "", b) - countOccurrences(input.jobDescription ?? "", a))[0]
    cutIndexes.set(r.targetId, new Set(cuts.map((c) => c.index)))
    for (const w of cuts) {
      push({
        id: `tips.cut.${r.targetId}.${w.index}`,
        section: "tips",
        state: "warn",
        weight: 0,
        // Dos títulos, porque son dos diagnósticos distintos: «no le habla a esta
        // vacante» es una razón que el candidato puede juzgar; «es de las más
        // flojas» es otra. Decir la equivocada le hace borrar la línea que no era.
        titleKey: landsNothing.has(w.index) ? "check.cut_irrelevant" : "check.cut_bullet",
        detailKey: landsNothing.has(w.index) ? "check.cut_irrelevant_detail" : "check.cut_bullet_detail",
        params: { job: r.jobTitle, count, max, ...(faltante ? { replacement: faltante } : {}) },
        // `auto` y no `user`: cortar una línea es determinista —no hace falta
        // modelo ni cuota—, y `user` habría pintado «esto sólo lo sabés vos:
        // escribilo en el editor», que es la frase sin salida que se reportó.
        // La decisión sigue siendo suya: el corte pasa por una confirmación que
        // muestra la línea entera antes de tocarla.
        owner: "auto",
        action: { kind: "rewrite_bullet", targetId: r.targetId, index: w.index },
        evidence: [w.text],
      })
    }
  }

  for (const r of input.writing.bulletRanking) {
    /**
     * SÓLO LAS QUE UNA REESCRITURA PUEDE ARREGLAR — no las últimas del ranking.
     *
     * `weakest` es el resultado de ORDENAR: en un puesto de nueve líneas siempre
     * sobran tres, y al reescribir la peor otra ocupa su lugar. Medido sobre el
     * propio algoritmo: seis rondas, tres hallazgos cada una, para siempre. El
     * usuario resolvía y el panel le devolvía la misma cantidad — el bucle
     * infinito que el CEO preguntó si existía. Existía.
     *
     * Que un puesto tenga demasiadas líneas es un problema de VOLUMEN y se
     * arregla cortando, no reescribiendo. Eso ya tiene dueño: `tips.balance` y
     * `tips.role_range`, sin botón, porque cuál cortar lo decide él.
     */
    // UNA VIÑETA, UN LUGAR. Una línea que ya tiene tarjeta de CORTE no puede
    // tener además tarjeta de REESCRITURA: son dos consejos opuestos sobre el
    // mismo renglón, y quien los lee no sabe cuál de los dos le hicimos caso.
    /**
     * Mismo criterio que el corte: si otra tarjeta ya reclamó la línea, ésta no
     * la vuelve a nombrar. Antes sólo cedía ante el corte, y quedaba pisando a
     * los duplicados y a la fusión — el mismo defecto una fila más abajo.
     */
    const reclamadasAqui = new Set(
      checks
        .filter((c) => c.action?.kind === "rewrite_bullet" && c.action.targetId === r.targetId && typeof c.action.index === "number")
        .map((c) => c.action?.index as number),
    )
    const mejorables = r.weakest.filter((w) => !reclamadasAqui.has(w.index) && isImprovableLine(w.text))
    if (mejorables.length === 0) continue
    push({
      id: `tips.dilutes.${r.targetId}`,
      section: "tips",
      state: "warn",
      weight: 0,
      titleKey: "check.dilutes",
      params: { job: r.jobTitle, count: mejorables.length },
      owner: "tailor",
      action: { kind: "rewrite_bullet", targetId: r.targetId, index: mejorables[0].index },
      evidence: mejorables.map((w) => w.text),
    })
  }

  /**
   * CUÁNTAS LÍNEAS LLEVA EL PUESTO — una tarjeta, con su rango.
   *
   * Eran DOS —`tips.balance` y `tips.role_range`— alimentadas por dos
   * productores del mismo dato, y decían lo mismo con distinta cuenta. Se
   * separaban con un filtro; ahora hay un solo productor y una sola tarjeta.
   */
  for (const b of input.writing.bulletBalance) {
    // El puesto que ya recibió tarjetas de CORTE no vuelve a recibir el aviso de
    // volumen: es el mismo dato dicho dos veces, y la segunda vez sin salida.
    if (b.kind === "too_many" && cutIndexes.has(b.targetId)) continue
    push({
      id: `tips.balance.${b.targetId}`,
      section: "tips",
      state: "warn",
      weight: 0,
      titleKey: b.kind === "none"
        ? "check.role_no_bullets"
        : b.kind === "too_few" ? "check.role_under" : "check.role_over",
      params: { job: b.jobTitle, count: b.count, min: b.min, max: b.max },
      // Cuántas líneas lleva un puesto no se arregla reescribiendo una: se
      // arregla cortando, y cuál cortar lo dice `tips.dilutes` con su botón.
      owner: "user",
      // SIN EVIDENCIA. El título ya dice el puesto y la cuenta; repetirlo debajo
      // en una ficha gris no lo vuelve accionable, ocupa alto y no lleva a ningún
      // lado.
    })
  }

  /**
   * LA CIFRA QUE FALTA — la categoría que puntuaba sin emitir un solo hallazgo.
   *
   * ── EL DEFECTO (reportado por el CEO, 2026-08-25) ─────────────────────────
   *
   *   «Veo igual que no sugieres métricas, no sé si es porque ya tiene el
   *    currículum o es que tenemos un bug metido ahí sobre ese tema.»
   *
   * Era un bug, y de los caros: `impact` vale 0.08 del puntaje —hasta 8 puntos—,
   * el panel dibuja la banda de cuantificación con su porcentaje… y NINGÚN
   * chequeo pedía nunca una cifra. `input.content`, que trae las viñetas sin
   * número ya localizadas, entraba a esta función y no se leía en ninguna línea:
   * un productor completo conectado a nada. El usuario veía «60-70%» como meta y
   * cero salidas para llegar — el mismo defecto que tenía `search.title` antes de
   * emitir su tarjeta.
   *
   * ── Y NO EMPUJA AL 100%, QUE ES EL OTRO LADO DEL MISMO ERROR ──────────────
   *
   * La meta es la BANDA (60-70%): un CV donde todas las líneas terminan en un
   * número se lee fabricado, y este mismo panel avisa de eso una pantalla más
   * arriba. Así que sólo se pide cifra mientras el CV esté POR DEBAJO del piso, y
   * se piden exactamente las que faltan para entrar — nunca «cuantificá todo».
   *
   * QUÉ LÍNEA SE ELIGE: la que más le aporta a esta vacante entre las que no
   * tienen número. Cuantificar la línea que el reclutador va a leer rinde más que
   * cuantificar la que no le habla al puesto — y de esa última ya se ocupan las
   * tarjetas de corte. Misma vara que todo lo demás (`bullet-impact`), al revés.
   *
   * La cifra NO la escribe el producto: el ejecutor propone el tamaño como RANGO
   * y el candidato lo confirma o lo corrige. Es la doctrina de la casa, y por eso
   * `owner: "tailor"` y no `auto`.
   */
  const todasLasVinetas = input.bullets ?? []
  const conCifra = todasLasVinetas.filter((b) => b.metric).length
  const pctCifra = todasLasVinetas.length > 0 ? Math.round((conCifra / todasLasVinetas.length) * 100) : 0
  if (todasLasVinetas.length > 0 && pctCifra < QUANTIFICATION_BAND.min) {
    const objetivo = Math.ceil((todasLasVinetas.length * QUANTIFICATION_BAND.min) / 100)
    const faltan = Math.max(0, objetivo - conCifra)
    // Una viñeta, un lugar: la que ya tiene tarjeta (corte, gemela, fusión,
    // reescritura) no recibe una segunda que pida otra cosa sobre el mismo renglón.
    const reclamadas = new Set(
      checks
        .filter((c) => c.action?.kind === "rewrite_bullet" && typeof c.action.index === "number")
        .map((c) => `${c.action?.targetId}::${c.action?.index}`),
    )
    /**
     * EL ÍNDICE ES LOCAL AL PUESTO, ASÍ QUE NO ALCANZA PARA IDENTIFICAR UNA LÍNEA.
     *
     * Cazado por QA antes de subir: la primera versión ordenaba `impactOf(...)`
     * —que sólo lleva índice y texto— sobre las viñetas de TODO el CV, y después
     * reconstruía el dueño buscando por índice y texto. Dos puestos con la misma
     * línea en la misma posición colapsaban en UNA tarjeta con el mismo id, y el
     * botón habría escrito sobre el puesto equivocado. La viñeta se mide, pero la
     * identidad viaja al lado — nunca se re-deduce.
     */
    const candidatas = todasLasVinetas
      .filter((b) => !b.metric && !reclamadas.has(`${b.targetId}::${b.index}`))
      .map((b) => ({ vineta: b, impacto: impactOf({ index: b.index, text: b.text, keywords: b.keywords }, weightOfTerm) }))
      // Al revés que el corte: primero la que MÁS aporta.
      .sort((a, b) => compareImpact(b.impacto, a.impacto))
    const elegidas = candidatas.slice(0, Math.min(faltan, MAX_METRIC_ASKS))
    // El peso REAL, repartido: la categoría existe y se puede recuperar entera
    // arreglando estas líneas. Prometer más de lo que el desglose devuelve sería
    // la contradicción que el dial ya pagó una vez.
    const impactoRecuperable = recoverableOf(input.categories, "impact")
    const porTarjeta = elegidas.length > 0 ? Math.floor(impactoRecuperable / elegidas.length) : 0
    for (const { vineta: dueño } of elegidas) {
      push({
        id: `tips.metric.${dueño.targetId}.${dueño.index}`,
        section: "tips",
        state: "warn",
        weight: porTarjeta,
        titleKey: "check.add_metric",
        detailKey: "check.add_metric_detail",
        params: { pct: pctCifra, min: QUANTIFICATION_BAND.min, max: QUANTIFICATION_BAND.max },
        /**
         * EL TAMAÑO LO PONE EL CANDIDATO. Y por eso acá no va un botón.
         *
         * ── EL DEFECTO (reportado con captura, 2026-08-25) ──────────────────
         *
         *   «¿Para qué ponemos improve bullet si al final no nos dejará
         *    realizarlo? Si no hay mejora no debería salir.»
         *
         * Tenía razón, y el defecto era mío: emití esta tarjeta con botón, y el
         * botón llama a un motor que TIENE PROHIBIDO poner una cifra. Su
         * instrucción es literal —«nunca escribas un número y nunca lo pidas; si
         * la fuente no tiene cifra, mejorá la redacción»—, así que sobre una
         * línea ya bien escrita contestaba lo único honesto que podía: «no puedo
         * mejorarla sin inventar datos». Un botón que promete lo que su motor
         * tiene prohibido dar.
         *
         * El número lo sabe una sola persona. La tarjeta dice QUÉ falta y DÓNDE
         * —eso es lo que el candidato no sabe—; el dato lo pone él, y el chequeo
         * se cierra solo en cuanto lo escribe, porque este informe se recalcula
         * con cada tecla.
         *
         * ── Y AHORA TIENE BOTÓN, PORQUE HAY UN MOTOR QUE PUEDE CUMPLIRLO ───
         *
         * El ejecutor SÍ tiene permiso para proponer el tamaño como RANGO —es la
         * doctrina de la casa— y su reescritura llega marcada. La pantalla de
         * confirmación pinta la cifra propuesta como un hueco, el candidato
         * escribe el número, y hasta que no lo escriba no se puede aplicar. El
         * producto pone lo que sabe —dónde va la cifra—; él pone lo que sólo él
         * sabe. Nadie inventa nada y nadie queda sin salida.
         */
        owner: "tailor",
        action: { kind: "rewrite_bullet", targetId: dueño.targetId, index: dueño.index },
        evidence: [dueño.text],
      })
    }
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

  /**
   * LA BRECHA DE AÑOS — INFORMA, NO CASTIGA (F2).
   *
   * La vacante pide un número de años y las fechas del CV suman otro. Es de las
   * señales que un ATS real sí extrae, así que decirlo es honesto; cobrarlo no,
   * mientras no esté medido contra CVs reales: `weight: 0` y `state: "warn"`.
   *
   * Un requisito mal juzgado no baja unos puntos — baja el TECHO alcanzable, y
   * eso ya se pagó una vez con la licenciatura que el CV sí tenía. Por eso esto
   * no entra a `mustHaves` ni resta: se muestra, y el candidato decide.
   */
  /**
   * EL TÉRMINO QUE SÓLO VIVE EN UN PUESTO VIEJO (F3).
   *
   * La recencia ya pesa en el TÍTULO —un cargo viejo cobra crédito reducido— y
   * la investigación dice que los ATS reales la miran también en las
   * habilidades. Acá se INFORMA y no se cobra: mover el número por una señal sin
   * calibrar hace que el mismo CV valga distinto sin que el candidato toque
   * nada, que es justo lo que la medición de la prioridad dejó demostrado.
   *
   * Sólo él sabe si sigue usando esa herramienta. Si la usa, el ejecutor escribe
   * la línea que lo demuestra en un puesto reciente y él la confirma; si no la
   * usa, deja el hallazgo como está. Ver el bloque del `owner` más abajo.
   */
  for (const st of input.staleTerms ?? []) {
    push({
      id: `search.stale.${st.term}`,
      section: "search",
      state: "warn",
      weight: 0,
      titleKey: "check.stale_term",
      detailKey: "check.stale_term_detail",
      params: { term: st.term, job: st.jobTitle, year: st.year },
      /**
       * Y SU SALIDA, que existía y no estaba conectada.
       *
       * Decía «sólo vos sabés si seguís usando esa herramienta» y ahí terminaba.
       * Pero si la sigue usando, lo que hay que hacer es nombrarla en un puesto
       * reciente — que es EXACTAMENTE lo que hace el tejido de un término en una
       * viñeta, la misma maquinaria que ya resuelve los términos que faltan. El
       * candidato sigue decidiendo: el ejecutor propone la línea y él confirma.
       */
      owner: "tailor",
      action: { kind: "weave_term", value: st.term },
    })
  }

  const yearsRequired = input.posting?.yearsRequired ?? 0
  if (yearsRequired > 0 && input.cvYears !== undefined && input.cvYears < yearsRequired) {
    push({
      id: "search.years_gap",
      section: "search",
      state: "warn",
      weight: 0,
      titleKey: "check.years_gap",
      params: { required: yearsRequired, actual: input.cvYears },
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

  /**
   * VOZ PASIVA: el trabajo sin dueño. Se reescribe, así que lleva botón.
   *
   * Es la misma pérdida que las aperturas débiles por otra puerta gramatical: la
   * frase existe, la acción existe, y el candidato no aparece en ninguna parte.
   */
  /**
   * UNA VIÑETA, UN LUGAR — y este chequeo llega último, así que cede.
   *
   * ── MEDIDO AL AGREGARLO (2026-08-22) ─────────────────────────────────────
   *
   * «Fue desarrollada la capa de red…» recibía DOS tarjetas: una de fusión y una
   * de pasiva. Dos consejos distintos sobre el mismo renglón, y quien los lee no
   * sabe a cuál le hizo caso — el defecto que este panel ya pagó tres veces.
   *
   * La precedencia es por ORDEN DE EMISIÓN y no por una regla nueva: duplicados,
   * fusión, corte y dilución ya reclamaron sus líneas más arriba. La pasiva es
   * un defecto de REDACCIÓN, y cuando el ejecutor reescribe esa línea por
   * cualquiera de los otros motivos la arregla igual — la doctrina le exige
   * primera persona activa en todo lo que escribe.
   */
  const reclamadas = new Set(
    checks
      .filter((c) => c.action?.kind === "rewrite_bullet" && c.action.targetId && typeof c.action.index === "number")
      .map((c) => `${c.action?.targetId}.${c.action?.index}`),
  )
  for (const b of input.passiveBullets ?? []) {
    if (reclamadas.has(`${b.targetId}.${b.index}`)) continue
    push({
      id: `tips.passive.${b.targetId}.${b.index}`,
      section: "tips",
      state: "warn",
      weight: 0,
      titleKey: "check.passive_voice",
      detailKey: "check.passive_voice_detail",
      params: { job: b.jobTitle },
      owner: "tailor",
      action: { kind: "rewrite_bullet", targetId: b.targetId, index: b.index },
      evidence: [b.text],
    })
  }

  /**
   * RELLENO DE KEYWORDS, MEDIDO.
   *
   * El aviso viejo miraba el PUNTAJE —un proxy malo: castigaba al CV honesto que
   * de verdad cubre la vacante y dejaba pasar al que repite un término catorce
   * veces por debajo del techo—. Acá se mide la conducta: cuántas veces lo dice y
   * qué proporción del texto ocupa, con los dos números a la vista para que él
   * pueda comprobarlo leyendo.
   *
   * `owner: "user"` y sin botón a propósito: cuál de esas apariciones sobra lo
   * sabe quien hizo el trabajo. Quitar la equivocada le cuesta la coincidencia.
   */
  for (const t of input.stuffedTerms ?? []) {
    push({
      id: `tips.stuffing.${t.term.toLowerCase().replace(/\s+/g, "_")}`,
      section: "tips",
      state: "warn",
      weight: 0,
      titleKey: "check.keyword_stuffing",
      detailKey: "check.keyword_stuffing_detail",
      params: { term: t.term, count: t.count, share: t.sharePct },
      owner: "user",
    })
  }

  /**
   * FOTO Y DATOS PERSONALES — INFORMATIVOS, sin botón. Ver `personal-data.ts`:
   * no existe una respuesta correcta que el producto pueda aplicar solo, porque
   * la misma foto es un acierto o un descarte según a dónde se postule.
   */
  if (input.personalData?.hasPhoto) {
    push({
      id: "tips.photo",
      section: "tips",
      state: "warn",
      weight: 0,
      titleKey: "check.photo_market",
      detailKey: "check.photo_market_detail",
      owner: "user",
      informational: true,
    })
  }
  for (const kind of input.personalData?.sensitive ?? []) {
    push({
      id: `tips.personal_data.${kind}`,
      section: "tips",
      state: "warn",
      weight: 0,
      titleKey: "check.personal_data",
      detailKey: `check.personal_data_${kind}`,
      owner: "user",
      informational: true,
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
      /**
       * EL CAMBIO A HACER, QUE VENÍA VIAJANDO Y NO LLEGABA A NINGUNA PARTE.
       *
       * `RecruiterFix.fix` existe desde siempre, el modelo lo devuelve («el
       * cambio exacto a hacer», dice el prompt en los dos idiomas) y este
       * `push()` lo ignoraba. La tarjeta quedaba con la cita y un botón, sin
       * decir nunca qué iba a pasar al apretarlo.
       */
      fixHint: f.fix?.trim() || undefined,
      // El ejemplo, por fin conectado (F2.5). Sin botón: es para leerlo y poner
      // tu número, no para pegarlo.
      exampleHint: f.example?.trim() || undefined,
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
  /**
   * ── EL CERO QUEMADO (medido, 2026-08-22) ─────────────────────────────────
   *
   * Esto ponía `cv: 0` a todo término que el SERVIDOR había marcado como
   * faltante, sin volver a mirar el CV. Y el CV cambia entre una llamada y la
   * siguiente: el usuario escribe una viñeta que dice «GraphQL», el panel se
   * rehace al instante con los datos vivos… y la tabla le sigue diciendo que su
   * CV no lo dice. Medido: escribir el término dejaba el conteo en 0 → 0.
   *
   * De ahí colgaba todo lo demás: el término seguía contando como trabajo del
   * ejecutor, «aplicar todo» lo volvía a ofrecer, y el usuario veía el panel
   * ignorando la mejora que acababa de aplicar.
   *
   * ── QUIÉN DECIDE QUÉ ─────────────────────────────────────────────────────
   *
   * El servidor decide QUÉ TÉRMINOS EXISTEN —eso sale de la vacante y sólo
   * cambia si cambia la oferta—. El CV VIVO decide SI ESTÁN. Mezclar las dos
   * preguntas es lo que congelaba el cero.
   *
   * El `matched ? 1` se conserva y es la parte sutil: un término que el servidor
   * dio por presente por sinónimo («APIs REST» ≈ «RESTful APIs») no aparece
   * literal en el texto, y contarlo sólo por letra lo devolvería a «faltante».
   * Se toma el mayor de los dos: lo que el CV dice hoy, o lo que el análisis ya
   * había probado.
   */
  const termOf = (term: string, matched: boolean, section: ReportTerm["section"]): ReportTerm => ({
    term,
    section,
    jd: countOccurrences(input.jobDescription ?? "", term),
    cv: Math.max(countOccurrences(input.resumeText ?? "", term), matched ? 1 : 0),
    listOnly: listedOnly.has(term.toLowerCase()),
  })
  const terms: ReportTerm[] = [
    ...input.matchedKeywords.map((t) => termOf(t, true, "hard")),
    ...input.missingKeywords.map((t) => termOf(t, false, "hard")),
    ...input.matchedSoftSkills.map((t) => termOf(t, true, "soft")),
    ...input.missingSoftSkills.map((t) => termOf(t, false, "soft")),
  ]

  /**
   * LO QUE EL CANDIDATO SABE Y ESTA OFERTA NO PIDE.
   *
   * No mueve el puntaje y la sección lo dice en voz alta —`SECTION_CATEGORY.other`
   * es `null`—, porque el puntaje es CONTRA ESTA VACANTE y no un inventario. Pero
   * callarlo dejaba al usuario creyendo que el análisis no ve sus habilidades.
   *
   * Se compara con `normalizeTerm`, la misma función con la que el matcher
   * decide presencia: si acá dijéramos «esto la vacante no lo pide» sobre algo
   * que el matcher SÍ contó, el informe se contradiría solo.
   */
  const asked = new Set(terms.map((t) => normalizeTerm(t.term)))
  for (const skill of input.cvSkills ?? []) {
    const name = skill.trim()
    const norm = normalizeTerm(name)
    if (!norm || asked.has(norm)) continue
    asked.add(norm)
    terms.push({
      term: name,
      section: "other",
      jd: countOccurrences(input.jobDescription ?? "", name),
      cv: Math.max(1, countOccurrences(input.resumeText ?? "", name)),
      // Sin viñeta detrás, una habilidad de la lista es una afirmación. Se dice
      // con la misma vara que las duras: aparece en la experiencia o no.
      listOnly: countOccurrences(input.evidenceText ?? "", name) === 0,
    })
  }

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
    /**
     * LO QUE SE PUEDE RECUPERAR TRABAJANDO — no todo lo que falta.
     *
     * Del desglose, que es quien lo calcula. Derivarlo de los pesos de los
     * chequeos dejaba fuera los términos —la palanca más grande— y el panel
     * prometía «+0» con treinta puntos en juego.
     *
     * ── PERO LOS REQUISITOS NO ENTRAN, Y ESO ES EL ARREGLO ────────────────
     *
     * «No tenemos información errónea hacia el usuario» (CEO, 2026-08-21).
     * Teníamos, y era el número más grande de la pantalla.
     *
     * `mustHaves` son los requisitos duros de la vacante. La tarjeta
     * `hard.requirements` los declara SIN salida, con estas palabras: «ninguna
     * reescritura lo cambia: es un requisito que cumplís o no», y publica el
     * TECHO que imponen. Sumarlos igual a «recuperables» hacía que el dial y esa
     * tarjeta se contradijeran en la misma pantalla.
     *
     * Medido sobre un CV con un requisito sin cumplir:
     *
     *   dial:                        «+25 recuperables»
     *   de esos, del requisito:       19
     *   alcanzables trabajando:        6
     *   techo que declara la tarjeta:  81  (= 100 − 19)
     *
     * El usuario perseguía diecinueve puntos que no existen para él, y el propio
     * panel se lo decía dos tarjetas más abajo.
     *
     * Cuando la vacante no lista requisitos, o él los cumple, esta categoría
     * aporta 0 y excluirla no cambia nada: el número sólo se mueve justo cuando
     * estaba mintiendo.
     */
    recoverable: input.categories
      .filter((c) => c.category !== "mustHaves")
      .reduce((sum, c) => sum + c.recoverable, 0),
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
