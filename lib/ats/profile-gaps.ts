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
import { parseBullets } from "@/lib/services/ai/shared/bullets"
import { BULLETS_PER_ROLE_MAX } from "@/lib/ats/scoring-config"

/**
 * Kinds of gap, which double as i18n keys for the question copy.
 * `jobBullets` and `jobDates` are per-role, so they carry a `jobId`.
 */
export type ProfileGapKind =
  | "jobTitle"
  | "workExperience"
  | "jobDates"
  | "jobBullets"
  | "moreBullets"
  | "moreExperience"
  | "education"
  | "skills"
  | "certifications"
  | "languages"
  | "summary"

export interface ProfileGap {
  kind: ProfileGapKind
  /** Which role this is about — only for the per-role gaps. */
  jobId?: string
  /** Employer or role name, so the question can name it: "…in Banco Mercantil?" */
  subject?: string
  /** True when `subject` is the ROLE because no employer is known — the question
   *  has to say "as a Telecoms Engineer", never "at a Telecoms Engineer". */
  subjectIsRole?: boolean
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
/** Past this many roles a résumé stops gaining and starts sprawling. */
const MAX_ROLES = 5
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

  // Asked FIRST, whatever it weighs, and asked whenever the CV has not actually
  // been BUILT — not merely whenever the title is missing.
  //
  // A résumé carrying a job title and nothing else used to skip this and open
  // with "where did you work?", which is an interrogation: we already knew the
  // role, so the right move was to write the CV from it and ask afterwards for
  // the things only the person can know.
  const unbuilt = !present.summary && !present.work && !present.skills
  if (!scan.currentTitle || unbuilt) {
    // `ai`, because answering this one does more than record a job title: it is
    // the seed the whole CV grows from — the summary and the skills of that
    // role come back with it. It used to be a separate "seed" screen that asked
    // the same question the list then asked again.
    gaps.push({ kind: "jobTitle", weight: RECRUITER_SCAN_ITEM, fill: "ai" })
  }
  const titleFirst = gaps.length

  if (!present.work) {
    // Nothing to ask about a specific role yet — ask for the role itself.
    gaps.push({ kind: "workExperience", weight: RECRUITER_SCAN_ITEM + COMPLETENESS_ITEM, fill: "direct" })
  } else {
    for (const job of work) {
      if (!job.id) continue
      // The employer if we have one, the role only as a fallback — and the two
      // are flagged apart, because "how long did you work AT Telecoms Engineer"
      // is not a sentence. The question picks its wording from this.
      const employer = (job.employer ?? "").trim()
      const subject = employer || (job.jobTitle ?? "").trim() || undefined
      const subjectIsRole = !employer
      if (missingDates(job)) {
        gaps.push({ kind: "jobDates", jobId: job.id, subject, subjectIsRole, weight: RECRUITER_SCAN_ITEM, fill: "direct" })
      }
      // Room for one more line on a role that already has some. Capped at the
      // number the rest of the product already enforces: past six, the ATS panel
      // flags the role as crowded and the skill writer stops proposing there. An
      // assistant that pushes past a limit its own analyser penalises is the
      // fastest way to make both look untrustworthy.
      if (!missingBullets(job) && parseBullets(job.description ?? "").length < BULLETS_PER_ROLE_MAX.value) {
        gaps.push({ kind: "moreBullets", jobId: job.id, subject, subjectIsRole, weight: COMPLETENESS_ITEM / 4, fill: "ai" })
      }
      if (missingBullets(job)) {
        // The one question the user cannot answer with a field: they describe
        // the job in their own words and the model turns it into bullets.
        gaps.push({ kind: "jobBullets", jobId: job.id, subject, subjectIsRole, weight: RECRUITER_SCAN_ITEM, fill: "ai" })
      }
    }
  }

  // One job is where the assistant used to stop, and then told the person their
  // CV was complete. Our own completeness model scores work experience at 60%
  // with a single role and 100% from two — so the product already knew one is
  // not enough, and the wizard was the only place that did not ask.
  //
  // Only offered once the roles on file are finished: asking "did you work
  // anywhere else?" while the current job still has no dates buries the user in
  // half-filled entries.
  const jobsComplete = work.length > 0 && work.every((j) => !missingDates(j) && !missingBullets(j))
  if (jobsComplete && work.length < MAX_ROLES) {
    gaps.push({ kind: "moreExperience", weight: COMPLETENESS_ITEM / 3, fill: "direct" })
  }

  if (!present.education) {
    gaps.push({ kind: "education", weight: RECRUITER_SCAN_ITEM + COMPLETENESS_ITEM, fill: "direct" })
  }

  if (!present.skills) {
    gaps.push({ kind: "skills", weight: COMPLETENESS_ITEM, fill: "direct" })
  }

  // Asked once, and only once there is a role to key the examples off. A
  // credential is the single line that most changes how a technical CV reads,
  // and the section existed for a year with nothing ever pointing at it.
  const certs = (Array.isArray(sectionData.certifications) ? sectionData.certifications : []) as unknown[]
  if (certs.length === 0 && scan.currentTitle) {
    gaps.push({ kind: "certifications", weight: COMPLETENESS_ITEM / 2, fill: "ai" })
  }

  // Asked, never guessed. Which languages someone speaks and how well is a fact
  // only they hold, and on a technical CV it is often the line that decides the
  // shortlist — the specs are in English.
  const langs = (Array.isArray(sectionData.languages) ? sectionData.languages : []) as unknown[]
  if (langs.length === 0) {
    gaps.push({ kind: "languages", weight: COMPLETENESS_ITEM / 2, fill: "direct" })
  }

  // Sorted between the pinned ends: the title stays first and the summary is
  // appended last, whatever either of them would weigh.
  const rest = gaps.slice(titleFirst).sort((a, b) => b.weight - a.weight)
  gaps.length = titleFirst
  gaps.push(...rest)

  if (!scan.readableSummary) {
    gaps.push({ kind: "summary", weight: RECRUITER_SCAN_ITEM + COMPLETENESS_ITEM, fill: "ai" })
  }

  return gaps
}
