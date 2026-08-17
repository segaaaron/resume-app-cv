"use client"

import { useState, useCallback, useEffect } from "react"

/**
 * djb2 string hash — cheap, stable, content-anchored. Any edit to the content
 * changes the hash, which auto-invalidates the "already optimized" mark, so a
 * changed CV becomes improvable again with no explicit reset to remember.
 */
export function contentHash(s: string): string {
  let h = 5381
  const t = s.trim()
  for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0
  return String(h >>> 0)
}

function read(key: string): string {
  try { return localStorage.getItem(key) ?? "" } catch { return "" }
}
function write(key: string, v: string): void {
  try { if (v) localStorage.setItem(key, v); else localStorage.removeItem(key) } catch { /* noop */ }
}

/**
 * Mark content as AI-optimized from OUTSIDE React.
 *
 * The guard is per-surface, but the CV is not: a bullet can be rewritten from
 * the Content tab OR from the ATS report, and both write the same field. If only
 * the surface that owns the hook marks the result, the other one sees changed
 * content, self-invalidates, and offers to improve text the AI just produced.
 * Any writer of AI output calls this with the same key the surface uses.
 */
export function markContentOptimized(storageKey: string, content: string): void {
  write(storageKey, contentHash(content))
}

/**
 * Has this exact content already been through the AI?
 *
 * The read half of the mark, callable outside React so a panel can decide whether
 * to DRAW a button rather than discover on click that there was nothing to do.
 * The ATS report only ever wrote the mark; it never asked, which is how a bullet
 * the AI had just rewritten could be sent back for rewriting from the other tab.
 */
export function isContentOptimized(storageKey: string, content: string): boolean {
  return !!content.trim() && read(storageKey) === contentHash(content)
}

/**
 * "This exact content already went through the AI — don't spend another call on
 * it." One persistent, content-anchored guard shared by every AI-improve surface
 * (bullets, summary, cover letter, tailor, ATS).
 *
 * Why persistent: the per-surface guards were useState/useRef, so collapsing an
 * accordion, switching a tab that unmounts, or reloading the page reset them —
 * and the button re-enabled, letting the user re-run the AI on content that had
 * not changed. Every such press burns tokens for an answer already known. Backed
 * by localStorage (same pattern as useAICooldown), the mark survives all three.
 *
 * Why content-anchored: the mark is a hash of the content. It self-clears the
 * instant the content differs — no manual reset, no stale lock after a real edit.
 *
 * `storageKey` must be unique per surface+item, e.g. `opt_bullet_${jobId}`.
 */
export function useOptimizedGuard(storageKey: string) {
  const [mark, setMark] = useState<string>(() => read(storageKey))
  // Hydration guard: the server has no localStorage, so it renders "not up to
  // date". Until the client has mounted we report the same, so the first client
  // render matches the server HTML exactly (no mismatch). After mount the stored
  // mark takes effect. Strictly safer than reading straight through on init.
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // localStorage is browser-only. Reading it during render would make the server and
    // the first client render disagree about whether the content is already optimised.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    setMark(read(storageKey))
  }, [storageKey])

  /** Record that this content is now AI-optimized (applied result OR "nothing to improve"). */
  const markOptimized = useCallback((content: string) => {
    const h = contentHash(content)
    setMark(h)
    write(storageKey, h)
  }, [storageKey])

  /** Forget the mark — e.g. the surface wants the button live again explicitly. */
  const clear = useCallback(() => {
    setMark("")
    write(storageKey, "")
  }, [storageKey])

  /** True when `content` is exactly what was last optimized — re-running is waste.
   *  Always false before mount so SSR and first client render agree. */
  const isUpToDate = useCallback(
    (content: string) => mounted && mark !== "" && mark === contentHash(content),
    [mounted, mark],
  )

  return { markOptimized, clear, isUpToDate }
}
