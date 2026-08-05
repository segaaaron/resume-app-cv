import { describe, it, expect } from "vitest"
import { diffLines, isNoOpDiff } from "@/lib/services/ai/shared/line-diff"

const BULLETS = [
  "Developed and maintained iOS applications using Swift and SwiftUI",
  "Integrated RESTful APIs and third-party libraries",
  "Implemented TCA architecture and design patterns",
].join("\n")

describe("diffLines", () => {
  it("marks an appended bullet as the only change", () => {
    const after = `${BULLETS}\nMentored two junior engineers through code review`
    const diff = diffLines(BULLETS, after)
    expect(diff.filter((d) => d.op === "added")).toEqual([
      { op: "added", text: "Mentored two junior engineers through code review" },
    ])
    expect(diff.filter((d) => d.op === "removed")).toEqual([])
    expect(diff.filter((d) => d.op === "same")).toHaveLength(3)
  })

  it("shows a rewritten bullet as one removal and one addition, in place", () => {
    const after = BULLETS.replace(
      "Integrated RESTful APIs and third-party libraries",
      "Integrated RESTful APIs, cutting sync failures by 30%"
    )
    const diff = diffLines(BULLETS, after)
    expect(diff.filter((d) => d.op !== "same")).toEqual([
      { op: "removed", text: "Integrated RESTful APIs and third-party libraries" },
      { op: "added", text: "Integrated RESTful APIs, cutting sync failures by 30%" },
    ])
    // The two untouched bullets stay as context, so the user sees where it lands.
    expect(diff.filter((d) => d.op === "same")).toHaveLength(2)
  })

  it("reports a deletion", () => {
    const after = BULLETS.split("\n").slice(0, 2).join("\n")
    const diff = diffLines(BULLETS, after)
    expect(diff.filter((d) => d.op === "removed")).toEqual([
      { op: "removed", text: "Implemented TCA architecture and design patterns" },
    ])
  })

  it("treats identical text as no change at all", () => {
    const diff = diffLines(BULLETS, BULLETS)
    expect(isNoOpDiff(diff)).toBe(true)
    expect(diff).toHaveLength(3)
  })

  it("handles an empty starting value (first bullet ever)", () => {
    const diff = diffLines("", "Led the migration of the payments service")
    expect(diff).toEqual([{ op: "added", text: "Led the migration of the payments service" }])
  })

  it("ignores blank lines and surrounding whitespace", () => {
    const diff = diffLines("  Line one  \n\n\nLine two", "Line one\nLine two")
    expect(isNoOpDiff(diff)).toBe(true)
  })

  it("keeps every line accounted for — nothing silently dropped", () => {
    const before = "a\nb\nc\nd"
    const after = "a\nX\nc\nd\nE"
    const diff = diffLines(before, after)
    const kept = diff.filter((d) => d.op !== "added").map((d) => d.text)
    const produced = diff.filter((d) => d.op !== "removed").map((d) => d.text)
    expect(kept).toEqual(["a", "b", "c", "d"])
    expect(produced).toEqual(["a", "X", "c", "d", "E"])
  })
})
