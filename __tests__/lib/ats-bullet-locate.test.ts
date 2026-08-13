import { describe, it, expect } from "vitest"
import { resolveBulletIndex } from "@/lib/ats/bullet-locate"
import { parseBullets } from "@/lib/services/ai/shared/bullets"

describe("resolveBulletIndex", () => {
  const bullets = [
    "Resolved critical bugs to improve app stability, reducing crash rates by 20%.",
    "Collaborated within a VIPER and MVVM environment, improving delivery by 25%.",
    "Implemented reactive programming patterns using RXSwift.",
  ]

  it("uses the index when it still points at the line", () => {
    expect(resolveBulletIndex(bullets, 1, bullets[1])).toBe(1)
  })

  it("finds the line when the index drifted", () => {
    // A line was inserted above: the snapshot index now points one line short.
    const moved = ["New first line.", ...bullets]
    expect(resolveBulletIndex(moved, 1, bullets[1])).toBe(2)
  })

  it("ignores spacing and case — they are not part of a bullet's identity", () => {
    expect(resolveBulletIndex(bullets, 0, `  ${bullets[0].toUpperCase()}  `)).toBe(0)
  })

  it("refuses when the line is gone", () => {
    expect(resolveBulletIndex(bullets, 0, "A line this CV never had.")).toBe(-1)
  })

  /**
   * Two identical lines are NOT an ambiguity: they say the same thing, so acting
   * on either leaves the same résumé. Refusing bought no safety and cost the user
   * their action.
   */
  it("picks the closest twin instead of refusing", () => {
    const twins = [bullets[0], "Something else.", bullets[0]]
    expect(resolveBulletIndex(twins, 2, bullets[0])).toBe(2)
    expect(resolveBulletIndex(twins, 0, bullets[0])).toBe(0)
    // Index off the end: the nearest copy wins, and the action goes through.
    expect(resolveBulletIndex(twins, 5, bullets[0])).toBe(2)
  })

  it("refuses empty text rather than matching the first blank", () => {
    expect(resolveBulletIndex(bullets, 0, "   ")).toBe(-1)
  })

  /**
   * THE BUG THIS SHIPPED FOR. Tailor's snapshot of the current bullet used a raw
   * line split, which keeps the stored "• " marker, while every write path parses
   * the description with parseBullets (marker stripped). The guard compared the
   * two and rejected Remove, Rewrite and the user's own edit.
   */
  it("the marker is not part of the identity — a raw line still resolves", () => {
    const stored = bullets.map((b) => `• ${b}`).join("\n")
    const parsed = parseBullets(stored)
    const rawLine = stored.split("\n")[1]
    expect(parsed[1]).not.toBe(rawLine)
    // parseBullets on both sides is the fix; the locator must not silently
    // "rescue" a marker mismatch, because a marker in the CV text is real content
    // we would then write twice.
    expect(resolveBulletIndex(parsed, 1, parseBullets(rawLine)[0])).toBe(1)
  })
})
