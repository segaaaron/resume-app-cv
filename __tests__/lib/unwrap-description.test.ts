import { describe, it, expect } from "vitest"
import { normalizeDescription, toBulletLines, fmtDesc } from "@/lib/utils"
import { findOrphanFragments } from "@/lib/ats/resume-integrity"

/**
 * Reported from a real import: one role rendered as a paragraph while the role
 * above it rendered as bullets, from the same document.
 *
 * The cause is not the heuristic, it is the ORDER. Text extracted from a PDF
 * carries the visual line breaks, so one achievement arrives as three lines. The
 * format was being decided before those breaks were repaired, and a single wrapped
 * line ending on a connector ("…software solutions and") failed the achievement
 * test and dragged the whole role into prose.
 */
const WRAPPED = [
  "Developed hybrid mobile applications using Ionic, React Native, and Flutter frameworks, enhancing cross-platform compatibility and improving",
  "user experience by 10%.",
  "Created web applications with Angular and TypeScript, integrating RESTful APIs to facilitate",
  "seamless data communication and increase",
  "efficiency by 15%",
  "Implemented Agile methodologies to coordinate with cross-functional teams, ensuring timely delivery of high-quality software solutions and",
  "reducing project timelines by 50%.",
].join("\n")

describe("a PDF's layout breaks are not the author's line breaks", () => {
  it("recovers the three achievements instead of leaving a paragraph", () => {
    const bullets = toBulletLines(WRAPPED)
    expect(bullets).toHaveLength(3)
    expect(bullets[0]).toContain("Ionic, React Native, and Flutter")
    expect(bullets[0]).toContain("user experience by 10%")
    expect(bullets[2]).toContain("reducing project timelines by 50%")
  })

  it("works the same in Spanish", () => {
    const es = [
      "Coordinó la instalación eléctrica de 15 viviendas según planos y",
      "supervisó a dos cuadrillas durante la obra.",
      "Realizó el control de calidad de las piezas antes del despacho.",
    ].join("\n")
    expect(toBulletLines(es)).toHaveLength(2)
  })
})

/**
 * The expensive direction. A narrative description is a legitimate format and must
 * never be shredded into fake bullets.
 */
describe("prose stays prose", () => {
  it("leaves a single paragraph untouched", () => {
    const prose = "I led the payments migration for a team of eight, from the first spike to the final rollout across three markets."
    expect(normalizeDescription(prose)).toBe(prose)
    expect(toBulletLines(prose)).toHaveLength(0)
  })

  it("does not join sentences that are each complete", () => {
    const p = "Led the payments migration.\nGrew the team from three to eight.\nShipped in June."
    const out = normalizeDescription(p).split("\n")
    expect(out).toHaveLength(3)
  })

  it("keeps an explicit marker list exactly as marked", () => {
    const marked = "• Built the checkout screen\n• Wrote the unit tests"
    expect(toBulletLines(marked)).toEqual(["Built the checkout screen", "Wrote the unit tests"])
  })

  it("still folds a wrapped continuation inside a marked list", () => {
    const marked = "• Built the checkout screen in SwiftUI and\nimproved its loading behaviour"
    expect(toBulletLines(marked)).toEqual(["Built the checkout screen in SwiftUI and improved its loading behaviour"])
  })

  it("keeps an intro paragraph above a marked list", () => {
    const mixed = "Led the mobile team.\n• Built the checkout screen\n• Wrote the unit tests"
    expect(normalizeDescription(mixed).split("\n")[0]).toBe("Led the mobile team.")
  })

  it("survives empty input", () => {
    expect(normalizeDescription("")).toBe("")
    expect(toBulletLines("   ")).toEqual([])
  })
})

/**
 * The second symptom of the same cause, photographed from the panel: the source
 * DID have markers, and the extractor gave one to a wrapped fragment too — so the
 * résumé rendered a bullet reading "5%." underneath the bullet it belongs to.
 */
describe("a marker on a wrapped fragment is the extractor's, not the author's", () => {
  it.each([
    [
      "a percentage split off its sentence",
      "• Developed new features and performed bug fixes for a Latin American delivery company, enhancing app functionality and user satisfaction by\n• 5%.",
      "user satisfaction by 5%.",
    ],
    [
      "an object split off its verb",
      "• Integrated advanced debugging and performance monitoring tools to optimize app responsiveness and stability, leading to a 10% decrease in\n• crash reports.",
      "10% decrease in crash reports.",
    ],
    [
      "a noun split off its modifier",
      "• Collaborated effectively within a VIPER and MVVM architectural pattern environment, enhancing team productivity and project delivery\n• timelines by 25%.",
      "project delivery timelines by 25%.",
    ],
  ])("rejoins %s", (_n, input, expectedTail) => {
    const bullets = toBulletLines(input)
    expect(bullets).toHaveLength(1)
    expect(bullets[0]).toContain(expectedTail)
  })

  it("keeps genuinely separate marked achievements apart", () => {
    const input = "• Wrote comprehensive unit tests to ensure code reliability.\n• Collaborated in code reviews to foster knowledge sharing."
    expect(toBulletLines(input)).toHaveLength(2)
  })

  // Case alone would weld this onto the bullet above it.
  it("does not swallow a bullet that legitimately starts lowercase", () => {
    const input = "• Migrated the payments module to SwiftUI.\n• iOS releases moved from monthly to weekly."
    expect(toBulletLines(input)).toHaveLength(2)
  })

  it("still folds an UNMARKED wrapped continuation inside a marked list", () => {
    const input = "• Built the checkout screen in SwiftUI and\nimproved its loading behaviour"
    expect(toBulletLines(input)).toEqual(["Built the checkout screen in SwiftUI and improved its loading behaviour"])
  })
})

/**
 * The half the repair cannot reach: a CV imported BEFORE the fix has the split
 * bullets already stored, and preventing a defect does not heal the documents that
 * already carry it. The panel has to be able to SEE them.
 */
describe("findOrphanFragments — the tail already stored as its own bullet", () => {
  const role = (bullets: string[]) => [{ id: "j", jobTitle: "iOS Developer", bullets }]

  it.each([
    ["a percentage", "Developed new features for a Latin American delivery company, enhancing user satisfaction by", "5%."],
    ["an object", "Integrated advanced debugging tools to optimize responsiveness, leading to a 10% decrease in", "crash reports."],
    ["a modifier", "Collaborated within a VIPER and MVVM environment, enhancing team productivity and project delivery", "timelines by 25%."],
  ])("finds %s split off the line above", (_n, prev, tail) => {
    const out = findOrphanFragments(role([prev, tail]))
    expect(out).toHaveLength(1)
    expect(out[0].previousText).toBe(prev)
    expect(out[0].text).toBe(tail)
  })

  it("never flags a real achievement, however short", () => {
    expect(findOrphanFragments(role(["Shipped the payments rewrite.", "Trained two engineers."]))).toHaveLength(0)
  })

  it("does not flag a lowercase bullet when the line above finished its sentence", () => {
    expect(findOrphanFragments(role(["Migrated payments to SwiftUI.", "iOS releases moved to weekly."]))).toHaveLength(0)
  })

  it("does not flag a long line, which is an achievement and not a fragment", () => {
    const prev = "Collaborated within a VIPER environment and"
    const long = "improved the release process across three teams over two quarters, which is a whole achievement"
    expect(findOrphanFragments(role([prev, long]))).toHaveLength(0)
  })

  it("never treats the first bullet as a fragment", () => {
    expect(findOrphanFragments(role(["5%.", "Shipped the rewrite."]))).toHaveLength(0)
  })

  it("ignores a role with no id — there would be nowhere to write the fix", () => {
    expect(findOrphanFragments([{ id: "", jobTitle: "x", bullets: ["a and", "b."] }])).toHaveLength(0)
  })
})

/**
 * The panel counts bullets with toBulletLines and the CV renders them with
 * fmtDesc. When only the normalizer learned the continuation rule, the same stored
 * text answered the same question twice: one bullet in the panel, two in the
 * preview. Found by auditing, not by a report.
 */
describe("the panel and the preview agree on how many bullets there are", () => {
  const countLi = (html: string) => (html.match(/<li/g) ?? []).length

  it.each([
    ["a percentage split off by a page break", "• Developed new features, enhancing user satisfaction by\n• 5%."],
    ["an object split off its verb", "• Integrated monitoring tools, leading to a 10% decrease in\n• crash reports."],
    ["an unmarked wrapped line", "• Built the checkout screen in SwiftUI and\nimproved its loading behaviour"],
    ["two genuinely separate achievements", "• Wrote the unit tests.\n• Reviewed the release notes."],
    ["a bullet that legitimately starts lowercase", "• Migrated payments to SwiftUI.\n• iOS releases moved to weekly."],
  ])("%s", (_n, stored) => {
    expect(countLi(fmtDesc(stored))).toBe(toBulletLines(stored).length)
  })

  it("keeps the intro paragraph out of the bullet count on both sides", () => {
    const mixed = "Led the mobile team.\n• Built the checkout screen\n• Wrote the unit tests"
    expect(countLi(fmtDesc(mixed))).toBe(2)
    expect(toBulletLines(mixed)).toHaveLength(2)
  })
})
