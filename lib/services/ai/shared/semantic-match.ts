// lib/services/ai/shared/semantic-match.ts
//
// Semantic keyword matching via embeddings. The exact matcher (ats-matcher.ts)
// only sees a keyword when the CV spells it the same way; a JD asking for "REST
// APIs" misses a CV that says "APIs REST", and no hand-maintained alias table
// scales to every synonym / word-order / language variant. This layer catches
// those by cosine similarity between embedding vectors — the same technique
// enterprise ATS (S-BERT) use — and ONLY ever ADDS recall: it can turn a missing
// keyword into a matched one, never the reverse, so the exact score is a floor.

import { normalizeTerm } from "@/lib/ats/vocabulary"

/** Cosine similarity of two equal-length vectors. 0 when either is a zero vector. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

// text-embedding-3-small scores genuinely-equivalent skill terms ("REST APIs" ↔
// "APIs REST", "team leadership" ↔ "liderazgo de equipos") comfortably above this
// and unrelated terms below. Conservative on purpose: a false positive would
// credit a skill the candidate lacks, which this product refuses to do.
//
// Tunable in prod WITHOUT a deploy via SEMANTIC_MATCH_THRESHOLD env (0..1): raise
// it if false positives appear, lower it if real equivalents are missed. Invalid
// / out-of-range values fall back to the safe default.
function resolveThreshold(): number {
  const raw = Number(process.env.SEMANTIC_MATCH_THRESHOLD)
  return Number.isFinite(raw) && raw > 0 && raw < 1 ? raw : 0.62
}
export const SEMANTIC_MATCH_THRESHOLD = resolveThreshold()

/**
 * The cheap threshold used when the pass is a PRE-FILTER rather than the verdict.
 *
 * Measured against 80 real es/en pairs plus 42 near-miss distractors: no single
 * threshold separates them. At 0.62 the score credits "backend" to a CV that only
 * says "frontend" (0.684) and "inspecciones sanitarias" to one that says "safety
 * inspections" (0.622), while still missing more than half of genuine translations
 * ("cuentas por cobrar" ↔ "accounts receivable", 0.516). Cosine measures topical
 * relatedness, and equivalence is not relatedness — no number fixes that.
 *
 * So when a judge runs behind it, the threshold stops being the decision and
 * becomes a cost control: keep recall high (0.40 kept 40/40 of the first set and
 * 39/40 of a held-out one) and let the judge reject. Only pairs above this cost a
 * token, and only the first time in the product's life.
 */
export const SEMANTIC_PREFILTER_THRESHOLD = 0.4

/** A pair worth asking about: a required keyword and the candidate's closest term. */
export interface SemanticCandidate {
  /** The requirement, as the job description worded it. */
  keyword: string
  /** The candidate's own term that came closest. */
  cvTerm: string
  similarity: number
}

/**
 * Same embedding pass as findSemanticMatches, but returns the PAIRS instead of a
 * verdict, so a judge can decide them. Fails CLOSED — an empty list leaves the
 * exact-match result untouched.
 */
export async function findSemanticCandidates(
  missingKeywords: string[],
  cvTerms: string[],
  embed: (texts: string[]) => Promise<number[][]>,
  threshold = SEMANTIC_PREFILTER_THRESHOLD,
  onFailure?: (err: Error) => void,
): Promise<SemanticCandidate[]> {
  const missing = [...new Set(missingKeywords.map((k) => k.trim()).filter(Boolean))]
  const terms = [...new Set(cvTerms.map((t) => t.trim()).filter(Boolean))]
  if (missing.length === 0 || terms.length === 0) return []

  try {
    const vectors = await embed([...missing, ...terms])
    if (vectors.length !== missing.length + terms.length) {
      onFailure?.(new Error(`embed returned ${vectors.length} vectors, expected ${missing.length + terms.length}`))
      return []
    }
    const missVecs = vectors.slice(0, missing.length)
    const termVecs = vectors.slice(missing.length)

    const out: SemanticCandidate[] = []
    for (let i = 0; i < missing.length; i++) {
      // Only the closest term is worth judging: if the best one is not the same
      // skill, no weaker one is, and asking about all of them multiplies the bill.
      let best = 0
      let bestIdx = -1
      for (let j = 0; j < termVecs.length; j++) {
        const sim = cosineSimilarity(missVecs[i], termVecs[j])
        if (sim > best) { best = sim; bestIdx = j }
      }
      if (bestIdx >= 0 && best >= threshold) {
        out.push({ keyword: missing[i], cvTerm: terms[bestIdx], similarity: best })
      }
    }
    return out
  } catch (err) {
    onFailure?.(err instanceof Error ? err : new Error(String(err)))
    return []
  }
}

/**
 * Returns the normalized set of `missingKeywords` that a `cvTerm` is semantically
 * equivalent to (cosine ≥ threshold). One batched embed call. Fails CLOSED — any
 * error yields an empty set, leaving the exact-match result untouched.
 *
 * Kept for the callers where a false positive only hides a suggestion instead of
 * crediting a skill (tailor's dedupe). The ATS score no longer decides on cosine
 * alone — see findSemanticCandidates and skill-equivalence.ts.
 */
export async function findSemanticMatches(
  missingKeywords: string[],
  cvTerms: string[],
  embed: (texts: string[]) => Promise<number[][]>,
  threshold = SEMANTIC_MATCH_THRESHOLD,
  /** Called when the embedding pass could not run. Optional so existing callers
   *  keep working; the ATS score passes one so the failure reaches the panel. */
  onFailure?: (err: Error) => void,
): Promise<Set<string>> {
  const matched = new Set<string>()
  // Dedupe + drop blanks to keep the embed call small.
  const missing = [...new Set(missingKeywords.map((k) => k.trim()).filter(Boolean))]
  const terms = [...new Set(cvTerms.map((t) => t.trim()).filter(Boolean))]
  if (missing.length === 0 || terms.length === 0) return matched

  try {
    const vectors = await embed([...missing, ...terms])
    if (vectors.length !== missing.length + terms.length) {
      onFailure?.(new Error(`embed returned ${vectors.length} vectors, expected ${missing.length + terms.length}`))
      return matched
    }
    const missVecs = vectors.slice(0, missing.length)
    const termVecs = vectors.slice(missing.length)

    for (let i = 0; i < missing.length; i++) {
      let best = 0
      for (const tv of termVecs) {
        const sim = cosineSimilarity(missVecs[i], tv)
        if (sim > best) best = sim
      }
      if (best >= threshold) matched.add(normalizeTerm(missing[i]))
    }
  } catch (err) {
    // Fail closed — the exact-match score stands. But NOT silently: without the
    // synonym pass ("REST APIs" ≡ "APIs REST") those requirements count as
    // missing, so a transient embedding failure drops the score hard and used to
    // leave no trace anywhere. The caller reports it, and the panel can say the
    // number is understated instead of the user seeing 70 become 33.
    onFailure?.(err instanceof Error ? err : new Error(String(err)))
    return new Set()
  }
  return matched
}

// ─── Bullets of one role that talk about the same work ────────────────────────

/**
 * The floor under a pair worth OFFERING to merge.
 *
 * MEASURED on 20 hand-labelled pairs across ten trades in both languages, held
 * out — labelled before any number was seen. Real merges scored 0.498 to 0.632;
 * genuinely different work from the same role scored 0.325 to 0.551. The bands
 * touch, so this is not a verdict and must never be used as one: at 0.50 it
 * offers 9 of 10 real merges and 1 of 10 wrong ones, and at 0.60 it offers 1 of
 * 10 real ones — a cut that kills the feature to buy precision it does not need.
 *
 * It does not need it because NOTHING IS APPLIED FROM THIS. The card shows both
 * lines in full and the user clicks; the model then writes the fusion and may
 * decline; and the result goes through a confirm before it touches the CV. Same
 * shape as SEMANTIC_PREFILTER_THRESHOLD above: keep recall high and let the
 * reader decide.
 *
 * WHY EMBEDDINGS AT ALL. The deterministic predicate this replaces asks whether
 * two lines share vocabulary, which answers "is this the same sentence?" — the
 * DUPLICATE question. Measured on the same set, it offered 0 of 10, because five
 * of the ten real merges share no content word at all: "Gestioné la agenda" and
 * "Confirmé los turnos" are one job written twice with no word in common. Cosine
 * measures topical relatedness, and "same work?" is a topical question.
 */
export const MERGE_PAIR_THRESHOLD = 0.5

/** How many pairs one role may propose. The user picks among them. */
export const MERGE_PAIRS_PER_ROLE = 3

/**
 * DOS LÍNEAS QUE DICEN LO MISMO. Otra pregunta, otro corte.
 *
 * `MERGE_PAIR_THRESHOLD` pregunta si dos líneas son UN trabajo partido en dos:
 * complementarias, cada una aporta algo que la otra no, y la salida es
 * fusionarlas. Esta pregunta es la contraria: una de las dos NO aporta nada, y
 * la salida es que sobra. Marcar una fusión como repetición le diría al
 * candidato «borrá una» donde había que unirlas — por eso el corte de acá tiene
 * que quedar POR ENCIMA del de fusión, no ser el mismo número con otro nombre.
 *
 * MEDIDO CONTRA LA API REAL (`scripts/ai-eval/repeat-threshold.test.ts`, 24
 * pares etiquetados a mano ANTES de ver un número):
 *
 *   repetido    0.654 – 0.897   (12 pares, incluidos dos cruzando puestos)
 *   fusionable  0.498 – 0.569   (6 pares)
 *   distinto    0.257 – 0.505   (6 pares)
 *
 * Las bandas NO se tocan: hueco entre 0.569 y 0.654. El corte va en medio de ese
 * hueco, apenas del lado de la precisión — un falso positivo acusa de repetir a
 * quien no repitió, y eso enoja más que el silencio. A 0.62 marca las 12
 * repeticiones y ninguno de los 12 negativos.
 */
export const REPEAT_PAIR_THRESHOLD = 0.62

/**
 * Una repetición vive ENTRE DOS PUESTOS tanto como dentro de uno, y por eso cada
 * lado lleva su `targetId`: el caso más común es copiar un logro del trabajo
 * anterior al siguiente, que es exactamente lo que el detector viejo no podía
 * ver porque comparaba sólo dentro de cada puesto.
 */
export interface RepeatedPair {
  a: { targetId: string; index: number }
  b: { targetId: string; index: number }
  score: number
}

export interface RoleBullets {
  targetId: string
  /** Only the bullets eligible to be merged, with their real index in the role. */
  candidates: { index: number; text: string }[]
}

export interface SemanticPair {
  targetId: string
  indexes: [number, number]
  score: number
}

/**
 * Ranks, per role, the bullet pairs most likely to be one piece of work.
 *
 * PROPOSES, never decides. Measured, no automatic selector is accurate enough to
 * pick THE pair: ranking inside a role put the labelled pair first in four roles
 * out of six, with margins as thin as 0.004. So it returns several, the card
 * shows both lines of each, and the person who did the work chooses. That is the
 * same reasoning `merge-candidates.ts` already applies to the model — a chooser
 * that is always confident is not a chooser — extended to our own code once the
 * numbers said our code is not confident either.
 *
 * Fails closed: any embedding error yields an empty list, and the caller keeps
 * its deterministic behaviour.
 */
export interface RoleAllBullets {
  targetId: string
  /** TODAS las viñetas del puesto, con su índice real. */
  bullets: { index: number; text: string }[]
  /** Los índices que además pueden PROPONERSE PARA FUSIÓN. */
  mergeEligible: readonly number[]
}

/** Cuántas repeticiones se muestran. Más que esto es una lista, no un hallazgo. */
export const REPEATED_PAIRS_MAX = 6

/**
 * UNA SOLA PETICIÓN DE EMBEDDINGS, DOS PREGUNTAS DISTINTAS.
 *
 * Antes se embebían sólo las viñetas ELEGIBLES PARA FUSIÓN: puestos con cuatro
 * líneas o más, sin cifras, de 25 caracteres para arriba, y comparadas
 * únicamente contra las de su propio puesto. Esos filtros son correctos para
 * proponer una fusión —fusionar es destructivo— pero dejaban ciega la otra
 * pregunta: un CV de tres puestos con tres líneas cada uno no se comparaba
 * NUNCA, y copiar un logro del trabajo anterior al siguiente era invisible por
 * construcción. Es lo que el CEO reportó: «podemos tener bullets repetidos y el
 * ATS no nos los comenta».
 *
 * Ahora se embebe TODO el CV una vez y de esos mismos vectores salen las dos
 * respuestas. No hay llamada nueva: hay más textos en la petición que ya se
 * hacía. La comparación es n² sobre unas decenas de vectores.
 *
 * Falla cerrada: cualquier error de embeddings devuelve las dos listas vacías y
 * el que llama se queda con su camino determinista de siempre.
 */
export async function findBulletSimilarity(
  roles: RoleAllBullets[],
  embed: (texts: string[]) => Promise<number[][]>,
): Promise<{ mergePairs: SemanticPair[]; repeatedPairs: RepeatedPair[] }> {
  const empty = { mergePairs: [], repeatedPairs: [] }
  const work = roles.filter((r) => r.targetId && r.bullets.length > 0)
  const total = work.reduce((n, r) => n + r.bullets.length, 0)
  if (total < 2) return empty

  const flat = work.flatMap((r) => r.bullets.map((b) => ({ targetId: r.targetId, index: b.index, text: b.text })))
  let vectors: number[][]
  try {
    vectors = await embed(flat.map((f) => f.text))
  } catch {
    return empty
  }
  if (vectors.length !== flat.length) return empty

  // ── Repeticiones: TODO contra TODO, también entre puestos ────────────────
  const candidates: (RepeatedPair & { ia: number; ib: number })[] = []
  for (let i = 0; i < flat.length; i++) {
    for (let j = i + 1; j < flat.length; j++) {
      // El texto idéntico es el chequeo de duplicado exacto, que además sabe
      // borrarlo. Acá van las que dicen lo mismo con otras palabras.
      if (flat[i].text.trim().toLowerCase() === flat[j].text.trim().toLowerCase()) continue
      const score = cosineSimilarity(vectors[i], vectors[j])
      if (score < REPEAT_PAIR_THRESHOLD) continue
      candidates.push({
        a: { targetId: flat[i].targetId, index: flat[i].index },
        b: { targetId: flat[j].targetId, index: flat[j].index },
        score,
        ia: i,
        ib: j,
      })
    }
  }
  // La más parecida primero, y ninguna línea en dos hallazgos: tres tarjetas
  // encadenadas sobre la misma viñeta son una sola cosa dicha tres veces.
  candidates.sort((a, b) => b.score - a.score)
  const usedLine = new Set<number>()
  const repeatedPairs: RepeatedPair[] = []
  for (const c of candidates) {
    if (usedLine.has(c.ia) || usedLine.has(c.ib)) continue
    usedLine.add(c.ia); usedLine.add(c.ib)
    repeatedPairs.push({ a: c.a, b: c.b, score: c.score })
    if (repeatedPairs.length >= REPEATED_PAIRS_MAX) break
  }

  // ── Fusiones: sólo dentro del puesto y sólo entre las elegibles ──────────
  const repeated = new Set(
    repeatedPairs.flatMap((p) => [`${p.a.targetId}#${p.a.index}`, `${p.b.targetId}#${p.b.index}`]),
  )
  const mergePairs: SemanticPair[] = []
  let offset = 0
  for (const role of work) {
    const base = offset
    offset += role.bullets.length
    const eligible = new Set(role.mergeEligible)
    const local = role.bullets
      .map((b, k) => ({ index: b.index, vec: vectors[base + k] }))
      .filter((b) => eligible.has(b.index))
    if (local.length < 2) continue

    const pairs: SemanticPair[] = []
    for (let i = 0; i < local.length; i++) {
      for (let j = i + 1; j < local.length; j++) {
        // Una repetición NO es una fusión: si ya se dijo que una de las dos
        // sobra, ofrecer unirlas es mandar al usuario a dos sitios distintos
        // con la misma línea.
        if (repeated.has(`${role.targetId}#${local[i].index}`) || repeated.has(`${role.targetId}#${local[j].index}`)) continue
        const score = cosineSimilarity(local[i].vec, local[j].vec)
        if (score < MERGE_PAIR_THRESHOLD) continue
        pairs.push({ targetId: role.targetId, indexes: [local[i].index, local[j].index], score })
      }
    }
    // Best first, and no bullet in two proposals: two cards offering to fold the
    // same line in different directions is a choice nobody can make.
    pairs.sort((a, b) => b.score - a.score)
    const taken = new Set<number>()
    for (const p of pairs) {
      if (taken.has(p.indexes[0]) || taken.has(p.indexes[1])) continue
      taken.add(p.indexes[0]); taken.add(p.indexes[1])
      mergePairs.push(p)
      if (taken.size >= MERGE_PAIRS_PER_ROLE * 2) break
    }
  }

  return { mergePairs, repeatedPairs }
}

/**
 * Las fusiones solas, para quien no necesita la otra respuesta.
 *
 * Delega: un segundo cuerpo con la misma lógica es la copia divergente que este
 * proyecto ya pagó una vez.
 */
export async function findMergePairs(
  roles: RoleBullets[],
  embed: (texts: string[]) => Promise<number[][]>,
): Promise<SemanticPair[]> {
  const input: RoleAllBullets[] = roles
    .filter((r) => r.targetId && r.candidates.length >= 2)
    .map((r) => ({
      targetId: r.targetId,
      bullets: r.candidates.map((c) => ({ index: c.index, text: c.text })),
      mergeEligible: r.candidates.map((c) => c.index),
    }))
  if (input.length === 0) return []
  const { mergePairs } = await findBulletSimilarity(input, embed)
  return mergePairs
}
