// lib/services/ai/shared/bullet-quality.ts
// Deterministic per-bullet quality signals.
//
// improve-bullet currently asks the model to decide which bullets lack a figure
// and returns status "metric_missing" so the UI can ask the user for it. That
// decision does not need a language model: whether a sentence contains a number
// is a regex, and a regex gives the same answer every time and costs nothing.
//
// Same split that made improve-summary work: the algorithm detects, the model
// only writes.
import { hasAnyMetric } from "./ai-helpers"
import { parseBullets } from "./bullets"
import { hasCliche } from "./cliches"
import type { ATSContentQuality } from "./ai-types"

/** Openers that describe a duty instead of an achievement. */
/**
 * Duty openers, kept apart BY LANGUAGE rather than in one bag.
 *
 * The prompts quote this list so a phrase is banned in one place and enforced in
 * one place. Quoting the wrong half teaches nothing: a first attempt at deriving
 * the two sides with a regex put "Participated in" into the Spanish prompt,
 * because "particip" is a prefix of both languages' word. The split is data now,
 * not a guess.
 */
export const WEAK_OPENERS_EN: readonly string[] = [
  "responsible for", "in charge of", "assisted with", "helped with",
  "worked on", "duties included", "tasked with", "involved in",
  "participated in", "contributed to",
]
export const WEAK_OPENERS_ES: readonly string[] = [
  "responsable de", "encargado de", "encargada de", "apoyé en", "apoye en",
  "ayudé con", "ayude con", "trabajé en", "trabaje en",
  "mis funciones incluían", "participé en", "participe en", "colaboré en",
]
export const WEAK_OPENERS: readonly string[] = [...WEAK_OPENERS_EN, ...WEAK_OPENERS_ES]

/**
 * Con qué SÍ abrir. La otra mitad de la regla, que faltaba.
 *
 * El prompt decía «abrí con un verbo de acción fuerte» y a continuación la lista
 * de los prohibidos. Nombraba el error y no el acierto: el modelo tenía que
 * adivinar qué cuenta como fuerte, y en los CVs no técnicos —donde el vocabulario
 * del oficio es justo lo que hay que aportar— adivinaba flojo.
 *
 * ── PRIMERA PERSONA EN ESPAÑOL, Y NO ES UN DETALLE ─────────────────────────
 *
 * Existía ya una lista `IMPACT_VERBS` en `summary-quality.ts`, pero en TERCERA
 * persona: «lideró», «desarrolló», «implementó». Son exactamente las formas que
 * `opensInThirdPersonEs` —el guard de este mismo archivo— rechaza, porque una
 * viñeta de CV la escribe el candidato, no un tercero que informa sobre él.
 * Cablear aquella lista al prompt le habría dado al modelo ejemplos que su
 * propio guard tira: el prompt empujando en una dirección y el filtro en la
 * contraria, que es el patrón de contradicción que este proyecto ya pagó caro.
 *
 * Aquella lista se queda donde está y para lo suyo: mide con qué abre un
 * RESUMEN, que no se escribe en primera persona conjugada («Cajera con
 * experiencia en…»). Son dos preguntas distintas y por eso son dos listas.
 *
 * SEPARADAS POR IDIOMA COMO DATO, no con regex — misma razón que WEAK_OPENERS:
 * un intento con regex metió aperturas inglesas en el prompt español porque las
 * raíces se solapan.
 */
export const IMPACT_OPENERS_EN: readonly string[] = [
  "led", "built", "designed", "implemented", "automated", "delivered",
  "launched", "negotiated", "coordinated", "resolved", "trained", "audited",
  "reconciled", "streamlined", "reduced", "increased", "recovered", "prepared",
]
export const IMPACT_OPENERS_ES: readonly string[] = [
  "lideré", "construí", "diseñé", "implementé", "automaticé", "entregué",
  "gestioné", "negocié", "coordiné", "resolví", "capacité", "audité",
  "cuadré", "atendí", "reduje", "incrementé", "recuperé", "preparé",
]

/**
 * A Spanish bullet written as if somebody else were reporting on the candidate.
 *
 * The -ó preterite is third person: "Ejecutó suites con Selenium" is a sentence
 * ABOUT the candidate, and a CV line is written BY them. Measured on a real CV,
 * tailor returned two of them straight into the work history.
 *
 * Narrow on purpose — only the FIRST word, only when it ends in the accented -ó
 * that marks the third-person preterite. A noun cannot end that way in Spanish
 * without being a verb form, so this cannot fire on ordinary vocabulary, and it
 * stays silent on English, where the same form does not exist.
 */
export function opensInThirdPersonEs(text: string): boolean {
  const first = text.replace(/^[\s•·▪‣*\-–—]+/, "").trim().split(/\s+/)[0] ?? ""
  return /^[a-zá-úñ]+ó$/i.test(first)
}

export interface BulletAssessment {
  /** Position in the original description, 0-based. */
  index: number
  text: string
  /** The bullet states a real figure. */
  hasMetric: boolean
  /** The bullet opens by describing a duty rather than an achievement. */
  weakOpener: boolean
}

export interface DescriptionQuality {
  bullets: BulletAssessment[]
  /** Share of bullets carrying a real figure, 0-1. NaN-free: 0 when empty. */
  quantificationRatio: number
  /** Indices of bullets with no figure — what to ask the user about. */
  missingMetricIndices: number[]
  /** Indices of bullets that open with a duty phrase. */
  weakOpenerIndices: number[]
}

function opensWeakly(text: string): boolean {
  const lower = text.toLowerCase().trim()
  return WEAK_OPENERS.some((o) => lower.startsWith(o))
}

/**
 * Scores each bullet of a work-experience description.
 *
 * Reports, never judges: a bullet without a figure is not automatically bad —
 * plenty of real work has no number attached, and demanding one is exactly what
 * used to push the model into hard-coding "[N users]". Callers decide what to do
 * with the ratio; this only says what is there.
 */
export function assessDescription(description: string): DescriptionQuality {
  const bullets = parseBullets(description).map((text, index) => ({
    index,
    text,
    hasMetric: hasAnyMetric(text),
    weakOpener: opensWeakly(text),
  }))

  const withMetric = bullets.filter((b) => b.hasMetric).length

  return {
    bullets,
    quantificationRatio: bullets.length ? withMetric / bullets.length : 0,
    missingMetricIndices: bullets.filter((b) => !b.hasMetric).map((b) => b.index),
    weakOpenerIndices: bullets.filter((b) => b.weakOpener).map((b) => b.index),
  }
}

/**
 * Aggregate content-quality across every work-experience description, reusing the
 * per-description assessDescription (no new regex). Reported, never scored.
 */
export function assessResumeContent(sectionData: Record<string, unknown>): ATSContentQuality {
  // sectionData is client-controlled (z.unknown), so workExperience may be anything.
  // Guard against a non-array value that would make for..of throw a 500.
  const raw = sectionData?.workExperience
  const work = (Array.isArray(raw) ? raw : []) as Array<{ id?: string; jobTitle?: string; description?: string }>
  const METRICLESS_LIMIT = 4
  let totalBullets = 0
  let quantifiedBullets = 0
  let weakOpenerBullets = 0
  const metriclessBullets: ATSContentQuality["metriclessBullets"] = []
  for (const job of work) {
    const q = assessDescription(job?.description ?? "")
    totalBullets += q.bullets.length
    quantifiedBullets += q.bullets.filter((b) => b.hasMetric).length
    weakOpenerBullets += q.weakOpenerIndices.length
    for (const b of q.bullets) {
      // Surface weak bullets LOCATED: no figure OR a duty opener. Weak openers
      // are the most improvable without hard-coding a number, so include them too.
      if ((!b.hasMetric || b.weakOpener) && metriclessBullets.length < METRICLESS_LIMIT) {
        metriclessBullets.push({
          text: b.text,
          targetId: job?.id ?? "",
          jobTitle: job?.jobTitle ?? "",
          index: b.index,
          weakOpener: b.weakOpener,
        })
      }
    }
  }
  return {
    totalBullets,
    quantifiedBullets,
    quantificationPct: totalBullets ? Math.round((quantifiedBullets / totalBullets) * 100) : 0,
    weakOpenerBullets,
    metriclessBullets,
  }
}


/**
 * Is there anything here an AI rewrite can actually fix?
 *
 * The improvement loop is not a UI problem, it is a stopping problem: asked to
 * improve text, a model always returns another variant, because "leave it alone"
 * is the one answer it will not volunteer. So the decision to stop cannot be the
 * model's — it has to be made in code, before the call.
 *
 * "Actionable" is deliberately narrow, and excludes a missing figure. We refuse
 * to hard-code numbers, so a bullet with no metric is not something the AI can
 * repair; treating it as a defect is what kept the button alive forever on
 * bullets that were already fine.
 *
 * @returns the 0-based indices worth rewriting. Empty means: do not call.
 */
export function actionableBulletIndices(description: string): number[] {
  const { bullets } = assessDescription(description)
  return bullets
    .filter((b) => {
      if (b.weakOpener) return true                 // opens with a duty, not an achievement
      if (hasCliche(b.text)) return true            // "team player", "results-driven"
      const words = b.text.trim().split(/\s+/).length
      if (words < 6) return true                    // too thin to say anything
      if (words > 45) return true                   // a paragraph pretending to be a bullet
      return false
    })
    .map((b) => b.index)
}

/** Nothing an AI rewrite can fix — the honest answer is "this is already fine". */
export function isDescriptionOptimized(description: string): boolean {
  return parseBullets(description).length > 0 && actionableBulletIndices(description).length === 0
}

/**
 * Three outcomes, because "we will not rewrite this" has two very different
 * reasons and telling them apart is the difference between help and a lie.
 *
 *   improvable   a defect a rewrite can repair (weak opener, cliché, length)
 *   needs_input  well-formed but says only WHAT you did, never what it achieved.
 *                A rewrite cannot add the result — only the candidate knows it,
 *                and hard-coding one is the line this product does not cross.
 *   optimized    verb-first, states an outcome, nothing left to do
 *
 * Measured on real bullets across fields: 8 of 12 weak ones ("Handled customer
 * inquiries and processed refunds daily") have no formal defect at all. Calling
 * those "already optimized" is false — they are the ones that most need work,
 * just not work an AI can do alone.
 */
export type Improvability = "improvable" | "needs_input" | "optimized"

export function assessImprovability(description: string): Improvability {
  const bullets = parseBullets(description)
  if (bullets.length === 0) return "needs_input"
  if (actionableBulletIndices(description).length > 0) return "improvable"

  // No formal defect left. Does the CV actually state an outcome anywhere here?
  // A figure is the clearest signal; without one there is nothing to rewrite
  // around, and asking the model produces a synonym swap our own guards drop.
  const statesOutcome = bullets.some((b) => hasAnyMetric(b))
  return statesOutcome ? "optimized" : "needs_input"
}
