"use client"

// Session-scoped cache for suggest-skills responses.
// Uses sessionStorage (cleared on tab close) keyed by jobTitle+language.
// Stays within apiFetch layer — no CSRF risk, no cross-user contamination.

const TTL_MS = 30 * 60 * 1000 // 30 min

function key(jobTitle: string, language: string): string {
  return `rc_skills_${jobTitle.trim().toLowerCase()}:${language.toLowerCase().split("-")[0]}`
}

export function getSkillsCache(
  jobTitle: string,
  language: string
): { skills: { name: string; level: string }[] } | null {
  try {
    const raw = sessionStorage.getItem(key(jobTitle, language))
    if (!raw) return null
    const { data, expiresAt } = JSON.parse(raw) as { data: { skills: { name: string; level: string }[] }; expiresAt: number }
    if (Date.now() > expiresAt) {
      sessionStorage.removeItem(key(jobTitle, language))
      return null
    }
    return data
  } catch {
    return null
  }
}

export function setSkillsCache(
  jobTitle: string,
  language: string,
  data: { skills: { name: string; level: string }[] }
): void {
  try {
    sessionStorage.setItem(key(jobTitle, language), JSON.stringify({ data, expiresAt: Date.now() + TTL_MS }))
  } catch {
    // sessionStorage unavailable or full — fail silently
  }
}
