// An AI feature does not get to hand the user nothing.
//
// THE RULE, set by the CEO and applied here once instead of eleven times: when a
// guard, a filter or the model itself leaves a hole, something fills it. The
// user never sees "could not do it" for having done everything right.
//
// WHY IT MATTERS BEYOND POLITENESS. Every one of these endpoints is reached by
// pressing a button that costs a use, and often a two-minute cooldown. An empty
// answer therefore does not cost the user nothing — it costs them a use, the
// wait, and their confidence in the feature. Measured on fill-profile before
// this existed: the model answered `{}` for roughly one request in ten, with no
// pattern the user could learn from, and the panel said "I could not build your
// CV with that" to someone who had typed their profession correctly.
//
// THE ORDER, which is also the order of cost:
//   1. ask
//   2. if the answer is empty, ask ONE more time, saying so
//   3. if it is still empty, fall back to something useful and truthful
//
// Step 2 is where most of the recovery happens (an empty answer is usually a
// bad roll, not a bad prompt). Step 3 is what makes the guarantee absolute, and
// it is the caller's job to define, because only the caller knows what "useful
// and truthful" is for its feature — the existing text unchanged, a shorter
// rewrite, a deterministic version with no model at all. What it must never be
// is invented facts about the person: filling a hole is not licence to make
// something up.
//
// WHAT THIS DELIBERATELY DOES NOT SWALLOW: a genuine off-topic. Someone who
// pastes a poem where a job posting goes has to be told, or the product answers
// nonsense with confident nonsense. `isOffTopic` marks that case, and it skips
// straight past the retry — a second call would spend money to be told the same
// thing.

export interface NeverEmptyOptions<T> {
  /** The call. `attempt` is 0 for the first try, 1 for the retry. */
  ask: (attempt: number) => Promise<T>
  /** True when the answer is usable. Empty arrays, blank strings — caller decides. */
  isAnswered: (result: T) => boolean
  /**
   * True when the request itself was off-topic and no retry can help. Optional:
   * without it, everything unanswered is treated as a bad roll worth retrying.
   */
  isOffTopic?: (result: T) => boolean
  /**
   * What the user gets when the model never answered. Runs at most once.
   * Returning null means "there really is nothing" — the caller then decides,
   * and it is the only path that may still surface an error.
   */
  fallback: () => Promise<T | null> | T | null
  /** Told what happened, so a silent 30% failure rate cannot hide. */
  onFilled?: (what: "retry" | "fallback") => void
}

export class OffTopicError extends Error {
  constructor() {
    super("off_topic")
    this.name = "OffTopicError"
  }
}

/**
 * Runs the call, retries an empty answer once, and fills what remains.
 *
 * Throws `OffTopicError` only when the caller's own `isOffTopic` says the input
 * was not about a résumé at all. Returns null only when the fallback returns
 * null — never as a way of giving up.
 */
export async function askUntilAnswered<T>({
  ask, isAnswered, isOffTopic, fallback, onFilled,
}: NeverEmptyOptions<T>): Promise<T | null> {
  const first = await ask(0)
  if (isAnswered(first)) return first
  if (isOffTopic?.(first)) throw new OffTopicError()

  // One retry. Two would cost the user a wait longer than the feature is worth,
  // and a prompt that fails twice on the same input is not going to succeed on
  // the third — that is what the fallback is for.
  const second = await ask(1)
  if (isAnswered(second)) { onFilled?.("retry"); return second }
  if (isOffTopic?.(second)) throw new OffTopicError()

  onFilled?.("fallback")
  return (await fallback()) ?? null
}

/**
 * The sentence appended to a retry.
 *
 * Not a scolding and not a new instruction: the model is told its previous
 * answer was empty and asked for the same JSON with content. Adding rules on a
 * retry is how prompts end up contradicting themselves, which OpenAI documents
 * as making the model spend its reasoning reconciling them instead of obeying.
 */
export function retryNudge(language: string): string {
  return language === "en"
    ? "\n\nYour previous answer came back empty. Return the same JSON structure, filled in. If the request is genuinely impossible, return the off-topic sentinel — but an empty answer to a valid request is not an option."
    : "\n\nTu respuesta anterior vino vacía. Devolvé la misma estructura JSON, con contenido. Si el pedido es genuinamente imposible, devolvé el centinela de off-topic — pero una respuesta vacía a un pedido válido no es una opción."
}
