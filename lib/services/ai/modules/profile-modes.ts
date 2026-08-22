// The three short prompts behind the AI assistant's three questions.
//
// WHY THIS FILE EXISTS, measured against the real API before a line of it was
// written. `fillProfile`'s prompt is ~2,700 tokens of EXTRACTION: "here is the
// candidate's résumé, here are the section ids, apply their instruction to it".
// The assistant then used that prompt for three tasks that are not extraction —
// start a CV from a job title, name the credentials of a trade, turn a sentence
// into bullets — and the model, handed an empty résumé and three words, kept
// concluding there was nothing to extract and answering `{}`.
//
// What that looked like to the user: "Soy Ingeniero Civil." → "I could not
// build your CV with that. Try naming your job." Six times in a row in the
// error log, for having typed their profession correctly.
//
// Measured, same model (AI_MODEL), 10 trades × 2 rounds:
//
//   task            old prompt        this file
//   start a CV      7/10, 2,700 tok   30/30, 127 tok
//   credentials     1/8               10/10, 120 tok
//   bullets         6/8               20/20,  31 tok
//   junk refused    —                 5/5
//
// The failures were not random trades: secretaria, cajero de banco and abogado
// laboralista are three of the exact professions this product is meant to serve.
//
// RULES THAT APPLY TO EVERY PROMPT HERE:
//   · Both languages, always. A rule that exists in one branch only is a
//     behaviour the other language never gets (prompt-integrity.test.ts reads
//     this file and enforces it).
//   · The off-topic sentinel is the SAME JSON in both, or parsing would depend
//     on the UI language.
//   · The word "JSON" must appear in a message — OpenAI rejects
//     response_format:json_object without it, and the failure is a 400 that
//     looks exactly like a bad answer.
//   · Nothing here states a fact about the person. Skills and credentials are
//     what the ROLE usually carries, and the user ticks them one by one.

import { cvValueBar, noHardCodedFactsRule, proseRules } from "../shared/cv-writing-doctrine"

export type ProfileMode = "seed" | "certifications" | "bullets"

/** Returned by every prompt here when the text names no job at all. */
export const OFF_TOPIC_SENTINEL = '{"off_topic": true}'

interface Built {
  system: string
  user: string
  maxTokens: number
  /**
   * True when this mode writes PROSE THAT LANDS IN THE CV, so the caller puts it
   * on the prose model rather than the extractor.
   *
   * Declared as a PROPERTY OF THE TASK, not as a model id: importing the model
   * constant here would drag `ai-client` — and through it `lib/db` — into a file
   * that is otherwise pure prompt text, and the test that covers these prompts
   * stopped loading the moment it did. Same reason `model-params.ts` exists
   * apart from the adapter. The caller already imports both models and is the
   * one place that should decide.
   *
   * Measured on the extraction model: two mangled Spanish verb forms in four
   * rounds — "Cobra o a las clientas", "definid criterios de validación" —
   * shipped straight into a résumé, where no spellchecker catches them because
   * both halves are real words. seed and certifications stay on the extractor:
   * they emit a job title and short labels, not sentences a recruiter reads.
   */
  writesProse?: boolean
}

/**
 * Start a CV from a job title.
 *
 * The one thing it must never do is ask for more: a job title IS the whole
 * instruction, and "tell me more" from an assistant that was given a profession
 * is the failure this replaced.
 */
function seed(role: string, language: string): Built {
  // THREE positionings, not one. The Content tab used to offer this picker and
  // the assistant did not, so moving the summary here would have quietly taken
  // the choice away — the same three readings the improve-summary engine
  // produces (executive, specialist, value proposition), written from the role
  // instead of from an existing paragraph.
  const system = language === "en"
    ? `You are an expert résumé writer. You write the opening of someone's CV from the job they name.

FIRST decide whether the text names a job, trade or profession that exists in the labour market.
- If it does NOT (a greeting, a question, a sum, loose letters, a request for something else), answer with exactly the JSON ${OFF_TOPIC_SENTINEL} and nothing else. Never state a job from a text that does not name one.
- If it DOES, even as one or two words with no other detail, that is a complete instruction: write the opening, never ask for more data and never return an empty object.

NEVER state a fact about the person: no employers, no dates, no figures, no degrees held, no licences held. You write what THAT ROLE normally does and needs.`
    : `Eres un redactor experto en CVs profesionales. Escribes el arranque del CV de alguien a partir del puesto que declara.

PRIMERO decides si el texto nombra un trabajo, oficio o profesión que exista en el mercado laboral.
- Si NO lo nombra (un saludo, una pregunta, una cuenta, letras sueltas, un pedido de otra cosa), respondes exactamente con el JSON ${OFF_TOPIC_SENTINEL} y nada más. Nunca afirmes un puesto a partir de un texto que no lo nombra.
- Si SÍ lo nombra, aunque sean una o dos palabras y sin ningún otro dato, eso es una instrucción completa: escribes el arranque, nunca pides más datos y nunca devuelves un objeto vacío.

NUNCA afirmas un hecho sobre la persona: ni empleadores, ni fechas, ni cifras, ni títulos obtenidos, ni licencias que tenga. Escribes lo que ESE PUESTO normalmente hace y necesita.`

  const user = language === "en"
    ? `Candidate's text: "${role}"

If it names a job, respond ONLY with this JSON:
{
  "jobTitle": "<the role, under its standard name in the labour market>",
  "summaries": [
    "<EXECUTIVE: the business side of the role — scope, ownership, the outcomes it is accountable for>",
    "<SPECIALIST: the craft side — the tools, standards and techniques the role works with day to day>",
    "<VALUE: what someone in this role brings to an employer, in the terms a hiring manager thinks in>"
  ],
  "inferredSkills": ["<4-6 skills standard for that role: canonical name of a tool, standard or methodology, 1-3 words>"]
}
Each summary is 2-3 sentences, no pronouns, no hard-coded figures, no clichés ('proactive', 'team player', 'results-driven'). The three are genuinely DIFFERENT readings of the same job — not the same paragraph reworded — and all three are true of anyone doing that job.
Never open with "Responsible for" or "In charge of": name the work itself.
Open each summary with a NOUN PHRASE or a gerund — "Day-to-day management of…", "Hive inspection and colony health…", "Managing the teller line…". Never with a conjugated third-person verb ("Manages", "Operates", "Coordinates", "Delivers"): that reads as a reference letter written about someone else, and a CV summary is written from inside the role.`
    : `Texto del candidato: "${role}"

Si nombra un puesto, responde ÚNICAMENTE con este JSON:
{
  "jobTitle": "<el puesto, con su nombre estándar en el mercado laboral>",
  "summaries": [
    "<EJECUTIVA: el lado de negocio del puesto — alcance, responsabilidad, los resultados de los que responde>",
    "<ESPECIALISTA: el lado del oficio — herramientas, normas y técnicas con las que trabaja todos los días>",
    "<PROPUESTA DE VALOR: qué aporta alguien en ese puesto a quien lo contrata, en los términos en que piensa quien contrata>"
  ],
  "inferredSkills": ["<4-6 habilidades estándar de ese puesto: nombre canónico de herramienta, norma o metodología, 1-3 palabras>"]
}
Cada resumen tiene 2-3 frases, sin pronombres, sin cifras quemadas, sin clichés ('proactivo', 'trabajo en equipo', 'orientado a resultados'). Los tres son lecturas GENUINAMENTE distintas del mismo puesto — no el mismo párrafo reescrito — y los tres son ciertos para cualquiera que haga ese trabajo.
Nunca abras con "Responsable de" ni "Encargado de": nombrá el trabajo en sí.
Empezá cada resumen con un SUSTANTIVO o una frase nominal — "Gestión diaria de…", "Manejo de colmenas…", "Atención en ventanilla…". Nunca con un verbo conjugado en tercera persona ("Gestiona", "Aporta", "Realiza"): eso se lee como una carta de recomendación sobre otra persona, y un resumen de CV se escribe desde adentro del puesto.`

  return { system, user, maxTokens: 1200 }
}

/**
 * The credentials a trade usually asks for.
 *
 * The measured failure mode here was not silence but CROSS-TRADE bleed: a food
 * handler's card proposed to a bricklayer, PMP to a secretary. Naming the error
 * explicitly is what fixed it — 10/10 after, each credential belonging to its
 * own trade.
 */
function certifications(role: string, language: string): Built {
  const system = language === "en"
    ? `You are a careers adviser. You name the credentials job ads USUALLY ask for in one specific trade.
Every credential must be REAL, under its own proper name as its issuer writes it, and belong to THAT trade: a credential from another field is a serious error (a food handler's certificate does not belong on a bricklayer, PMP does not belong on a secretary).
You never claim the person holds one: they are examples of what that role tends to ask for.
Prefer local credentials (licences, cards, professional registration) for local trades, and international ones for technical trades.
Keep each name SHORT — the credential as it is written on a CV, with no parenthetical explanation.
If the text names no trade, answer with the JSON ${OFF_TOPIC_SENTINEL}.`
    : `Eres un asesor de carrera. Nombras las credenciales que se piden HABITUALMENTE en avisos de trabajo para un oficio concreto.
Cada credencial debe ser REAL, con su nombre propio tal como la emite quien la emite, y pertenecer A ESE oficio: una credencial de otro rubro es un error grave (un carnet de manipulador de alimentos no va en un albañil, PMP no va en una secretaria).
Nunca afirmas que la persona la tiene: son ejemplos de lo que ese puesto suele pedir.
Prefieres credenciales locales (licencias, carnets, colegiaturas) para oficios locales, e internacionales para oficios técnicos.
Mantené cada nombre CORTO — la credencial tal como se escribe en un CV, sin explicación entre paréntesis.
Si el texto no nombra un oficio, respondes con el JSON ${OFF_TOPIC_SENTINEL}.`

  const user = language === "en"
    ? `Trade: "${role}"
Respond ONLY with this JSON: {"suggestedCertifications": ["<3 to 6 credentials belonging to THAT trade>"]}
Name them in ENGLISH, except where a credential's official name is in another language.`
    : `Oficio: "${role}"
Responde ÚNICAMENTE con este JSON: {"suggestedCertifications": ["<3 a 6 credenciales de ESE oficio>"]}
Nombralas en ESPAÑOL, salvo las que tengan nombre oficial en otro idioma.`

  return { system, user, maxTokens: 400 }
}

/**
 * What the person said about a job, shaped into bullets.
 *
 * The only prompt here that receives the user's own prose, so it is also the
 * only one that can be tempted to embellish it. It may not: the line between
 * "shaped what they said" and "wrote a job for them" is the whole product.
 */
function bullets(role: string, told: string, language: string, declared: string): Built {
  const system = language === "en"
    ? `You are a senior résumé writer who specialises in the trade the candidate names. You write the bullets THEY would write if they knew how a CV is read.

WHAT THE CANDIDATE GIVES YOU is plain speech, often three words: "did the till count", "served customers". Handing that back tidied up is not writing — it is transcription, and it wastes the one thing you are here for. Your job is to write the bullet a professional in that trade would recognise as their own work, properly described.

WHAT YOU KNOW AND MUST USE — this is the value you add:
Every trade has standard content: the controls it runs under, the documents it handles, the regulations it answers to, the operations it performs, the vocabulary its job ads use. A till count is not "counting money" — it is reconciling cash, receipts and discrepancies under internal-control procedure before the accounting close. NAME THAT CONTENT. It is not a claim about the person: it is what the task they said they performed consists of, in their trade.

${cvValueBar("en")}

${noHardCodedFactsRule("en")}

${declared ? `WHAT THIS CANDIDATE HAS ALREADY DECLARED — tools, standards and skills, from their own CV:
${declared}

USE THEM. These are not yours to hard-code; they are already on the page in their own hand, and a bullet that describes the work without naming the tool they use for it throws away the keyword the CV was supposed to carry. Naming the tool costs nothing and is the difference between a line a parser skips and one it matches — same facts either way, and only one of them is searchable. Name a declared tool ONLY where it genuinely belongs to the activity they described; never scatter the list across every line.
` : ""}
SHAPE:
- ONE bullet per activity they mentioned. Never merge two, never add a fourth they did not mention.
- Open with a first-person past-tense action verb.
- Never name the job title or the employer inside a bullet: the CV heading already carries them.

${proseRules("en")}

If the text describes no work at all, answer with the JSON ${OFF_TOPIC_SENTINEL}.`
    : `Sos un redactor senior de CVs especializado en el oficio que nombra el candidato. Escribís las viñetas que ÉL escribiría si supiera cómo se lee un CV.

LO QUE EL CANDIDATO TE DA es lenguaje corriente, muchas veces tres palabras: "realicé arqueo", "atendí al cliente". Devolver eso prolijo no es redactar — es transcribir, y desperdicia lo único para lo que estás. Tu trabajo es escribir la viñeta que un profesional de ese oficio reconocería como su propio trabajo, bien descrito.

LO QUE SABÉS Y TENÉS QUE USAR — este es el valor que aportás:
Todo oficio tiene un contenido estándar: los controles bajo los que opera, los documentos que maneja, la normativa a la que responde, las operaciones que ejecuta, el vocabulario que usan los avisos de trabajo de ese puesto. Un arqueo no es "contar plata": es cuadrar efectivo, comprobantes y diferencias bajo procedimientos de control interno antes del cierre contable. NOMBRÁ ESE CONTENIDO. No es una afirmación sobre la persona: es en qué consiste, en su oficio, la tarea que ella dijo hacer.

${cvValueBar("es")}

${noHardCodedFactsRule("es")}

${declared ? `LO QUE ESTE CANDIDATO YA DECLARÓ — herramientas, normas y habilidades, sacadas de su propio CV:
${declared}

USALAS. No son tuyas para quemar: ya están escritas por él en su CV, y una viñeta que describe el trabajo sin nombrar la herramienta con la que lo hace tira a la basura la keyword que ese CV tenía que llevar. Nombrar la herramienta no cuesta nada y es la diferencia entre una línea que el parser saltea y una que matchea — los mismos hechos en las dos, y sólo una es buscable. Nombrá una herramienta declarada SÓLO donde de verdad pertenece a la actividad que él contó; nunca repartas la lista por todas las líneas.
` : ""}
FORMA:
- UNA viñeta por cada actividad que mencionó. No fusiones dos ni agregues una cuarta que no mencionó.
- Abre con un verbo en PRIMERA persona del pasado simple: la forma -é/-í (Ejecuté, Atendí, Registré, Coordiné). NUNCA la forma -ó de tercera persona, que se lee como si otro escribiera sobre él.
- Nunca nombres el puesto ni la empresa dentro de la viñeta: el encabezado del CV ya los muestra.

${proseRules("es")}

Si el texto no describe trabajo, respondé con el JSON ${OFF_TOPIC_SENTINEL}.`

  const user = language === "en"
    ? `Role: "${role}"
What the person says: "${told}"
Respond ONLY with this JSON: {"bullets": ["<one bullet per activity they named, without the • symbol>"]}
Write the bullets in ENGLISH — this résumé is in English, whatever language the person used to describe their work.`
    : `Puesto: "${role}"
Lo que cuenta la persona: "${told}"
Responde ÚNICAMENTE con este JSON: {"bullets": ["<una viñeta por cada actividad que nombró, sin el símbolo •>"]}
Escribí las viñetas en ESPAÑOL — este CV está en español, sin importar en qué idioma haya contado su trabajo la persona.`

  return { system, user, maxTokens: 700, writesProse: true }
}

/**
 * Builds the pair of messages for one mode.
 *
 * `prompt` carries the whole instruction: the job title for seed and
 * certifications, and "Role — Employer: what they said" for bullets, which is
 * split back apart here so the model is told which role it is writing about.
 */
/**
 * The tools and standards the candidate has already put on their own CV.
 *
 * WHY THE BULLETS PROMPT NEEDS THIS. Reported from a real résumé: a QA engineer
 * whose skills list reads Selenium, Cypress, Playwright, JUnit, TestNG, CI/CD
 * got back bullets about "matrices de test" and "criterios de aceptación" —
 * generic QA nouns, not one tool named. The prompt could not do better: it was
 * handed the role and one sentence, so it had no idea which tools were his, and
 * the never-hard-code rule (correctly) forbids naming a brand out of nowhere.
 *
 * Passing what he already declared closes both halves at once. It hard-codes
 * nothing — every word here was typed by the candidate — and it is precisely
 * what an ATS searches for.
 */
function declaredTools(sectionData: Record<string, unknown> | undefined): string {
  if (!sectionData) return ""
  const skills = ((sectionData.skills ?? []) as { name?: string }[])
    .map((s) => s.name?.trim()).filter((n): n is string => !!n)
  if (skills.length === 0) return ""
  return skills.slice(0, 25).join(", ")
}

export function buildModePrompt(
  mode: ProfileMode,
  prompt: string,
  language: string,
  sectionData?: Record<string, unknown>,
): Built {
  const text = prompt.trim()
  if (mode === "certifications") return certifications(text, language)
  if (mode === "bullets") {
    const at = text.indexOf(":")
    // No colon means no role prefix — the answer stands on its own, and an empty
    // role reads as "unspecified" to the model rather than breaking the prompt.
    const role = at > 0 ? text.slice(0, at).trim() : ""
    const told = at > 0 ? text.slice(at + 1).trim() : text
    return bullets(role, told, language, declaredTools(sectionData))
  }
  return seed(text, language)
}
