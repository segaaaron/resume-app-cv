import { describe, it, expect, beforeEach, vi } from "vitest"
import { contentHash, markContentOptimized } from "@/components/editor/hooks/useOptimizedGuard"

// jsdom is not configured for this file; a minimal store is enough and keeps the
// test about the RULE, not about the browser.
const store = new Map<string, string>()
beforeEach(() => {
  store.clear()
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
})

/**
 * The loop this prevents: improve a bullet → apply it → the content changed →
 * the content-anchored mark self-invalidates → after the cooldown the button
 * offers to improve the AI's own output → forever. A model always returns
 * another variant, so nothing stops it except refusing to ask again.
 */
describe("optimized guard — AI output is already optimized", () => {
  it("marks the text the AI produced, so re-running is refused", () => {
    const applied = "• Led the migration to SwiftUI, cutting crash rate 30%."
    markContentOptimized("opt_bullet_w1", applied)
    expect(store.get("opt_bullet_w1")).toBe(contentHash(applied))
  })

  it("a HUMAN edit reopens it — the mark is a content hash, not a lock", () => {
    const applied = "• Led the migration to SwiftUI."
    markContentOptimized("opt_bullet_w1", applied)
    const edited = applied + " Shipped to 50k users."
    expect(store.get("opt_bullet_w1")).not.toBe(contentHash(edited))
  })

  it("is per job, so improving one role does not silence another", () => {
    markContentOptimized("opt_bullet_w1", "• A")
    markContentOptimized("opt_bullet_w2", "• B")
    expect(store.get("opt_bullet_w1")).not.toBe(store.get("opt_bullet_w2"))
  })

  it("ignores surrounding whitespace — the same text is the same text", () => {
    expect(contentHash("  • Led the migration.  ")).toBe(contentHash("• Led the migration."))
  })

  it("survives a storage failure instead of breaking the editor", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => { throw new Error("denied") },
      setItem: () => { throw new Error("denied") },
      removeItem: () => { throw new Error("denied") },
    })
    expect(() => markContentOptimized("opt_bullet_w1", "• A")).not.toThrow()
  })
})
