import { describe, it, expect } from "vitest"
import { assessSummary, profileStatesMetrics } from "@/lib/services/ai/shared/summary-quality"

const STRONG =
  "Senior iOS engineer who rebuilt Xiobit's billing service on a modular architecture, cutting deploy time from 40 minutes to under 6. Leads the mobile team's code review practice and ships in Swift, SwiftUI and Combine."

const STRONG_NO_METRIC =
  "Senior iOS engineer who rebuilt Xiobit's billing service on a modular architecture and leads the mobile team's code review practice, shipping consumer apps in Swift, SwiftUI and Combine."

describe("assessSummary", () => {
  it("passes a strong summary when the profile has metrics", () => {
    expect(assessSummary(STRONG, true)).toEqual({ alreadyGood: true, issues: [] })
  })

  // The whole point: a summary is not faulty for lacking a figure the candidate
  // never gave. Demanding one is what pushed the model into inventing it.
  it("does not demand a metric the profile never states", () => {
    expect(assessSummary(STRONG_NO_METRIC, false).alreadyGood).toBe(true)
  })

  it("flags a missing metric only when the profile has one to quote", () => {
    expect(assessSummary(STRONG_NO_METRIC, true).issues).toContain("missing_metric")
  })

  it("flags first-person pronouns", () => {
    const s = "I am a senior iOS engineer who rebuilt the billing service on a modular architecture and led the mobile team through the migration to Swift."
    expect(assessSummary(s, false).issues).toContain("pronouns")
  })

  it("flags clichés in both languages", () => {
    const en = "Passionate about mobile development and a proven team player who delivers quality software for consumer applications every single release cycle."
    const es = "Responsable de aplicaciones móviles, apasionado por la tecnología y orientado a resultados en cada entrega del equipo de producto móvil."
    expect(assessSummary(en, false).issues).toContain("cliche")
    expect(assessSummary(es, false).issues).toContain("cliche")
  })

  it("flags a weak opener", () => {
    const s = "the candidate has worked on several mobile applications over the years and contributed to various teams across the organisation and its partners."
    expect(assessSummary(s, false).issues).toContain("weak_opener")
  })

  it("flags a stub", () => {
    expect(assessSummary("iOS developer.", false).issues).toContain("too_short")
  })

  it("accepts a role-title opener as strong", () => {
    expect(assessSummary(STRONG_NO_METRIC, false).issues).not.toContain("weak_opener")
  })

  it("accepts an impact-verb opener", () => {
    const s = "Rebuilt the billing service on a modular architecture and mentored the mobile team through the migration, establishing the code review practice they use today."
    expect(assessSummary(s, false).issues).not.toContain("weak_opener")
  })

  it("reports every issue at once", () => {
    const s = "I am responsible for mobile apps and passionate about clean code across the team and its many product surfaces every day."
    const { alreadyGood, issues } = assessSummary(s, false)
    expect(alreadyGood).toBe(false)
    expect(issues).toContain("pronouns")
    expect(issues).toContain("cliche")
  })

  it("treats empty input as not good", () => {
    expect(assessSummary("", false).alreadyGood).toBe(false)
  })
})

describe("profileStatesMetrics", () => {
  const job = (description: string) => ({ workExperience: [{ description }] })

  it("finds a metric in the work experience", () => {
    expect(profileStatesMetrics(job("• Cut crash rate 20% by refactoring the sync layer"))).toBe(true)
    expect(profileStatesMetrics(job("• Mentored 5 engineers through the migration"))).toBe(true)
  })

  it("returns false when the CV states no figures", () => {
    expect(profileStatesMetrics(job("• Rebuilt the billing service on a modular architecture"))).toBe(false)
  })

  it("handles missing data", () => {
    expect(profileStatesMetrics(undefined)).toBe(false)
    expect(profileStatesMetrics({})).toBe(false)
  })
})
