import OpenAI from "openai"
import { db } from "@/lib/db"
import { createLogger } from "@/lib/logger"
import { parseBullets, renderBulletsForPrompt } from "@/lib/services/ai/shared/bullets"

const logger = createLogger("ai-client")

// Re-export so existing AI routes don't need to change their import path
export { checkRateLimit, recordRateLimitUsage, checkAndIncrementRateLimit, checkAndIncrementAIQuota } from "@/lib/rate-limit"
export type { AIQuotaCheck } from "@/lib/rate-limit"

// Lazy singleton — never instantiate at module level (Docker build fails without OPENAI_API_KEY)
let _openai: OpenAI | null = null
export function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
      // Bound hung requests and let the SDK back off on 429/5xx (exponential)
      // instead of the caller hammering the provider during a surge.
      timeout: Math.max(5_000, Number(process.env.OPENAI_TIMEOUT_MS ?? 60_000)),
      maxRetries: 3,
    })
    // Cost guard: a silent env change must leave a loud trace on every boot,
    // while still allowing a deliberate upgrade.
    if (AI_MODEL !== EXPECTED_AI_MODEL) {
      logger.warn(
        `AI_MODEL="${AI_MODEL}" difiere del esperado "${EXPECTED_AI_MODEL}" — verifica que el cambio sea intencional (impacto directo de costo por llamada)`,
        { configured: AI_MODEL, expected: EXPECTED_AI_MODEL },
      )
    }
  }
  return _openai
}

// Baseline model for structured / high-volume tasks (profile fill, CV import,
// ATS keyword extraction, tailoring, review, translation). Upgraded
// gpt-4.1-mini → gpt-5.4-nano: newer generation with materially higher
// intelligence + prose scores AND a LOWER price ($0.20/$1.25 vs $0.40/$1.60,
// verified on the official OpenAI pricing page). gpt-5.4 is a REASONING model:
// it requires max_completion_tokens and rejects temperature/top_p. That param
// divergence is handled centrally in OpenAIClientAdapter — callers keep sending
// max_tokens/temperature and the adapter normalizes per model, so no module had
// to change its request shape.
export const EXPECTED_AI_MODEL = "gpt-5.4-nano"

// ─────────────────────────────────────────────────────────────────────────────
// LAS CLAVES, UNA POR PROVEEDOR Y EN UN SOLO LUGAR (CEO, 2026-10-20)
//
// La clave se lee acá y no en cada punto de uso: así «qué proveedor está
// configurado» se contesta leyendo un archivo, no grepeando `process.env`. Nunca
// se imprime ni se loguea: lo único que se dice de ella es si está o no.
// ─────────────────────────────────────────────────────────────────────────────
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? ""
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? ""

// ─────────────────────────────────────────────────────────────────────────────
// LOS MODELOS DE CLAUDE — LA IA PRINCIPAL, EN LAS MISMAS TRES RANURAS
//
// Una ranura por trabajo, no un modelo global: es la única forma de cambiar el
// modelo de la prosa sin tocar el del ATS. Precios por 1M (tabla oficial de
// Anthropic, 2026-10-06; el ATS mide in 13.660 / out 4.927 por análisis):
//   claude-opus-5-5    $4,00 / $20,00  → 40x gpt-6-luna en ese perfil
//   claude-sonnet-5-5  $2,00 / $10,00  → 20x
//   claude-haiku-5-5   $0,10 /  $0,50  → paridad exacta con gpt-6-luna
//
// Los defaults son el techo de calidad de cada ranura, NO una decisión de costo:
// bajarlos es del CEO y se hace por env, sin tocar código.
//
// Un aviso: en Claude el razonamiento no se apaga (`thinking` es 400 en Opus 5.5
// y Sonnet 5.5) y se cobra como salida, así que paridad de tarifa no es paridad
// de factura hasta medirla. El equivalente de `AI_REASONING_EFFORT` es
// `output_config.effort`, y lo traduce `AnthropicClientAdapter`.
// ─────────────────────────────────────────────────────────────────────────────
export const CLAUDE_MODEL = (process.env.CLAUDE_MODEL ?? "claude-opus-5-5") as string
export const CLAUDE_MODEL_PROSE = (process.env.CLAUDE_MODEL_PROSE ?? "claude-sonnet-5-5") as string
export const CLAUDE_MODEL_BULLETS = (process.env.CLAUDE_MODEL_BULLETS ?? "claude-haiku-5-5") as string

/**
 * LOS MODELOS DE OPENAI — UNA GLOBAL Y UNA POR RANURA.
 *
 * `OPENAI_MODEL` es LA GLOBAL del proveedor: la que vale para toda ranura que no
 * tenga la suya puesta. Encima de ella mandan las de ranura
 * (`OPENAI_MODEL_PROSE`, `OPENAI_MODEL_BULLETS`), y encima de todo las viejas
 * `AI_MODEL*`, que siguen ganando porque ya están en Dokploy y un rename
 * silencioso cambiaría el modelo de producción sin que nadie lo pida.
 *
 * Orden, de mayor a menor: `AI_MODEL_<RANURA>` → `OPENAI_MODEL_<RANURA>` →
 * `OPENAI_MODEL` → el default escrito acá.
 *
 * OJO con el ATS: la global también alcanza la ranura de viñetas, y la regla del
 * CEO ahí es `gpt-6-luna` fijo. Poner `OPENAI_MODEL` sin `OPENAI_MODEL_BULLETS`
 * mueve el ATS, y eso invalida las mediciones de P1/P2/P4/P5.
 */
const OPENAI_MODEL_GLOBAL = process.env.OPENAI_MODEL
export const AI_MODEL = (process.env.AI_MODEL ?? OPENAI_MODEL_GLOBAL ?? "gpt-5.4-nano") as string

// Prose-quality model for user-facing generated text (summaries, bullet
// rewrites, cover letters) — the ranura donde el texto ES el entregable.
//
// CLAUDE MANDA ACÁ (CEO, 2026-10-20): el default pasó de `gpt-5.4-mini` a
// `CLAUDE_MODEL_PROSE`. La env `AI_MODEL_PROSE` sigue ganando, así que un deploy
// que ya la tenga puesta no se mueve hasta que se la saque.
export const AI_MODEL_PROSE = (process.env.AI_MODEL_PROSE ?? CLAUDE_MODEL_PROSE) as string

// El respaldo de la prosa: a quién se le pregunta cuando Claude no contesta por
// algo que no es culpa nuestra (429, 5xx, timeout, modelo caído, refusal).
export const OPENAI_MODEL_PROSE = (process.env.OPENAI_MODEL_PROSE ?? OPENAI_MODEL_GLOBAL ?? "gpt-5.4-mini") as string
// Model for the ATS bullet work: Tailor's minimal edits (P4) and the tools/figure
// check (P3). Measured 2026-09-30 on the CEO's CV vs DECISION + 3 trades: same or
// better than gpt-5.4-mini on bullets, ~6x cheaper and faster. NOT used for reading
// the posting, the diagnosis or the summary: there it read the posting worse and
// wrote a broken summary. Overridable per deploy, like the others.
export const AI_MODEL_BULLETS = (process.env.AI_MODEL_BULLETS ?? process.env.OPENAI_MODEL_BULLETS ?? OPENAI_MODEL_GLOBAL ?? "gpt-6-luna") as string

/**
 * A QUIÉN SE LE PREGUNTA CUANDO CLAUDE NO CONTESTA (CEO, 2026-10-20).
 *
 * Claude es la IA principal; OpenAI es el respaldo y SÓLO ante un error que no
 * es culpa nuestra: 429, 5xx, timeout, modelo caído y `refusal`. Un 400 (params
 * mal) o un 401 (clave mal) NO se respaldan: son bugs o configuración, y taparlos
 * los esconde meses — el usuario recibe texto y el motor parece sano.
 *
 * El mapa va por MODELO y no por ranura porque es lo único que el adapter ve en
 * la petición. Un modelo de Claude que no esté acá no tiene respaldo: su error
 * sube tal cual, que es la respuesta honesta.
 */
export const OPENAI_BACKUP: Readonly<Record<string, string>> = {
  [CLAUDE_MODEL]: AI_MODEL,
  [CLAUDE_MODEL_PROSE]: OPENAI_MODEL_PROSE,
  [CLAUDE_MODEL_BULLETS]: AI_MODEL_BULLETS,
}

export const AI_TEMPERATURE = 0.4 as const
export const AI_TEMPERATURE_CREATIVE = 0.7 as const  // cover letters — needs variety
export const AI_TEMPERATURE_PRECISE = 0.1 as const   // scoring/lookup — reproducible results (ats-score)
// Proofreading. There is no upside to variety when the task is "point at the
// error": at 0.1 the same CV checked twice returned three findings, then four,
// then none, and a checker that contradicts itself teaches the user to ignore it.
export const AI_TEMPERATURE_EXACT = 0 as const
export const AI_TEMPERATURE_STRUCTURED = 0.3 as const // profile fill — faithful to user input, minimal creative drift
export const AI_TEMPERATURE_GENERATIVE = 0.6 as const  // summary generation — needs variety across 3 versions but bounded

// Fire-and-forget usage log — never throws
export function logAIUsage(
  userId: string,
  endpoint: string,
  opts: { model: string; plan: string; promptTokens: number; completionTokens: number; costUsd: number },
): void {
  db.aIUsageLog.create({
    data: {
      userId,
      endpoint,
      model: opts.model,
      plan: opts.plan,
      promptTokens: opts.promptTokens,
      completionTokens: opts.completionTokens,
      costUsd: opts.costUsd,
    },
  }).catch((err) => {
    logger.error("logAIUsage: failed to write usage log", { userId, endpoint }, err)
  })
}

export interface BuildResumeContextOptions {
  /**
   * Omit the work experience block. For callers that render their own, fuller
   * view of the same jobs (tailor-cv), including both puts two different texts
   * for the same job and bullet index in one prompt — and the model follows
   * whichever came last, which was the more truncated one.
   */
  includeWorkExperience?: boolean
}

// Extract plain-text summary of CV data for use in AI prompts
export function buildResumeContext(
  sectionData: Record<string, unknown>,
  language = "es",
  options: BuildResumeContextOptions = {},
): string {
  const en = language === "en"
  const {
    personalDetails,
    workExperience,
    education,
    skills,
    summary,
    languages,
    certifications,
    projects,
  } = sectionData as {
    personalDetails?: { firstName?: string; lastName?: string; jobTitle?: string; email?: string; phone?: string; location?: string }
    workExperience?: Array<{ id?: string; jobTitle?: string; employer?: string; startDate?: string; endDate?: string; description?: string }>
    education?: Array<{ degree?: string; institution?: string; school?: string; startDate?: string; endDate?: string }>
    skills?: Array<{ name?: string; level?: string }>
    summary?: string
    // `name`, not `language` — that is the field LanguageItemSchema actually has.
    // The old shape declared an optional `language` that never exists, so every
    // entry rendered as " (native), (b2)" and the recruiter analysis reported the
    // section as garbled parser noise. Optional fields make this class of typo
    // silent: it type-checks and yields undefined forever.
    languages?: Array<{ name?: string; level?: string }>
    certifications?: Array<{ name?: string; issuer?: string; date?: string }>
    projects?: Array<{ name?: string; description?: string }>
  }

  const lines: string[] = []

  if (personalDetails) {
    const name = [personalDetails.firstName, personalDetails.lastName].filter(Boolean).join(" ")
    if (name) lines.push(`${en ? "Name" : "Nombre"}: ${name}`)
    if (personalDetails.jobTitle) lines.push(`${en ? "Target Role" : "Puesto objetivo"}: ${personalDetails.jobTitle}`)
    if (personalDetails.location) lines.push(`${en ? "Location" : "Ubicación"}: ${personalDetails.location}`)
  }

  if (summary) lines.push(`${en ? "Professional Summary" : "Resumen profesional"}: ${summary}`)

  if (workExperience?.length && options.includeWorkExperience !== false) {
    lines.push(en ? "Work Experience:" : "Experiencia laboral:")
    // Per-job budget alone is not a cap: 10 jobs x 1400 would blow past
    // AI_INPUT_LIMITS.resumeContext (12000) and hand the user a 400. Spend from
    // one shared pool so the ceiling holds no matter how long the CV is.
    let workBudget = 8400
    workExperience.slice(0, 10).forEach((j) => {
      const present = en ? "Present" : "Presente"
      const at = en ? "at" : "en"
      const period = [j.startDate, j.endDate ?? present].filter(Boolean).join(" - ")
      // The id must be in the prompt: review-cv is asked to return a targetId
      // naming the job a suggestion applies to, and without the id here it
      // cannot — the suggestion then gets dropped for being unplaceable.
      const jobId = j.id ? `ID:${j.id} | ` : ""
      lines.push(`  - ${jobId}${j.jobTitle ?? ""} ${at} ${j.employer ?? ""} (${period})`)
      // Render bullets as indexed lines, never as one blob: a model shown a
      // paragraph returns a paragraph, which is how review-cv used to collapse
      // an 8-bullet description into a single one.
      //
      // The budget is 1400, not the old 500. review-cv is asked to return one
      // line per original bullet and its suggestion is dropped if it returns
      // fewer — but at 500 chars a normal 5-bullet job only ever showed 4, so
      // the model could not comply and every such job silently lost its
      // suggestion. 1400 fits ~10 typical bullets; jobs are capped at 10, and
      // AI_INPUT_LIMITS.resumeContext (12000) still guards the ceiling.
      const bullets = parseBullets(j.description ?? "")
      if (bullets.length && workBudget > 0) {
        const rendered = renderBulletsForPrompt(bullets, {
          indent: "    ",
          // 2200 ≈ 14 typical bullets. At 1400 a 10-bullet role was cut, and the
          // omission notice then became a fake "critical fix" in the recruiter
          // analysis. AI_INPUT_LIMITS.resumeContext (12000) still caps the whole.
          maxTotalLength: Math.min(2200, workBudget),
        })
        lines.push(rendered)
        workBudget -= rendered.length
      }
    })
  }

  if (education?.length) {
    lines.push(en ? "Education:" : "Educación:")
    education.slice(0, 6).forEach((e) => {
      const at = en ? "at" : "en"
      lines.push(`  - ${e.degree ?? ""} ${at} ${e.institution ?? e.school ?? ""}`)
    })
  }

  if (skills?.length) {
    // 40, not 12. At 12 the analyst never saw most of a real CV's skills and
    // told the candidate to "add" things already listed — the same truncation
    // that used to break the keyword matcher (fixed separately in the haystack).
    const skillList = skills.slice(0, 40).map((s) => s.name).filter(Boolean).join(", ")
    if (skillList) lines.push(`${en ? "Skills" : "Habilidades"}: ${skillList}`)
  }

  if (languages?.length) {
    // Filter on the NAME, not on the rendered string: a level with no language
    // ("(b2)") is truthy, which is exactly how the empty entries survived the
    // old `.filter(Boolean)` and reached the prompt.
    const langList = languages
      .map((l) => ({ name: (l.name ?? "").trim(), level: l.level }))
      .filter((l) => l.name)
      .map((l) => `${l.name}${l.level ? ` (${l.level})` : ""}`)
      .join(", ")
    if (langList) lines.push(`${en ? "Languages" : "Idiomas"}: ${langList}`)
  }

  if (certifications?.length) {
    const certList = certifications.slice(0, 6).map((c) => c.name).filter(Boolean).join(", ")
    if (certList) lines.push(`${en ? "Certifications" : "Certificaciones"}: ${certList}`)
  }

  if (projects?.length) {
    lines.push(en ? "Projects:" : "Proyectos:")
    projects.slice(0, 6).forEach((p) => {
      lines.push(`  - ${p.name ?? ""}${p.description ? `: ${p.description.slice(0, 300)}` : ""}`)
    })
  }

  /**
   * LAS SECCIONES QUE EL USUARIO SE ARMÓ, que el modelo tampoco veía.
   *
   * ── EL DEFECTO (reportado con captura, 2026-08-22) ────────────────────────
   *
   * Un CV real con una sección propia «AREAS OF EXPERTISE» —TypeScript, Dart,
   * XCTest, VIPER y seis más, impresas en el PDF— llegaba al modelo SIN ellas.
   * El analista le recomendaba agregar cosas que su CV ya muestra, y las
   * viñetas se escribían sin la mitad de su vocabulario técnico.
   *
   * `customSections` no es un caso de borde: es donde el importador deja toda
   * sección que no supo mapear, así que cualquier CV importado con una sección
   * no estándar caía acá.
   *
   * Acotado como todo lo demás de este contexto —el techo global sigue siendo
   * `AI_INPUT_LIMITS.resumeContext`—: cuatro secciones, ocho ítems cada una.
   */
  const customSections = (sectionData as { customSections?: Array<{ title?: string; items?: Array<{ title?: string; subtitle?: string; description?: string }> }> }).customSections
  if (customSections?.length) {
    customSections.slice(0, 4).forEach((c) => {
      const rows = (c.items ?? []).slice(0, 8)
        .map((i) => [i.title, i.subtitle, i.description].map((x) => (x ?? "").trim()).filter(Boolean).join(" · "))
        .filter(Boolean)
      if (rows.length === 0) return
      lines.push(`${(c.title ?? "").trim() || (en ? "Other section" : "Otra sección")}:`)
      rows.forEach((r) => lines.push(`  - ${r.slice(0, 200)}`))
    })
  }

  return lines.join("\n")
}
