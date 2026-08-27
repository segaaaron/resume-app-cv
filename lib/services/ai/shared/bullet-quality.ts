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
/**
 * ── «helped», NO «helped with» (pase de QA, 2026-08-27) ─────────────────────
 *
 * Al unificar el séptimo detector apareció que el regex privado de
 * `bullet-strength` cazaba `helped` A SECAS y esta lista —la canónica— sólo
 * «helped with». O sea que «Helped customers on the sales floor» era una
 * apertura débil para el ranking y una línea sana para todo lo demás.
 *
 * Gana la forma corta: el defecto es el verbo, no la preposición que lo sigue.
 * `startsWith` hace que «helped with» siga cubierto por «helped», así que la
 * lista se acorta sin perder nada. Ídem «ayudé/ayude» en español.
 *
 * OJO: esta lista viaja al prompt (`bannedOpeners`) y entra en el
 * `DOCTRINE_FINGERPRINT`, así que tocarla invalida el caché del análisis. Es lo
 * correcto: la doctrina cambió de verdad.
 */
export const WEAK_OPENERS_EN: readonly string[] = [
  "responsible for", "in charge of", "assisted with", "helped",
  "worked on", "duties included", "tasked with", "involved in",
  "participated in", "contributed to",
]
export const WEAK_OPENERS_ES: readonly string[] = [
  "responsable de", "encargado de", "encargada de", "apoyé en", "apoye en",
  "ayudé", "ayude", "trabajé en", "trabaje en",
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
 *
 * ── SIN VERBOS DE JERARQUÍA, Y ESO ERA UNA CONTRADICCIÓN REAL ──────────────
 *
 * «Lideré» / «led» estaban acá, y `noHardCodedFactsRule` dice tres líneas más
 * abajo «nada de "lideré", "gestioné" ni "supervisé" si no lo dijo». El modelo
 * recibía el verbo como ejemplo del registro correcto y su prohibición en el
 * mismo prompt: una regla lo empujaba a usarlo y la otra a evitarlo.
 *
 * Mandar no es un verbo de estilo, es un HECHO sobre la persona: sólo lo escribe
 * quien lo declaró. Un ejemplo general no puede sugerirlo. Los que quedan
 * describen el trabajo, no la posición en el organigrama.
 *
 * ── LAS DOS LISTAS VAN EMPAREJADAS, POSICIÓN POR POSICIÓN ──────────────────
 *
 * No lo estaban: a la española le faltaban «lancé» y un equivalente de
 * «streamlined», y a la inglesa le faltaba «served» — el verbo de los oficios de
 * atención, que en este producto son muchos. Un CV en inglés recibía dieciocho
 * ejemplos y uno en español dieciséis, y nadie lo habría visto: son dos ramas de
 * un `if` que nunca se leen juntas.
 *
 * Emparejadas 1:1 y en el mismo orden, la paridad se verifica ejecutando.
 */
export const IMPACT_OPENERS_EN: readonly string[] = [
  "built", "designed", "implemented", "automated", "delivered", "launched",
  "negotiated", "coordinated", "resolved", "trained", "audited", "reconciled",
  "streamlined", "served", "reduced", "increased", "recovered", "prepared",
]
export const IMPACT_OPENERS_ES: readonly string[] = [
  "construí", "diseñé", "implementé", "automaticé", "entregué", "lancé",
  "negocié", "coordiné", "resolví", "capacité", "audité", "cuadré",
  "simplifiqué", "atendí", "reduje", "incrementé", "recuperé", "preparé",
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
  const stripped = text.replace(/^[\s•·▪‣*\-–—]+/, "").trim()
  // El pronombre delata la tercera persona igual que el verbo: «Él coordinó» es
  // tan de-otro como «Coordinó». El inglés ya cazaba su pronombre; el español
  // debe cazar el suyo para quedar parejo.
  // SÓLO singular: «Él/Ella coordinó» describe al candidato. «Ellos/Ellas»
  // habla de OTRAS personas — convertirlo cambiaría el significado, no lo
  // arreglaría. Por eso quedan fuera a propósito.
  if (/^(?:él|ella)\s+[a-zá-úñ]/i.test(stripped)) return true
  const words = stripped.split(/\s+/)
  const first = words[0] ?? ""
  // Un verbo de apertura ABRE una acción: siempre lleva algo después. Un token
  // suelto que termina en -ó es más probable un nombre propio o una sigla que un
  // pretérito — no se toca sin un complemento que confirme que es el verbo.
  if (words.length < 2) return false
  // Sigla o marca en mayúsculas (SAAB, TELCO…): no es un verbo aunque termine en
  // -ó, y convertirla a «-é» la rompería. El pretérito real abre con mayúscula
  // inicial y minúsculas después.
  if (first === first.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(first)) return false
  // -ó (hablar→habló) y -ió (dirigir→dirigió) son el pretérito regular de 3ª: una
  // clase de palabras que en español son verbos. No hace falta un diccionario.
  return /^[a-zá-úñ]+ó$/i.test(first)
}

/**
 * ¿La línea abre en tercera persona en INGLÉS? — un pronombre que reporta al
 * candidato desde afuera.
 *
 * En inglés la primera persona del pasado se ve igual que la tercera sin
 * pronombre («Managed the team» sirve para «I managed» y «he managed»), así que
 * el defecto NO es el verbo: es abrir con «He/She/They», que convierte la línea
 * en alguien describiendo al candidato. Es el mismo defecto que
 * `opensInThirdPersonEs` caza en español, por la puerta que el inglés sí tiene.
 */
export function opensInThirdPersonEn(text: string): boolean {
  const stripped = text.replace(/^[\s•·▪‣*\-–—]+/, "").trim()
  // SÓLO singular: «He/She managed» describe al candidato. «They» habla de un
  // equipo — quitarlo cambiaría «ellos hicieron» por «yo hice». Fuera a propósito.
  return /^(?:he|she)\s+[a-z]/i.test(stripped)
}

/**
 * CORRIGE la apertura a primera persona en vez de tirar la reescritura entera.
 *
 * ── POR QUÉ CORREGIR Y NO BORRAR (CEO, 2026-08-22) ─────────────────────────
 *
 * Una reescritura de alto impacto no puede morir por un solo defecto de forma:
 * «Ejecutó suites de prueba con Selenium reduciendo el retrabajo» es una línea
 * excelente con un único problema —el verbo en tercera persona—. Borrarla pierde
 * todo su valor por una letra. Se arregla la letra y se conserva el valor.
 *
 * ── LA CONJUGACIÓN, DE RAÍZ Y NO A OJO ─────────────────────────────────────
 *
 * ES: el pasado de tercera persona es «-ó» (verbos -ar: ejecutó→ejecuté) o «-ió»
 * (verbos -er/-ir: definió→definí, escribió→escribí). Se distingue por la
 * terminación, no por una lista de verbos.
 * EN: se quita el pronombre y se recapitaliza («He managed…»→«Managed…»).
 *
 * Sólo toca la PRIMERA palabra —la que el detector marcó—; el resto de la línea
 * queda intacto. Conserva el glifo de viñeta si venía.
 */
export function toFirstPersonOpener(text: string, language: string): string {
  const m = text.match(/^([\s•·▪‣*\-–—]*)(.*)$/s)
  const marker = m?.[1] ?? ""
  const body = (m?.[2] ?? text).trimStart()
  const en = language === "en"

  if (en) {
    if (!opensInThirdPersonEn(text)) return text
    const rest = body.replace(/^(?:he|she)\s+/i, "")
    return marker + rest.charAt(0).toUpperCase() + rest.slice(1)
  }

  if (!opensInThirdPersonEs(text)) return text
  // Si abre con pronombre, se quita —igual que en inglés— y se corrige el verbo
  // que queda de primera palabra. Sin pronombre, se corrige el verbo directo.
  const words = body.replace(/^(?:él|ella)\s+/i, "").split(/\s+/)
  const first = words[0] ?? ""
  const tail = words.slice(1)
  const hadPronoun = /^(?:él|ella)\s+/i.test(body)
  const wasCapital = hadPronoun || /^[A-ZÁÉÍÓÚÑ]/.test(first)
  let corrected: string
  // Sólo transforma si el verbo está en tercera (-ó/-ió); si el pronombre iba con
  // otra forma, se conserva la palabra tal cual tras quitar el pronombre.
  if (/ió$/i.test(first)) corrected = first.slice(0, -2) + "í"
  else if (/ó$/i.test(first)) corrected = first.slice(0, -1) + "é"
  else corrected = first
  if (wasCapital && corrected) corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1)
  return marker + [corrected, ...tail].join(" ")
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

/**
 * Determinantes y preposiciones: listas GRAMATICALES cerradas, no una colección
 * de frases que se nos ocurrieron. Un idioma tiene las que tiene.
 */
const DET_EN = new Set(["a", "an", "the", "this", "that", "these", "those", "my", "our", "its", "their"])
const DET_ES = new Set(["el", "la", "los", "las", "un", "una", "unos", "unas", "su", "sus", "mi", "mis", "este", "esta", "estos", "estas"])
const PREP_EN = new Set(["of", "for", "on", "in", "with", "to", "across", "over"])
const PREP_ES = new Set(["de", "del", "para", "por", "en", "con", "sobre", "entre"])

/**
 * ¿La línea abre con un SINTAGMA NOMINAL en vez de con el trabajo hecho?
 *
 * ── EL AGUJERO (reportado con captura, CEO 2026-08-27) ──────────────────────
 *
 * El CV de producción llevaba «Active use of AI-assisted development tools…» y
 * «A point of view on using AI-assisted development tools…». Medido ejecutando
 * el motor sobre esas líneas: `weakVerbBullets` vacío e `isImprovableLine` en NO
 * para las cuatro que probé. El producto era CIEGO a esa forma, y la ceguera se
 * propagaba entera: sin defecto no hay tarjeta, sin tarjeta el ejecutor no
 * recibe la línea, y si el reclutador la señalaba `rejectionOf` la descartaba
 * como `line_has_no_defect`. Nadie las arreglaba nunca.
 *
 * ── POR QUÉ NO SE AGREGAN A `WEAK_OPENERS` ─────────────────────────────────
 *
 * Porque esa lista ENUMERA frases, y la lista siguiente siempre va a llegar
 * tarde: «Ongoing maintenance of», «Responsibility for», «A point of view on»…
 * son infinitas. La regla se DERIVA de la gramática: la línea no arranca con el
 * verbo del trabajo, y el sintagma que sí encabeza queda anclado por su
 * determinante o su preposición.
 *
 * ── MEDIDO ANTES DE ESCRIBIRLA (21 líneas, es + en) ────────────────────────
 *
 *   6 de 6 aperturas nominales detectadas   ·   0 falsos positivos sobre 15 sanas
 *
 * La ventana de la preposición es DOS palabras, no tres, y eso salió de la
 * medición: con tres, «Reduje el tiempo DE cierre contable» caía como nominal.
 * Un pretérito irregular no lleva tilde y por eso no lo salva el test de verbo.
 */
export function opensNominally(text: string): boolean {
  const palabras = text
    .toLowerCase()
    .replace(/^[\s•·▪◦‣∙●○*–—-]+/, "")
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}-]/gu, ""))
    .filter(Boolean)
  if (palabras.length < 3) return false
  const primera = palabras[0]
  /**
   * ── NO SE ADIVINA EL IDIOMA (cazado en el pase de QA, 2026-08-27) ──────────
   *
   * La primera versión lo deducía con `/[áéíóúñ]/`, y ESO ERA UN HUECO: medio
   * currículum latinoamericano se escribe sin tildes, así que una línea española
   * caía por la rama inglesa, donde «de» no es preposición ni «la» determinante.
   * Medido: «Responsabilidad de la atencion al cliente» y «Uso constante de
   * sistemas de facturacion» NO se detectaban, y por lo tanto `isImprovableLine`
   * las daba por sanas y el ejecutor no las recibía nunca — el mismo defecto que
   * esta función vino a cerrar, vivo en el otro idioma.
   *
   * Y mi propia medición lo tapó: la sonda pasaba el idioma a mano mientras el
   * código real nunca lo pasa.
   *
   * Se juzga con los DOS idiomas a la vez. No hace falta saber cuál es: si la
   * primera palabra es un verbo conjugado de cualquiera de los dos, la línea abre
   * con el trabajo; si es un determinante de cualquiera de los dos, abre con un
   * sintagma nominal. Un CV bilingüe —los hay— queda cubierto por lo mismo.
   */
  if (/(ed|ded|ted)$/.test(primera)) return false
  if (/(é|í|ó|amos|imos|aron|ieron)$/.test(primera)) return false
  if (DET_EN.has(primera) || DET_ES.has(primera)) return true
  return palabras.slice(1, 3).some((w) => PREP_EN.has(w) || PREP_ES.has(w))
}

/**
 * ¿Esta línea abre mal? UN SOLO DUEÑO de la pregunta.
 *
 * Vivía contestada en dos lugares —acá y en `writing-checks`— con dos funciones
 * casi iguales, que es como una acaba sabiendo algo que la otra no. Las dos
 * formas de abrir mal se juzgan juntas: la frase de tarea que ENUMERA la lista,
 * y el sintagma nominal que se DERIVA de la gramática.
 */
export function opensWeakly(text: string): boolean {
  const lower = text.toLowerCase().replace(/^[\s•·▪◦‣∙●○*–—-]+/, "").trim()
  return WEAK_OPENERS.some((o) => lower.startsWith(o)) || opensNominally(text)
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
