/**
 * tabular-work — Parser para formato tabla de experiencia laboral.
 *
 * Muchas plantillas de CV presentan el trabajo como tabla con columnas
 * (YR / ROLE / FIRM / LOC) y rangos de años partidos en líneas:
 *
 *   YR    ROLE             FIRM      LOC
 *   15
 *   —     iOS Developer    Xiobit    Cochabamba
 *   16
 *   [bullets del puesto...]
 *   17    iOS Developer & Web
 *   Salamanca
 *   —     Debeloper & Mobile    Cochabamba
 *   ...
 *
 * Con extracción posicional (extract-pdf) las celdas llegan separadas por \t
 * y los bullets siguen a su entrada. Este parser:
 *  - Detecta inicios de entrada por tokens de año (2 o 4 dígitos).
 *  - Clasifica fragmentos de celdas: rol (keywords), ubicación (última celda
 *    de filas multi-celda), empresa (el resto, en orden).
 *  - Acumula bullets por oración (hasta terminar en . ! ?) — robusto ante
 *    el word-wrap del PDF sin depender de mayúsculas.
 */

import { clean, ROLE_KEYWORDS, INSTITUTION_RE, expandYear } from "./patterns"
import { serializeBullets } from "../services/ai/shared/bullets"

export interface TabularJob {
  id: string
  jobTitle: string
  employer: string
  city: string
  startDate: string
  endDate: string
  currentlyWorking: boolean
  description: string
}

const YEAR_TOKEN = /^(\d{2}|(?:19|20)\d{2})$/
const DASH_ONLY = /^[—–-]+$/
const TABLE_HEADER = /^(yr|year|años?|aã±os?)\b/i
const SENTENCE_END = /[.!?]$/

/** ¿La sección de trabajo usa formato tabla? */
export function detectTabularWork(lines: string[]): boolean {
  let yearTokens = 0
  let dashRows = 0
  let header = false
  for (const line of lines) {
    const cells = line.split("\t").map(c => c.trim()).filter(Boolean)
    if (!cells.length) continue
    if (TABLE_HEADER.test(cells[0]) && cells.length >= 3) header = true
    if (YEAR_TOKEN.test(cells[0])) yearTokens++
    if (DASH_ONLY.test(cells[0]) && cells.length >= 2) dashRows++
  }
  return (header && dashRows >= 1) || (yearTokens >= 2 && dashRows >= 1)
}

// ─── Sub-formato date-first: "2015–2016 ⇥ Rol ⇥ Empresa · Ciudad" ────────────
// La fila empieza con un rango de años completo y separa celdas con TAB.
// Distinto del tabular YR/ROLE/FIRM/LOC (años partidos en líneas).

const DATE_ROW = /^(\d{2,4})\s*[–—-]\s*(\d{2,4}|present|presente|actual|current|now|hoy)\b/i
const CURRENT_END = /^(present|presente|actual|current|now|hoy)$/i

/** ¿La sección usa filas con rango de año al inicio + tabs? */
export function detectRowDatedWork(lines: string[]): boolean {
  let rows = 0
  for (const line of lines) {
    if (DATE_ROW.test(line.trim()) && line.includes("\t")) rows++
  }
  return rows >= 2
}

/** Parsea sección de trabajo en formato fila con fecha al inicio. */
export function parseRowDatedWork(lines: string[], maxJobs: number, maxBullets: number): TabularJob[] {
  const jobs: TabularJob[] = []
  let cur: TabularJob | null = null
  let bullets: string[] = []
  let bulletAcc = ""
  let sawBullet = false

  const flushBullet = () => {
    const b = clean(bulletAcc)
    if (b.length > 3) bullets.push(b)
    bulletAcc = ""
  }
  const flush = () => {
    flushBullet()
    if (cur) {
      cur.description = serializeBullets(bullets.slice(0, maxBullets))
      jobs.push(cur)
    }
    cur = null
    bullets = []
    sawBullet = false
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    const m = line.match(DATE_ROW)

    if (m && rawLine.includes("\t")) {
      flush()
      if (jobs.length >= maxJobs) break
      const cells = line.split("\t").map(c => c.trim()).filter(Boolean)
      const endRaw = m[2]
      const current = CURRENT_END.test(endRaw)
      cur = {
        id: `we${jobs.length + 1}`,
        jobTitle: clean(cells[1] ?? ""),
        employer: "",
        city: "",
        startDate: expandYear(m[1]),
        endDate: current ? "" : expandYear(endRaw),
        currentlyWorking: current,
        description: "",
      }
      // 3ª celda: "Empresa · Ciudad"
      if (cells[2]) {
        const ec = cells[2].split(/\s*[·|]\s*/).map(s => clean(s)).filter(Boolean)
        cur.employer = ec[0] ?? ""
        if (ec[1]) cur.city = ec[1]
      }
      continue
    }

    if (!cur) continue

    const isSentence = line.length >= 40 || SENTENCE_END.test(line)
    // Continuación de rol envuelto: línea corta, antes de cualquier bullet,
    // sin terminar en punto (p. ej. "Developer" tras "...& Mobile").
    if (!sawBullet && !isSentence && line.length < 30) {
      cur.jobTitle = clean(`${cur.jobTitle} ${line}`)
      continue
    }

    sawBullet = true
    if (bulletAcc.endsWith("-")) bulletAcc = bulletAcc.slice(0, -1) + line
    else bulletAcc += (bulletAcc ? " " : "") + line
    if (SENTENCE_END.test(line)) flushBullet()
  }

  flush()
  return jobs.slice(0, maxJobs)
}

interface EntryDraft {
  startYear: string
  endYear: string
  current: boolean
  frags: string[]
  lastCellFrags: string[]
  bullets: string[]
}

function newDraft(startYear: string): EntryDraft {
  return { startYear, endYear: "", current: false, frags: [], lastCellFrags: [], bullets: [] }
}

function finalize(draft: EntryDraft, id: string, maxBullets: number): TabularJob {
  const roleParts: string[] = []
  const rest: string[] = []
  for (const f of draft.frags) {
    if (ROLE_KEYWORDS.test(f) && !INSTITUTION_RE.test(f)) roleParts.push(f)
    else rest.push(f)
  }

  let jobTitle = roleParts.join(" ")
  let city = draft.lastCellFrags.find(f => !roleParts.includes(f)) ?? ""
  let employer = rest.filter(f => f !== city).join(" ")

  // Fallback sin keywords de rol: primer fragmento = rol, última celda = ubicación
  if (!jobTitle && rest.length) {
    jobTitle = rest[0]
    const others = rest.slice(1).filter(f => f !== city)
    if (!city && others.length > 1) city = others.pop() ?? ""
    employer = others.join(" ")
  }

  return {
    id,
    jobTitle: clean(jobTitle),
    employer: clean(employer),
    city: clean(city),
    startDate: expandYear(draft.startYear),
    endDate: draft.current ? "" : expandYear(draft.endYear),
    currentlyWorking: draft.current,
    description: serializeBullets(draft.bullets.slice(0, maxBullets)),
  }
}

/** Parsea una sección de trabajo en formato tabla. Devuelve [] si no aplica. */
export function parseTabularWork(lines: string[], maxJobs: number, maxBullets: number): TabularJob[] {
  const jobs: TabularJob[] = []
  let draft: EntryDraft | null = null
  let inDesc = false
  let bulletAcc = ""

  const flushBullet = () => {
    const b = clean(bulletAcc)
    if (b.length > 3 && draft) draft.bullets.push(b)
    bulletAcc = ""
  }
  const flushDraft = () => {
    flushBullet()
    if (draft && (draft.frags.length || draft.bullets.length)) {
      jobs.push(finalize(draft, `we${jobs.length + 1}`, maxBullets))
    }
    draft = null
    inDesc = false
  }

  for (const rawLine of lines) {
    const cells = rawLine.split("\t").map(c => c.trim()).filter(Boolean)
    if (!cells.length) continue
    if (TABLE_HEADER.test(cells[0]) && cells.length >= 3) continue // header YR/ROLE/FIRM/LOC

    const firstIsYear = YEAR_TOKEN.test(cells[0])
    const firstIsDash = DASH_ONLY.test(cells[0])

    if (firstIsYear) {
      const year = cells[0]
      const restCells = cells.slice(1)
      if (!draft || inDesc) {
        // Nuevo bloque de entrada
        flushDraft()
        draft = newDraft(year)
      } else if (!draft.endYear) {
        draft.endYear = year
      }
      if (draft && restCells.length) {
        draft.frags.push(...restCells)
        if (cells.length >= 3) draft.lastCellFrags.push(restCells[restCells.length - 1])
      }
      continue
    }

    if (!draft) continue // texto antes de la primera entrada — no es de la tabla

    if (firstIsDash) {
      const restCells = cells.slice(1)
      draft.frags.push(...restCells)
      if (cells.length >= 3) draft.lastCellFrags.push(restCells[restCells.length - 1])
      continue
    }

    const line = cells.join(" ")
    const isSentence = line.length >= 40 || SENTENCE_END.test(line)

    if (!inDesc && !isSentence && line.length < 60) {
      // Fragmento de celda envuelta (firm/loc/role wrap)
      draft.frags.push(...cells)
      if (cells.length >= 3) draft.lastCellFrags.push(cells[cells.length - 1])
      continue
    }

    // Descripción: acumular hasta cierre de oración (robusto al word-wrap)
    inDesc = true
    if (bulletAcc.endsWith("-")) bulletAcc = bulletAcc.slice(0, -1) + line
    else bulletAcc += (bulletAcc ? " " : "") + line
    if (SENTENCE_END.test(line)) flushBullet()

    if (jobs.length >= maxJobs) break
  }

  flushDraft()
  return jobs.slice(0, maxJobs)
}
