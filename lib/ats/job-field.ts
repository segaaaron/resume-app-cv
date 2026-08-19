// lib/ats/job-field.ts
// Infer the user's field from the job title they already entered, so skill
// suggestions can be RANKED by relevance (a nurse sees nursing skills first, a
// designer sees design tools first) — a soft boost, never a filter, so nothing is
// hidden and a wrong guess only reorders. Deterministic, no model.
import { normalizeTerm } from "@/lib/ats/vocabulary"

// Job-title keywords → dictionary category. Non-tech and specific roles are checked
// BEFORE generic engineering titles so "UX Designer" resolves to design, not lang.
// Bilingual (en/es) to match the product's two markets.
//
// Keywords are matched at the START of a word, so most Spanish entries are stems
// on purpose: "contad" catches contador and contadora, "financ" catches financiero
// and financiera, "abogad" catches abogado and abogada. Write them without
// accents — they are normalized below, alongside the title.
const TITLE_TO_CATEGORY: Array<{ cat: string; kws: string[] }> = [
  { cat: "healthcare", kws: ["nurse", "nursing", "physician", "doctor", "medical", "clinical", "surgeon", "therapist", "paramedic", "pharmacist", "dentist", "radiolog", "caregiver", "enfermer", "medico", "clinic", "salud", "odontolog", "psicolog", "fisioterapeut", "nutricion", "nutricionista", "veterinari", "obstetr", "kinesiolog", "auxiliar de enfermeria"] },
  { cat: "design", kws: ["designer", "graphic", "illustrat", "motion", "art director", "creative director", "brand", "disen", "ux", "ui/ux", "ilustrad", "diagramad"] },
  { cat: "legal", kws: ["lawyer", "attorney", "paralegal", "counsel", "litigation", "abogad", "jurid", "notari", "derecho", "escriban", "procurador", "asesor legal", "asistente legal", "fiscal"] },
  { cat: "education", kws: ["teacher", "professor", "instructor", "tutor", "educator", "lecturer", "docente", "profesor", "maestr", "catedratic", "pedagog", "educad"] },
  // Office and front-desk work lives here: the dictionary already carries
  // "office management", "filing systems", "front desk reception" and
  // "correspondence management" under operations, with their Spanish forms.
  { cat: "operations", kws: ["logistics", "warehouse", "supply chain", "procurement", "manufacturing", "welder", "electrician", "plumber", "chef", "cook", "bartender", "construction", "hvac", "operario", "almacen", "operations manager", "secretari", "recepcion", "asistente administrativ", "auxiliar administrativ", "administrativ", "administrador", "administracion", "oficina", "office manager", "office assistant", "executive assistant", "asistente ejecutiv", "conserje", "mensajer", "cajer", "atencion al cliente", "servicio al cliente", "customer service", "mesero", "camarer", "cociner", "panader", "chofer", "conductor", "mecanic", "carpinter", "soldador", "electricista", "plomero", "gasfiter", "costurer", "limpieza", "seguridad", "vigilante", "inventario", "produccion", "bodega", "supervisor de planta"] },
  // Banking sits in finance: a branch manager, a teller supervisor and a credit
  // analyst all want the same vocabulary.
  { cat: "finance", kws: ["accountant", "financial", "controller", "auditor", "bookkeeper", "contad", "contable", "financ", "tesorer", "banc", "banking", "riesgo", "credit", "credito", "creditic", "cartera", "cobranza", "sucursal", "branch manager", "teller", "prestam", "hipotecari", "seguros", "actuari", "presupuest", "costos", "impuest", "tributari"] },
  { cat: "sales", kws: ["sales", "account executive", "business development", "vendedor", "vendedora", "ventas", "comercial", "asesor comercial", "ejecutivo de cuenta", "promotor", "preventista", "telemarketing"] },
  { cat: "marketing", kws: ["marketing", "seo", "growth", "social media", "content", "publicid", "mercadeo", "publicista", "community manager", "redes sociales", "branding"] },
  { cat: "hr", kws: ["recruiter", "human resources", "talent acquisition", "people ops", "reclutad", "recursos humanos", "seleccion de personal", "jefe de personal", "capacitacion", "nomina", "payroll"] },
  { cat: "pm", kws: ["product manager", "project manager", "program manager", "scrum master", "product owner", "gerente de proyecto", "jefe de proyecto", "coordinador de proyecto"] },
  { cat: "data", kws: ["data scientist", "data engineer", "data analyst", "machine learning", "ml engineer", "ai engineer", "analytics", "cientifico de datos", "analista de datos", "ingeniero de datos"] },
  { cat: "mobile", kws: ["ios", "android", "mobile", "flutter", "react native"] },
  { cat: "devops", kws: ["devops", "sre", "site reliability", "platform engineer", "infrastructure"] },
  { cat: "frontend", kws: ["frontend", "front-end", "front end", "ui engineer"] },
  { cat: "backend", kws: ["backend", "back-end", "back end", "api engineer"] },
  { cat: "lang", kws: ["software engineer", "developer", "programmer", "full stack", "fullstack", "full-stack", "engineer", "desarrollador", "ingeniero de software", "programador"] },
]

/**
 * The keywords, normalized exactly like the title they are compared against.
 *
 * They used to be compared raw, which quietly killed every accented one:
 * `normalizeTerm` strips accents from the TITLE, so "Diseñador Gráfico" arrived
 * as "disenador grafico" and the keyword "diseñ" could never match it. Designers,
 * data scientists and warehouse leads all fell through to no category at all.
 */
const NORMALIZED: Array<{ cat: string; kws: string[] }> = TITLE_TO_CATEGORY.map(
  ({ cat, kws }) => ({ cat, kws: kws.map((k) => normalizeTerm(k)).filter(Boolean) })
)

/**
 * True when `kw` appears in `title` at the start of a word.
 *
 * A plain `includes` matched inside words, and two-letter keywords made that
 * expensive: "ux" hit a-UX-iliar, so every "Auxiliar contable" in the product was
 * filed under graphic design. Anchoring to a word start keeps the stems working —
 * "contad" still matches "contadora" — while "ux" stops matching "auxiliar".
 */
function mentionsAtWordStart(title: string, kw: string): boolean {
  for (let from = 0; ; ) {
    const i = title.indexOf(kw, from)
    if (i === -1) return false
    if (i === 0 || !/[a-z0-9]/.test(title[i - 1])) return true
    from = i + 1
  }
}

/**
 * Categories to boost in suggestions. Uses the job title first; falls back to the
 * most common category among the user's existing skills. Returns [] when nothing
 * is inferable (suggestions then rank purely by match).
 */
export function inferFieldCategories(jobTitle: string, existingCategories: readonly string[] = []): string[] {
  const t = normalizeTerm(jobTitle)
  const hits: string[] = []
  if (t) {
    for (const { cat, kws } of NORMALIZED) {
      if (!hits.includes(cat) && kws.some((k) => mentionsAtWordStart(t, k))) {
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
