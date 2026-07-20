import { describe, it, expect } from "vitest"
import { foldAccentsLower } from "@/lib/text/normalize"

// The exact original implementations this util replaces — kept here to PROVE the
// shared function reproduces their behavior byte-for-byte, so no caller changes.
const oldAnalyzerNormalize = (text: string) =>
  text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()
const oldLanguagesNormalizeToken = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

const SAMPLES = [
  "Café", "MÜNCHEN", "Español", "Français", "Ñandú", "naïve",
  "React.js", "C++", "AWS", "  Mixed CASE  ", "", "Português",
  "Über", "señor", "façade", "Zürich", "élan", "coöperate",
  "JavaScript", "Node.js 18", "5 años", "Ingeniero de Software",
]

describe("foldAccentsLower", () => {
  it("reproduces analyzer.normalize exactly (NFKD)", () => {
    for (const s of SAMPLES) {
      expect(foldAccentsLower(s, "NFKD")).toBe(oldAnalyzerNormalize(s))
    }
  })

  it("reproduces languages.normalizeToken exactly (NFD, default)", () => {
    for (const s of SAMPLES) {
      expect(foldAccentsLower(s)).toBe(oldLanguagesNormalizeToken(s))
    }
  })

  it("folds accents and lowercases", () => {
    expect(foldAccentsLower("Café")).toBe("cafe")
    expect(foldAccentsLower("MÜNCHEN")).toBe("munchen")
    expect(foldAccentsLower("Español")).toBe("espanol")
  })
})
