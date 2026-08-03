import { describe, it, expect } from "vitest"
import { normalizeDescription, toBulletLines, fmtDesc } from "@/lib/utils"

describe("normalizeDescription — recognises markers, preserves prose", () => {
  it("empty / whitespace → ''", () => {
    expect(normalizeDescription("")).toBe("")
    expect(normalizeDescription("   \n  ")).toBe("")
  })

  it.each([
    ["•", "• Built X\n• Led Y"],
    ["-", "- Built X\n- Led Y"],
    ["*", "* Built X\n* Led Y"],
    ["●", "● Built X\n● Led Y"],
    ["▪", "▪ Built X\n▪ Led Y"],
    ["→", "→ Built X\n→ Led Y"],
    ["1.", "1. Built X\n2. Led Y"],
    ["a)", "a) Built X\nb) Led Y"],
  ])("normalises %s markers to '• '", (_m, input) => {
    expect(normalizeDescription(input)).toBe("• Built X\n• Led Y")
  })

  it("marker-less SHORT achievement lines → bullets (PDF stripped the markers)", () => {
    expect(normalizeDescription("Built the payments service\nLed a team of 5\nCut latency 30%")).toBe(
      "• Built the payments service\n• Led a team of 5\n• Cut latency 30%",
    )
  })

  it("a genuine NARRATIVE PARAGRAPH is left untouched — never shredded into bullets", () => {
    const prose =
      "Led the mobile team while owning the iOS roadmap and mentoring four engineers, because the product needed a stronger foundation and faster delivery across releases."
    expect(normalizeDescription(prose)).toBe(prose)
  })

  it("intro paragraph + bullets → intro stays prose, achievements become bullets", () => {
    const input = "Led the mobile team and owned the iOS roadmap.\n• Shipped 12 releases\n• Cut crash rate 40%"
    expect(normalizeDescription(input)).toBe(
      "Led the mobile team and owned the iOS roadmap.\n• Shipped 12 releases\n• Cut crash rate 40%",
    )
  })

  it("inline 'a • b • c' → separate bullets", () => {
    expect(normalizeDescription("Shipped iOS app • Mentored juniors • Reduced crashes")).toBe(
      "• Shipped iOS app\n• Mentored juniors\n• Reduced crashes",
    )
  })
})

describe("toBulletLines — only the marker-free achievement lines", () => {
  it("bullets → array", () => {
    expect(toBulletLines("• Built X\n• Led Y")).toEqual(["Built X", "Led Y"])
  })
  it("pure prose → [] (no bullets to extract)", () => {
    expect(toBulletLines("A flowing narrative paragraph describing the whole role and its impact overall.")).toEqual([])
  })
})

describe("fmtDesc — renders intent, not fake bullets", () => {
  it.each(["- one\n- two", "● one\n● two", "1. one\n2. two", "→ one\n→ two"])("%s → <ul>", (input) => {
    const html = fmtDesc(input)
    expect(html).toContain("<ul")
    expect(html).toContain("<li")
  })

  it("a narrative paragraph stays plain (no <ul>)", () => {
    expect(fmtDesc("One flowing sentence about the role")).not.toContain("<ul")
  })

  it("intro + bullets → <p> intro then <ul>", () => {
    const html = fmtDesc("Led the team.\n• Shipped 12 releases\n• Cut crashes 40%")
    expect(html).toContain("<p")
    expect(html).toContain("Led the team.")
    expect(html).toContain("<ul")
    expect(html).toContain("Shipped 12 releases")
    // the intro must NOT become a bullet
    expect(html.indexOf("<p")).toBeLessThan(html.indexOf("<ul"))
  })
})
