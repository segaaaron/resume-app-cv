import { describe, it, expect } from "vitest"
import {
  parseBullets,
  serializeBullets,
  renderBulletsForPrompt,
  formatBullet,
  BULLET_MARKER,
} from "@/lib/services/ai/shared/bullets"

describe("formatBullet", () => {
  it("adds the marker", () => {
    expect(formatBullet("A")).toBe(`${BULLET_MARKER} A`)
  })

  it("does not double an existing marker", () => {
    expect(formatBullet("• A")).toBe(`${BULLET_MARKER} A`)
    expect(formatBullet("- A")).toBe(`${BULLET_MARKER} A`)
  })

  it("returns empty string for empty input", () => {
    expect(formatBullet("")).toBe("")
    expect(formatBullet("   ")).toBe("")
  })

  it("agrees with serializeBullets for a single bullet", () => {
    expect(formatBullet("A")).toBe(serializeBullets(["A"]))
  })
})

describe("parseBullets", () => {
  it("returns [] for empty input", () => {
    expect(parseBullets("")).toEqual([])
    expect(parseBullets("   \n  \n ")).toEqual([])
  })

  it("splits on newlines and strips markers", () => {
    expect(parseBullets("• Built A\n• Shipped B")).toEqual(["Built A", "Shipped B"])
  })

  it("accepts -, * and · as markers", () => {
    expect(parseBullets("- Built A\n* Shipped B\n· Fixed C")).toEqual(["Built A", "Shipped B", "Fixed C"])
  })

  it("keeps unmarked lines as-is", () => {
    expect(parseBullets("Built A\nShipped B")).toEqual(["Built A", "Shipped B"])
  })

  it("drops blank lines without shifting the rest", () => {
    expect(parseBullets("• A\n\n• B\n   \n• C")).toEqual(["A", "B", "C"])
  })

  it("does not treat a hyphen inside text as a marker", () => {
    expect(parseBullets("• Built a full-stack app")).toEqual(["Built a full-stack app"])
  })

  // A marker-looking char with no space after it is content, not a marker.
  // Stripping it corrupts the user's data silently.
  it("keeps a leading minus sign on a metric — '-5%' must not become '5%'", () => {
    expect(parseBullets("-5% churn reduction achieved")).toEqual(["-5% churn reduction achieved"])
    expect(parseBullets("• -5% churn")).toEqual(["-5% churn"])
  })

  it("keeps leading emphasis markup", () => {
    expect(parseBullets("*Important* refactor")).toEqual(["*Important* refactor"])
  })

  it("still strips markers that have a space after them", () => {
    expect(parseBullets("- Built A\n* Shipped B")).toEqual(["Built A", "Shipped B"])
  })

  it("strips • and · with or without a following space", () => {
    expect(parseBullets("•Built A\n·Shipped B")).toEqual(["Built A", "Shipped B"])
  })

  it("preserves bracket content — the model references bullets by index, not text", () => {
    expect(parseBullets("• Grew revenue by [X%]")).toEqual(["Grew revenue by [X%]"])
  })
})

describe("serializeBullets", () => {
  it("marks every line", () => {
    expect(serializeBullets(["A", "B"])).toBe(`${BULLET_MARKER} A\n${BULLET_MARKER} B`)
  })

  it("does not double-mark already-marked input", () => {
    expect(serializeBullets(["• A"])).toBe(`${BULLET_MARKER} A`)
  })

  it("drops empty entries", () => {
    expect(serializeBullets(["A", "", "   ", "B"])).toBe(`${BULLET_MARKER} A\n${BULLET_MARKER} B`)
  })

  it("returns empty string for no bullets", () => {
    expect(serializeBullets([])).toBe("")
  })
})

describe("round-trip", () => {
  // The invariant that stops descriptions from being flattened: N bullets in,
  // N bullets out, same order, regardless of which marker style came in.
  it("preserves count and order", () => {
    const original = "• A\n• B\n• C\n• D\n• E\n• F\n• G\n• H"
    const bullets = parseBullets(original)
    expect(bullets).toHaveLength(8)
    expect(serializeBullets(bullets)).toBe(original)
  })

  it("normalizes mixed markers to a single style", () => {
    expect(serializeBullets(parseBullets("- A\n* B\nC"))).toBe(
      `${BULLET_MARKER} A\n${BULLET_MARKER} B\n${BULLET_MARKER} C`,
    )
  })

  it("is idempotent", () => {
    const once = serializeBullets(parseBullets("- A\nB"))
    expect(serializeBullets(parseBullets(once))).toBe(once)
  })
})

describe("renderBulletsForPrompt", () => {
  it("renders 0-based indexed lines", () => {
    expect(renderBulletsForPrompt(["A", "B"])).toBe("  [0] A\n  [1] B")
  })

  it("honors a custom indent", () => {
    expect(renderBulletsForPrompt(["A"], { indent: "    " })).toBe("    [0] A")
  })

  it("returns the empty label when there are no bullets", () => {
    expect(renderBulletsForPrompt([], { emptyLabel: "  (no bullets)" })).toBe("  (no bullets)")
    expect(renderBulletsForPrompt([])).toBe("")
  })

  it("elides bullets past maxLength", () => {
    expect(renderBulletsForPrompt(["abcdefghij"], { maxLength: 4 })).toBe("  [0] abcd…")
  })

  it("leaves bullets shorter than maxLength untouched", () => {
    expect(renderBulletsForPrompt(["abc"], { maxLength: 10 })).toBe("  [0] abc")
  })

  it("drops whole bullets past maxTotalLength and says so", () => {
    const out = renderBulletsForPrompt(["aaaa", "bbbb", "cccc"], { maxTotalLength: 20 })
    expect(out).toContain("[0] aaaa")
    expect(out).toContain("more not shown")
    expect(out).not.toContain("[2] cccc")
  })

  it("always renders at least one bullet, even over budget", () => {
    const out = renderBulletsForPrompt(["a".repeat(500), "b"], { maxTotalLength: 10 })
    expect(out).toContain("[0]")
  })

  // A prose description parses to exactly ONE bullet. If that single bullet is
  // allowed through whole, maxTotalLength stops being a cap and the caller's
  // context limit blows up (AI_INPUT_LIMITS.resumeContext → 400 for the user).
  it("elides a single over-budget bullet instead of exceeding the cap", () => {
    const out = renderBulletsForPrompt(["a".repeat(5000)], { indent: "    ", maxTotalLength: 500 })
    expect(out.length).toBeLessThanOrEqual(500)
    expect(out).toContain("[0]")
    expect(out.endsWith("…")).toBe(true)
  })

  it("keeps the cap across many bullets", () => {
    const out = renderBulletsForPrompt(Array.from({ length: 50 }, () => "x".repeat(80)), {
      indent: "    ",
      maxTotalLength: 500,
    })
    expect(out.length).toBeLessThanOrEqual(500 + 40) // + the "more not shown" notice
    expect(out).toContain("more not shown")
  })

  it("keeps indices aligned with parseBullets after blank lines are dropped", () => {
    // Guards the write-back path: index N in the prompt must be index N in the
    // array the client splices into.
    const bullets = parseBullets("• A\n\n• B")
    expect(renderBulletsForPrompt(bullets)).toBe("  [0] A\n  [1] B")
    expect(bullets[1]).toBe("B")
  })
})
