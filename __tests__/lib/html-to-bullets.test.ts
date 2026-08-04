import { describe, it, expect } from "vitest"
import { htmlToBullets } from "@/components/resume/templates/ats/useAtsData"

describe("htmlToBullets — the double-bullet fix", () => {
  it("strips a leading '• ' glyph so the template's own marker isn't doubled", () => {
    // The bug: content stored "• text" AND the template drew a dash → "— • text".
    expect(htmlToBullets("• Optimized data sync\n• Reduced crash rates")).toEqual([
      "Optimized data sync",
      "Reduced crash rates",
    ])
  })

  it("strips other leading glyphs too (dash, dot, star)", () => {
    expect(htmlToBullets("- Built the API\n· Shipped it\n* Mentored")).toEqual([
      "Built the API",
      "Shipped it",
      "Mentored",
    ])
  })

  it("parses <li> HTML and strips the glyph inside", () => {
    expect(htmlToBullets("<ul><li>• Did a thing</li><li>Did another</li></ul>")).toEqual([
      "Did a thing",
      "Did another",
    ])
  })

  it("leaves bullet-free prose intact", () => {
    expect(htmlToBullets("Led the migration")).toEqual(["Led the migration"])
  })

  it("returns empty for empty/nullish input", () => {
    expect(htmlToBullets("")).toEqual([])
    expect(htmlToBullets(null)).toEqual([])
    expect(htmlToBullets(undefined)).toEqual([])
  })
})
