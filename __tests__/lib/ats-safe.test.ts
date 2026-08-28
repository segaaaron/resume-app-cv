/**
 * ATS-safe rendering — the fix that turns a resume our own product can produce RED
 * into GREEN across all five engines, without touching the user's designed template.
 *
 * The proof that matters: feed a resume that trips every documented failure mode
 * (mixed dates, decorative bullets, non-standard labels) into toAtsSafeResumeText and
 * assert the output parses clean in all five simulated engines. Plus unit coverage of
 * the date normalizer, which is the subtle part.
 */
import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/db", () => ({ db: {} }))

import { toAtsSafeResumeText, normalizeDate } from "@/lib/ats-checker/ats-safe"
import { simulateAtsEngines } from "@/lib/ats-checker/engines"
import { computeResumeSignals, detectDateFormatFamilies } from "@/lib/ats/signals"
import type { ResumeSections } from "@/types/resume"

function makeData(over: Partial<ResumeSections> = {}): ResumeSections {
  return {
    personalDetails: {
      firstName: "Ana", lastName: "Rivas", jobTitle: "Sales Lead",
      email: "ana@example.com", phone: "+34 600 000 000",
      address: "", city: "Madrid", country: "ES", postalCode: "",
      website: "", linkedin: "linkedin.com/in/ana", github: "",
      socials: [], yearsOfExperience: "",
    },
    summary: "<p>Sales lead with Kubernetes and analytics experience.</p>",
    workExperience: [
      { id: "1", jobTitle: "Sales Lead", employer: "Acme", city: "Madrid", startDate: "January 2020", endDate: "03/2024", currentlyWorking: false, description: "→ Grew sales 30%\n✓ Ran analytics on Kubernetes" },
      { id: "2", jobTitle: "Rep", employer: "Nexa", city: "Boston", startDate: "'18", endDate: "2020", currentlyWorking: false, description: "• Built dashboards" },
    ],
    education: [{ id: "e1", degree: "BSc CS", fieldOfStudy: "", institution: "UMSS", city: "", startDate: "2012", endDate: "2016", currentlyStudying: false, description: "" }],
    skills: [{ id: "s1", name: "Sales", level: "expert" }, { id: "s2", name: "Kubernetes", level: "advanced" }],
    languages: [{ id: "l1", name: "English", level: "c1" }],
    certifications: [{ id: "c1", name: "AWS SA", issuer: "Amazon", date: "2022", url: "" }],
    projects: [], volunteer: [], references: [], hobbies: "", customSections: [],
    ...over,
  } as ResumeSections
}

describe("ATS-safe output parses clean in every engine", () => {
  it("a resume that trips every failure mode comes out green across all five", () => {
    const txt = toAtsSafeResumeText(makeData(), "en")

    // Every underlying signal is now off.
    const sig = computeResumeSignals(txt, "en")
    expect(sig.multiColumn).toBe(false)
    expect(sig.mixedDates).toBe(false)
    expect(sig.decorativeBullets).toBe(false)
    expect(sig.nonStandardHeadings).toHaveLength(0)
    expect(sig.contactInHeaderFooter).toBe(false)

    const sim = simulateAtsEngines(txt, "en")
    expect(sim.cleanCount).toBe(5)
    for (const e of sim.engines) expect(e.verdict, `${e.label}`).toBe("clean")
  })

  it("uses standard section labels, not whatever the user typed", () => {
    const txt = toAtsSafeResumeText(makeData(), "en")
    expect(txt).toContain("WORK EXPERIENCE")
    expect(txt).toContain("EDUCATION")
    expect(txt).toContain("SKILLS")
  })

  it("emits plain '-' bullets, never a decorative glyph", () => {
    const txt = toAtsSafeResumeText(makeData(), "en")
    expect(txt).toContain("- Grew sales 30%")
    expect(txt).not.toMatch(/[→✓•]/)
  })

  it("contact sits once in the body", () => {
    const txt = toAtsSafeResumeText(makeData(), "en")
    const emailCount = (txt.match(/ana@example\.com/g) ?? []).length
    expect(emailCount).toBe(1)
  })

  it("the Spanish version is clean too, with Spanish labels", () => {
    const txt = toAtsSafeResumeText(makeData(), "es")
    expect(txt).toContain("EXPERIENCIA LABORAL")
    expect(simulateAtsEngines(txt, "es").cleanCount).toBe(5)
  })

  it("tolerates a resume whose personalDetails key is absent (DB default '{}')", () => {
    // The ats-safe-export endpoint reads resume.personalDetails, which defaults to "{}"
    // in the DB — so the object can arrive with no personalDetails key at all. Must not
    // throw (it did: 'Cannot read properties of undefined (reading firstName)').
    // @ts-expect-error deliberately malformed to mimic the raw DB default shape
    expect(() => toAtsSafeResumeText({}, "en")).not.toThrow()
    // @ts-expect-error same
    expect(toAtsSafeResumeText({}, "en")).toBe("")
  })

  it("an empty resume produces no crash and no false red", () => {
    const empty = makeData({ workExperience: [], education: [], skills: [], summary: "", certifications: [], languages: [] })
    const txt = toAtsSafeResumeText(empty, "en")
    expect(() => simulateAtsEngines(txt, "en")).not.toThrow()
    expect(simulateAtsEngines(txt, "en").cleanCount).toBe(5)
  })
})

describe("normalizeDate — one consistent format from free text", () => {
  it("month names (en/es, long/short) → 'MMM YYYY'", () => {
    expect(normalizeDate("January 2020", "en")).toBe("Jan 2020")
    expect(normalizeDate("Jan 2020", "en")).toBe("Jan 2020")
    expect(normalizeDate("Enero 2020", "es")).toBe("Ene 2020")
    expect(normalizeDate("march 2022", "en")).toBe("Mar 2022")
  })

  it("numeric formats → the same 'MMM YYYY'", () => {
    expect(normalizeDate("03/2024", "en")).toBe("Mar 2024")
    expect(normalizeDate("2024-03", "en")).toBe("Mar 2024")
  })

  it("apostrophe year → full year", () => {
    expect(normalizeDate("'18", "en")).toBe("2018")
  })

  it("bare year stays a year", () => {
    expect(normalizeDate("2016", "en")).toBe("2016")
  })

  it("everything normalizes to ONE date-format family (the whole point)", () => {
    const mixed = ["January 2020", "03/2024", "2019-06", "'18", "2016"]
    const normalized = mixed.map((d) => normalizeDate(d, "en")).join(" ")
    // All month-name family now (or bare years) — never more than one dated family.
    const families = detectDateFormatFamilies(normalized)
    expect(families.filter((f: string) => f !== "month-name").length).toBe(0)
  })

  it("unparseable input is left untouched — never destroys data", () => {
    expect(normalizeDate("Summer term", "en")).toBe("Summer term")
    expect(normalizeDate("", "en")).toBe("")
  })
})

describe("no section is silently dropped from the ATS version", () => {
  it("keeps projects, volunteer, hobbies, references and custom sections", () => {
    const data = makeData({
      projects: [{ id: "p1", name: "Analytics Platform", role: "Lead", startDate: "2022", endDate: "2023", description: "• Built the pipeline", url: "" }],
      volunteer: [{ id: "v1", organization: "Red Cross", role: "Coordinator", startDate: "2021", endDate: "", description: "" }],
      references: [{ id: "r1", name: "Jane Doe", company: "Acme", phone: "", email: "jane@acme.com" }],
      hobbies: "Chess, running",
      customSections: [{ id: "cs1", title: "Publications", items: [{ id: "i1", title: "AI in HR", subtitle: "Journal", date: "2023", description: "" }] }],
    })
    const txt = toAtsSafeResumeText(data, "en")
    expect(txt).toContain("Analytics Platform")      // projects
    expect(txt).toContain("Red Cross")               // volunteer
    expect(txt).toContain("jane@acme.com")           // references
    expect(txt).toContain("Chess, running")          // hobbies
    expect(txt).toContain("Publications")            // custom heading kept in Title Case (ATS-safe)
    expect(txt).toContain("AI in HR")                // custom section item
    // And the whole thing still parses clean in every engine.
    expect(simulateAtsEngines(txt, "en").cleanCount).toBe(5)
  })

  it("a season/quarter qualifier collapses to the year (ATS-safe), never loses it", () => {
    expect(normalizeDate("Q1 2020", "en")).toBe("2020")
    expect(normalizeDate("Fall 2019", "en")).toBe("2019")
    // The year — the only field an ATS indexes — survives.
  })
})
