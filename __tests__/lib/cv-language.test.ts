import { describe, it, expect } from "vitest"
import {
  detectCvLanguage,
  detectCvLanguageOrNull,
  collectCvProse,
  CV_LANG_MIN_CHARS,
} from "@/lib/resume/cv-language"

const EN_SUMMARY =
  "Software engineer with experience in the development of projects and the management of teams for the company."
const ES_SUMMARY =
  "Ingeniera de software con experiencia en el desarrollo de proyectos y la gestión de equipos para la empresa."

describe("collectCvProse", () => {
  it("takes prose from summary, work experience and projects", () => {
    const parts = collectCvProse({
      summary: "Summary text",
      workExperience: [{ jobTitle: "Backend Engineer", description: "Built the API" }],
      projects: [{ role: "Maintainer", description: "Open source tooling" }],
    })
    expect(parts).toEqual([
      "Summary text",
      "Backend Engineer",
      "Built the API",
      "Maintainer",
      "Open source tooling",
    ])
  })

  it("ignores missing, empty and non-string fields instead of throwing", () => {
    expect(collectCvProse(null)).toEqual([])
    expect(collectCvProse(undefined)).toEqual([])
    expect(collectCvProse({})).toEqual([])
    expect(
      collectCvProse({
        summary: 42,
        workExperience: "not-an-array",
        projects: [{ role: "   ", description: null }],
      })
    ).toEqual([])
  })
})

describe("detectCvLanguage", () => {
  it("follows the CV, not the app, for an English CV", () => {
    expect(detectCvLanguage({ summary: EN_SUMMARY }, "es")).toBe("en")
  })

  it("follows the CV, not the app, for a Spanish CV", () => {
    expect(detectCvLanguage({ summary: ES_SUMMARY }, "en")).toBe("es")
  })

  it("falls back to the app locale while the CV is too short to judge", () => {
    const shortCv = { summary: "Dev" }
    expect(detectCvLanguage(shortCv, "en")).toBe("en")
    expect(detectCvLanguage(shortCv, "es")).toBe("es")
  })

  it("falls back to the app locale on an empty CV (a brand-new resume)", () => {
    expect(detectCvLanguage({}, "en")).toBe("en")
    expect(detectCvLanguage(null, "en")).toBe("en")
  })

  it("reads bullets when there is no summary yet", () => {
    const cv = {
      workExperience: [
        {
          jobTitle: "Backend Engineer",
          description:
            "Led the migration of the payments service and reduced the response time for the team by 30%",
        },
      ],
    }
    expect(detectCvLanguage(cv, "es")).toBe("en")
  })

  it("needs at least CV_LANG_MIN_CHARS of prose before overriding the fallback", () => {
    const justUnder = "a".repeat(CV_LANG_MIN_CHARS - 1)
    expect(detectCvLanguage({ summary: justUnder }, "en")).toBe("en")
  })
})

describe("detectCvLanguageOrNull", () => {
  it("reports null instead of guessing when the CV is too short", () => {
    expect(detectCvLanguageOrNull({ summary: "Dev" })).toBeNull()
    expect(detectCvLanguageOrNull({})).toBeNull()
  })

  it("agrees with detectCvLanguage once there is enough prose", () => {
    expect(detectCvLanguageOrNull({ summary: EN_SUMMARY })).toBe("en")
    expect(detectCvLanguage({ summary: EN_SUMMARY }, "es")).toBe("en")
  })
})
