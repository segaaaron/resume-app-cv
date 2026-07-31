import { describe, it, expect } from "vitest"
import { contentHash } from "@/components/editor/hooks/useOptimizedGuard"

// The "already optimized" mark is a content hash. These properties are what make
// the guard correct: the same content stays locked, any real edit unlocks it,
// and cosmetic surrounding whitespace does not count as an edit.
describe("contentHash — the anchor behind the optimized guard", () => {
  it("is stable for identical content", () => {
    expect(contentHash("• Built the payments API.")).toBe(contentHash("• Built the payments API."))
  })

  it("changes when the content changes (unlocks the button after a real edit)", () => {
    expect(contentHash("• Built the payments API.")).not.toBe(contentHash("• Built the payments and billing API."))
  })

  it("ignores surrounding whitespace (not a real edit)", () => {
    expect(contentHash("  • Built the API.  ")).toBe(contentHash("• Built the API."))
  })

  it("distinguishes near-identical content (one word)", () => {
    expect(contentHash("Led the team")).not.toBe(contentHash("Led the teams"))
  })

  it("returns a stable non-empty string for empty input", () => {
    expect(contentHash("")).toBe(contentHash("   "))
    expect(typeof contentHash("")).toBe("string")
  })
})
