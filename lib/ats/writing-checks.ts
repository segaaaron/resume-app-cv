// lib/ats/writing-checks.ts
//
// Deterministic writing-quality checks a keyword matcher can't do, surfaced as
// ACTIONABLE findings (each maps to a real fix button in the report):
//   · cliché / buzzword bullets  → rewrite  ("results-driven", "team player"…)
//   · date-format inconsistency  → normalize ("May 2022" vs "06/2023" breaks ATS
//     tenure parsing — Jobscan/Indeed 2026)
//   · bullet-count balance       → trim / add (recruiters want 3–5 per recent role)
//
// No LLM, no randomness: the same CV always yields the same findings, so they can
// flow through the live re-score. Cliché detection reuses the shared list
// (lib/services/ai/shared/cliches.ts) — one source of truth, never a parallel list.
import { findCliches } from "@/lib/services/ai/shared/cliches"
import { findMergeCandidates, type MergeCandidate } from "./merge-candidates"
import type { SemanticPair } from "@/lib/services/ai/shared/semantic-match"
import { assessMetricCredibility, findDegreeInSkills, hasVerifiableLink, type MetricCredibility } from "./metric-credibility"
import { rankRoleBullets, type RoleBulletRanking } from "./bullet-strength"
import { roleBand, roleBudget } from "./role-budget"
import {
  checkChronology,
  checkFutureDates,
  checkYearsClaim,
  findNearDuplicateBullets,
  findOrphanFragments,
  findIncompleteEducation,
  type ChronologyIssue,
  type FutureDateIssue,
  type YearsClaimIssue,
  type NearDuplicate,
  type OrphanFragment,
  type IncompleteEducation,
} from "./resume-integrity"
import { parseBullets } from "@/lib/services/ai/shared/bullets"
import { opensWeakly } from "@/lib/services/ai/shared/bullet-quality"
import { resolveBulletIndex } from "./bullet-locate"
import type { RepeatedPair } from "@/lib/services/ai/shared/semantic-match"

interface WorkRow {
  id?: string
  jobTitle?: string
  description?: string
  startDate?: string
  endDate?: string
  /** Needed by the chronology and future-date checks: an ongoing role has no end. */
  currentlyWorking?: boolean
}

/** A bullet that opens with / contains a recruiter cliché — quote it, rewrite it. */
export interface ClicheBullet {
  targetId: string
  jobTitle: string
  index: number
  text: string
  cliches: string[]
}

/** A role whose bullet count is off the 3–5 recruiter sweet spot. */
/**
 * Cuántas líneas lleva un puesto contra las que su antigüedad admite.
 *
 * ── POR QUÉ TRAE EL RANGO (2026-08-25) ──────────────────────────────────────
 *
 * Este dato lo producían DOS lugares: acá, con el conteo pelado, y un
 * `roleBalance` dentro del adaptador del panel, con el rango. Los dos medían lo
 * mismo, así que el informe emitía dos tarjetas sobre el mismo puesto —«lleva 7
 * viñetas» y «lleva 7; para su antigüedad, 4-6»— y hubo que separarlas con un
 * filtro. Un filtro que tapa dos productores del mismo dato es exactamente el
 * parche que este proyecto no admite: el arreglo es que haya UN productor.
 *
 * `too_few` no existía acá y sí en el otro: un puesto con una sola línea se lee
 * como si el candidato no hubiera hecho nada ahí, y esa mitad se habría perdido
 * al unificar.
 */
export interface BulletBalance {
  targetId: string
  jobTitle: string
  count: number
  /** El rango que su antigüedad admite, para que la tarjeta lo pueda decir. */
  min: number
  max: number
  kind: "too_many" | "too_few" | "none"
}

/** A bullet opening with a duty phrase ("Responsible for…") — recruiters skim the
 *  first 2–3 words and a duty phrase reads as a task list, not a track record. */
export interface WeakVerbBullet {
  targetId: string
  jobTitle: string
  index: number
  text: string
}

/**
 * A bullet whose text already appears earlier in the CV, word for word.
 *
 * The recruiter analysis reports these in prose ("the same bullet appears twice
 * in Rappi") but had nothing to act on. Detecting them in code names the exact
 * duplicate — index and all — so the report can offer the one fix that applies:
 * delete this line. `duplicateOfJobTitle` is set when the twin lives in another
 * role, which reads very differently to a recruiter (copy-paste across jobs).
 */
export interface DuplicateBullet {
  targetId: string
  jobTitle: string
  index: number
  text: string
  duplicateOfJobTitle: string
}

/**
 * Un puesto cuya fecha lleva sólo el año, con la fecha que lo delata.
 *
 * El puesto solo no alcanza: el usuario lee su propio cargo y no ve el defecto.
 */
export interface BareYearRole {
  jobTitle: string
  /** Las fechas crudas del puesto que vienen sin mes: "2019", "2023". */
  dates: string[]
}

export interface WritingChecks {
  clicheBullets: ClicheBullet[]
  weakVerbBullets: WeakVerbBullet[]
  duplicateBullets: DuplicateBullet[]
  /**
   * Non-null when the CV mixes date formats (confuses ATS tenure parsing).
   *
   * `jobsMissingMonth` names WHICH roles carry a bare year, because the message
   * without them is unusable: "tus fechas mezclan formatos" told the user there
   * was a problem and left him to hunt through every role for it — the one part
   * of the job a person is worst at on their own CV. Reported as such.
   */
  dateInconsistency: { formats: string[]; jobsMissingMonth: BareYearRole[] } | null
  bulletBalance: BulletBalance[]
  /** Pairs of thin bullets in one role that would read better as a single line. */
  mergeCandidates: MergeCandidate[]
  /** Roles listed oldest-first — invisible to a keyword matcher, glaring to a person. */
  chronology: ChronologyIssue | null
  /** End dates that have not happened yet. */
  futureDates: FutureDateIssue[]
  /** The summary claims more (or fewer) years than the dates support. */
  yearsClaim: YearsClaimIssue | null
  /** The same achievement written twice in different words. */
  nearDuplicates: NearDuplicate[]
  /** For each overloaded role: which lines carry it and which dilute it. */
  bulletRanking: RoleBulletRanking[]
  /** Education entries with a school but no degree or no dates. */
  incompleteEducation: IncompleteEducation[]
  /** Bullets that are the tail of the line above, split by a page break on import. */
  orphanFragments: OrphanFragment[]
  /** Whether the figures in this CV can be defended in an interview. */
  metrics: MetricCredibility
  /** Skill entries that are really the candidate's degree. */
  degreeInSkills: string[]
  /** Somewhere a reader can verify the claims — a link of any kind. */
  hasLink: boolean
}

// Duty-phrase openers that read as a task list, not achievements. High-signal
// (unambiguous) on purpose — single overused verbs like "Managed"/"Led" are left
// out to avoid flagging legitimately strong bullets.
/**
 * UN SOLO DUEÑO: `opensWeakly`, en `bullet-quality`.
 *
 * Acá vivía una copia que sólo consultaba `WEAK_OPENERS`, y por eso este archivo
 * no sabía nada de las aperturas NOMINALES que el dueño sí juzga —medido con el
 * CV reportado el 2026-08-27, cuatro líneas rotas y `weakVerbBullets` vacío—.
 * Dos funciones para una pregunta es como una acaba sabiendo algo que la otra no.
 */
const opensWeak = opensWeakly

/** Classify a free-text date into a comparable format family (null = empty/unknown). */
function dateFormatClass(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  if (/^\d{4}$/.test(t)) return "year" // 2015
  if (/^\d{1,2}\/\d{4}$/.test(t)) return "mm/yyyy" // 06/2023
  if (/^\d{4}-\d{1,2}$/.test(t)) return "yyyy-mm" // 2023-06
  if (/^[A-Za-zÁÉÍÓÚÑáéíóúñ]+\.?\s+\d{4}$/.test(t)) return "month yyyy" // May 2022 / Mayo 2022
  return null // anything else is too irregular to compare fairly
}

const MAX_CLICHE = 8
const MAX_BALANCE = 6
const MAX_DUPLICATE = 8
/**
 * Comparison key for "is this the same bullet". Case, accents, punctuation and
 * whitespace are stripped: a duplicate that survived a re-typing is still a
 * duplicate to a recruiter. Short lines are skipped by the caller — two bullets
 * reading "Code reviews" are not a copy-paste defect.
 */
function duplicateKey(bullet: string): string {
  return bullet
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
}
/** Below this a repeated line is a heading-like fragment, not a duplicated achievement. */
const MIN_DUPLICATE_CHARS = 25

/**
 * `semanticPairs` — merge proposals from the last ATS analysis, echoed by the
 * panel so the live recompute offers the same pairs the server found. Absent on
 * the server's own first pass and between analyses, and the merge finder falls
 * back to its deterministic path there.
 */
/**
 * Convierte los pares semánticos en hallazgos de repetición, y los suma a los
 * que el detector léxico ya encontró.
 *
 * DOS DETECTORES, UNA LISTA. El léxico caza la copia con retoques (misma
 * apertura, vocabulario casi idéntico) sin gastar un token; el semántico caza lo
 * mismo dicho con otras palabras y, sobre todo, **entre puestos distintos**, que
 * es donde el léxico no miraba nunca. Publicar dos listas separadas obligaría a
 * cada consumidor —la credibilidad, el informe, el panel— a acordarse de las
 * dos; una lista sola no se puede olvidar.
 *
 * Sin duplicar el hallazgo: si los dos vieron el mismo par, entra una vez.
 */
function mergeRepeats(
  lexical: NearDuplicate[],
  pairs: readonly RepeatedPair[],
  work: readonly WorkRow[],
): NearDuplicate[] {
  if (pairs.length === 0) return lexical
  const byId = new Map(work.filter((j) => j.id).map((j) => [j.id as string, j]))
  /**
   * Dónde está HOY la línea del par, resuelta por su texto.
   *
   * Leía `bullets[index]` a secas y su comentario prometía que «un índice que ya
   * no existe se descarta en silencio». No era eso lo que pasaba: el índice sigue
   * existiendo después de borrar una línea, sólo que apunta a OTRA. La tarjeta
   * acusaba de gemelas a dos líneas que nadie comparó.
   */
  const lineOf = (targetId: string, index: number, snapshot?: string) => {
    const job = byId.get(targetId)
    if (!job) return null
    const bullets = parseBullets(job.description ?? "")
    const at = snapshot ? resolveBulletIndex(bullets, index, snapshot) : index
    const text = at >= 0 ? bullets[at] : undefined
    return text ? { text, index: at, jobTitle: job.jobTitle?.trim() ?? "" } : null
  }
  const key = (a: { targetId: string; index: number }, b: { targetId: string; index: number }) =>
    [`${a.targetId}#${a.index}`, `${b.targetId}#${b.index}`].sort().join("|")

  const out = [...lexical]
  const seen = new Set(
    lexical.map((n) => key({ targetId: n.targetId, index: n.index }, { targetId: n.otherTargetId ?? n.targetId, index: n.otherIndex })),
  )
  for (const p of pairs) {
    // El CV pudo cambiar entre el análisis y este recálculo: un par cuya línea ya
    // no está se descarta en silencio, nunca se muestra una línea que no está.
    const a = lineOf(p.a.targetId, p.a.index, p.a.text)
    const b = lineOf(p.b.targetId, p.b.index, p.b.text)
    if (!a || !b) continue
    // Y si las dos resuelven al MISMO renglón, no hay par: el hallazgo diría que
    // una línea es gemela de sí misma. Pasa cuando una de las dos ya se fusionó.
    if (p.a.targetId === p.b.targetId && a.index === b.index) continue
    /**
     * LA CLAVE SE ARMA CON LOS ÍNDICES VIVOS, no con los del análisis.
     *
     * Cazado en el pase de QA de este mismo cambio: `seen` se siembra con los
     * pares léxicos, que ya vienen con posiciones actuales, y acá se comparaba
     * contra las CONGELADAS. Dos claves distintas para el mismo par de líneas =
     * la tarjeta se emitía dos veces, y con el mismo id, porque el id se arma con
     * el índice resuelto. Es el defecto de las dos tarjetas iguales que este
     * bloque ya había pagado una vez.
     */
    const k = key({ targetId: p.a.targetId, index: a.index }, { targetId: p.b.targetId, index: b.index })
    if (seen.has(k)) continue
    seen.add(k)
    out.push({
      targetId: p.b.targetId,
      jobTitle: b.jobTitle,
      index: b.index,
      text: b.text,
      otherIndex: a.index,
      otherText: a.text,
      otherTargetId: p.a.targetId,
      otherJobTitle: a.jobTitle,
    })
  }
  return out
}

export function analyzeWriting(
  sectionData: Record<string, unknown>,
  semanticPairs: SemanticPair[] = [],
  repeatedPairs: RepeatedPair[] = [],
): WritingChecks {
  const work = (sectionData.workExperience ?? []) as WorkRow[]
  const clicheBullets: ClicheBullet[] = []
  const weakVerbBullets: WeakVerbBullet[] = []
  const bulletBalance: BulletBalance[] = []
  const duplicateBullets: DuplicateBullet[] = []
  const formats = new Set<string>()
  const jobsMissingMonth: BareYearRole[] = []
  // First occurrence wins: the twin is what gets flagged, so applying the fix
  // (delete) always leaves the CV with exactly one copy.
  const firstSeen = new Map<string, { jobTitle: string }>()

  for (const j of work) {
    const id = j.id ?? ""
    const hasContent = !!(j.jobTitle?.trim() || (j.description ?? "").trim())
    const bullets = parseBullets(j.description ?? "")

    bullets.forEach((b, index) => {
      const cl = findCliches(b)
      if (cl.length > 0 && id && clicheBullets.length < MAX_CLICHE) {
        clicheBullets.push({ targetId: id, jobTitle: j.jobTitle ?? "", index, text: b, cliches: cl })
      }
      if (id && opensWeak(b) && weakVerbBullets.length < MAX_CLICHE) {
        weakVerbBullets.push({ targetId: id, jobTitle: j.jobTitle ?? "", index, text: b })
      }
      if (id && b.length >= MIN_DUPLICATE_CHARS) {
        const key = duplicateKey(b)
        const first = firstSeen.get(key)
        if (!first) firstSeen.set(key, { jobTitle: j.jobTitle ?? "" })
        else if (duplicateBullets.length < MAX_DUPLICATE) {
          duplicateBullets.push({
            targetId: id,
            jobTitle: j.jobTitle ?? "",
            index,
            text: b,
            duplicateOfJobTitle: first.jobTitle,
          })
        }
      }
    })

    /**
     * Y ESTE TAMBIÉN PREGUNTA POR LA BANDA, no por el tope plano.
     *
     * Cazado por QA antes de subir: la migración a `roleBudget` había dejado
     * afuera justo el cálculo que alimenta la CREDIBILIDAD (`overloaded_roles`) y
     * la tarjeta `tips.balance`: un puesto actual con siete líneas producía DOS
     * tarjetas diciendo lo mismo con distinta cuenta. El número y la pantalla
     * tienen que salir del mismo dueño.
     *
     * El rango que compara es 3-6 para todo puesto, el mismo que el editor deja
     * escribir. Una banda más estricta acá —la había, por antigüedad— es pedirle
     * al usuario que borre la línea que el editor le acaba de aceptar.
     */
    const presupuesto = roleBudget(j)
    if (id && hasContent && bulletBalance.length < MAX_BALANCE) {
      const fila = { targetId: id, jobTitle: j.jobTitle ?? "", count: presupuesto.count, min: presupuesto.min, max: presupuesto.max }
      if (presupuesto.count === 0) bulletBalance.push({ ...fila, kind: "none" })
      else if (presupuesto.state === "over") bulletBalance.push({ ...fila, kind: "too_many" })
      else if (presupuesto.state === "under") bulletBalance.push({ ...fila, kind: "too_few" })
    }

    for (const d of [j.startDate, j.endDate]) {
      const c = dateFormatClass(d ?? "")
      if (c) formats.add(c)
    }
    // El puesto que lleva un año pelado: es el que hay que tocar — y CUÁL de sus
    // dos fechas. Nombrar sólo el puesto dejaba al usuario leyendo su propio
    // cargo sin entender qué tenía de malo: reportado con captura, el chip decía
    // «Marketing Digital / Community Manager» y se leía como un tema, no como un
    // defecto. La fecha cruda es lo que lo vuelve verificable de un vistazo.
    const bare = ([
      ["start", j.startDate],
      ["end", j.endDate],
    ] as const).filter(([, d]) => dateFormatClass(d ?? "") === "year")
    if (bare.length > 0) {
      const label = (j.jobTitle ?? "").trim()
      if (label && !jobsMissingMonth.some((r) => r.jobTitle === label)) {
        jobsMissingMonth.push({
          jobTitle: label,
          dates: bare.map(([, d]) => (d ?? "").trim()),
        })
      }
    }
  }

  return {
    clicheBullets,
    weakVerbBullets,
    duplicateBullets,
    dateInconsistency: formats.size > 1 ? { formats: [...formats], jobsMissingMonth } : null,
    bulletBalance,
    // Two thin lines telling one story. Deliberately computed here, with the other
    // deterministic checks, so the panel can offer the merge without a model call
    // deciding that a merge is warranted — see merge-candidates.ts.
    mergeCandidates: findMergeCandidates(
      work.map((j) => ({
        targetId: j.id ?? "",
        jobTitle: j.jobTitle ?? "",
        bullets: parseBullets(j.description ?? ""),
        // El rango que su antigüedad admite, medido por el único dueño.
        band: roleBand(j),
      })),
      undefined,
      semanticPairs,
    ),
    // What a recruiter catches in seven seconds and a keyword matcher never can.
    // The year is read here, at the single call site, so the checks themselves stay
    // pure and their tests do not expire.
    chronology: checkChronology(work),
    futureDates: checkFutureDates(work, new Date().getFullYear()),
    yearsClaim: checkYearsClaim(
      typeof sectionData.summary === "string" ? sectionData.summary : "",
      work,
      new Date().getFullYear(),
    ),
    // Las léxicas (misma apertura, o una que no agrega nada) MÁS las semánticas
    // que el análisis encontró con embeddings. Un solo dueño de «esto está
    // repetido»: la credibilidad las cobra y el informe las muestra sin saber
    // cuál de los dos detectores las vio.
    nearDuplicates: mergeRepeats(
      findNearDuplicateBullets(
        work.map((j) => ({ id: j.id, jobTitle: j.jobTitle, bullets: parseBullets(j.description ?? "") })),
      ),
      repeatedPairs,
      work,
    ),
    // The structure check names the problem; this names the instances. Same source
    // of truth for "how many is too many", so the two can never disagree.
    bulletRanking: rankRoleBullets(
      work.map((j) => ({ id: j.id, jobTitle: j.jobTitle, bullets: parseBullets(j.description ?? "") })),
    ),
    incompleteEducation: findIncompleteEducation(
      (sectionData.education ?? []) as { school?: string; degree?: string }[],
    ),
    orphanFragments: findOrphanFragments(
      work.map((j) => ({ id: j.id, jobTitle: j.jobTitle, bullets: parseBullets(j.description ?? "") })),
    ),
    // Judged as a pattern across the whole history, never line by line: whether a
    // single figure is impressive needs context we do not have, whether EVERY
    // figure is an unanchored percentage does not.
    metrics: assessMetricCredibility(work.flatMap((j) => parseBullets(j.description ?? ""))),
    degreeInSkills: findDegreeInSkills(
      ((sectionData.skills ?? []) as { name?: string }[]).map((sk) => sk?.name ?? "").filter(Boolean),
      (sectionData.education ?? []) as { degree?: string; fieldOfStudy?: string }[],
    ),
    hasLink: hasVerifiableLink(sectionData),
  }
}
