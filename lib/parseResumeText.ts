/**
 * parseResumeText — Extrae datos estructurados de texto plano de un CV.
 * Funciona con PDFs y DOCX sin necesidad de IA externa.
 */

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
  "experience": "work", "work experience": "work", "professional experience": "work",
  "employment": "work", "employment history": "work", "work history": "work",
  "career": "work", "career history": "work",
  "relevant experience": "work", "related experience": "work", "job experience": "work",
  "professional background": "work", "career background": "work", "work background": "work",
  "positions held": "work", "positions": "work", "job history": "work",
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
  "volunteer": "volunteer", "volunteering": "volunteer",
  "intereses": "hobbies", "hobbies": "hobbies", "aficiones": "hobbies",
  "pasatiempos": "hobbies", "interests": "hobbies", "hobbies & interests": "hobbies",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clean(s: string) {
  return s.replace(/\s+/g, " ").trim()
}

function isSectionHeading(line: string): string | null {
  const norm = line.toLowerCase().trim()
    .replace(/[:\-_•*\/\\|]/g, "")
    .replace(/\s+/g, " ").trim()
  return SECTION_MAP[norm] ?? null
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
const HAS_YEAR = /\b(20\d{2}|19\d{2})\b/

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
      const segments = line.split(/\s*[|·]\s*/)
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
    // Fallback: return all lines as one block
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

// Keywords that strongly suggest a line is a job role/title (not a company name)
const ROLE_KEYWORDS = /\b(developer|engineer|manager|designer|director|lead|senior|junior|intern|analyst|consultant|architect|scientist|specialist|coordinator|executive|officer|head|vp|cto|ceo|coo|cfo|devops|fullstack|frontend|backend|mobile|ios|android|qa|tester|scrum|agile|product|project|software|web|data|cloud|security|network|system|support|recruiter|hr|marketing|sales|account)\b/i

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
      const parts = line.split(/\s*[|·]\s*/)
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
        const rparts = remainder.split(/\s*[|·,]\s*/).map(clean).filter(p => p.length > 1)
        if (!job.employer && rparts[0]) job.employer = rparts[0]
        if (!job.city && rparts[1]) job.city = rparts[1]
      }
      continue
    }

    // Bullet points → description
    if (isBullet(line)) {
      descLines.push(line.replace(/^[•\-–·▪▸►→✓✔*]\s*/, "").trim())
      continue
    }

    // Short line without date → fill jobTitle, employer, or city in order
    if (line.length < 80 && !HAS_YEAR.test(line)) {
      const parts = line.split(/\s*[|·,]\s*/).map(clean).filter(p => p.length > 1)
      if (!job.jobTitle && !job.employer) {
        // Nothing set yet — first short line is the title
        job.jobTitle = parts[0] ?? ""
        if (parts.length >= 2 && !job.city) job.city = parts[1]
      } else if (!job.jobTitle) {
        // Employer was set from i=0 inline date — this line is the job title
        job.jobTitle = parts[0] ?? ""
        if (parts.length >= 2 && !job.city) job.city = parts[1]
      } else if (!job.employer) {
        job.employer = parts[0] ?? ""
        if (parts.length >= 2 && !job.city) job.city = parts[1]
      } else if (!job.city && parts.length === 1) {
        job.city = parts[0]
      } else if (job.startDate) {
        const wordCount = line.trim().split(/\s+/).length
        const looksLikeLeakedSidebarItem = wordCount <= 3 && line.length <= 25 && !/[.,]$/.test(line) && descLines.length > 0
        if (!looksLikeLeakedSidebarItem) descLines.push(line)
      }
      continue
    }

    // Long line → description (only after we have dates)
    if (line.length >= 40 && job.startDate) {
      descLines.push(line)
    }
  }

  job.description = descLines.slice(0, 20).map(d => `• ${d}`).join("\n")
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
      const parts = line.split(/\s*[|·]\s*/)
      if (parts.length >= 2) {
        edu.degree = clean(parts[0])
        if (!HAS_YEAR.test(parts[1])) edu.institution = clean(parts[1])
        if (parts.length >= 3 && !HAS_YEAR.test(parts[2])) edu.city = clean(parts[2])
        // Check for dates in parts
        for (const p of parts) {
          if (HAS_YEAR.test(p) && !edu.startDate) {
            const d = extractDateRange(p)
            if (d.startDate) { edu.startDate = d.startDate; edu.endDate = d.endDate; edu.currentlyStudying = d.current }
          }
        }
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
      if (rem.length > 1 && !edu.institution) edu.institution = rem
      continue
    }

    if (!isBullet(line) && line.length < 80 && !HAS_YEAR.test(line)) {
      const parts = line.split(/\s*[|·,]\s*/).map(clean).filter(p => p.length > 1)
      if (!edu.institution) {
        edu.institution = parts[0] ?? ""
        if (parts.length >= 2 && !edu.city) edu.city = parts[1]
      } else if (!edu.city && parts.length === 1) {
        edu.city = parts[0]
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
  ).filter(Boolean)

  type Section = { type: string; lines: string[] }
  const sections: Section[] = []
  let cur: Section = { type: "header", lines: [] }

  for (const line of lines) {
    const type = isSectionHeading(line)
    if (type) {
      if (cur.lines.length > 0 || cur.type !== "header") sections.push(cur)
      cur = { type, lines: [] }
    } else {
      cur.lines.push(line)
    }
  }
  sections.push(cur)

  const get = (type: string) => sections.find(s => s.type === type)
  const getAll = (type: string) => sections.filter(s => s.type === type)

  // ── Header → name + job title ─────────────────────────────────────────
  const header = get("header")
  if (header) {
    const contactRe = /[@+]|linkedin|github|http|www\.|\.com|\.mx|\.es|\d{5,}/i
    const cands = header.lines.filter(l => !contactRe.test(l) && l.length > 1 && l.length < 70)
    if (cands[0]) {
      const parts = clean(cands[0]).split(/\s+/)
      result.personalDetails.firstName = parts[0] ?? ""
      result.personalDetails.lastName = parts.slice(1).join(" ")
    }
    if (cands[1] && !cands[1].match(/^\d/)) {
      result.personalDetails.jobTitle = clean(cands[1])
    }
    const locLine = header.lines.find(l => /,\s*[A-ZÁÉÍÓÚÜÑ]/.test(l) && !contactRe.test(l) && l.length < 60)
    if (locLine) {
      const parts = locLine.split(",").map(p => clean(p))
      result.personalDetails.city = parts[0]
      result.personalDetails.country = parts[parts.length - 1]
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────
  const summarySection = get("summary")
  if (summarySection) {
    result.summary = summarySection.lines.join(" ").slice(0, 2500).trim()
  }

  // ── Work Experience (block-based) ─────────────────────────────────────
  for (const sec of getAll("work")) {
    const blocks = splitIntoBlocks(sec.lines, 6)
    for (const block of blocks) {
      if (result.workExperience.length >= 12) break
      const job = parseWorkBlock(block, `we${result.workExperience.length + 1}`)
      if (job.jobTitle || job.employer) result.workExperience.push(job)
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
      // Exclude sections that have their own dedicated parsers or are clearly not work
      if (["work", "header", "education", "summary", "certifications", "projects", "volunteer", "hobbies"].includes(sec.type)) continue
      // Only attempt rescue if section has year-dated, non-bullet lines
      if (!sec.lines.some(l => (HAS_YEAR.test(l) || CURRENT_WORDS.test(l)) && !isBullet(l))) continue
      const blocks = splitIntoBlocks(sec.lines, 6)
      for (const block of blocks) {
        if (result.workExperience.length >= 12) break
        const job = parseWorkBlock(block, `we${result.workExperience.length + 1}`)
        // Require a title/employer AND a year-based start date (avoids false positives)
        if (!(job.jobTitle || job.employer)) continue
        if (!job.startDate.match(/\d{4}/)) continue
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
  const DEGREE_RE = /\b(licenciatura|ingeniería|ingenieria|bachillerato|maestría|maestria|doctorado|técnico|tecnico|bachelor|master|phd|mba|degree|diploma|carrera|grado|engineer|science|arts|technology|business|medicine|law)\b/i

  for (const sec of getAll("education")) {
    // For education, also try splitting by degree keywords if blocks fail
    const blocks = splitIntoBlocks(sec.lines, 5)
    for (const block of blocks) {
      if (result.education.length >= 8) break
      if (!block[0]) continue
      // Only parse if it looks like an education entry
      if (!DEGREE_RE.test(block.join(" ")) && !HAS_YEAR.test(block.join(" "))) continue
      const edu = parseEduBlock(block, `ed${result.education.length + 1}`)
      if (edu.degree || edu.institution) result.education.push(edu)
    }
  }

  // ── Skills ────────────────────────────────────────────────────────────
  const skillNames = new Set<string>()
  for (const sec of getAll("skills")) {
    for (const line of sec.lines) {
      for (const part of line.split(/[,|•·\t\/]/)) {
        const s = clean(part)
        if (s.length > 1 && s.length < 50 && !/^\d+$/.test(s)) skillNames.add(s)
      }
    }
  }
  result.skills = Array.from(skillNames).slice(0, 60).map((name, i) => ({
    id: `sk${i + 1}`, name, level: "intermediate",
  }))

  // ── Skill rescue: collect short tokens from non-work sections that look like tech skills ──
  // Sidebar PDFs often split the skills column across multiple text blocks
  const existingSkillNames = new Set(result.skills.map(s => s.name.toLowerCase()))
  for (const sec of sections) {
    if (["skills", "header", "summary", "work", "education", "languages", "certifications", "projects", "volunteer", "hobbies"].includes(sec.type)) continue
    for (const line of sec.lines) {
      if (line.length > 35 || line.endsWith(".") || line.endsWith(",")) continue
      if (/\d{4}/.test(line)) continue
      if (isBullet(line)) continue
      if (!/^[A-ZÁÉÍÓÚÜÑ]/.test(line)) continue
      for (const part of line.split(/[,|•·\t\/]/)) {
        const s = clean(part)
        if (s.length > 1 && s.length < 35 && !/^\d+$/.test(s) && !existingSkillNames.has(s.toLowerCase()) && result.skills.length < 60) {
          result.skills.push({ id: `sk${result.skills.length + 1}`, name: s, level: "intermediate" })
          existingSkillNames.add(s.toLowerCase())
        }
      }
    }
  }

  // ── Languages ─────────────────────────────────────────────────────────
  const LANG_LEVEL_MAP: Record<string, string> = {
    "nativo": "native", "native": "native", "materno": "native",
    "bilingüe": "native", "bilingue": "native", "bilingual": "native",
    "fluido": "full_professional", "fluent": "full_professional",
    "avanzado": "full_professional", "advanced": "full_professional", "c1": "full_professional", "c2": "native",
    "profesional": "professional", "professional": "professional",
    "intermedio": "professional", "intermediate": "professional", "b2": "professional", "b1": "limited",
    "básico": "limited", "basico": "limited", "basic": "limited",
    "elemental": "elementary", "elementary": "elementary", "a1": "elementary", "a2": "elementary",
  }

  // Known language names (covers most CVs in ES/EN)
  const KNOWN_LANGUAGES = new Set([
    "español", "espanol", "spanish", "inglés", "ingles", "english",
    "francés", "frances", "french", "alemán", "aleman", "german",
    "italiano", "italian", "portugués", "portugues", "portuguese",
    "chino", "chinese", "mandarín", "mandarin", "japonés", "japones", "japanese",
    "coreano", "korean", "árabe", "arabe", "arabic", "ruso", "russian",
    "holandés", "holandes", "dutch", "sueco", "swedish", "noruego", "norwegian",
    "danés", "danish", "finlandés", "finnish", "polaco", "polish",
    "catalán", "catalan", "euskera", "basque", "gallego", "galician",
    "hindi", "bengali", "turco", "turkish", "griego", "greek",
    "hebreo", "hebrew", "tailandés", "thai", "vietnamita", "vietnamese",
  ])

  const LANG_LEVEL_WORDS = new Set(Object.keys(LANG_LEVEL_MAP))

  for (const sec of getAll("languages")) {
    for (const line of sec.lines) {
      // Skip lines that are clearly sentence fragments (contain periods, start lowercase, too long)
      if (/\.\s/.test(line) || line.endsWith(".")) continue
      if (line.length > 60) continue
      if (!/^[A-ZÁÉÍÓÚÜÑ]/.test(line)) continue

      const parts = line.split(/\s*[-–:|()\[\]\/]\s*/).map(p => clean(p)).filter(Boolean)
      if (!parts[0] || parts[0].length < 2 || parts[0].length > 35) continue

      const name = parts[0]
      const rawLevel = parts.slice(1).join(" ").toLowerCase()

      // Validate: must be a known language OR the line must contain a level keyword
      const nameNorm = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      const nameNormAccent = name.toLowerCase()
      const isKnownLang = KNOWN_LANGUAGES.has(nameNorm) || KNOWN_LANGUAGES.has(nameNormAccent)
      const hasLevelWord = Array.from(LANG_LEVEL_WORDS).some(k => rawLevel.includes(k))

      if (!isKnownLang && !hasLevelWord) continue

      // Language name should be 1-3 words, no sentence structure
      const wordCount = name.trim().split(/\s+/).length
      if (wordCount > 3) continue

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
      const dr = extractDateRange(line)
      const nameClean = stripDates(line).replace(/^[•\-·]\s*/, "").trim()
      if (nameClean.length > 2) {
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
      if (result.projects.length >= 8) break
      const proj = {
        id: `pr${result.projects.length + 1}`,
        name: clean(block[0] ?? ""), role: "",
        startDate: "", endDate: "",
        description: block.slice(1).map(l => l.replace(/^[•\-·]\s*/, "").trim()).join(" ").slice(0, 300),
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
      if (result.volunteer.length >= 6) break
      const dr = extractDateRange(block.join(" "))
      result.volunteer.push({
        id: `vo${result.volunteer.length + 1}`,
        role: clean(block[0] ?? ""), organization: clean(block[1] ?? ""),
        startDate: dr.startDate, endDate: dr.endDate, description: "",
      })
    }
  }

  // ── Hobbies ───────────────────────────────────────────────────────────
  const hobbiesSection = get("hobbies")
  if (hobbiesSection) {
    result.hobbies = hobbiesSection.lines.map(l => l.replace(/^[•\-·]\s*/, "")).join(", ").slice(0, 300)
  }

  return result
}
