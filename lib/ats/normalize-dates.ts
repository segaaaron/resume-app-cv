// lib/ats/normalize-dates.ts
//
// One date format across the CV, written the way a parser reads best: MM/YYYY.
//
// Workday, Taleo, iCIMS and Lever all derive tenure from the date strings, and a
// CV that writes "2015" on one role and "May 2022" on the next hands them two
// different shapes to reconcile — the deterministic writing check already flags
// it. Flagging was all it did: the fix was "go and retype eight date fields".
// This does it in one action, and only for dates it can read with certainty.
//
// Pure, no LLM. A field it cannot parse confidently is left EXACTLY as typed —
// silently rewriting a date the user meant differently is worse than a mixed
// format.

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, ene: 1, enero: 1,
  feb: 2, february: 2, febrero: 2,
  mar: 3, march: 3, marzo: 3,
  apr: 4, april: 4, abr: 4, abril: 4,
  may: 5, mayo: 5,
  jun: 6, june: 6, junio: 6,
  jul: 7, july: 7, julio: 7,
  aug: 8, august: 8, ago: 8, agosto: 8,
  sep: 9, sept: 9, september: 9, septiembre: 9, setiembre: 9,
  oct: 10, october: 10, octubre: 10,
  nov: 11, november: 11, noviembre: 11,
  dec: 12, december: 12, dic: 12, diciembre: 12,
}

/** Words that mean "still there" — never rewritten into a date. */
const PRESENT = new Set(["present", "current", "now", "presente", "actual", "actualidad", "hoy"])

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/**
 * A single date field in canonical MM/YYYY, or null when it should be left
 * alone (empty, "Present", or a shape we cannot read without guessing).
 *
 * A bare year is deliberately NOT expanded to a month: "2015" says nothing about
 * January, and inventing a month invents tenure the candidate never claimed.
 */
export function toMachineDate(raw: string | undefined): string | null {
  const t = (raw ?? "").trim()
  if (!t) return null
  if (PRESENT.has(t.toLowerCase().replace(/[.\s]/g, ""))) return null

  // Already canonical.
  if (/^\d{2}\/\d{4}$/.test(t)) return null

  // M/YYYY or MM/YYYY with a single digit → pad.
  let m = /^(\d{1,2})\s*\/\s*(\d{4})$/.exec(t)
  if (m) {
    const month = Number(m[1])
    return month >= 1 && month <= 12 ? `${pad(month)}/${m[2]}` : null
  }

  // YYYY-MM / YYYY/MM
  m = /^(\d{4})\s*[-/]\s*(\d{1,2})$/.exec(t)
  if (m) {
    const month = Number(m[2])
    return month >= 1 && month <= 12 ? `${pad(month)}/${m[1]}` : null
  }

  // "May 2022", "Mayo 2022", "sept. 2019", "May, 2022"
  m = /^([A-Za-zÁÉÍÓÚÑáéíóúñ]+)\.?,?\s+(?:de\s+)?(\d{4})$/.exec(t)
  if (m) {
    const month = MONTHS[m[1].toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")]
    return month ? `${pad(month)}/${m[2]}` : null
  }

  // "2022 May" / "2022 Mayo"
  m = /^(\d{4})\s+([A-Za-zÁÉÍÓÚÑáéíóúñ]+)\.?$/.exec(t)
  if (m) {
    const month = MONTHS[m[2].toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")]
    return month ? `${pad(month)}/${m[1]}` : null
  }

  return null
}

interface DatedRow { startDate?: string; endDate?: string }

/**
 * Rewrites every readable date in a list of rows to MM/YYYY.
 * Returns the new rows plus how many fields actually changed, so the caller can
 * tell the user what happened instead of claiming a silent success.
 */
export function normalizeDates<T extends DatedRow>(rows: T[]): { rows: T[]; changed: number } {
  let changed = 0
  const out = rows.map((row) => {
    const start = toMachineDate(row.startDate)
    const end = toMachineDate(row.endDate)
    if (!start && !end) return row
    changed += (start ? 1 : 0) + (end ? 1 : 0)
    return { ...row, ...(start ? { startDate: start } : {}), ...(end ? { endDate: end } : {}) }
  })
  return { rows: out, changed }
}
