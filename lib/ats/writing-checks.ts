// lib/ats/writing-checks.ts
//
// Deterministic writing-quality checks a keyword matcher can't do, surfaced as
// ACTIONABLE findings (each maps to a real fix button in the report):
//   · cliché / buzzword bullets  → rewrite  ("results-driven", "team player"…)
//   · date-format inconsistency  → normalize ("May 2022" vs "06/2023" breaks ATS
//     tenure parsing — Jobscan/Indeed 2026)
//   · bullet-count balance       → trim / add (recruiters want 3–5 per recent role)
//
// No LLM, no randomness: the same CV always yields the same findings, so they can
// flow through the live re-score. Cliché detection reuses the shared list
// (lib/services/ai/shared/cliches.ts) — one source of truth, never a parallel list.
import { findCliches } from "@/lib/services/ai/shared/cliches"
import { parseBullets } from "@/lib/services/ai/shared/bullets"

interface WorkRow {
  id?: string
  jobTitle?: string
  description?: string
  startDate?: string
  endDate?: string
}

/** A bullet that opens with / contains a recruiter cliché — quote it, rewrite it. */
export interface ClicheBullet {
  targetId: string
  jobTitle: string
  index: number
  text: string
  cliches: string[]
}

/** A role whose bullet count is off the 3–5 recruiter sweet spot. */
export interface BulletBalance {
  targetId: string
  jobTitle: string
  count: number
  kind: "too_many" | "none"
}

/** A bullet opening with a duty phrase ("Responsible for…") — recruiters skim the
 *  first 2–3 words and a duty phrase reads as a task list, not a track record. */
export interface WeakVerbBullet {
  targetId: string
  jobTitle: string
  index: number
  text: string
}

export interface WritingChecks {
  clicheBullets: ClicheBullet[]
  weakVerbBullets: WeakVerbBullet[]
  /** Non-null when the CV mixes date formats (confuses ATS tenure parsing). */
  dateInconsistency: { formats: string[] } | null
  bulletBalance: BulletBalance[]
}

// Duty-phrase openers that read as a task list, not achievements. High-signal
// (unambiguous) on purpose — single overused verbs like "Managed"/"Led" are left
// out to avoid flagging legitimately strong bullets.
const WEAK_OPENERS: readonly string[] = [
  "responsible for", "in charge of", "assisted with", "helped with", "worked on",
  "duties included", "tasked with", "involved in", "participated in", "contributed to",
  "responsable de", "encargado de", "encargada de", "apoyé en", "apoye en",
  "ayudé con", "ayude con", "trabajé en", "trabaje en", "mis funciones incluían",
  "participé en", "participe en", "colaboré en",
]
function opensWeak(bullet: string): boolean {
  const l = bullet.toLowerCase().replace(/^[\s•·▪◦‣∙●○*–—-]+/, "").trim()
  return WEAK_OPENERS.some((o) => l.startsWith(o))
}

/** Classify a free-text date into a comparable format family (null = empty/unknown). */
function dateFormatClass(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  if (/^\d{4}$/.test(t)) return "year" // 2015
  if (/^\d{1,2}\/\d{4}$/.test(t)) return "mm/yyyy" // 06/2023
  if (/^\d{4}-\d{1,2}$/.test(t)) return "yyyy-mm" // 2023-06
  if (/^[A-Za-zÁÉÍÓÚÑáéíóúñ]+\.?\s+\d{4}$/.test(t)) return "month yyyy" // May 2022 / Mayo 2022
  return null // anything else is too irregular to compare fairly
}

const MAX_CLICHE = 8
const MAX_BALANCE = 6
const BULLET_MAX = 6 // more than this on one role reads as noise

export function analyzeWriting(sectionData: Record<string, unknown>): WritingChecks {
  const work = (sectionData.workExperience ?? []) as WorkRow[]
  const clicheBullets: ClicheBullet[] = []
  const weakVerbBullets: WeakVerbBullet[] = []
  const bulletBalance: BulletBalance[] = []
  const formats = new Set<string>()

  for (const j of work) {
    const id = j.id ?? ""
    const hasContent = !!(j.jobTitle?.trim() || (j.description ?? "").trim())
    const bullets = parseBullets(j.description ?? "")

    bullets.forEach((b, index) => {
      const cl = findCliches(b)
      if (cl.length > 0 && id && clicheBullets.length < MAX_CLICHE) {
        clicheBullets.push({ targetId: id, jobTitle: j.jobTitle ?? "", index, text: b, cliches: cl })
      }
      if (id && opensWeak(b) && weakVerbBullets.length < MAX_CLICHE) {
        weakVerbBullets.push({ targetId: id, jobTitle: j.jobTitle ?? "", index, text: b })
      }
    })

    if (id && hasContent && bulletBalance.length < MAX_BALANCE) {
      if (bullets.length > BULLET_MAX) {
        bulletBalance.push({ targetId: id, jobTitle: j.jobTitle ?? "", count: bullets.length, kind: "too_many" })
      } else if (bullets.length === 0) {
        bulletBalance.push({ targetId: id, jobTitle: j.jobTitle ?? "", count: 0, kind: "none" })
      }
    }

    for (const d of [j.startDate, j.endDate]) {
      const c = dateFormatClass(d ?? "")
      if (c) formats.add(c)
    }
  }

  return {
    clicheBullets,
    weakVerbBullets,
    dateInconsistency: formats.size > 1 ? { formats: [...formats] } : null,
    bulletBalance,
  }
}
