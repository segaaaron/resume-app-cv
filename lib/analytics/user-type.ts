// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers to derive low-cardinality analytics dimensions from user state.
// No side effects, no PII — safe to unit test and to run on server or client.
// ─────────────────────────────────────────────────────────────────────────────

import type { ResultBucket, ScoreBucket, Tenure, UserType } from "./events"

const DAY_MS = 24 * 60 * 60 * 1000

/** Signals needed to classify a user's lifecycle stage. All cheap to obtain. */
export interface UserTypeSignals {
  isAuthenticated: boolean
  isManaged: boolean
  /** True when the user currently has paid/active access (PRO/BASIC/SPRINT/LIMITED). */
  hasActiveAccess: boolean
  /** True when they held paid access before but no longer do. */
  wasPaying: boolean
  resumeCount: number
  coverLetterCount: number
  applicationCount: number
}

/**
 * Classifies a user into a single lifecycle stage. Order matters: the most
 * specific / commercially-relevant states win.
 */
export function deriveUserType(s: UserTypeSignals): UserType {
  if (!s.isAuthenticated) return "visitor"
  if (s.isManaged) return "managed"
  if (s.hasActiveAccess) {
    const heavy = s.resumeCount >= 3 || s.coverLetterCount >= 3 || s.applicationCount >= 5
    return heavy ? "power_user" : "paying"
  }
  if (s.wasPaying) return "churned"
  if (s.coverLetterCount > 0 || s.applicationCount > 0) return "engaged"
  if (s.resumeCount > 0) return "activated"
  return "unactivated"
}

/** Buckets account age into new / returning / veteran. Never exposes the date. */
export function tenureBucket(createdAt: Date | string | number, now: number = Date.now()): Tenure {
  const created = new Date(createdAt).getTime()
  if (!Number.isFinite(created)) return "new"
  const ageDays = (now - created) / DAY_MS
  if (ageDays < 7) return "new"
  if (ageDays < 60) return "returning"
  return "veteran"
}

/** Maps a 0-100 ATS score to a fixed bucket to keep cardinality bounded. */
export function scoreBucket(score: number): ScoreBucket {
  if (score < 40) return "0-40"
  if (score < 60) return "40-60"
  if (score < 75) return "60-75"
  if (score < 90) return "75-90"
  return "90-100"
}

/** Maps a 0-100 result to low / mid / high (used by the public ATS tool). */
export function resultBucket(score: number): ResultBucket {
  if (score < 50) return "low"
  if (score < 80) return "mid"
  return "high"
}
