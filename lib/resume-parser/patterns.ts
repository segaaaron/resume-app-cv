/**
 * patterns — Regexes y helpers compartidos entre los módulos del parser de CV.
 */

export function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim()
}

/**
 * Marcador de salto de columna (Group Separator, U+001D — nunca aparece en
 * texto real). extract-pdf lo emite entre la columna principal y el sidebar;
 * el section splitter corta la sección actual al verlo, evitando que el
 * contenido del sidebar se anexe a la última sección del flujo principal.
 */
export const COLUMN_BREAK = "\u001D"

export const HAS_YEAR = /\b(20\d{2}|19\d{2})\b/

/** Palabras que sugieren fuertemente que una línea es un rol/título de trabajo. */
export const ROLE_KEYWORDS = /\b(developer|engineer|manager|designer|director|lead|senior|junior|intern|analyst|consultant|architect|scientist|specialist|coordinator|executive|officer|head|vp|cto|ceo|coo|cfo|devops|fullstack|frontend|backend|mobile|ios|android|qa|tester|scrum|agile|product|project|software|web|data|cloud|security|network|system|support|recruiter|hr|marketing|sales|account)\b/i

/** Instituciones académicas — entradas de educación, no empleadores. */
export const INSTITUTION_RE = /\b(university|universidad|college|instituto|institute|school|escuela|academy|academia|polytechnic|politécnico|politecnico|colegio|católica|catolica|faculty|facultad|seminary|seminario)\b/i

/** Títulos académicos. "engineer/science/arts" excluidos (demasiado amplios). */
export const DEGREE_RE = /\b(licenciatura|ingeniería|ingenieria|bachillerato|maestría|maestria|doctorado|técnico|tecnico|bachelor|master|phd|mba|degree|diploma|carrera|grado|licenciado|associate|postgrad|posgrado|bsc|msc|beng|meng|llb|llm|bba|b\.eng|m\.eng|b\.s\.|m\.s\.|m\.a\.|b\.a\.|b\.sc|m\.sc)\b/i

/** Labels de plantilla de sidebar — sub-encabezados, no valores de campos. */
export const SIDEBAR_LABEL_RE = /^(studied\s+at|estudió\s+en|cursó\s+en|gpa|grade|honours?|honors?|activities?|awards?|achievements?|languages?|skills?|references?|contact|links?)$/i

/** Huella de info de contacto — emails/links/teléfonos concatenados por pdf-parse. */
export const CONTACT_LINE_RE = /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}|linkedin\.com|github\.com|\+\d{5,}/i

/** Expande año de 2 dígitos: "15" → 2015 (pivote: año actual + 1). */
export function expandYear(token: string): string {
  if (/^(19|20)\d{2}$/.test(token)) return token
  if (!/^\d{2}$/.test(token)) return token
  const n = parseInt(token, 10)
  const pivot = (new Date().getFullYear() % 100) + 1
  return String(n <= pivot ? 2000 + n : 1900 + n)
}
