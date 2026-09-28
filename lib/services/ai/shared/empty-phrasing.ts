// lib/services/ai/shared/empty-phrasing.ts
//
// Detects the sentence that would fit any candidate in any role — WITHOUT
// enumerating the sentences.
//
// The list next door (cliches.ts) does the enumerating, and it has the defect
// every curated list has: it only finds what somebody thought of first. Measured
// against 50 ordinary empty phrasings pulled from real CVs across industries and
// both languages, it found ZERO. Not because the phrases are exotic — "Excellent
// communication and interpersonal skills", "Profesional altamente motivado",
// "Please find attached my resume" — but because they are not the exact strings
// somebody typed into the array.
//
// A phrase is empty for a structural reason, not a lexical one: it praises a
// QUALITY instead of reporting a THING DONE. That structure is describable with
// two closed word classes and a proximity rule, and it composes — 90 evaluative
// words against 60 quality nouns cover thousands of phrasings, and adding one
// word to either class covers dozens more. That is the difference between a list
// and a rule.
//
// Everything here is pure and synchronous on purpose. The ATS panel runs these
// checks client-side on every keystroke (writing-checks.ts) and the quality gates
// run them before every model call, so the detector cannot cost a request, and it
// cannot vary between two runs on the same text.

/** Lowercase, accent-stripped, punctuation to spaces. Same shape the CV writes in. */
function fold(text: string): string {
  return (text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Words that RATE rather than report. Accent-stripped, so "dinamico" covers
 * "dinámico"; stems where the ending is the only thing that varies, so "motivad"
 * covers motivado/motivada/motivados/motivadas.
 *
 * Closed class on purpose: these are adjectives and intensifiers, not vocabulary.
 * A profession-specific word never belongs here — "clinical" and "structural"
 * describe work, not the worker.
 */
const EVALUATIVE: readonly string[] = [
  // en
  "motivated", "self-motivated", "dedicated", "reliable", "dependable", "hardworking",
  "hard-working", "diligent", "excellent", "exceptional", "outstanding", "strong",
  "solid", "great", "proven", "passionate", "proactive", "dynamic", "energetic",
  "enthusiastic", "meticulous", "adaptable", "flexible", "versatile", "committed",
  "driven", "ambitious", "creative", "innovative", "resourceful", "organized",
  "punctual", "competent", "skilled", "talented", "seasoned", "extensive", "robust",
  "keen", "highly", "well-rounded", "results-driven", "goal-oriented", "capable",
  "efficient", "effective", "natural", "quick", "fast", "collaborative", "fresh",
  "detail-oriented", "customer-focused", "team-oriented", "thrives", "excels",
  // es — stems, so gender and number fall out of one entry
  "motivad", "comprometid", "trabajador", "dedicad", "excelente", "excepcional",
  "sobresaliente", "gran", "grande", "fuerte", "solid", "probad", "apasionad",
  "proactiv", "dinamic", "energic", "entusiasta", "meticulos", "detallista",
  "versatil", "ambicios", "creativ", "innovador", "ingenios", "organizad",
  "puntual", "competente", "habil", "talentos", "experimentad", "ampli",
  // "nato"/"nata" spelled out: entries of four characters or fewer are matched
  // whole, so a three-letter stem here would never match anything.
  "altamente", "nato", "nata", "capaz", "eficiente", "eficaz", "rapid", "destacad",
  "notable", "envidiable", "inmejorable", "excelentes", "optim",
]

/**
 * Nouns that name a quality, a trait or the candidate-as-a-category — the thing
 * the evaluative word attaches to. "Skills", "attitude", "professional", "persona".
 *
 * Deliberately NOT here: any noun naming work. "Patients", "invoices", "welds",
 * "students" are what a real sentence is about, and a sentence about them is
 * never empty.
 */
const QUALITY_NOUN: readonly string[] = [
  // en
  "skill", "skills", "ability", "abilities", "attitude", "ethic", "mindset",
  "mentality", "personality", "character", "professional", "individual", "person",
  "candidate", "communicator", "leader", "learner", "player", "experience",
  "background", "expertise", "knowledge", "capability", "capabilities",
  "competencies", "strengths", "qualities", "traits", "commitment", "dedication",
  "motivation", "passion", "enthusiasm", "drive", "desire", "ownership",
  "accountability", "initiative", "focus", "sense", "approach", "environment",
  "environments", "settings", "standards", "excellence", "potential", "perspective",
  "ethos", "attributes", "aptitude",
  // es
  "habilidad", "habilidades", "capacidad", "capacidades", "actitud", "etica",
  "mentalidad", "personalidad", "caracter", "profesional", "persona", "individuo",
  "candidat", "comunicador", "lider", "experiencia", "trayectoria", "formacion",
  "conocimientos", "competencias", "fortalezas", "cualidades", "rasgos",
  "compromiso", "dedicacion", "motivacion", "pasion", "entusiasmo", "iniciativa",
  "enfoque", "sentido", "entorno", "entornos", "estandares", "excelencia",
  "potencial", "vocacion", "ganas", "mirada", "don", "perfil", "aptitud",
  "aptitudes", "disposicion", "predisposicion", "facilidad", "attention",
]

/**
 * Words about the APPLICATION rather than the applicant — the other family of
 * empty sentence, and the one that opens and closes most cover letters. "Please
 * find attached my resume", "Quedo a la espera de su respuesta". They carry
 * process, never content.
 */
const PROCESS_TALK: readonly RegExp[] = [
  /\b(please find|find attached|attached (is|you will find|please find)?\s*(my|the)?\s*(resume|cv|curriculum))/,
  /\b(i am writing to (apply|express|submit))/,
  /\b(would like to express (my)? ?(strong)? ?interest)/,
  /\b(for your consideration|look forward to hearing|thank you for your (time|consideration))/,
  /\b(i am confident that my (skills|experience|background))/,
  /\b(ideal candidate|perfect fit|great fit for (this|the) (role|position))/,
  /\b(adjunto (mi)? ?(curriculum|cv|hoja de vida))/,
  /\b(me dirijo a (ustedes|usted))/,
  /\b(quedo a la espera|a la espera de su (respuesta|pronta))/,
  /\b(para su consideracion|agradezco (de antemano|su tiempo))/,
  /\b(mi perfil (encaja|se ajusta|calza))/,
  /\b(seria un honor|prestigiosa (empresa|institucion))/,
  /\b(postular al (puesto|cargo)|postularme al)/,
]

/**
 * What rescues a sentence: something only THIS candidate could have written.
 *
 * A figure, or a name. Both are things a generic sentence cannot contain, which
 * is exactly the test — "would this fit anyone?" A sentence with "3 caídas" or
 * "Kubernetes" in it does not fit anyone.
 *
 * This guard is why the evaluative rule can be broad without becoming the false
 * positive that already cost this product money: "un enfoque proactivo al
 * monitoreo evitó 3 caídas del sistema" hits BOTH word classes and is still a
 * real sentence about real work, and the number says so.
 */
function isGrounded(text: string): boolean {
  if (/\d/.test(text)) return true
  // A capitalised word that is not opening the sentence: a product, a company, a
  // tool, a place. Checked on the RAW text — folding destroys the signal.
  const words = text.trim().split(/\s+/)

  // Unless the whole line is Title Case, in which case the capitals are a styling
  // choice and say nothing. Users write summary headlines this way, and treating
  // "Highly Motivated Professional With A Strong Work Ethic" as grounded let the
  // emptiest sentence in the CV walk straight through the guard.
  const capitalised = words.filter((w) => /^\p{Lu}/u.test(w.replace(/^[^\p{L}]+/u, ""))).length
  const alphabetic = words.filter((w) => /\p{L}/u.test(w)).length
  if (alphabetic >= 3 && capitalised / alphabetic >= 0.6) return false

  for (let i = 1; i < words.length; i++) {
    const w = words[i].replace(/^[^\p{L}]+/u, "")
    if (!w) continue
    // Skip the word that opens a new sentence.
    const prev = words[i - 1]
    if (/[.!?:]$/.test(prev)) continue
    if (/^\p{Lu}/u.test(w) && !/^I$/.test(w)) return true
  }
  return false
}

function tokens(folded: string): string[] {
  return folded.split(" ").filter(Boolean)
}

function matchesClass(token: string, cls: readonly string[]): boolean {
  return cls.some((c) => (c.length <= 4 ? token === c : token === c || token.startsWith(c)))
}

/** How far apart the rating and the thing rated can sit and still be one claim. */
const WINDOW = 4

/**
 * True when the text praises a quality instead of reporting work.
 *
 * Two shapes, both structural:
 *   1. an evaluative word within a few words of a quality noun
 *      ("highly motivated professional", "gran capacidad de organizacion")
 *   2. a short fragment built only of evaluative words, with nothing done in it
 *      ("Meticuloso y detallista", "Adaptable y flexible")
 * plus the application boilerplate family, which praises nothing and reports
 * nothing.
 *
 * Anything grounded in a figure or a name is exempt — see isGrounded.
 */
export function isEmptyPhrasing(text: string): boolean {
  const raw = (text ?? "").trim()
  if (!raw) return false
  const folded = fold(raw)
  if (!folded) return false

  if (PROCESS_TALK.some((re) => re.test(folded))) return true

  if (isGrounded(raw)) return false

  const toks = tokens(folded)
  const evalIdx: number[] = []
  const nounIdx: number[] = []
  toks.forEach((t, i) => {
    if (matchesClass(t, EVALUATIVE)) evalIdx.push(i)
    if (matchesClass(t, QUALITY_NOUN)) nounIdx.push(i)
  })

  // Shape 1 — a rating attached to a quality.
  for (const e of evalIdx) {
    for (const n of nounIdx) {
      if (e !== n && Math.abs(e - n) <= WINDOW) return true
    }
  }

  // Shape 2 — a fragment that is nothing but ratings. Bounded by length so a real
  // sentence that happens to carry two adjectives is never caught by it.
  if (evalIdx.length >= 2 && toks.length <= 8) return true

  // There is NO third shape, and the missing one is deliberate.
  //
  // It existed for one draft: "a short line whose subject is a quality" — enough
  // to catch "Capacidad para trabajar bajo presión" without any rating word. It
  // was measured against the summaries this product actually generates and it
  // flagged SEVEN of ten: "Ingeniero de software con experiencia en sistemas de
  // pago", "Enfermera con experiencia en sala de emergencias", "Abogado con
  // trayectoria en derecho laboral". "Con experiencia en X" is not a cliché, it is
  // how a Spanish summary opens, and the rule could not tell that from "Amplia
  // experiencia en diversos entornos" because the difference is whether X is
  // specific — which needs a vocabulary of every profession, i.e. the list problem
  // all over again.
  //
  // The cost of each error is not symmetric. A miss leaves one weak line
  // unflagged. A false positive sends the quality gate off to rewrite text that
  // was already correct: a model call billed, and the user's own wording replaced
  // by something no better. So the rating word stays REQUIRED, and the phrases
  // that carry no rating are left alone.
  return false
}

/** The word classes, for tests and diagnostics. Not for callers to extend at runtime. */
export const EMPTY_PHRASING_CLASSES = { EVALUATIVE, QUALITY_NOUN } as const

// ── LA APERTURA QUE DESCRIBE UNA TAREA ─────────────────────────────────────────
//
// Vive acá desde el 2026-09-28 (antes en bullet-quality, que la reexporta): es la
// misma pregunta que este archivo —¿la línea dice algo hecho?— y así la puede
// usar el motor ATS sin arrastrar los helpers de los módulos de IA al navegador.

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
  "responsable de", "encargado de", "encargada de", "apoyé", "apoye",
  "ayudé", "ayude", "trabajé en", "trabaje en",
  "mis funciones incluían", "participé", "participe", "colaboré", "colabore",
]
export const WEAK_OPENERS: readonly string[] = [...WEAK_OPENERS_EN, ...WEAK_OPENERS_ES]

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
