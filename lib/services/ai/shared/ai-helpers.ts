// lib/services/ai/shared/ai-helpers.ts
// Shared helpers used across multiple AI modules.
import { AppError } from "@/lib/services/auth/AppError"
import { parseBullets, renderBulletsForPrompt } from "./bullets"

/** Safe JSON parser — throws AppError("parse_error", 500) on failure. */
export function parseAIJson<T>(raw: string): T {
  try {
    return JSON.parse(raw || "{}") as T
  } catch {
    throw new AppError("parse_error", 500)
  }
}

/**
 * Same parse, but a bad body is a value instead of a 500.
 *
 * Callers that can retry need to SEE the failure rather than have the whole
 * request die on it: a truncated extraction is a sampling accident, and turning
 * it into "something went wrong" for the user is worse than asking again.
 */
export function safeParseAIJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw || "{}") as T
  } catch {
    return null
  }
}

export interface BuildSectionContextOptions {
  /**
   * Render `description` as indexed bullet lines via the shared bullets
   * contract. Opt-in: only work experience stores bullets — education,
   * projects and volunteer descriptions are prose, and indexing prose would
   * hard-code a structure the data doesn't have.
   */
  bullets?: boolean
}

/** Builds a labeled list of section items for prompts (with stable ids). */
export function buildSectionContext(
  label: string,
  items: {
    id: string
    name?: string
    title?: string
    employer?: string
    organization?: string
    role?: string
    jobTitle?: string
    degree?: string
    description?: string
  }[],
  options: BuildSectionContextOptions = {},
): string {
  if (!items.length) return ""
  return `\n${label}:\n` + items.map((item, i) => {
    const name = item.employer ?? item.organization ?? item.name ?? item.title ?? item.degree ?? item.role ?? item.jobTitle ?? ""
    const desc = buildItemDescription(item.description, options.bullets === true)
    return `  [${i + 1}] id="${item.id}" | ${name}${desc}`
  }).join("\n")
}

function buildItemDescription(description: string | undefined, asBullets: boolean): string {
  if (!description) return ""
  if (!asBullets) return `\n    Descripción actual: ${description.slice(0, 500)}`
  const bullets = parseBullets(description)
  if (!bullets.length) return ""
  const rendered = renderBulletsForPrompt(bullets, { indent: "      ", maxTotalLength: 500 })
  return `\n    Descripción actual (bullets):\n${rendered}`
}

/** Minimal HTML escape for AI output rendered as HTML. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Normalizes a raw locale into "es" | "en" and returns the matching system instruction. */
export function resolveLanguage(raw?: string): { language: "es" | "en"; langInstruction: string } {
  const language: "es" | "en" = raw === "en" ? "en" : "es"
  const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."
  return { language, langInstruction }
}

// ─── Anti-hard-coded fact helpers (shared across all AI modules) ────────────────

/**
 * Tech/framework buzzwords commonly hard-coded out of nowhere by LLMs.
 * If any of these appears in the AI output but NOT in the source context,
 * we treat the output as a hard-coded fact.
 */
export const TECH_BUZZWORDS: readonly string[] = [
  "graphql", "redux", "kubernetes", "docker", "terraform", "tca", "swiftui",
  "kotlin", "rust", "ansible", "jenkins", "circleci", "grpc", "kafka",
  "rabbitmq", "redis", "elasticsearch", "prometheus", "grafana", "next.js",
  "nestjs", "fastapi", "django", "rails", "spring boot", "flutter",
  "react", "node", "typescript", "javascript", "python", "aws", "gcp",
  "azure", "postgresql", "mongodb", "tailwind", "vue", "angular",
]

/**
 * Metric tokens that count as hard-coded when they appear in AI output but not in
 * the source. Deliberately NARROW: every token here that the model writes and
 * the source lacks costs the user their whole suggestion, so a false positive
 * is expensive. Only units that are unambiguously performance claims.
 *
 * Not the same list as ANY_METRIC_REGEX, and that is on purpose — see there.
 */
export const METRIC_REGEX =
  /(\d+(?:[.,]\d+)?)\s*(%|percent|x\b|users?|usuarios?|requests?|peticiones?|reduction|reducci[oó]n|increase|aumento|decrease|improvement|mejora)/gi

/**
 * Any figure that quantifies something — used to ask "does this text contain a
 * real number at all?", never to accuse the model of hard-coding one.
 *
 * Deliberately BROAD, and deliberately broader than METRIC_REGEX. The two
 * answer opposite questions and want opposite errors:
 *
 *   METRIC_REGEX      "is this hard-coded?"  → a false positive DROPS the user's
 *                                            suggestion, so it stays narrow.
 *   ANY_METRIC_REGEX  "does this quantify?" → a false negative just means we
 *                                            nag about a metric that is there,
 *                                            so it stays inclusive.
 *
 * They used to be two unrelated regexes in two files that happened to disagree
 * about whether "5 engineers" was a metric. One list, one place, and the
 * difference is now a decision instead of an accident.
 */
export const ANY_METRIC_REGEX =
  /\b\d+(?:[.,]\d+)?\s*(?:%|percent|x\b|k\b|m\b|users?|usuarios?|clients?|clientes?|people|personas|engineers?|ingenieros?|teams?|equipos?|projects?|proyectos?|years?|a[ñn]os?|months?|meses?|minutes?|minutos?|hours?|horas?|releases?|versions?|versiones?|countries?|pa[ií]ses?|accounts?|cuentas?|tickets?|deals?|leads?)/i

/**
 * The same question, asked structurally instead of by naming units.
 *
 * The list above knows the units somebody thought of. Reported from the panel: a
 * bullet reading "cut release cycle time FROM 4 WEEKS TO 2 WEEKS" was labelled
 * "no metric" — "weeks" was simply not on the list, and neither were days,
 * seconds, patients, students, beds, units or any currency symbol. Telling a
 * candidate that their explicit before-and-after is not a number is the kind of
 * error that makes the whole panel untrustworthy, and no list ever stays ahead of
 * every profession's units.
 *
 * So: a before→after pair, a currency amount, a magnitude, or a figure followed
 * by any real word — which is what quantification looks like in every language
 * this product supports. Same shapes the bullet ranking already scores with, so
 * the two cannot disagree about whether a line carries a figure.
 *
 * The trade-off is deliberate and in the safe direction: over-counting means we
 * stay QUIET about a bullet, while under-counting means we call a real number
 * missing to the person who wrote it.
 */
const STRUCTURAL_METRIC = [
  /\bfrom\s+[\d.,]+\s*%?\s*[a-zá-úñ]*\s+to\s+[\d.,]+/i,
  /\bde\s+[\d.,]+\s*%?\s*[a-zá-úñ]*\s+a\s+[\d.,]+/i,
  /[$€£]\s?[\d.,]+|\b[\d.,]+\s?(?:usd|eur|bob|mxn|cop|ars)\b/i,
  /\b\d[\d.,]*\s*(?:mil|millones|million|billion)\b/i,
  /\b\d[\d.,]*\s*(?:ms|seg|segundos|minutos|horas|hrs|kb|mb|gb|tb)\b/i,
  /\b\d[\d.,]*\s+[a-zá-úñ]{3,}/i,
  /**
   * Units of measurement too short for the rule above.
   *
   * Found by the stability bench on its first run: "Drove 1,800 km per week" was
   * not a figure, because "km" is two letters. Every trade that measures distance,
   * weight, area or power was affected — a driver, a farmer, an electrician — and
   * no amount of staring at a developer's resume would have surfaced it.
   *
   * A list, and defensible as one: units of measurement are a closed set that has
   * not changed in a lifetime, unlike the open set of things a person can count.
   */
  /\b\d[\d.,]*\s*(?:km|kg|mg|ml|lt|hr|hs|hp|kw|mw|m2|m²|ft|mi|lb|oz|cm|mm|gb|tb|kb|mb)\b/i,
]

/** True when the text quantifies anything at all. Prefer this over the regex. */
export function hasAnyMetric(text: string): boolean {
  return ANY_METRIC_REGEX.test(text) || STRUCTURAL_METRIC.some((re) => re.test(text))
}

/**
 * Matches a METRIC placeholder: a bracket standing in for a figure the source
 * never provided — [X%], [N users], [$Z], [N meses], [number of clients].
 *
 * Anchored to the START of the bracket, because that is what distinguishes a
 * metric stand-in from ordinary bracketed prose. The previous version accepted
 * the bare letters "x" or "n" ANYWHERE inside the brackets, so "[Your Name]"
 * and "[Company]" both matched on their incidental "n" — which silently binned
 * every cover letter the model signed off with "Sincerely, [Your Name]".
 */
/**
 * Resolves the job id a model answered with to a job that actually exists.
 *
 * The prompts show work experience as "ID:w1 | Welder at Talleres Cruz", and the
 * model is asked to answer with the id. Measured across 8 résumés: sometimes it
 * answers "w1" and sometimes "ID:w1" — it echoes the label it was shown.
 *
 * WHY THAT IS NOT COSMETIC. Everything downstream looks the job up by exact id.
 * A miss is silent in the worst possible way: in tailor, `origBulletsByJob.get()`
 * returns undefined, and EVERY per-bullet guard is written as
 * `if (orig !== undefined)` — so the figure-loss check, the trivial-edit check
 * and the lateral-rewrite check all quietly skip for that job, and the rewrite
 * ships unexamined. The client then cannot place it either, because the id it
 * was handed matches nothing.
 *
 * Returns null when the id matches no job, so the caller can drop the suggestion
 * instead of shipping one that points nowhere.
 */
export function resolveJobId(raw: string | undefined, jobs: { id?: string }[]): string | null {
  const candidate = (raw ?? "").trim().replace(/^ID:\s*/i, "")
  if (!candidate) return null
  return jobs.some((j) => j.id === candidate) ? candidate : null
}

/**
 * True when the rewrite has dropped a figure the ORIGINAL stated.
 *
 * THE SYMMETRIC HALF OF `hasHardCodedFact`, and it was missing.
 * `hasHardCodedFact` asks "did it ADD a number nobody gave?" — the failure
 * that gets a CV caught in an interview. This asks "did it REMOVE a number the
 * candidate did give?" — the failure that quietly deletes the one thing on the
 * line a recruiter can weigh, and it is the more expensive of the two, because
 * the candidate spent a year earning that number and the button promised an
 * improvement.
 *
 * Measured on well-written résumés, 2026-08-19: asking tailor to name the
 * content of the work turned "Cut medication errors from 12 to 3 per month"
 * into "Reduced medication errors by reconciling prescriptions, MAR entries and
 * administered doses" — richer, truthful, and stripped of 12 and 3. Four of five
 * bullets on that CV lost their figures, and every existing guard passed it:
 * nothing was hard-coded, nothing was trivially reworded, and the text grew, so
 * `dropsContentWithoutGain` saw a gain.
 *
 * Compared on DIGITS, not on the token: "1.400" and "1,400" are the same figure
 * written under two locales, and a CV in Spanish must not be judged by an
 * English separator.
 */
/** Un año suelto es una fecha, no una medida del trabajo. */
const BARE_YEAR_REGEX = /^(?:19|20)\d{2}$/

/**
 * Los números que MIDEN el trabajo, no todos los números del texto.
 *
 * La versión anterior sacaba todo lo que matcheara `\d+`. Con eso, un año
 * ("desde 2019"), un horario ("24/7") o cualquier cifra suelta armaba el guard, y
 * una reescritura mejor moría por no repetir un dígito que no medía nada. Acá un
 * número cuenta sólo si lo que lo rodea lo convierte en cantidad —la misma
 * pregunta que ya contesta `hasAnyMetric`, hecha sobre la ventana del número.
 *
 * La ventana mira 20 caracteres ATRÁS a propósito: en "from 3.2s to 1.1s" lo que
 * vuelve cantidad al 3.2 es el "from … to", que está antes.
 *
 * Se comparan dígitos, no el token: un CV español escribe 1.400 donde el inglés
 * escribe 1,400 — dos locales, una cifra.
 */
function statedFigures(text: string): string[] {
  const figures = new Set<string>()
  for (const m of text.matchAll(/\d+(?:[.,]\d+)?/g)) {
    const raw = m[0]
    const digits = raw.replace(/[.,]/g, "")
    if (BARE_YEAR_REGEX.test(digits)) continue
    const start = Math.max(0, (m.index ?? 0) - 20)
    if (hasAnyMetric(text.slice(start, (m.index ?? 0) + raw.length + 14))) figures.add(digits)
  }
  return [...figures]
}

/**
 * ¿La reescritura borró o alteró una cifra del candidato?
 *
 * Contesta DOS casos, y sólo esos dos:
 *
 *   1. LA ALTERÓ. Sobreviven unas cifras y falta otra: el modelo conservó la
 *      frase y cambió un número ("de 3.2s a 1.1s" → "de 3.5s a 1.1s"). Eso
 *      falsea un dato del candidato y se tira siempre.
 *   2. LA BORRÓ. No sobrevive ninguna y la reescritura no trae ninguna propia:
 *      es el defecto medido el 2026-08-19, donde una línea volvía más rica y sin
 *      el 12 ni el 3, y ningún filtro lo veía porque el texto había crecido.
 *
 * Lo que YA NO tira: decir la misma cifra de otra forma ("de 12 a 3" → "75%").
 * Si el número nuevo es correcto no lo decide este guard — no está en el CV, así
 * que `hardCodedFactKind` lo marca `figure` y llega con el chip "confirmá la
 * cifra", que es exactamente donde esa pregunta se contesta: se la hace al
 * candidato. Antes se tiraba la línea entera y él nunca veía nada.
 */
export function losesStatedFigure(original: string, rewrite: string): boolean {
  const before = statedFigures(original)
  if (before.length === 0) return false
  const after = new Set(statedFigures(rewrite))
  const missing = before.filter((d) => !after.has(d))
  if (missing.length === 0) return false
  // Alteró: algo de la cifra original sigue ahí y otra parte cambió.
  if (missing.length < before.length) return true
  // Borró: no quedó ninguna, y tampoco trajo una propia.
  return after.size === 0
}

/**
 * Las palabras que le dan SENTIDO a una cifra: sin ellas el número no dice nada.
 *
 * FORMAS COMPLETAS, NO RAÍCES, y la diferencia costó una corrida de tests. Con
 * `baj` como raíz, la reescritura rota del caso reportado pasaba limpia: decía
 * «ítems de baja rotación» y ese «baja» —un adjetivo— contaba como el verbo
 * bajar. Un guard que descarta trabajo bueno hace más daño que no tenerlo, así
 * que acá se prefiere el falso negativo: una forma rara que no esté en la lista
 * deja pasar la línea, y eso es recuperable; tirar una reescritura correcta, no.
 *
 * Sólo verbos de CAMBIO —lo que sube, baja o se ahorra—. «Gestioné 40 cuentas»
 * no está en juego: ahí la cifra se sostiene sola.
 */
const CHANGE_WORDS = new Set([
  // es · sube
  "aumentar", "aumento", "aumenta", "aumento", "aumente", "aumentaron", "aumentando", "aumentada", "aumentadas",
  "incrementar", "incremento", "incrementa", "incremente", "incrementaron", "incrementando",
  "subir", "subio", "subi", "sube", "subiendo", "crecer", "crecio", "crece", "creciendo", "crecimiento",
  "elevar", "elevo", "eleve", "elevando", "duplicar", "duplico", "duplique", "duplicando",
  "triplicar", "triplico", "impulsar", "impulso", "impulse", "impulsando",
  "multiplicar", "multiplico", "escalar", "escalo", "ampliar", "amplio", "amplie", "ampliando",
  // es · baja
  "reducir", "redujo", "reduje", "reduce", "reduciendo", "reduccion",
  "bajar", "bajo", "baje", "bajando", "disminuir", "disminuyo", "disminuye", "disminuyendo",
  "recortar", "recorto", "recorte", "recortando", "acortar", "acorto", "acortando",
  "ahorrar", "ahorro", "ahorre", "ahorrando", "minimizar", "minimizo",
  "optimizar", "optimizo", "optimice", "optimizando", "acelerar", "acelero", "acelerando",
  "mejorar", "mejoro", "mejore", "mejora", "mejorando",
  // en · up
  "increased", "increase", "increases", "increasing", "grew", "grow", "growing", "growth",
  "raised", "raise", "raising", "boosted", "boost", "boosting",
  "doubled", "double", "tripled", "triple", "lifted", "lift", "scaled", "scale", "scaling",
  // en · down
  "reduced", "reduce", "reducing", "reduction", "lowered", "lower", "lowering",
  "decreased", "decrease", "decreasing", "cut", "cutting", "shortened", "shorten",
  "saved", "save", "saving", "savings", "improved", "improve", "improving", "improvement",
  "optimized", "optimised", "optimizing", "accelerated", "accelerate", "minimized", "maximized",
])

function hasChangeVerb(text: string): boolean {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .some((w) => CHANGE_WORDS.has(w))
}

/**
 * ¿La cifra sobrevivió pero perdió el verbo que la explicaba?
 *
 * EL HUECO QUE ESTE GUARD CIERRA, reportado con captura el 2026-08-21:
 *
 *   antes:   "logrando AUMENTAR las ventas entre un 15% y 20%"
 *   después: "logrando ventas de 15% a 20%"
 *
 * `losesStatedFigure` se quedó callado —y hacía bien lo suyo: compara DÍGITOS, y
 * el 15 y el 20 seguían ahí—. `dropsContentWithoutGain` tampoco lo vio porque el
 * texto no se achicó. Pero el dato quedó destruido: sin «aumentar», un «15% a
 * 20%» no es un logro, no es nada. Y es PEOR que borrar la cifra, porque lo que
 * queda parece un dato y el candidato lo firma sin mirar.
 *
 * La pregunta es estrecha a propósito: sólo mira las cifras que venían con un
 * verbo de cambio. Si el original no tenía uno, no hay nada que perder.
 */
export function figureLosesItsVerb(original: string, rewrite: string): boolean {
  if (statedFigures(original).length === 0) return false
  if (!hasChangeVerb(original)) return false
  // Si además se llevó la cifra, ya lo dice `losesStatedFigure`: acá sólo
  // interesa el caso silencioso — el número quedó y su significado no.
  if (statedFigures(rewrite).length === 0) return false
  return !hasChangeVerb(rewrite)
}

export const METRIC_PLACEHOLDER_REGEX =
  /\[\s*(?:x\b|n\b|z\b|\$|\d|number\b|métrica\b|metric\b|porcentaje\b|percent\b|cifra\b)/i

/**
 * Fail-safe hard-coded fact detector. Returns true if `text` looks like it
 * introduces data (placeholders, metrics, or technologies) not present in
 * `sourceContext`. Callers should drop/replace flagged content rather than
 * surface hard-coded data to the user.
 *
 * Detection layers:
 *   1. Metric placeholders like [X%], [N users], [métrica].
 *   2. Metric tokens present in text but absent from source.
 *   3. Tech buzzwords from TECH_BUZZWORDS present in text but absent from source.
 *
 * There is deliberately no opt-out for layer 1. Modules used to pass
 * `allowPlaceholders: true` and instruct the model to emit "[X%]" whenever a
 * real metric was missing — which shipped unfilled brackets into CVs and cover
 * letters, and gave the model a way to "improve" a bullet by bolting a fake
 * metric onto an otherwise unchanged sentence. When a figure is missing the
 * answer is to write without it, or to ask the user — never to bracket it.
 */
/**
 * Un sistema con nombre propio que el candidato NUNCA declaró.
 *
 * ── EL HUECO QUE ESTO CIERRA ───────────────────────────────────────────────
 *
 * `TECH_BUZZWORDS` es una lista SÓLO TÉCNICA, y estaba declarado como hueco
 * conocido: «Temenos T24» en el CV de un cajero de banco no lo cazaba nadie más
 * que el prompt. El producto no atiende sólo a perfiles de software —cajeros,
 * enfermeras, abogados, agricultores— y cada rubro tiene sus propios sistemas.
 * Mantener una lista por rubro es una carrera que se pierde: siempre falta el
 * siguiente.
 *
 * ── POR QUÉ POR FORMA Y NO POR CATÁLOGO ────────────────────────────────────
 *
 * La pregunta correcta nunca fue «¿es una marca que yo conozco?» sino «¿el
 * candidato declaró esto?». Y hay dos formas que en prosa de CV sólo tiene un
 * nombre de producto, en cualquier idioma y cualquier rubro:
 *
 *   · MAYÚSCULA INTERNA — SwiftUI, PostgreSQL, PowerBI, QuickBooks, SAP4HANA.
 *     Ninguna palabra de un idioma natural se escribe así.
 *   · LETRAS PEGADAS A DÍGITOS — T24, S4HANA, Office365, AutoCAD2024, SAP2000.
 *     Un año o una cifra sueltos no entran: tienen que ir pegados a las letras.
 *     Basta UNA letra: los sistemas de banca y ERP se llaman así —«T24», «S4HANA»—
 *     y exigir dos los dejaba pasar, que era justo el caso reportado.
 *
 * ── LO QUE DELIBERADAMENTE NO SE MIRA ──────────────────────────────────────
 *
 * Una palabra capitalizada normal («Temenos» a secas, «Cochabamba», «Marzo») NO
 * se juzga. Cazarla exigiría marcar todo nombre propio, y ahí caerían empleadores
 * reales, ciudades, meses y apellidos — descartando reescrituras correctas. La
 * regla es la del CEO: un guard que tira trabajo bueno hace más daño que el hueco
 * que tapa. Ese resto lo contiene el prompt, y se dice así en vez de fingir que
 * está cubierto.
 */
const UNDECLARED_SYSTEM = /\b(?=\w*[A-Z])(?:[A-Za-z]+[A-Z][A-Za-z]*\d*|[A-Za-z]+\d+[A-Za-z\d]*)\b/g

/** Siglas del oficio y del idioma que no son un producto de nadie. */
const NOT_A_SYSTEM = new Set([
  "KPI", "KPIs", "CRM", "ERP", "POS", "SLA", "ROI", "B2B", "B2C", "PYME", "PYMEs",
  "IVA", "RRHH", "TI", "IT", "QA", "UX", "UI", "API", "APIs", "PDF", "CV", "MIG", "TIG",
  "OK", "ID", "IDs", "SKU", "SKUs", "M2", "M3", "H2", "CO2", "P95", "P99", "A1", "B1", "B2", "C1", "C2",
])

function namesUndeclaredSystem(text: string, sourceContext: string): boolean {
  const source = sourceContext.toLowerCase()
  for (const m of text.match(UNDECLARED_SYSTEM) ?? []) {
    if (NOT_A_SYSTEM.has(m) || NOT_A_SYSTEM.has(m.toUpperCase())) continue
    // Todo en mayúsculas sin dígitos es una sigla, no un producto: la lista de
    // arriba no puede enumerar las de cada oficio, y marcarlas descartaría
    // líneas correctas de rubros que no conocemos.
    if (m === m.toUpperCase() && !/\d/.test(m)) continue
    if (!source.includes(m.toLowerCase())) return true
  }
  return false
}

/**
 * POR QUÉ se disparó `hasHardCodedFact`. Las tres causas no son iguales.
 *
 * La función devuelve un booleano y quien llama tiraba la sugerencia entera, sin
 * distinguir un `[X%]` de una marca quemada de una CIFRA. Y la cifra es el caso
 * que el CEO corrigió el 2026-08-20: proponer el tamaño del trabajo que el
 * candidato describió NO es quemar — quemar es quemar un número desde afuera.
 * Una cifra propuesta se le MUESTRA para que la confirme o la corrija; lo que se
 * sigue tirando sin preguntar es el placeholder (nunca puede llegar al CV) y la
 * marca que el candidato no declaró (eso sí es un hecho falso sobre él).
 *
 * `null` = nada que objetar.
 */
export function hardCodedFactKind(
  text: string,
  sourceContext: string,
): "placeholder" | "brand" | "figure" | null {
  if (!text) return null
  if (METRIC_PLACEHOLDER_REGEX.test(text)) return "placeholder"
  for (const tech of TECH_BUZZWORDS) {
    const re = new RegExp(`\\b${tech.replace(/[.+]/g, "\\$&")}\\b`, "i")
    if (re.test(text) && !re.test(sourceContext)) return "brand"
  }
  if (namesUndeclaredSystem(text, sourceContext)) return "brand"
  const sourceLower = sourceContext.toLowerCase()
  for (const metric of text.match(METRIC_REGEX) ?? []) {
    if (!sourceLower.includes(metric.toLowerCase())) return "figure"
  }
  return null
}

/**
 * LA POLÍTICA DE LA CIFRA — QUÉ ENTRADA USAR, Y POR QUÉ NO DA LO MISMO.
 *
 * ── LA CONTRADICCIÓN QUE ESTO CIERRA (barrido, 2026-08-22) ─────────────────
 *
 * La doctrina que se le manda al modelo dice, textual: «PODÉS proponer una cifra
 * cuando el trabajo que describió tiene claramente un tamaño medible y él no lo
 * escribió — y la escribís como RANGO que confirma o corrige en un clic».
 *
 * Y después `hasHardCodedFact` devolvía un BOOLEANO, así que el que la llamaba
 * descartaba la respuesta entera. Le pedíamos al modelo que propusiera el rango
 * y le tirábamos a la basura exactamente eso. El usuario no ve un descarte: ve
 * menos sugerencias, o una línea pelada donde el tamaño era obvio.
 *
 * `hardCodedFactKind` existe desde el 2026-08-20 y sabe distinguir —placeholder
 * y marca se tiran; una CIFRA se muestra con el chip «confirmá la cifra»— y
 * estaba cableada en UNO de siete módulos.
 *
 * ── LA REGLA, PARA QUIEN AGREGUE EL OCTAVO ─────────────────────────────────
 *
 * Sólo hay dos posturas válidas, y las dos son decisiones explícitas:
 *
 *  A. **El texto nace de un relato del candidato** (reescribir su viñeta, su
 *     resumen, la propuesta del panel). Usá `hardCodedFactKind` y hacé viajar
 *     `needsFigureConfirm` hasta una pantalla que PREGUNTE. Descartar acá
 *     contradice la doctrina.
 *
 *  B. **El texto se escribe de cero, sin relato que medir** (la viñeta que
 *     demuestra una habilidad, una fusión de dos líneas, una carta). Ahí la
 *     cifra sería tuya y no suya: `hasHardCodedFact` y se descarta — PERO el
 *     prompt tiene que decir esa acotación, o el modelo obedece a la doctrina y
 *     nosotros lo castigamos en silencio.
 *
 * El guard `figure-guard-ownership.test.ts` enumera qué postura tomó cada módulo
 * y falla cuando aparece uno sin declararla.
 */
/**
 * ¿La cifra que agregó viene como RANGO A CONFIRMAR, o como hecho?
 *
 * ── LA MITAD QUE FALTABA (barrido de contradicciones, 2026-08-22) ──────────
 *
 * La doctrina no dice «podés poner números». Dice, con todas las letras: podés
 * proponer el tamaño medible del trabajo que él describió **como RANGO que
 * confirma o corrige en un clic, nunca como número exacto presentado como
 * hecho**. Son dos cosas distintas y el guard no las distinguía:
 *
 *   «entre 50 y 100 transacciones por día»  → una PREGUNTA. Él la confirma.
 *   «reduje las fallas de login un 40%»     → una AFIRMACIÓN que él nunca hizo.
 *
 * `hardCodedFactKind` sólo ve «hay un número que no está en la fuente» y las
 * llama igual. Con eso, dejar pasar las cifras propuestas dejaba pasar también
 * un resultado fabricado — que es el defecto más caro del producto, el que hace
 * que un CV se caiga en la entrevista.
 *
 * Y al revés: descartarlas TODAS —lo que hacían seis de siete módulos— tiraba la
 * propuesta legítima que el propio prompt pide. La línea correcta pasa por el
 * medio, y es exactamente la que la doctrina ya había escrito.
 *
 * Detecta la forma del rango en los dos idiomas: «entre X y Y», «between X and
 * Y», «X-Y», «X a Y», «X to Y». Ante la duda responde `false` — falla del lado
 * de descartar, que es el lado que no le pone palabras en la boca al candidato.
 */
export function proposesRangeFigure(text: string): boolean {
  if (!text) return false
  const t = text.toLowerCase()
  return (
    /\b(?:entre|between)\s+[\d.,]+\s*[a-z%]*\s*(?:y|and|a|to)\s+[\d.,]+/.test(t)
    || /\b\d[\d.,]*\s*(?:-|–|—)\s*\d[\d.,]*/.test(t)
    || /\b\d[\d.,]*\s+(?:a|to)\s+\d[\d.,]*/.test(t)
  )
}

export function hasHardCodedFact(text: string, sourceContext: string): boolean {
  if (!text) return false
  const sourceLower = sourceContext.toLowerCase()

  // 1. Metric placeholders are never allowed in production-ready output.
  if (METRIC_PLACEHOLDER_REGEX.test(text)) return true

  // 2. Metric tokens present in text but absent from the source.
  const textMetrics = text.match(METRIC_REGEX) ?? []
  for (const metric of textMetrics) {
    if (!sourceLower.includes(metric.toLowerCase())) return true
  }

  // 3. Tech buzzwords introduced out of nowhere.
  //    Use word-boundary regex (not substring) to avoid false positives like
  //    "reacción" → "react", "avenue" → "vue", "node_modules" → "node".
  //    Escape `.` and `+` for entries such as "next.js" or hypothetical "c++".
  for (const tech of TECH_BUZZWORDS) {
    const re = new RegExp(`\\b${tech.replace(/[.+]/g, "\\$&")}\\b`, "i")
    if (re.test(text) && !re.test(sourceContext)) return true
  }

  return false
}

// Summary/cover-letter prompts label each variant ("Version 1 — EXECUTIVE", etc.)
// as a styling instruction. Models sometimes echo that header into the body, so
// the saved text ends up reading "Version 2: ...". Strip a single leading
// "Version N"/"Versión N" label (with an optional style word + separator). Only
// the start is touched — never the real prose.
const VERSION_LABEL_REGEX =
  /^\s*versi[oó]n\s*\d+\s*(?:[—–-]\s*[\p{Lu}][\p{L} ]{1,30}?)?\s*[:—–-]\s+/iu

export function stripVersionLabel(text: string): string {
  if (!text) return text
  return text.replace(VERSION_LABEL_REGEX, "").trimStart()
}

/** Words too common to prove anything about grounding. */
const STOPWORDS = new Set([
  "the", "a", "an", "of", "at", "in", "for", "and", "as", "to", "with",
  "el", "la", "los", "las", "un", "una", "de", "del", "en", "para", "y", "como",
])

/**
 * Shorthands people type and the canonical words a CV uses for them. Explicit,
 * because prefix matching cannot tell these apart: "dev" must ground
 * "developer" but not "devops", and both are three-letter prefixes. Mirrors the
 * ALIAS_GROUPS approach in ats-matcher.ts — short and curated on purpose.
 */
const WORD_ALIASES: readonly string[][] = [
  ["dev", "developer", "development"],
  ["eng", "engineer", "engineering"],
  ["ing", "ingeniero", "ingeniera", "ingeniería", "ingenieria"],
  ["mgr", "manager"],
  ["sr", "senior"],
  ["jr", "junior"],
  ["admin", "administrator", "administrador", "administradora"],
  ["arch", "architect", "arquitecto", "arquitecta"],
  ["desarrollador", "desarrolladora", "desarrollo"],
  ["analyst", "analista"],
  ["designer", "diseñador", "diseñadora"],
  ["qa", "tester"],
]

const ALIAS_LOOKUP: Map<string, number> = (() => {
  const m = new Map<string, number>()
  WORD_ALIASES.forEach((group, i) => group.forEach((w) => m.set(w, i)))
  return m
})()

/**
 * Edit distance, capped: stops as soon as it exceeds `max` instead of computing
 * the true distance, so this stays cheap over a whole resume's worth of words.
 */
function withinEditDistance(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      const v = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
      curr.push(v)
      if (v < rowMin) rowMin = v
    }
    if (rowMin > max) return false
    prev = curr
  }
  return prev[b.length] <= max
}

/**
 * How far apart two words may be and still count as the same word. Nothing
 * under 4 letters — at that length one edit is a different word ("cat"/"car").
 */
function typoBudget(len: number): number {
  if (len >= 8) return 2
  if (len >= 4) return 1
  return 0
}

function wordsMatch(a: string, b: string): boolean {
  if (a === b) return true
  const ga = ALIAS_LOOKUP.get(a)
  if (ga !== undefined && ga === ALIAS_LOOKUP.get(b)) return true
  // Typo tolerance, and it is not a nicety. The prompts ORDER the model to use
  // the canonical spelling of a name so an ATS matches it exactly; the user
  // types "banco mercanil" and "banco central de bolicia". The model obeys,
  // writes "Banco Mercantil" — and an exact-match grounding check then binned
  // the entry FOR OBEYING, so a CV with two real jobs came back with a summary
  // and nothing else. Measured against a real user's text, 2026-08-18.
  const budget = Math.min(typoBudget(a.length), typoBudget(b.length))
  return budget > 0 && withinEditDistance(a, b, budget)
}

const WORD_SPLIT = /[^\p{L}\p{N}.+#]+/u

/**
 * True when `value` is derivable from `source`: an exact substring, or every
 * significant word matching a source word directly or through WORD_ALIASES.
 *
 * A plain `source.includes(value)` demands a verbatim echo, which binned the
 * model for doing the right thing — the user writes "I worked at Google as a
 * backend dev", the model canonicalises to "Backend Developer", which is the
 * form a CV needs, and the whole entry was dropped. This still rejects a role
 * or employer the user never mentioned, which is what the check is for.
 */
export function isGroundedIn(value: string, source: string): boolean {
  const v = value.toLowerCase().trim()
  if (!v) return false
  const s = source.toLowerCase()
  if (s.includes(v)) return true

  const sourceWords = s.split(WORD_SPLIT).filter(Boolean)
  const valueWords = v.split(WORD_SPLIT).filter((w) => w && !STOPWORDS.has(w))
  if (!valueWords.length) return false

  return valueWords.every((word) => sourceWords.some((sw) => wordsMatch(sw, word)))
}

// Cover-letter prompts ask for the body only — the app renders the candidate's
// real name beneath it. Models sign off anyway (~1 in 8), usually as
// "Sincerely,\n[Your Name]", which leaves an unfilled bracket in a letter the
// user sends to a recruiter. The prompt is the first line of defence; this is
// the deterministic one.
const SIGN_OFF_REGEX =
  /\n+\s*(?:sincerely|regards|best regards|kind regards|warm regards|yours (?:sincerely|truly|faithfully)|thank you|atentamente|saludos(?: cordiales)?|cordialmente|un saludo)\s*,?\s*(?:\n+.{0,60})?\s*$/i

/** Trailing "[Your Name]" / "[Tu Nombre]" line, with or without a sign-off above it. */
const NAME_PLACEHOLDER_LINE_REGEX = /\n+\s*\[[^\]\n]{0,40}\]\s*$/

/**
 * Removes a trailing signature block from a cover-letter body: the sign-off
 * line, and any bracketed name line under it. Only the tail is touched — real
 * prose is never rewritten.
 */
export function stripSignOff(text: string): string {
  if (!text) return text
  let out = text.replace(NAME_PLACEHOLDER_LINE_REGEX, "")
  out = out.replace(SIGN_OFF_REGEX, "")
  return out.trimEnd()
}
