// lib/services/ai/shared/cliches.ts
//
// One owner of the phrases that say nothing about the candidate.
//
// They lived inside summary-quality.ts, which was fine while only the summary
// checked them — and then the cover letter needed the same list and there was
// no honest place to import it from. Worse, the prompts each restated the list
// from memory and drifted: the detector rejected "proven track record" while
// the English prompt never mentioned it, and the Spanish prompt banned five
// phrases including one the detector does not check. The clichés that reached
// users were exactly the ones the model had never been told about.
//
// So the list is the only definition, and everything else reads from it: the
// checks (hasCliche) and the prompts (clicheBanList). Adding a phrase here bans
// it in the prompt and rejects it in the output, in one edit.
//
// A phrase belongs here when it would fit any candidate in any role. Anything
// specific to one document — a summary's missing metric, a letter's generic
// opener — belongs in that document's own quality module.

const CLICHES_EN: readonly string[] = [
  "responsible for", "passionate about", "looking for new challenges",
  "experienced in", "team player", "detail-oriented", "hard-working",
  "hard worker", "results-driven", "results-oriented", "go-getter",
  "self-starter", "proven track record", "think outside the box",
  "wear many hats", "seasoned professional", "dynamic professional",
  "track record of success", "i believe i", "i am excited to",
  "i am a proactive person",
]

const CLICHES_ES: readonly string[] = [
  "responsable de", "apasionado por", "apasionada por", "con experiencia en",
  "busco nuevos retos", "trabajo en equipo", "orientado al detalle",
  "orientada al detalle", "proactivo", "proactiva", "orientado a resultados",
  "orientada a resultados", "don de gentes", "amplia trayectoria",
  "trayectoria probada", "profesional dinámico", "profesional dinámica",
  "me motiva", "creo firmemente", "estoy emocionado de",
  "estoy emocionada de",
]

/**
 * Checked against both languages whatever the document's own: a Spanish letter
 * that opens "Passionate about" is just as empty, and mixed-language text is
 * ordinary in tech CVs.
 */
const ALL: readonly string[] = [...CLICHES_EN, ...CLICHES_ES]

/** True when the text leans on a phrase that fits anyone. */
export function hasCliche(text: string): boolean {
  const lower = (text ?? "").toLowerCase()
  return ALL.some((c) => lower.includes(c))
}

/** Every cliché the text carries — for logs, so a run can be explained. */
export function findCliches(text: string): string[] {
  const lower = (text ?? "").toLowerCase()
  return ALL.filter((c) => lower.includes(c))
}

/**
 * The banned list as the prompt states it, straight from the detector.
 *
 * The model is told exactly what will be rejected — nothing more, nothing less.
 */
export function clicheBanList(language: "es" | "en"): string {
  const list = language === "en" ? CLICHES_EN : CLICHES_ES
  return list.map((c) => `"${c.charAt(0).toUpperCase()}${c.slice(1)}"`).join(", ")
}
