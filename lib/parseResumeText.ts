/**
 * parseResumeText — Extrae datos estructurados de texto plano de un CV.
 * Funciona con PDFs y DOCX sin necesidad de IA externa.
 *
 * Para PDFs el texto debe venir de `lib/resume-parser/extract-pdf` (extracción
 * posicional con columnas y celdas \t-separadas). Los módulos especializados
 * viven en `lib/resume-parser/`.
 */

import {
  clean, HAS_YEAR, ROLE_KEYWORDS, INSTITUTION_RE, DEGREE_RE,
  SIDEBAR_LABEL_RE, CONTACT_LINE_RE, COLUMN_BREAK,
} from "./resume-parser/patterns"
import { detectTabularWork, parseTabularWork, detectRowDatedWork, parseRowDatedWork } from "./resume-parser/tabular-work"
import { parseLanguageLines, KNOWN_LANGUAGES, LANG_LEVEL_MAP } from "./resume-parser/languages"
import { parseSkillLines } from "./resume-parser/skills"

// Topes del parser — protegen contra inputs patológicos sin recortar CVs
// reales. Si un CV legítimo choca con un tope, el caller debe avisar al
// usuario (nunca truncar en silencio).
export const PARSE_LIMITS = {
  /** ~4 páginas impresas de texto plano */
  rawTextChars: 40_000,
  bulletsPerJob: 30,
  skills: 80,
  education: 12,
  projects: 12,
  volunteer: 10,
  summaryChars: 2_500,
} as const

export interface ParsedResume {
  personalDetails: {
    firstName: string; lastName: string; jobTitle: string
    email: string; phone: string; address: string
    city: string; country: string; postalCode: string
    website: string; linkedin: string; github: string
  }
  summary: string
  workExperience: Array<{
    id: string; employer: string; jobTitle: string; city: string
    startDate: string; endDate: string; currentlyWorking: boolean; description: string
  }>
  education: Array<{
    id: string; institution: string; degree: string; fieldOfStudy: string
    city: string; startDate: string; endDate: string; currentlyStudying: boolean; description: string
  }>
  skills: Array<{ id: string; name: string; level: string }>
  languages: Array<{ id: string; name: string; level: string }>
  certifications: Array<{ id: string; name: string; issuer: string; date: string; url: string }>
  projects: Array<{ id: string; name: string; role: string; startDate: string; endDate: string; description: string; url: string }>
  volunteer: Array<{ id: string; organization: string; role: string; startDate: string; endDate: string; description: string }>
  references: Array<{ id: string; name: string; company: string; phone: string; email: string }>
  hobbies: string
  customSections: Array<{ id: string; title: string; items: Array<{ id: string; title: string; subtitle: string; date: string; description: string }> }>
}

// ─── Section heading map ──────────────────────────────────────────────────────

const SECTION_MAP: Record<string, string> = {
  "experiencia": "work", "experiencia laboral": "work", "experiencia profesional": "work",
  "historial laboral": "work", "trayectoria profesional": "work", "trayectoria laboral": "work",
  "empleo": "work", "empleos": "work", "historia profesional": "work",
  "experiencia de trabajo": "work", "experiencias laborales": "work", "vida laboral": "work",
  "carrera profesional": "work", "carrera laboral": "work", "trayectoria": "work",
  "trabajos": "work", "trabajo": "work", "logros profesionales": "work",
  "experience": "work", "work experience": "work", "professional experience": "work",
  "employment": "work", "employment history": "work", "work history": "work",
  "career": "work", "career history": "work",
  "relevant experience": "work", "related experience": "work", "job experience": "work",
  "professional background": "work", "career background": "work", "work background": "work",
  "positions held": "work", "positions": "work", "job history": "work",
  "technical experience": "work", "selected experience": "work", "additional experience": "work",
  "educación": "education", "educacion": "education", "formación": "education",
  "formacion": "education", "formación académica": "education", "formacion academica": "education",
  "estudios": "education", "estudios realizados": "education",
  "education": "education", "academic background": "education",
  "educational background": "education", "qualifications": "education",
  "habilidades": "skills", "habilidades técnicas": "skills", "habilidades tecnicas": "skills",
  "competencias": "skills", "competencias técnicas": "skills", "conocimientos": "skills",
  "tecnologías": "skills", "tecnologias": "skills", "aptitudes": "skills",
  "herramientas": "skills", "stack tecnológico": "skills",
  "skills": "skills", "technical skills": "skills", "core competencies": "skills",
  "key skills": "skills", "technologies": "skills", "tools": "skills",
  "expertise": "skills", "areas of expertise": "skills",
  "idiomas": "languages", "lenguas": "languages",
  "languages": "languages", "language skills": "languages",
  "certificaciones": "certifications", "certificados": "certifications",
  "cursos": "certifications", "cursos y certificaciones": "certifications",
  "formación complementaria": "certifications", "capacitación": "certifications",
  "certifications": "certifications", "certificates": "certifications",
  "courses": "certifications", "training": "certifications",
  "proyectos": "projects", "proyectos personales": "projects", "proyectos destacados": "projects",
  "projects": "projects", "personal projects": "projects", "portfolio": "projects",
  "perfil": "summary", "perfil profesional": "summary", "resumen": "summary",
  "resumen profesional": "summary", "sobre mí": "summary", "sobre mi": "summary",
  "presentación": "summary", "presentacion": "summary", "objetivos": "summary",
  "objetivo profesional": "summary",
  "summary": "summary", "profile": "summary", "professional summary": "summary",
  "professional profile": "summary", "objective": "summary", "about me": "summary",
  "voluntariado": "volunteer", "trabajo voluntario": "volunteer",
  "experiencia de voluntariado": "volunteer", "servicio comunitario": "volunteer",
  "volunteer": "volunteer", "volunteering": "volunteer",
  "volunteer experience": "volunteer", "volunteer work": "volunteer", "community service": "volunteer",
  "referencias": "references", "referencias profesionales": "references",
  "referencias personales": "references", "contactos de referencia": "references",
  "references": "references", "professional references": "references",
  "personal references": "references", "reference": "references",
  "intereses": "hobbies", "hobbies": "hobbies", "aficiones": "hobbies",
  "pasatiempos": "hobbies", "interests": "hobbies", "hobbies & interests": "hobbies",
  "intereses personales": "hobbies", "personal interests": "hobbies", "interests & hobbies": "hobbies",
  "contacto": "contact", "contact": "contact", "contact me": "contact",
  "contact information": "contact", "información de contacto": "contact",
  "informacion de contacto": "contact", "datos de contacto": "contact",
  "contact details": "contact", "datos personales": "contact",
  "información personal": "contact", "informacion personal": "contact",
  "get in touch": "contact",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Keys sorted longest-first so prefix matching tries most specific keys first
const SECTION_KEYS_BY_LENGTH = Object.entries(SECTION_MAP).sort(([a], [b]) => b.length - a.length)

function normalizeLine(line: string): string {
  return line.toLowerCase().trim()
    // Numeración de plantilla: "1) PROFILE", "2. EXPERIENCE", "3 - SKILLS"
    .replace(/^\d{1,2}\s*[).:\-–—]\s*/, "")
    .replace(/[:\-_•*\/\\|]/g, "")
    .replace(/\s+/g, " ").trim()
}

// Líneas de adorno de plantilla (banners estilo terminal, timestamps, latín)
function isNoiseLine(line: string): boolean {
  if (/<[A-Z]{2,8}>/.test(line)) return true            // tags tipo <GO>, <HELP>
  if (/^\d{2}[·.:]\d{2}[·.:]\d{2}/.test(line)) return true // timestamps 06·05·26
  // Adorno con letras espaciadas: "C U R R I C U L U M", "I N FIDEM SCRIPSI",
  // a menudo con símbolos decorativos (★ — ●). ≥4 letras sueltas = decorativo.
  const singleChars = line.match(/(?:^|\s)\p{L}(?=\s|$)/gu)
  if (singleChars && singleChars.length >= 4) return true
  return false
}

function isSectionHeading(line: string): string | null {
  const norm = normalizeLine(line)
  // Exact match
  if (SECTION_MAP[norm]) return SECTION_MAP[norm]
  // Heading combinado: "Languages & Contact", "Contacto y Datos", "Skills + Tools".
  // Si AMBAS mitades son headings conocidos, gana el tipo de la primera; el
  // contenido se enruta por su parser real (idiomas→languages, email→contacto global).
  const combo = norm.split(/\s+(?:&|y|and|\+|·|\/)\s+/)
  if (combo.length === 2 && SECTION_MAP[combo[0]] && SECTION_MAP[combo[1]]) {
    return SECTION_MAP[combo[0]]
  }
  // Double-heading concatenation: "EXPERIENCIA PROFESIONALCOMPETENCIAS Swift..."
  // Only match if the remainder ALSO starts with a known section heading key.
  // This avoids false positives like "Experienced..." being detected as "experience".
  for (const [key, type] of SECTION_KEYS_BY_LENGTH) {
    if (!norm.startsWith(key) || norm.length <= key.length) continue
    const rest = norm.slice(key.length)
    // Confirm by checking rest starts with another known heading (concatenation artifact)
    if (SECTION_KEYS_BY_LENGTH.some(([k2]) => rest.startsWith(k2))) {
      return type
    }
  }
  return null
}

function extractEmail(text: string): string {
  return text.match(/[\w.+\-']+@[\w\-.]+\.[a-zA-Z]{2,}/g)?.[0] ?? ""
}

function extractPhone(text: string): string {
  const m = text.match(/(?:\+\d{1,3}[\s\-.]?)?\(?\d{2,4}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}(?!\d)/g) ?? []
  const found = m.find(p => p.replace(/\D/g, "").length >= 7)
  if (!found) return ""
  const phone = found.trim()
  // Strip trailing " NNNN" groups that are address numbers appended to the phone
  // (happens when phone and address share a line in PDF extraction)
  const stripped = phone.replace(/\s+\d{1,5}$/, "")
  if (stripped !== phone && stripped.replace(/\D/g, "").length >= 7) {
    return clean(stripped)
  }
  return clean(phone)
}

function extractLinkedIn(text: string): string {
  // Collapse newlines that split a LinkedIn URL slug (e.g. "saravia-\nios" → "saravia-ios")
  const collapsed = text.replace(/(linkedin\.com\/in\/[\w\-.]+-)\n([\w\-.]+)/gi, "$1$2")
  return collapsed.match(/linkedin\.com\/in\/[\w\-.]+/i)?.[0] ?? ""
}

function extractGitHub(text: string): string {
  return text.match(/github\.com\/[\w\-.]+/i)?.[0]?.replace(/\/$/, "") ?? ""
}

function extractWebsite(text: string): string {
  return text.match(/https?:\/\/(?!(?:linkedin|github)\.com)[\w\-./]+/i)?.[0] ?? ""
}

const CURRENT_WORDS = /\b(presente|actual|current|present|currently|now|hoy|actualidad|ongoing|till\s+date|to\s+date)\b/i

const MONTH_NAMES: Record<string, string> = {
  "ene": "01", "enero": "01", "jan": "01", "january": "01",
  "feb": "02", "febrero": "02", "february": "02",
  "mar": "03", "marzo": "03", "march": "03",
  "abr": "04", "abril": "04", "apr": "04", "april": "04",
  "may": "05", "mayo": "05",
  "jun": "06", "junio": "06", "june": "06",
  "jul": "07", "julio": "07", "july": "07",
  "ago": "08", "agosto": "08", "aug": "08", "august": "08",
  "sep": "09", "sept": "09", "septiembre": "09", "september": "09",
  "oct": "10", "octubre": "10", "october": "10",
  "nov": "11", "noviembre": "11", "november": "11",
  "dic": "12", "diciembre": "12", "dec": "12", "december": "12",
}

function parseMonthYear(s: string): string {
  s = s.trim().replace(/\.$/, "")
  if (/^\d{1,2}\/\d{4}$/.test(s) || /^\d{4}$/.test(s)) return s
  const parts = s.split(/[\s,]+/)
  if (parts.length >= 2) {
    const mon = MONTH_NAMES[parts[0].toLowerCase()]
    const yr = parts.find(p => /^\d{4}$/.test(p))
    if (mon && yr) return `${mon}/${yr}`
    if (yr) return yr
  }
  return s
}

function extractDateRange(text: string): { startDate: string; endDate: string; current: boolean } {
  const isCurrent = CURRENT_WORDS.test(text)

  const CURRENT_PATTERN = "presente|actual|current|currently|present|now|hoy|actualidad|ongoing|till\\s+date|to\\s+date"

  const monthYearRange = text.match(
    new RegExp(`([a-záéíóúüñA-Z]+\\.?\\s+\\d{4})\\s*[-–—]\\s*([a-záéíóúüñA-Z]+\\.?\\s+\\d{4}|${CURRENT_PATTERN})`, "i")
  )
  if (monthYearRange) {
    return {
      startDate: parseMonthYear(monthYearRange[1]),
      endDate: CURRENT_WORDS.test(monthYearRange[2]) ? "" : parseMonthYear(monthYearRange[2]),
      current: CURRENT_WORDS.test(monthYearRange[2]),
    }
  }

  const mmRange = text.match(new RegExp(`(\\d{1,2}\\/\\d{4})\\s*[-–—]\\s*(\\d{1,2}\\/\\d{4}|${CURRENT_PATTERN})`, "i"))
  if (mmRange) {
    return {
      startDate: mmRange[1],
      endDate: CURRENT_WORDS.test(mmRange[2]) ? "" : mmRange[2],
      current: CURRENT_WORDS.test(mmRange[2]),
    }
  }

  const yearRange = text.match(new RegExp(`\\b(\\d{4})\\s*[-–—]\\s*(\\d{4}|${CURRENT_PATTERN})\\b`, "i"))
  if (yearRange) {
    return {
      startDate: yearRange[1],
      endDate: CURRENT_WORDS.test(yearRange[2]) ? "" : yearRange[2],
      current: CURRENT_WORDS.test(yearRange[2]),
    }
  }

  const singleYear = text.match(/\b(20\d{2}|19\d{2})\b/)
  if (singleYear) return { startDate: singleYear[1], endDate: isCurrent ? "" : "", current: isCurrent }

  return { startDate: "", endDate: isCurrent ? "" : "", current: isCurrent }
}

function isBullet(line: string) {
  return /^[•\-–·▪▸►→✓✔*]\s/.test(line) || /^\d+\.\s/.test(line)
}

const CURRENT_ALT = "presente|actual|current|currently|present|now|hoy|actualidad|ongoing|till\\s+date|to\\s+date"
function stripDates(line: string): string {
  return line
    .replace(new RegExp(`([a-záéíóúüñA-Z]+\\.?\\s+\\d{4})\\s*[-–—]\\s*([a-záéíóúüñA-Z]+\\.?\\s+\\d{4}|${CURRENT_ALT})`, "gi"), "")
    .replace(new RegExp(`\\d{1,2}\\/\\d{4}\\s*[-–—]\\s*(\\d{1,2}\\/\\d{4}|${CURRENT_ALT})`, "gi"), "")
    .replace(new RegExp(`\\b\\d{4}\\s*[-–—]\\s*(\\d{4}|${CURRENT_ALT})\\b`, "gi"), "")
    .replace(/\b(20\d{2}|19\d{2})\b/g, " ")
    .replace(/[|,·\-–]\s*$/, "").replace(/^\s*[|,·\-–]\s*/, "")
    .replace(/\s+/g, " ").trim()
}

// ─── Block-based entry parser ─────────────────────────────────────────────────
/**
 * Splits a list of lines into "entry blocks" (one per job/degree/etc.).
 *
 * Strategy: instead of looking FORWARD from a candidate title line (which
 * causes false positives when description sentences precede the next date),
 * we look BACKWARD from every DATE line to find its owning title.
 *
 * A "title line" is any short (≤ MAX_TITLE_WORDS words AND < 60 chars),
 * non-bullet, non-date line that starts with a capital letter.  The entry
 * block begins at the TOPMOST such line found before the date (within
 * `lookahead` lines).
 *
 * Fallback (inline format): when NO backward title is found, the date line
 * itself is treated as the entry start if it has the pattern
 * "Title | Employer | 2022–2023" (first segment before "|" or "·" is
 * year-free and short).
 */
function splitIntoBlocks(lines: string[], lookahead = 6): string[][] {
  /** Lines with more words than this are likely description text, not titles. */
  const MAX_TITLE_WORDS = 8

  const isShortTitleLine = (line: string) =>
    line.split(/\s+/).length <= MAX_TITLE_WORDS &&
    line.length < 60 &&
    !line.endsWith(".") &&
    !line.endsWith(",")

  const entryStarts = new Set<number>()

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line || isBullet(line)) continue

    const lineHasDate = HAS_YEAR.test(line) || CURRENT_WORDS.test(line)
    if (!lineHasDate) continue

    // ── Strategy 1: look backward from this date line ───────────────────────
    // Keep extending backward as long as lines are short/title-like.
    // Stop at a bullet (previous entry description), another date line, or a
    // long description line.  The topmost valid line is the block title.
    let titleIdx = -1
    for (let j = i - 1; j >= Math.max(0, i - lookahead); j--) {
      const prev = lines[j]
      if (!prev) break
      if (isBullet(prev)) break                                       // inside previous entry
      if (HAS_YEAR.test(prev) || CURRENT_WORDS.test(prev)) break     // previous entry's date
      if (!/[A-ZÁÉÍÓÚÜÑa-záéíóúüñ]/.test(prev[0] ?? "")) break      // must start with a letter
      if (!isShortTitleLine(prev)) break                              // long line or sentence → not a title
      titleIdx = j  // valid candidate — keep going to reach the topmost one
    }

    if (titleIdx !== -1) {
      entryStarts.add(titleIdx)
      continue
    }

    // ── Strategy 2 (fallback): date line IS the entry start (inline formats) ─

    if (!(/[A-ZÁÉÍÓÚÜÑ]/i.test(line[0] ?? ""))) continue

    // Case A: explicit separator  →  "Title | Employer | 2022–2023"
    if (line.length < 90) {
      const segments = line.split(/\s*[|·\t]\s*/)
      if (
        segments.length >= 2 &&
        !HAS_YEAR.test(segments[0]) &&
        !CURRENT_WORDS.test(segments[0]) &&
        isShortTitleLine(segments[0])
      ) {
        entryStarts.add(i)
        continue
      }
    }

    // Case B: right-aligned date  →  "Software Engineer          May 2022 – Present"
    // (common in English/American CV layouts)
    // Extract everything BEFORE the first year; if it looks like a short title, accept.
    const yearMatch = line.match(/\b(20\d{2}|19\d{2})\b/)
    if (yearMatch?.index !== undefined) {
      const beforeYear = line
        .slice(0, yearMatch.index)
        // strip trailing month name / abbreviation (the bridge between title and year)
        .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\.?\s*$/i, "")
        .trim()
      if (beforeYear && isShortTitleLine(beforeYear)) {
        entryStarts.add(i)
      }
    }
  }

  if (entryStarts.size === 0) {
    // Fallback: try to split by blank-line boundaries between entries.
    // This handles CVs where dates are missing/unrecognized but entries
    // are visually separated by empty lines in the extracted text.
    const blankSplits: number[] = []
    for (let i = 1; i < lines.length; i++) {
      // A blank line followed by a short capitalized line = new entry boundary
      if (!lines[i - 1] && lines[i] && /^[A-ZÁÉÍÓÚÜÑ]/.test(lines[i]) && isShortTitleLine(lines[i])) {
        blankSplits.push(i)
      }
    }
    if (blankSplits.length > 0) {
      const starts = [0, ...blankSplits]
      return starts.map((start, idx) => {
        const end = idx + 1 < starts.length ? starts[idx + 1] : lines.length
        return lines.slice(start, end).filter(l => l.length > 0)
      }).filter(b => b.length > 0)
    }
    return lines.length > 0 ? [lines] : []
  }

  const sortedStarts = Array.from(entryStarts).sort((a, b) => a - b)
  const blocks: string[][] = []

  for (let b = 0; b < sortedStarts.length; b++) {
    const start = sortedStarts[b]
    const end = b + 1 < sortedStarts.length ? sortedStarts[b + 1] : lines.length
    const block = lines.slice(start, end).filter(l => l.length > 0)
    if (block.length > 0) blocks.push(block)
  }

  return blocks
}

// ─── Merge wrapped lines (PDF word-wrap continuation) ────────────────────────
function mergeWrappedLines(lines: string[]): string[] {
  const result: string[] = []
  for (const line of lines) {
    const prev = result[result.length - 1]
    if (prev !== undefined && /^[a-z]/.test(line) && !isBullet(line)) {
      result[result.length - 1] = prev + " " + line
    } else {
      result.push(line)
    }
  }
  return result
}

// ─── Parse a single work experience block ─────────────────────────────────────
function parseWorkBlock(block: string[], id: string) {
  block = mergeWrappedLines(block)
  const job = {
    id,
    jobTitle: "",
    employer: "",
    city: "",
    startDate: "",
    endDate: "",
    currentlyWorking: false,
    description: "",
  }

  const descLines: string[] = []

  for (let i = 0; i < block.length; i++) {
    const line = block[i]
    const dr = extractDateRange(line)

    if (i === 0) {
      // First line: parse with separator, or inline date, or plain title
      const parts = line.split(/\s*[|·\t]\s*/)
      if (parts.length >= 2) {
        // Separator format: "Title | Company | Date" or "Company | Date"
        job.jobTitle = clean(parts[0])
        if (HAS_YEAR.test(parts[1]) || CURRENT_WORDS.test(parts[1])) {
          const dr1 = extractDateRange(parts[1])
          job.startDate = dr1.startDate; job.endDate = dr1.endDate; job.currentlyWorking = dr1.current
        } else {
          job.employer = clean(parts[1])
        }
        for (let p = 2; p < parts.length; p++) {
          if (HAS_YEAR.test(parts[p]) || CURRENT_WORDS.test(parts[p])) {
            if (!job.startDate) { const dp = extractDateRange(parts[p]); job.startDate = dp.startDate; job.endDate = dp.endDate; job.currentlyWorking = dp.current }
          } else if (!job.city) {
            job.city = clean(parts[p])
          }
        }
      } else if (HAS_YEAR.test(line) || CURRENT_WORDS.test(line)) {
        // Inline date on first line: "Company    Apr 2021 – Mar 2023" or "Title    2015-2016"
        const dr0 = extractDateRange(line)
        if (dr0.startDate) { job.startDate = dr0.startDate; job.endDate = dr0.endDate; job.currentlyWorking = dr0.current }
        const yIdx = line.search(/\b(20\d{2}|19\d{2})\b/)
        const textPart = clean(
          yIdx > 0
            ? line.slice(0, yIdx)
                .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\.?\s*$/i, "")
                .trim()
            : line
        )
        // Heuristic: if text looks like a role keyword → jobTitle, otherwise → employer
        // (job title will be read from next line in the employer case)
        if (ROLE_KEYWORDS.test(textPart)) {
          job.jobTitle = textPart
        } else {
          job.employer = textPart
        }
      } else {
        job.jobTitle = clean(line)
      }
      continue
    }

    // Lines with a date range → extract dates + any trailing employer/city
    if ((dr.startDate || dr.current) && !job.startDate) {
      job.startDate = dr.startDate
      job.endDate = dr.endDate
      job.currentlyWorking = dr.current
      const remainder = stripDates(line).trim()
      if (remainder.length > 1) {
        const rparts = remainder.split(/\s*[|·,\t]\s*/).map(clean).filter(p => p.length > 1)
        // Skip institution names — they are education entries interleaved by pdf-parse from the right column
        if (!job.employer && rparts[0] && !INSTITUTION_RE.test(rparts[0])) job.employer = rparts[0]
        if (!job.city && rparts[1] && !SIDEBAR_LABEL_RE.test(rparts[1])) job.city = rparts[1]
      }
      continue
    }

    // Bullet points → description (filter skill/cert items: < 5 words and no verb-like structure)
    if (isBullet(line)) {
      const stripped = line.replace(/^[•\-–·▪▸►→✓✔*]\s*/, "").trim()
      const wordCount = stripped.split(/\s+/).length
      // Skip very short items (1-4 words without action verb) — likely skill/cert names from sidebar
      const hasActionVerb = /\b(implement|develop|build|creat|design|manag|lead|improv|deliver|optim|collaborat|integrat|maintain|support|enhanc|reduc|increas|achiev|establi|launch|migrat|refactor|test|deploy|analyz|coordin|provid)\w*/i.test(stripped)
      if (wordCount <= 4 && !hasActionVerb) continue
      descLines.push(stripped)
      continue
    }

    // Skip known sidebar template labels — these appear as sub-headings in some PDF templates
    // (e.g. "Studied at", "GPA") and get interleaved into work blocks by pdf-parse.
    if (SIDEBAR_LABEL_RE.test(line.trim())) continue

    // Short line without date → fill jobTitle, employer, or city in order
    if (line.length < 80 && !HAS_YEAR.test(line)) {
      const parts = line.split(/\s*[|·,\t]\s*/).map(clean).filter(p => p.length > 1)
      const looksLikeSentence = line.endsWith(".") || line.endsWith(",") || line.length > 50
      if (!job.jobTitle && !job.employer) {
        job.jobTitle = parts[0] ?? ""
        if (parts.length >= 2 && !job.city && !SIDEBAR_LABEL_RE.test(parts[1] ?? "")) job.city = parts[1]
      } else if (!job.jobTitle) {
        job.jobTitle = parts[0] ?? ""
        if (parts.length >= 2 && !job.city && !SIDEBAR_LABEL_RE.test(parts[1] ?? "")) job.city = parts[1]
      } else if (!job.employer && !looksLikeSentence) {
        // If the line is a single role-keyword word that could be a title continuation,
        // merge it into jobTitle instead of setting as employer
        const wordCount = parts[0]?.split(/\s+/).length ?? 0
        if (wordCount <= 2 && ROLE_KEYWORDS.test(parts[0] ?? "") && !job.startDate) {
          job.jobTitle = job.jobTitle + " " + (parts[0] ?? "")
        } else if (INSTITUTION_RE.test(parts[0] ?? "")) {
          // Academic institution interleaved from right column — not an employer, skip
          continue
        } else {
          job.employer = parts[0] ?? ""
          if (parts.length >= 2 && !job.city && !SIDEBAR_LABEL_RE.test(parts[1] ?? "")) job.city = parts[1]
        }
      } else if (!job.city && parts.length === 1 && !looksLikeSentence && line.length < 45) {
        job.city = parts[0]
      } else if (job.startDate) {
        const wordCount = line.trim().split(/\s+/).length
        const looksLikeLeakedSidebarItem = wordCount <= 3 && line.length <= 25 && !/[.,]$/.test(line) && descLines.length > 0
        if (!looksLikeLeakedSidebarItem && !CONTACT_LINE_RE.test(line)) descLines.push(line)
      }
      continue
    }

    // Long line → description (only after we have dates)
    if (line.length >= 40 && job.startDate && !CONTACT_LINE_RE.test(line)) {
      descLines.push(line)
    }
  }

  job.description = descLines.slice(0, PARSE_LIMITS.bulletsPerJob).map(d => `• ${d}`).join("\n")
  return job
}

// ─── Parse a single education block ──────────────────────────────────────────
function parseEduBlock(block: string[], id: string) {
  const edu = {
    id,
    institution: "",
    degree: "",
    fieldOfStudy: "",
    city: "",
    startDate: "",
    endDate: "",
    currentlyStudying: false,
    description: "",
  }

  for (let i = 0; i < block.length; i++) {
    const line = block[i]
    const dr = extractDateRange(line)

    if (i === 0) {
      // Filtrar vacíos: líneas con viñeta inicial ("· Systems engineer ...")
      // producen un primer elemento vacío al separar.
      const parts = line.split(/\s*[|·\t]\s*/).map(p => p.trim()).filter(Boolean)
      if (parts.length >= 2) {
        const p0 = clean(parts[0])
        const p1 = clean(parts[1])
        // If first part is institution name (not a degree keyword) → assign correctly
        if (INSTITUTION_RE.test(p0) && !DEGREE_RE.test(p0) && !HAS_YEAR.test(p0)) {
          edu.institution = p0
          if (!HAS_YEAR.test(p1)) edu.degree = clean(stripDates(p1))
        } else {
          // El degree puede traer las fechas inline: "Systems engineer 2010 - 2015"
          edu.degree = clean(stripDates(p0))
          if (!HAS_YEAR.test(p1)) edu.institution = p1
          if (parts.length >= 3 && !HAS_YEAR.test(parts[2]) && !SIDEBAR_LABEL_RE.test(clean(parts[2]))) edu.city = clean(parts[2])
        }
        for (const p of parts) {
          if (HAS_YEAR.test(p) && !edu.startDate) {
            const d = extractDateRange(p)
            if (d.startDate) { edu.startDate = d.startDate; edu.endDate = d.endDate; edu.currentlyStudying = d.current }
          }
        }
      } else if (INSTITUTION_RE.test(line) && !DEGREE_RE.test(line) && !HAS_YEAR.test(line)) {
        // Institution-first ordering: 2-col PDFs often place institution name on the first line
        edu.institution = clean(line)
      } else {
        edu.degree = clean(line)
      }
      continue
    }

    if (dr.startDate && !edu.startDate) {
      edu.startDate = dr.startDate
      edu.endDate = dr.endDate
      edu.currentlyStudying = dr.current
      const rem = stripDates(line).replace(/[|·,]/g, " ").trim()
      if (rem.length > 1) {
        if (!edu.institution && !DEGREE_RE.test(rem)) edu.institution = rem
        else if (!edu.degree && DEGREE_RE.test(rem)) edu.degree = rem
        else if (!edu.institution) edu.institution = rem
      }
      continue
    }

    if (!isBullet(line) && line.length < 80 && !HAS_YEAR.test(line)) {
      if (SIDEBAR_LABEL_RE.test(line.trim())) continue
      const parts = line.split(/\s*[|·,\t]\s*/).map(clean).filter(p => p.length > 1)
      const p0 = parts[0] ?? ""
      if (!edu.institution) {
        // Institution not set yet — assign this line to institution
        edu.institution = p0
        if (parts.length >= 2 && !edu.city && !SIDEBAR_LABEL_RE.test(parts[1] ?? "")) edu.city = parts[1]
      } else if (INSTITUTION_RE.test(p0) && parts.length === 1 && p0.length < 40 && !DEGREE_RE.test(p0)) {
        // Continuación del nombre de institución envuelto: "Catolica" + "University"
        edu.institution = `${edu.institution} ${p0}`
      } else if (!edu.degree && !INSTITUTION_RE.test(p0)) {
        // Institution already set, degree empty, and line is not another institution → it's the degree
        edu.degree = p0
      } else if (!edu.city && parts.length === 1) {
        edu.city = p0
      }
    }
  }

  // Split degree into degree + fieldOfStudy
  const degMatch = edu.degree.match(/^(.+?)\s+(?:en|in|of|de)\s+(.+)$/i)
  if (degMatch) {
    edu.degree = clean(degMatch[1])
    edu.fieldOfStudy = clean(degMatch[2])
  }

  return edu
}

// ─── Language detection ───────────────────────────────────────────────────────

const EN_SECTION_WORDS = ["experience", "work experience", "education", "skills", "languages", "certifications", "courses", "projects", "summary", "profile", "volunteer", "references", "interests", "hobbies", "training", "employment"]
const ES_SECTION_WORDS = ["experiencia", "educación", "educacion", "habilidades", "idiomas", "certificaciones", "cursos", "proyectos", "perfil", "voluntariado", "referencias", "intereses", "hobbies", "capacitación", "formación"]

export function detectLanguage(text: string): "es" | "en" {
  const lower = text.toLowerCase()
  const enScore = EN_SECTION_WORDS.filter(w => lower.includes(w)).length
  const esScore = ES_SECTION_WORDS.filter(w => lower.includes(w)).length
  return enScore >= esScore ? "en" : "es"
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseResumeText(rawText: string): ParsedResume {
  const result: ParsedResume = {
    personalDetails: {
      firstName: "", lastName: "", jobTitle: "", email: "", phone: "",
      address: "", city: "", country: "", postalCode: "",
      website: "", linkedin: "", github: "",
    },
    summary: "",
    workExperience: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
    projects: [],
    volunteer: [],
    references: [],
    hobbies: "",
    customSections: [],
  }

  // ── Contact (scan full text) ───────────────────────────────────────────
  result.personalDetails.email = extractEmail(rawText)
  result.personalDetails.phone = extractPhone(rawText)
  result.personalDetails.linkedin = extractLinkedIn(rawText)
  result.personalDetails.github = extractGitHub(rawText)
  result.personalDetails.website = extractWebsite(rawText)

  // ── Split into sections ───────────────────────────────────────────────
  // Normalize: insert space when a 4-digit year (19xx/20xx) is directly adjacent
  // to a letter — common artifact of PDF text extraction (e.g. "Developer2021")
  const lines = rawText.split("\n").map(l =>
    l.trim()
      // Insert space when a 4-digit year is directly adjacent to a letter (PDF artifact)
      .replace(/([A-Za-záéíóúüñ])((?:19|20)\d{2})/g, "$1 $2")
      .replace(/((?:19|20)\d{2})([A-Za-záéíóúüñ])/g, "$1 $2")
      // Insert space when a month name is directly concatenated to a preceding word
      .replace(/([a-záéíóúüñ])(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Ene|Abr|Ago|Dic)/g, "$1 $2")
  ).filter(Boolean).filter(l => !isNoiseLine(l))

  type Section = { type: string; lines: string[] }
  const sections: Section[] = []
  let cur: Section = { type: "header", lines: [] }

  // Sections that commonly appear as sidebar headings in 2-column PDFs
  // and can interrupt work/education content mid-flow
  const SIDEBAR_SECTION_TYPES = new Set(["skills", "languages", "hobbies"])

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li]
    // Salto de columna emitido por extract-pdf: el sidebar empieza aquí.
    // Cerrar la sección actual para que su contenido no absorba el sidebar.
    if (line === COLUMN_BREAK) {
      if (cur.lines.length > 0 || cur.type !== "header") sections.push(cur)
      cur = { type: "unknown", lines: [] }
      continue
    }
    const type = isSectionHeading(line)
    if (type) {
      // Guard: if we're inside a work/education section and this heading is a
      // typical sidebar section (skills/languages/hobbies), check whether the
      // immediately following lines look like job description sentences.
      // If they do, this heading is a sidebar artifact injected by pdf-parse
      // into the middle of the main column — ignore it and keep the current section.
      if (
        (cur.type === "work" || cur.type === "education") &&
        SIDEBAR_SECTION_TYPES.has(type)
      ) {
        const nextLines = lines.slice(li + 1, li + 3)
        const hasDescAhead = nextLines.some(l => l.length > 45 && /[.!?]$/.test(l))
        if (hasDescAhead) continue // sidebar artifact — skip heading, stay in current section
      }
      if (cur.lines.length > 0 || cur.type !== "header") sections.push(cur)
      cur = { type, lines: [] }
    } else if (
      // Encabezado numerado DESCONOCIDO en mayúsculas ("4) METRICS") — corta la
      // sección actual para que su contenido no contamine la sección anterior.
      /^\d{1,2}\s*[).:]\s+\S{2,}/.test(line) &&
      line.length < 40 &&
      line === line.toUpperCase() &&
      !isBullet(line)
    ) {
      if (cur.lines.length > 0 || cur.type !== "header") sections.push(cur)
      cur = { type: "unknown", lines: [] }
    } else {
      cur.lines.push(line)
    }
  }
  sections.push(cur)

  // ── Post-process: re-split sections whose lines contain embedded section headings ──
  // 2-column PDFs often dump a heading like "EXPERIENCIA PROFESIONAL" inside the summary
  // section (after the prefix-match detection still failed due to different line ordering).
  // Scan every section's lines for headings; when found, split the section there.
  {
    const expanded: typeof sections = []
    for (const sec of sections) {
      let cur2 = { type: sec.type, lines: [] as string[] }
      for (const line of sec.lines) {
        const t = isSectionHeading(line)
        if (t && t !== sec.type) {
          if (cur2.lines.length > 0) expanded.push(cur2)
          cur2 = { type: t, lines: [] }
        } else {
          cur2.lines.push(line)
        }
      }
      if (cur2.lines.length > 0 || cur2.type !== sec.type) expanded.push(cur2)
    }
    sections.length = 0
    sections.push(...expanded)
  }

  const get = (type: string) => sections.find(s => s.type === type)
  const getAll = (type: string) => sections.filter(s => s.type === type)

  // ── Header → name + job title ─────────────────────────────────────────
  const header = get("header")
  if (header) {
    const contactRe = /[@+]|linkedin|github|http|www\.|\.com|\.mx|\.es|\d{5,}/i
    // Candidato a nombre: debe empezar con letra (excluye adornos "● LIVE ·...")
    const cands = header.lines.filter(l =>
      !contactRe.test(l) && l.length > 1 && l.length < 70 && /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(l)
    )
    if (cands[0]) {
      const parts = clean(cands[0]).split(/\s+/)
      result.personalDetails.firstName = parts[0] ?? ""
      result.personalDetails.lastName = parts.slice(1).join(" ")
    }
    if (cands[1] && !cands[1].match(/^\d/)) {
      result.personalDetails.jobTitle = clean(cands[1])
    }
    // Ubicación: línea dedicada "Ciudad, País"…
    const locLine = header.lines.find(l => /,\s*[A-ZÁÉÍÓÚÜÑ]/.test(l) && !contactRe.test(l) && l.length < 60)
    if (locLine) {
      const parts = locLine.split(",").map(p => clean(p))
      result.personalDetails.city = parts[0]
      result.personalDetails.country = parts[parts.length - 1]
    } else {
      // …o embebida en una línea de contacto: "email | +34... | Madrid, España"
      for (const line of header.lines) {
        const m = line.match(/(?:^|[|·•])\s*([A-ZÁÉÍÓÚÜÑ][\wáéíóúüñ.\- ]{1,28}),\s*([A-ZÁÉÍÓÚÜÑ][\wáéíóúüñ.\- ]{1,28})(?:$|[|·•])/)
        if (m && !/@/.test(m[1]) && !/\d{4}/.test(m[0])) {
          result.personalDetails.city = clean(m[1])
          result.personalDetails.country = clean(m[2])
          break
        }
      }
    }
  }

  // ── Fallback de nombre: el header no dio nombre ────────────────────────
  // Plantillas que arrancan con un heading ("CONTACTO") dejan el header vacío.
  // Buscar en las primeras líneas del doc una línea con pinta de nombre:
  // 2-4 palabras, cada una iniciando en mayúscula, sin dígitos ni keywords de rol.
  if (!result.personalDetails.firstName) {
    const NAME_WORD = /^[A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ.'\-]*$/
    // Primeras líneas del doc + inicio de secciones contact/unknown (sidebars
    // se emiten al final del texto, donde puede vivir el nombre).
    const scanLines: string[] = [
      ...lines.slice(0, 25),
      ...sections.filter(s => ["contact", "unknown"].includes(s.type)).flatMap(s => s.lines.slice(0, 10)),
    ]
    for (let i = 0; i < scanLines.length; i++) {
      const line = scanLines[i]
      if (isSectionHeading(line)) continue
      if (CONTACT_LINE_RE.test(line) || /\d/.test(line)) continue
      if (ROLE_KEYWORDS.test(line) || INSTITUTION_RE.test(line)) continue
      const words = clean(line).split(/\s+/)
      if (words.length < 2 || words.length > 4) continue
      if (!words.every(w => NAME_WORD.test(w))) continue
      result.personalDetails.firstName = words[0]
      result.personalDetails.lastName = words.slice(1).join(" ")
      // El cargo suele venir justo después del nombre
      const next = scanLines[i + 1]
      if (!result.personalDetails.jobTitle && next && next.length < 60 &&
          !isSectionHeading(next) && !CONTACT_LINE_RE.test(next) && !/\d{4}/.test(next)) {
        result.personalDetails.jobTitle = clean(next)
      }
      break
    }
  }

  // ── Ciudad: buscar patrón "Ciudad, País" o línea corta en contact/languages ─
  // Headings combinados ("Languages & Contact") enrutan el contacto al tipo de
  // la primera mitad, así que escaneamos varios tipos de sección.
  if (!result.personalDetails.city) {
    const fullName = `${result.personalDetails.firstName} ${result.personalDetails.lastName}`.trim().toLowerCase()
    const sectionsForCity = sections.filter(s => ["contact", "languages", "unknown", "header"].includes(s.type))
    // Pase 1: "Ciudad, País" (la coma es la señal más fuerte)
    outerCity: for (const sec of sectionsForCity) {
      for (const line of sec.lines) {
        if (CONTACT_LINE_RE.test(line) || HAS_YEAR.test(line)) continue
        if (line.length >= 40 || !/^[A-ZÁÉÍÓÚÜÑ]/.test(line)) continue
        if (!/^[A-ZÁÉÍÓÚÜÑ][\wáéíóúüñ.\- ]*,\s*[A-ZÁÉÍÓÚÜÑ]/.test(line)) continue
        const parts = clean(line).split(",").map(p => p.trim())
        if (parts.length === 2 && parts.every(p => p.split(/\s+/).length <= 3)) {
          result.personalDetails.city = parts[0]
          result.personalDetails.country = parts[1]
          break outerCity
        }
      }
    }
    // Pase 2 (solo secciones contact explícitas): línea corta sin dígitos
    if (!result.personalDetails.city) {
      outerCity2: for (const sec of getAll("contact")) {
        for (const line of sec.lines) {
          if (CONTACT_LINE_RE.test(line) || /\d/.test(line)) continue
          if (line.length >= 40 || !/^[A-ZÁÉÍÓÚÜÑ]/.test(line)) continue
          const cleaned = clean(line)
          if (cleaned.toLowerCase() === fullName || cleaned.split(/\s+/).length > 4) continue
          result.personalDetails.city = cleaned
          break outerCity2
        }
      }
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────
  const summarySection = get("summary")
  if (summarySection) {
    result.summary = summarySection.lines.join(" ").slice(0, PARSE_LIMITS.summaryChars).trim()
  }

  // Summary rescue: sidebars suelen poner el perfil SIN heading (párrafo suelto).
  // Buscar en header/contact/unknown un bloque de ≥2 líneas largas consecutivas.
  if (!result.summary) {
    outerSummary: for (const sec of sections) {
      if (!["header", "contact", "unknown"].includes(sec.type)) continue
      let run: string[] = []
      for (const line of sec.lines) {
        const isProse = line.length > 60 && !HAS_YEAR.test(line) && !isBullet(line) && !CONTACT_LINE_RE.test(line)
        if (isProse) {
          run.push(line)
        } else {
          if (run.length >= 2) break
          run = []
        }
      }
      if (run.length >= 2) {
        result.summary = run.join(" ").slice(0, PARSE_LIMITS.summaryChars).trim()
        break outerSummary
      }
    }
  }

  // ── Work Experience ───────────────────────────────────────────────────
  // Tres formatos, detectados por caso (más específico primero):
  //  1. Date-first rows:  "2015–2016 ⇥ Rol ⇥ Empresa · Ciudad" + bullets
  //  2. Tabla YR/ROLE/FIRM/LOC (años partidos en líneas)
  //  3. Bloques clásicos:  "Título | Empresa | Fecha" + bullets
  const tabularWorkSections = new Set<object>()
  for (const sec of getAll("work")) {
    const pushJobs = (jobs: typeof result.workExperience) => {
      for (const job of jobs) {
        if (result.workExperience.length >= 12) break
        job.id = `we${result.workExperience.length + 1}`
        result.workExperience.push(job)
      }
    }

    if (detectRowDatedWork(sec.lines)) {
      tabularWorkSections.add(sec)
      pushJobs(parseRowDatedWork(sec.lines, 12 - result.workExperience.length, PARSE_LIMITS.bulletsPerJob))
      continue
    }
    if (detectTabularWork(sec.lines)) {
      tabularWorkSections.add(sec)
      pushJobs(parseTabularWork(sec.lines, 12 - result.workExperience.length, PARSE_LIMITS.bulletsPerJob))
      continue
    }
    const blocks = splitIntoBlocks(sec.lines, 6)
    for (const block of blocks) {
      if (result.workExperience.length >= 12) break
      const job = parseWorkBlock(block, `we${result.workExperience.length + 1}`)
      if (job.jobTitle || job.employer) result.workExperience.push(job)
    }
  }

  // ── Description rescue: recover job bullets lost in sidebar-hijacked sections ──
  // When pdf-parse interleaves 2-column content, description bullets from the last
  // parsed job often land in the next section (skills/languages/etc).
  // Scan non-work sections for long sentences (real bullets) and append them to the
  // most recently added job — done BEFORE the rescue pass + sort so order is correct.
  if (result.workExperience.length > 0) {
    const SKIP_FOR_DESC_RESCUE = new Set(["work", "header", "summary", "education", "certifications", "projects", "volunteer", "hobbies", "contact"])
    for (const sec of sections) {
      if (SKIP_FOR_DESC_RESCUE.has(sec.type)) continue
      const rescuedBullets: string[] = []
      for (const line of sec.lines) {
        // A real job bullet: long sentence ending in punctuation, no year (not a date line)
        if (line.length > 45 && /[.!?]$/.test(line) && !HAS_YEAR.test(line) && !isBullet(line)) {
          rescuedBullets.push(line)
        }
      }
      if (rescuedBullets.length === 0) continue
      // Append to the last job parsed (the one being actively written when section split)
      const lastJob = result.workExperience[result.workExperience.length - 1]
      const existing = lastJob.description ? lastJob.description.split("\n").filter(Boolean) : []
      lastJob.description = [...existing, ...rescuedBullets.map(b => `• ${b}`)].join("\n")
    }
  }

  // ── Rescue pass: recover work entries from sidebar-hijacked sections ──
  // 2-column PDFs often emit sidebar headings (e.g. "Languages") in the
  // middle of the main content, causing legitimate work entries to land in
  // wrong sections. Scan every non-work, non-header section for blocks that
  // look like work experience (have a year AND a short title line).
  if (result.workExperience.length < 12) {
    // Deduplicate by (jobTitle + employer) pair — NOT by title alone,
    // because multiple positions can share the same title (e.g. "iOS Developer" at different companies)
    const seenJobs = new Set(
      result.workExperience.map(j => `${j.jobTitle.toLowerCase()}|${j.employer.toLowerCase()}`)
    )
    for (const sec of sections) {
      // Skip: "work" (already parsed), "summary" (own parser), "hobbies"/"contact" (not work)
      // Include certifications/languages/skills — 2-column PDFs often route job entries there
      if (["work", "summary", "hobbies", "contact"].includes(sec.type)) continue
      // Si esta sección de trabajo ya se parseó con tabular/row-dated, no re-escanear
      if (tabularWorkSections.has(sec)) continue
      // Only attempt rescue if section has year-dated, non-bullet lines
      if (!sec.lines.some(l => (HAS_YEAR.test(l) || CURRENT_WORDS.test(l)) && !isBullet(l))) continue
      const blocks = splitIntoBlocks(sec.lines, 6)
      for (const block of blocks) {
        if (result.workExperience.length >= 12) break
        const job = parseWorkBlock(block, `we${result.workExperience.length + 1}`)
        // Require BOTH title AND employer AND a year-based start date (strict — avoids skills/certs rescued as jobs)
        if (!job.jobTitle || !job.employer) continue
        if (!job.startDate.match(/\d{4}/)) continue
        // Un "título" que es solo un año = celda de fecha mal asignada (certs "2023 <nombre>")
        if (/^\d{2,4}$/.test(job.jobTitle.trim())) continue
        // Título con keyword de grado académico = entrada de educación, no trabajo
        if (DEGREE_RE.test(job.jobTitle)) continue
        // Rescate estricto: el título DEBE parecer un rol real. Certs/cursos
        // ("Functional Programming", "Concurrency IOS") no tienen rol → se descartan.
        if (!ROLE_KEYWORDS.test(job.jobTitle)) continue
        const key = `${job.jobTitle.toLowerCase()}|${job.employer.toLowerCase()}`
        if (seenJobs.has(key)) continue
        result.workExperience.push(job)
        seenJobs.add(key)
      }
    }
    // Re-sort by start date descending so chronological order is preserved
    result.workExperience.sort((a, b) => {
      const ya = parseInt(a.startDate.match(/\d{4}/)?.[0] ?? "0")
      const yb = parseInt(b.startDate.match(/\d{4}/)?.[0] ?? "0")
      return yb - ya
    })
  }

  // ── Education (block-based) ───────────────────────────────────────────
  for (const sec of getAll("education")) {
    // For education, also try splitting by degree keywords if blocks fail
    const blocks = splitIntoBlocks(sec.lines, 5)
    for (const block of blocks) {
      if (result.education.length >= PARSE_LIMITS.education) break
      if (!block[0]) continue
      // Accept if block has a degree keyword OR an institution name (e.g. "Catalica University")
      // HAS_YEAR alone is too loose — accepts job titles like "iOS Developer 2023-2026"
      if (!DEGREE_RE.test(block.join(" ")) && !INSTITUTION_RE.test(block.join(" "))) continue
      const edu = parseEduBlock(block, `ed${result.education.length + 1}`)
      if (edu.degree || edu.institution) result.education.push(edu)
    }
  }

  // ── Education rescue: recover entries interleaved into other sections by pdf-parse ──
  // Runs always (not only when empty) — deduplicates against already-parsed entries.
  // 2-column PDFs route education right-column content into work/language/skill sections.
  {
    const seenEduKeys = new Set(
      result.education.map(e => `${e.degree.toLowerCase()}|${e.institution.toLowerCase()}`)
    )
    for (const sec of sections) {
      if (["education", "summary", "hobbies"].includes(sec.type)) continue
      if (!sec.lines.some(l => INSTITUTION_RE.test(l))) continue
      const blocks = splitIntoBlocks(sec.lines, 5)
      for (const block of blocks) {
        if (result.education.length >= PARSE_LIMITS.education) break
        if (block.length < 2) continue
        // INSTITUTION_RE must appear AFTER line 0 — line 0 is always degree/title
        if (!INSTITUTION_RE.test(block.slice(1).join(" "))) continue
        const edu = parseEduBlock(block, `ed${result.education.length + 1}`)
        if (!edu.degree || !edu.institution) continue
        const key = `${edu.degree.toLowerCase()}|${edu.institution.toLowerCase()}`
        if (seenEduKeys.has(key)) continue
        seenEduKeys.add(key)
        result.education.push(edu)
      }
    }
  }

  // ── Prune work entries that are actually education ─────────────────────
  // When a 2-col PDF interleaves education into work section, parseWorkBlock
  // creates a work entry with empty employer. If dates match an education entry,
  // it's the same entry → remove from work to avoid showing it twice.
  if (result.education.length > 0) {
    const eduDateKeys = new Set(result.education.map(e => `${e.startDate}|${e.endDate}`))
    const before = result.workExperience.length
    result.workExperience = result.workExperience.filter(
      job => !(job.employer === "" && job.startDate && eduDateKeys.has(`${job.startDate}|${job.endDate}`))
    )
    if (result.workExperience.length < before) {
      result.workExperience.forEach((j, i) => { j.id = `we${i + 1}` })
    }
  }

  // ── Prune education entries that are mis-parsed work entries ──────────
  // When a 2-col PDF routes job info into the education section, parseEduBlock
  // creates an entry with degree = jobTitle. If degree + startDate match a work
  // entry, it's a duplicate → remove from education.
  if (result.workExperience.length > 0) {
    const before = result.education.length
    result.education = result.education.filter(edu => {
      if (!edu.degree) return true
      return !result.workExperience.some(job =>
        job.jobTitle && job.jobTitle.toLowerCase() === edu.degree.toLowerCase() &&
        job.startDate && job.startDate === edu.startDate
      )
    })
    if (result.education.length < before) {
      result.education.forEach((e, i) => { e.id = `ed${i + 1}` })
    }
  }

  // ── Skills ────────────────────────────────────────────────────────────
  // Módulo dedicado: prioriza celdas \t (preserva "CI/CD", "UX Design"),
  // fallback camelCase para tokens concatenados de texto plano.
  {
    const allSkillLines = getAll("skills").flatMap(sec => sec.lines)
    // El nombre/cargo de la persona pueden caer dentro de la sección skills
    // en layouts de sidebar — nunca son habilidades.
    const pd = result.personalDetails
    const notSkills = new Set(
      [`${pd.firstName} ${pd.lastName}`, pd.jobTitle, pd.city, pd.country]
        .map(s => s.trim().toLowerCase()).filter(Boolean)
    )
    result.skills = parseSkillLines(allSkillLines, PARSE_LIMITS.skills)
      .filter(name => !notSkills.has(name.toLowerCase()))
      .map((name, i) => ({ id: `sk${i + 1}`, name, level: "intermediate" }))
  }

  // ── Skill rescue: collect short tokens from sidebar overflow in any section ──
  // 2-column PDFs split the skills sidebar across work/education blocks.
  // We restore rescue for all sections but blocklist employer names, cities, and
  // job titles already parsed from work experience to prevent those from leaking in.
  const workBlocklist = new Set<string>()

  // From parsed work experience
  for (const job of result.workExperience) {
    if (job.employer) workBlocklist.add(job.employer.toLowerCase().trim())
    if (job.city) workBlocklist.add(job.city.toLowerCase().trim())
    if (job.jobTitle) {
      workBlocklist.add(job.jobTitle.toLowerCase().trim())
      for (const part of job.jobTitle.split(/[&,]/)) workBlocklist.add(part.toLowerCase().trim())
    }
  }

  // From education institutions (parsed entries)
  for (const edu of result.education) {
    if (edu.institution) workBlocklist.add(edu.institution.toLowerCase().trim())
    if (edu.city) workBlocklist.add(edu.city.toLowerCase().trim())
  }

  // From education section lines — even entries filtered by DEGREE_RE (e.g. "Catalica University")
  for (const sec of sections) {
    if (sec.type !== "education") continue
    for (const line of sec.lines) {
      if (INSTITUTION_RE.test(line) && line.length < 80 && !HAS_YEAR.test(line) && !isBullet(line)) {
        workBlocklist.add(line.toLowerCase().trim())
      }
    }
  }

  // Personal location
  if (result.personalDetails.city) workBlocklist.add(result.personalDetails.city.toLowerCase().trim())
  if (result.personalDetails.country) workBlocklist.add(result.personalDetails.country.toLowerCase().trim())
  if (result.personalDetails.jobTitle) workBlocklist.add(result.personalDetails.jobTitle.toLowerCase().trim())

  // Scan raw work/education lines for "Company, City" patterns the parser may have missed
  // Only comma-split lines — avoids blocking single-token skill names
  for (const sec of sections) {
    if (!["work", "education"].includes(sec.type)) continue
    for (const line of sec.lines) {
      if (line.length > 50 || isBullet(line) || /\d{4}/.test(line) || line.endsWith(".")) continue
      if (!/^[A-ZÁÉÍÓÚÜÑ]/.test(line)) continue
      const commaIdx = line.indexOf(",")
      if (commaIdx > 0) {
        workBlocklist.add(line.slice(0, commaIdx).toLowerCase().trim())
        workBlocklist.add(line.slice(commaIdx + 1).toLowerCase().trim())
      }
    }
  }

  // Palabras de header de tabla y palabras sueltas de empleadores — nunca son skills
  const TABLE_HEADER_WORDS = new Set(["yr", "year", "años", "año", "role", "firm", "loc", "company", "employer", "location", "puesto", "empresa"])
  for (const job of result.workExperience) {
    for (const word of `${job.employer} ${job.city}`.split(/\s+/)) {
      if (word.length >= 4) workBlocklist.add(word.toLowerCase().trim())
    }
  }

  const existingSkillNames = new Set(result.skills.map(s => s.name.toLowerCase()))
  for (const sec of sections) {
    if (["skills", "header", "summary", "languages", "hobbies", "unknown", "contact", "references", "volunteer", "projects", "certifications"].includes(sec.type)) continue
    for (const line of sec.lines) {
      if (line.length > 35 || line.endsWith(".") || line.endsWith(",")) continue
      if (/\d{4}/.test(line)) continue
      if (isBullet(line)) continue
      if (CONTACT_LINE_RE.test(line)) continue
      if (!/^[A-ZÁÉÍÓÚÜÑ]/.test(line)) continue
      // Don't split on "/" — preserves tokens like "CI/CD", "iOS back-end services"
      for (const part of line.split(/[,|•·\t]/)) {
        const s = clean(part)
        if (
          s.length > 1 && s.length < 35 &&
          !/^\d+$/.test(s) &&
          !existingSkillNames.has(s.toLowerCase()) &&
          !workBlocklist.has(s.toLowerCase().trim()) &&
          !TABLE_HEADER_WORDS.has(s.toLowerCase()) &&
          !INSTITUTION_RE.test(s) &&
          result.skills.length < 60
        ) {
          result.skills.push({ id: `sk${result.skills.length + 1}`, name: s, level: "intermediate" })
          existingSkillNames.add(s.toLowerCase())
        }
      }
    }
  }

  // ── Languages ─────────────────────────────────────────────────────────
  // Módulo dedicado: soporta varios idiomas por línea ("Spanish · NATIVE English · B2")
  {
    const langLines = getAll("languages").flatMap(sec =>
      sec.lines.filter(l => !/\.\s/.test(l) && !l.endsWith(".") && l.length <= 120)
    )
    for (const lang of parseLanguageLines(langLines)) {
      if (!result.languages.find(l => l.name.toLowerCase() === lang.name.toLowerCase())) {
        result.languages.push({ id: `la${result.languages.length + 1}`, name: lang.name, level: lang.level })
      }
    }
  }

  // ── Language rescue: scan all lines if no languages found ────────────
  // 2-column PDFs can bury the Languages section inside work content.
  if (result.languages.length === 0) {
    for (const line of lines) {
      if (line.length > 60 || line.length < 2) continue
      if (!/^[A-ZÁÉÍÓÚÜÑ]/.test(line)) continue
      const parts = line.split(/\s*[-–:|()\[\]\/\s●•○]+/).map(p => clean(p)).filter(Boolean)
      const name = parts[0]
      if (!name || name.length < 2 || name.length > 30) continue
      const nameNorm = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      if (!KNOWN_LANGUAGES.has(nameNorm) && !KNOWN_LANGUAGES.has(name.toLowerCase())) continue
      if (name.trim().split(/\s+/).length > 3) continue
      const rawLevel = parts.slice(1).join(" ").toLowerCase()
      const level = Object.entries(LANG_LEVEL_MAP).find(([k]) => rawLevel.includes(k))?.[1] ?? "professional"
      if (!result.languages.find(l => l.name.toLowerCase() === name.toLowerCase())) {
        result.languages.push({ id: `la${result.languages.length + 1}`, name, level })
      }
    }
  }

  // ── Certifications ────────────────────────────────────────────────────
  for (const sec of getAll("certifications")) {
    for (const line of sec.lines) {
      if (line.length < 3) continue
      // Skip job description bullets: long sentences ending in punctuation
      if (line.length > 80 && /[.!?]$/.test(line)) continue
      // Skip lines that look like job entries: role keyword + date RANGE.
      // Un año suelto al inicio ("2025  Concurrency IOS...") es formato fecha+nombre de cert.
      if (ROLE_KEYWORDS.test(line) && /\b(19|20)\d{2}\s*[-–—]\s*((19|20)\d{2}|present|presente|actual)/i.test(line)) continue
      // Skip continuation bullets that are clearly job descriptions (start lowercase after bullet)
      if (/^[a-z]/.test(line) && line.length > 20) continue
      const dr = extractDateRange(line)
      const nameClean = stripDates(line).replace(/^[•\-·]\s*/, "").trim()
      if (nameClean.length > 2 && nameClean.length < 120) {
        result.certifications.push({
          id: `ce${result.certifications.length + 1}`,
          name: nameClean, issuer: "",
          date: dr.startDate || dr.endDate || "", url: "",
        })
      }
    }
  }

  // ── Projects ──────────────────────────────────────────────────────────
  for (const sec of getAll("projects")) {
    const blocks = splitIntoBlocks(sec.lines, 8)
    // Fallback: if no blocks detected, treat each non-bullet line as a project
    const entries = blocks.length > 0 ? blocks : sec.lines.filter(l => !isBullet(l) && l.length > 2).map(l => [l])
    for (const block of entries) {
      if (result.projects.length >= PARSE_LIMITS.projects) break
      // Primera línea "Nombre — Descripción" o "Nombre | Rol": separar nombre del resto
      const first = clean(block[0] ?? "")
      const sep = first.match(/^(.{2,60}?)\s*[—–|·:]\s*(.+)$/)
      let name = first
      let inlineDesc = ""
      if (sep && sep[1].split(/\s+/).length <= 8) {
        name = clean(sep[1])
        inlineDesc = clean(sep[2])
      }
      const restDesc = block.slice(1).map(l => l.replace(/^[•\-·]\s*/, "").trim()).join(" ")
      const proj = {
        id: `pr${result.projects.length + 1}`,
        name, role: "",
        startDate: "", endDate: "",
        description: [inlineDesc, restDesc].filter(Boolean).join(" ").slice(0, 300),
        url: "",
      }
      const urlMatch = (block.join(" ")).match(/https?:\/\/[\w\-./]+/)
      if (urlMatch) proj.url = urlMatch[0]
      if (proj.name) result.projects.push(proj)
    }
  }

  // ── Volunteer ─────────────────────────────────────────────────────────
  for (const sec of getAll("volunteer")) {
    const blocks = splitIntoBlocks(sec.lines, 5)
    const entries = blocks.length > 0 ? blocks : sec.lines.filter(l => !isBullet(l)).map(l => [l])
    for (const block of entries) {
      if (result.volunteer.length >= PARSE_LIMITS.volunteer) break
      const dr = extractDateRange(block.join(" "))
      // Primera línea puede traer "Rol | Organización | Fecha" en celdas
      const firstParts = (block[0] ?? "").split(/\s*[|·\t]\s*/)
        .map(p => clean(stripDates(p))).filter(p => p.length > 1 && !HAS_YEAR.test(p))
      const role = firstParts[0] ?? clean(block[0] ?? "")
      const organization = firstParts[1] ?? clean(block[1] ?? "")
      const descLines = block.slice(firstParts[1] ? 1 : 2).filter(l => isBullet(l) || l.length > 30)
      result.volunteer.push({
        id: `vo${result.volunteer.length + 1}`,
        role, organization,
        startDate: dr.startDate, endDate: dr.endDate,
        description: descLines.map(l => l.replace(/^[•\-·]\s*/, "").trim()).join(" ").slice(0, 300),
      })
    }
  }

  // ── References ────────────────────────────────────────────────────────
  // Formatos comunes: "Nombre — Empresa", "Nombre | Cargo en Empresa",
  // con email/teléfono en líneas adyacentes. Soporta "Disponible a solicitud".
  for (const sec of getAll("references")) {
    const blocks = splitIntoBlocks(sec.lines, 4)
    const entries = blocks.length > 0 ? blocks : sec.lines.map(l => [l])
    for (const block of entries) {
      if (result.references.length >= 10) break
      const joined = block.join(" ")
      // "Disponibles a solicitud" / "Available upon request" → no es una referencia real
      if (/solicitud|request|upon request|petición|peticion/i.test(joined) && !extractEmail(joined)) continue
      const nameLine = clean(block[0] ?? "")
      if (!nameLine || nameLine.length < 2) continue
      // El nombre puede venir con cargo/empresa: "Juan Pérez — CTO en Acme"
      const nameParts = nameLine.split(/\s*[|·—–]\s*|\s+(?:en|at|de|from)\s+/i)
      const ref = {
        id: `re${result.references.length + 1}`,
        name: clean(nameParts[0] ?? ""),
        company: clean(nameParts.slice(1).join(" ")),
        phone: extractPhone(joined),
        email: extractEmail(joined),
      }
      // Si la empresa no salió del nombre, buscar en líneas siguientes
      if (!ref.company) {
        const companyLine = block.slice(1).find(l =>
          !CONTACT_LINE_RE.test(l) && !extractPhone(l) && clean(l).length > 1
        )
        if (companyLine) ref.company = clean(companyLine)
      }
      if (ref.name) result.references.push(ref)
    }
  }

  // ── Hobbies ───────────────────────────────────────────────────────────
  const hobbiesSection = get("hobbies")
  if (hobbiesSection) {
    result.hobbies = hobbiesSection.lines.map(l => l.replace(/^[•\-·]\s*/, "")).join(", ").slice(0, 300)
  }

  return result
}
