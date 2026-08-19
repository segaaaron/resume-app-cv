"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * "No, that's all" has to survive a reload.
 *
 * The assistant asks two questions the CV itself cannot answer: is there
 * another job, and is there another line to add to this one. A finished CV
 * looks exactly like an unfinished one to `computeProfileGaps` — three roles
 * with four bullets each is a complete résumé AND a résumé that could hold a
 * fourth role, so the only thing separating them is the person having said no.
 *
 * That answer lived in useState. Reloading the page, or leaving to the CV list
 * and coming back, dropped it: the panel that had just said "your CV is
 * complete" re-opened asking for more experience, and the only way out was to
 * decline again, every time. Reported from a real session.
 *
 * localStorage, keyed per résumé — the same store `useOptimizedGuard` and
 * `useAICooldown` already use for marks that must outlive a remount. It is
 * per-device by nature: someone who declines on their laptop is asked once more
 * on their phone. Carrying it across devices means a column on Resume and a
 * migration, which is not a decision this panel gets to make on its own.
 *
 * Answers are additive and never expire on their own. Adding a fourth role from
 * the Content tab does not re-open the question — the person said no, and the
 * assistant is not the only door to the editor.
 */
export function declinedStorageKey(resumeId: string | null): string {
  return `ai_declined_${resumeId ?? "none"}`
}

/**
 * The stored answers for one résumé. Exported so the behaviour that matters —
 * an answer outliving a remount — is testable as a function, without a React
 * renderer the suite does not carry.
 */
export function readDeclined(resumeId: string | null): Set<string> {
  const key = declinedStorageKey(resumeId)
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? new Set(parsed.filter((v): v is string => typeof v === "string")) : new Set()
  } catch {
    // Unreadable or unavailable (private mode, quota, someone else's JSON):
    // asking the question again is a nuisance, throwing here would blank the
    // whole assistant.
    return new Set()
  }
}

/** Records one answer and hands back the new set. */
export function addDeclined(resumeId: string | null, id: string): Set<string> {
  const next = new Set(readDeclined(resumeId)).add(id)
  try { localStorage.setItem(declinedStorageKey(resumeId), JSON.stringify([...next])) } catch { /* nothing to do about it */ }
  return next
}

export function useDeclinedGaps(resumeId: string | null) {
  const [declined, setDeclined] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Browser-only, and read after mount so the server's HTML and the first
    // client render agree — the same hydration rule useOptimizedGuard follows.
    setDeclined(readDeclined(resumeId))
  }, [resumeId])

  /** Records one answer. `id` is the gap it belongs to: "moreExperience", or "moreBullets:<jobId>". */
  const decline = useCallback((id: string) => {
    setDeclined(addDeclined(resumeId, id))
  }, [resumeId])

  const hasDeclined = useCallback((id: string) => declined.has(id), [declined])

  return { decline, hasDeclined }
}
