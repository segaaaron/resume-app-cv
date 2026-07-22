import { describe, it, expect } from "vitest"
import { computeResumeScore } from "@/lib/services/ai/shared/resume-score"

const dim = (r: ReturnType<typeof computeResumeScore>, key: string) =>
  r.dimensions.find((d) => d.key === key)!

describe("computeResumeScore — deterministic, JD-independent", () => {
  it("is deterministic: same input → same output", () => {
    const sd = { summary: "Engineer with experience building scalable systems for teams.", workExperience: [{ id: "w1", description: "• Cut latency by 40% across the API" }] }
    expect(computeResumeScore(sd)).toEqual(computeResumeScore(sd))
  })

  it("scores Impact from the share of quantified bullets", () => {
    const sd = {
      workExperience: [{ id: "w1", description: "• Increased sales by 32%\n• Led the payments team of 5 engineers" }],
    }
    const r = computeResumeScore(sd)
    // both bullets carry a figure → 100
    expect(dim(r, "impact").score).toBe(100)
  })

  it("penalizes weak openers on the Action Verbs dimension", () => {
    const sd = {
      workExperience: [{ id: "w1", description: "• Responsible for the deployment pipeline\n• Built the CI system from scratch" }],
    }
    const r = computeResumeScore(sd)
    // one of two bullets opens with a duty phrase → 50
    expect(dim(r, "actionVerbs").score).toBe(50)
  })

  it("scores Completeness by core sections present", () => {
    const full = {
      personalDetails: { firstName: "Ada", email: "ada@x.com" },
      summary: "Summary here.",
      workExperience: [{ id: "w1", description: "• Did work" }],
      education: [{ id: "e1", institution: "MIT" }],
      skills: [{ id: "s1", name: "React" }],
    }
    expect(dim(computeResumeScore(full), "completeness").score).toBe(100)
    // Missing education + skills → 3/5 = 60
    const partial = { personalDetails: { firstName: "Ada", email: "ada@x.com" }, summary: "S.", workExperience: [{ id: "w1", description: "• x" }] }
    expect(dim(computeResumeScore(partial), "completeness").score).toBe(60)
  })

  it("flags an overly long bullet on the Brevity dimension", () => {
    const longBullet = "• " + "word ".repeat(45) // 45 words > 32 cap
    const sd = { workExperience: [{ id: "w1", description: longBullet }] }
    const r = computeResumeScore(sd)
    expect(dim(r, "brevity").score).toBe(0)
    expect(dim(r, "brevity").detail.tooLong).toBe(1)
  })

  it("scores Recruiter Scan on the top-of-resume 6-second items", () => {
    // All 5 scan items present + strong → 100.
    const strong = {
      personalDetails: { firstName: "Ada", email: "a@x.com", jobTitle: "iOS Developer" },
      summary: "Senior iOS engineer with seven years of experience building scalable native apps for millions of users across fintech and healthcare products.",
      workExperience: [{ id: "w1", jobTitle: "iOS Developer", employer: "Acme", startDate: "2022", endDate: "2024", description: "• Shipped features" }],
      education: [{ id: "e1", institution: "MIT" }],
    }
    expect(dim(computeResumeScore(strong), "recruiterScan").score).toBe(100)

    // Missing current title + no summary + no education → only name (1/5) + recent job title present via job.
    const weak = {
      personalDetails: { firstName: "Ada", email: "a@x.com" }, // no jobTitle
      workExperience: [{ id: "w1", description: "• did stuff" }], // no title/employer/dates
    }
    const s = dim(computeResumeScore(weak), "recruiterScan").score as number
    expect(s).toBeLessThan(50) // fails most 6-second scan checks
  })

  it("returns null (not 0) for dimensions that do not apply, and still scores overall", () => {
    // No bullets → Impact and Action Verbs are N/A; overall rests on the rest.
    const sd = { personalDetails: { firstName: "Ada", email: "ada@x.com" }, summary: "A concise professional summary of about thirty words describing the engineer background and the value they bring to a modern product team overall." }
    const r = computeResumeScore(sd)
    expect(dim(r, "impact").score).toBeNull()
    expect(dim(r, "actionVerbs").score).toBeNull()
    expect(r.overall).toBeGreaterThan(0)
    expect(r.overall).toBeLessThanOrEqual(100)
  })
})
