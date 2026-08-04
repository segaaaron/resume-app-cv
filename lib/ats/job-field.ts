// lib/ats/job-field.ts
// Infer the user's field from the job title they already entered, so skill
// suggestions can be RANKED by relevance (a nurse sees nursing skills first, a
// designer sees design tools first) — a soft boost, never a filter, so nothing is
// hidden and a wrong guess only reorders. Deterministic, no model.
import { normalizeTerm } from "@/lib/ats/vocabulary"

// Job-title keywords → dictionary category. Non-tech and specific roles are checked
// BEFORE generic engineering titles so "UX Designer" resolves to design, not lang.
// Bilingual (en/es) to match the product's two markets.
const TITLE_TO_CATEGORY: Array<{ cat: string; kws: string[] }> = [
  { cat: "healthcare", kws: ["nurse", "nursing", "physician", "doctor", "medical", "clinical", "surgeon", "therapist", "paramedic", "pharmacist", "dentist", "radiolog", "caregiver", "enfermer", "medico", "médico", "clínic", "clinic", "salud"] },
  { cat: "design", kws: ["designer", "graphic", "illustrat", "motion", "art director", "creative director", "brand", "diseñ", "ux", "ui/ux"] },
  { cat: "legal", kws: ["lawyer", "attorney", "paralegal", "counsel", "litigation", "abogad", "juríd", "notari"] },
  { cat: "education", kws: ["teacher", "professor", "instructor", "tutor", "educator", "lecturer", "docente", "profesor", "maestr"] },
  { cat: "operations", kws: ["logistics", "warehouse", "supply chain", "procurement", "manufacturing", "welder", "electrician", "plumber", "chef", "cook", "bartender", "construction", "hvac", "operario", "almacén", "operations manager"] },
  { cat: "finance", kws: ["accountant", "financial", "controller", "auditor", "bookkeeper", "contad", "financ", "tesorer"] },
  { cat: "sales", kws: ["sales", "account executive", "business development", "vendedor", "ventas", "comercial"] },
  { cat: "marketing", kws: ["marketing", "seo", "growth", "social media", "content", "publicid"] },
  { cat: "hr", kws: ["recruiter", "human resources", "talent acquisition", "people ops", "reclutad", "recursos humanos"] },
  { cat: "pm", kws: ["product manager", "project manager", "program manager", "scrum master", "product owner", "gerente de proyecto"] },
  { cat: "data", kws: ["data scientist", "data engineer", "data analyst", "machine learning", "ml engineer", "ai engineer", "analytics", "científico de datos"] },
  { cat: "mobile", kws: ["ios", "android", "mobile", "flutter", "react native"] },
  { cat: "devops", kws: ["devops", "sre", "site reliability", "platform engineer", "infrastructure"] },
  { cat: "frontend", kws: ["frontend", "front-end", "front end", "ui engineer"] },
  { cat: "backend", kws: ["backend", "back-end", "back end", "api engineer"] },
  { cat: "lang", kws: ["software engineer", "developer", "programmer", "full stack", "fullstack", "full-stack", "engineer", "desarrollador", "ingeniero de software", "programador"] },
]

/**
 * Categories to boost in suggestions. Uses the job title first; falls back to the
 * most common category among the user's existing skills. Returns [] when nothing
 * is inferable (suggestions then rank purely by match).
 */
export function inferFieldCategories(jobTitle: string, existingCategories: readonly string[] = []): string[] {
  const t = normalizeTerm(jobTitle)
  const hits: string[] = []
  if (t) {
    for (const { cat, kws } of TITLE_TO_CATEGORY) {
      if (!hits.includes(cat) && kws.some((k) => t.includes(k))) {
        hits.push(cat)
        if (hits.length >= 2) break
      }
    }
  }
  if (hits.length > 0) return hits

  if (existingCategories.length > 0) {
    const counts = new Map<string, number>()
    for (const c of existingCategories) if (c) counts.set(c, (counts.get(c) ?? 0) + 1)
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
    if (top) return [top[0]]
  }
  return []
}
