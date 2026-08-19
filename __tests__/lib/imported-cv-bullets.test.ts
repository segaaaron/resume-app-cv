import { describe, it, expect } from "vitest"
import { normalizeDescription } from "@/lib/utils"
import { parseBullets } from "@/lib/services/ai/shared/bullets"
import { joinBullets } from "@/components/resume/sections/BulletFields"
import { BULLETS_PER_ROLE_MAX } from "@/lib/ats/scoring-config"

/**
 * An uploaded CV lands in the bullet boxes, not in one wall of text.
 *
 * The editor no longer edits `description` directly — it edits one box per
 * bullet, parsed out of that string. The import path writes the same string
 * through `normalizeDescription` (AIImportModule's `bulletDesc`), so these two
 * halves have to agree or a freshly imported role opens either empty or as a
 * single unreadable block. Nothing here mocks the split: it runs the real
 * writer and the real reader against the shapes a parsed CV actually produces.
 */
describe("an imported CV opens as bullets", () => {
  it("gives each achievement its own box, with no marker left in the text", () => {
    const parsed = normalizeDescription(
      "- Reviewed client credit files\n- Cut the approval cycle from 10 days to 4\n- Trained two new analysts"
    )
    const boxes = parseBullets(parsed)
    expect(boxes).toEqual([
      "Reviewed client credit files",
      "Cut the approval cycle from 10 days to 4",
      "Trained two new analysts",
    ])
    // The marker is the editor's job to add back, never the user's to type.
    expect(boxes.join("")).not.toContain("•")
  })

  it("reads the markers a real CV comes with, whichever glyph it used", () => {
    for (const glyph of ["•", "●", "▪", "*", "-", "→"]) {
      const parsed = normalizeDescription(`${glyph} Ran the till\n${glyph} Balanced it at closing`)
      expect(parseBullets(parsed)).toEqual(["Ran the till", "Balanced it at closing"])
    }
  })

  it("keeps a narrative paragraph whole instead of inventing bullets", () => {
    // The import prompt protects prose on purpose. Chopping someone's paragraph
    // into three boxes would be the editor claiming a structure the CV never
    // had — so it arrives as one box, and they split it if they want to.
    const prose =
      "Led the retail branch for six years, covering hiring, the monthly close and the relationship with head office."
    expect(parseBullets(normalizeDescription(prose))).toEqual([prose])
  })

  it("round-trips: what the boxes write back is what they read", () => {
    const parsed = normalizeDescription("- Reviewed files\n- Trained analysts")
    const written = joinBullets(parseBullets(parsed))
    expect(parseBullets(written)).toEqual(parseBullets(parsed))
    expect(written).toBe("• Reviewed files\n• Trained analysts")
  })

  it("shows every bullet of a role that came in over the cap", () => {
    // The cap stops the user ADDING a seventh, it never deletes the ninth a CV
    // arrived with — losing a line of someone's history to enforce a guideline
    // is not a trade this product makes.
    const nine = Array.from({ length: 9 }, (_, i) => `- Achievement ${i + 1}`).join("\n")
    const boxes = parseBullets(normalizeDescription(nine))
    expect(boxes.length).toBe(9)
    expect(boxes.length).toBeGreaterThan(BULLETS_PER_ROLE_MAX.value)
  })

  it("drops the empty box instead of writing a bare marker", () => {
    // Pressing "add bullet" and saving without typing must not leave "• " in
    // the CV — it renders as a bullet with nothing after it in the PDF.
    expect(joinBullets(["Reviewed files", "   ", ""])).toBe("• Reviewed files")
  })
})
