// lib/ats/profile-gaps.ts
//
// What this CV is still missing, as an ordered list of things to ASK the user.
//
// One source of truth, and it is not a new one: every gap here is read off the
// booleans `computeResumeScore` already computes on every keystroke. Before
// this, that function collapsed them to "3 of 5" and dropped which 3 — so the
// product knew exactly what was missing and had no way to say it. The assistant
// could only guess from free text, which is why it answered a banking profile
// with a summary and a job title and nothing else.
//
// Deterministic on purpose. Deciding WHAT to ask is arithmetic over the CV; the
// model is only needed to WRITE (bullets, the closing summary), and that keeps
// the interview free.
import { computeResumeScore } from "@/lib/services/ai/shared/resume-score"

/**
 * Kinds of gap, which double as i18n keys for the question copy.
 * `jobBullets` and `jobDates` are per-role, so they carry a `jobId`.
 */
export type ProfileGapKind =
  | "jobTitle"
  | "workExperience"
  | "jobDates"
  | "jobBullets"
  | "education"
  | "skills"
  | "summary"

export interface ProfileGap {
  kind: ProfileGapKind
  /** Which role this is about — only for the per-role gaps. */
  jobId?: string
  /** Employer or role name, so the question can name it: "…in Banco Mercantil?" */
  subject?: string
  /**
   * How much closing this gap moves the score, 0-1. Drives the order: the user
   * answers the question that helps them most, first.
   */
  weight: number
  /**
   * The answer goes straight into the CV as typed (`direct`), or has to be
   * written up by the model first (`ai`). Only `ai` costs anything.
   */
  fill: "direct" | "ai"
}

// Weights mirror what the score actually rewards, so the order the user is asked
// in and the order that improves their CV cannot drift apart. recruiterScan is
// worth 0.20 of the overall and completeness 0.15; a missing item inside a
// dimension is worth its share of that dimension.
const RECRUITER_SCAN_ITEM = 0.2 / 5
const COMPLETENESS_ITEM = 0.15 / 5

interface JobLike {
  id?: string
  jobTitle?: string
  employer?: string
  startDate?: string
  endDate?: string
  currentlyWorking?: boolean
  description?: string
}

/** True when the role has neither a start nor an end date. */
function missingDates(job: JobLike): boolean {
  if (job.currentlyWorking && (job.startDate ?? "").trim()) return false
  return !(job.startDate ?? "").trim() && !(job.endDate ?? "").trim()
}

/** A role with no description has nothing for a recruiter to read. */
function missingBullets(job: JobLike): boolean {
  return (job.description ?? "").trim().length === 0
}

/**
 * The gaps in this CV, most valuable first.
 *
 * `summary` is deliberately last and always last: written first it has nothing
 * to work from, which is exactly how the old assistant produced a generic
 * paragraph from an empty profile. It is worth asking for only once the roles,
 * dates and studies are in.
 */
export function computeProfileGaps(sectionData: Record<string, unknown>): ProfileGap[] {
  const score = computeResumeScore(sectionData)
  const byKey = new Map(score.dimensions.map((d) => [d.key, d]))
  const scan = byKey.get("recruiterScan")?.checks ?? {}
  const present = byKey.get("completeness")?.checks ?? {}

  const work = (Array.isArray(sectionData.workExperience) ? sectionData.workExperience : []) as JobLike[]
  const gaps: ProfileGap[] = []

  if (!scan.currentTitle) {
    gaps.push({ kind: "jobTitle", weight: RECRUITER_SCAN_ITEM, fill: "direct" })
  }

  if (!present.work) {
    // Nothing to ask about a specific role yet — ask for the role itself.
    gaps.push({ kind: "workExperience", weight: RECRUITER_SCAN_ITEM + COMPLETENESS_ITEM, fill: "direct" })
  } else {
    for (const job of work) {
      if (!job.id) continue
      const subject = (job.employer ?? "").trim() || (job.jobTitle ?? "").trim() || undefined
      if (missingDates(job)) {
        gaps.push({ kind: "jobDates", jobId: job.id, subject, weight: RECRUITER_SCAN_ITEM, fill: "direct" })
      }
      if (missingBullets(job)) {
        // The one question the user cannot answer with a field: they describe
        // the job in their own words and the model turns it into bullets.
        gaps.push({ kind: "jobBullets", jobId: job.id, subject, weight: RECRUITER_SCAN_ITEM, fill: "ai" })
      }
    }
  }

  if (!present.education) {
    gaps.push({ kind: "education", weight: RECRUITER_SCAN_ITEM + COMPLETENESS_ITEM, fill: "direct" })
  }

  if (!present.skills) {
    gaps.push({ kind: "skills", weight: COMPLETENESS_ITEM, fill: "direct" })
  }

  // Sorted before the summary is appended, so the summary stays last whatever
  // it would weigh.
  gaps.sort((a, b) => b.weight - a.weight)

  if (!scan.readableSummary) {
    gaps.push({ kind: "summary", weight: RECRUITER_SCAN_ITEM + COMPLETENESS_ITEM, fill: "ai" })
  }

  return gaps
}
