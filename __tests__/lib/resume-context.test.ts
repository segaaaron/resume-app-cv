import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/db", () => ({ db: {} }))

import { buildResumeContext } from "@/lib/ai-client"
import { AI_INPUT_LIMITS } from "@/lib/services/ai/shared/ai-types"

const LONG_BULLET = (i: number) =>
  `• Delivered measurable impact on workstream ${i} by rebuilding the ingestion path and cutting processing time from 40 minutes to under 6 across three releases`

const job = (i: number, bullets: number) => ({
  id: `w${i}`,
  jobTitle: `Senior Engineer ${i}`,
  employer: `Company ${i}`,
  startDate: "2018",
  endDate: "2024",
  description: Array.from({ length: bullets }, (_, k) => LONG_BULLET(k)).join("\n"),
})

const bulletsShown = (ctx: string) => (ctx.match(/\[\d+\]/g) || []).length

describe("buildResumeContext — work experience", () => {
  it("emits the job id: review-cv is asked for a targetId and cannot invent one", () => {
    const ctx = buildResumeContext({ workExperience: [job(1, 2)] }, "en")
    expect(ctx).toContain("ID:w1")
  })

  // review-cv must return one line per original bullet or its suggestion is
  // dropped. At the old 500-char budget an ordinary 5-bullet job only ever
  // showed 4, so the model could not comply and the feature silently did
  // nothing for most real CVs.
  it("shows every bullet of a normal job", () => {
    const ctx = buildResumeContext({ workExperience: [job(1, 5)] }, "en")
    expect(bulletsShown(ctx)).toBe(5)
    expect(ctx).not.toContain("more not shown")
  })

  it("shows every bullet across several jobs", () => {
    const ctx = buildResumeContext({ workExperience: [job(1, 8), job(2, 8), job(3, 8)] }, "en")
    expect(bulletsShown(ctx)).toBe(24)
  })

  // A per-job budget is not a cap. Ten jobs at 1400 each would sail past
  // AI_INPUT_LIMITS.resumeContext and hand the user a 400 from validateAIInput.
  it("never exceeds the context limit, however long the CV", () => {
    const sectionData = {
      personalDetails: { firstName: "Ana", lastName: "Rivas", jobTitle: "Engineer", location: "Madrid" },
      summary: "x".repeat(400),
      workExperience: Array.from({ length: 10 }, (_, i) => job(i, 30)),
      education: Array.from({ length: 6 }, (_, i) => ({ degree: `Degree ${i}`, institution: `Uni ${i}` })),
      skills: Array.from({ length: 12 }, (_, i) => ({ name: `Skill${i}` })),
      certifications: Array.from({ length: 6 }, (_, i) => ({ name: `Cert ${i}` })),
      projects: Array.from({ length: 6 }, (_, i) => ({ name: `P${i}`, description: "y".repeat(300) })),
    }
    const ctx = buildResumeContext(sectionData, "en")
    expect(ctx.length).toBeLessThan(AI_INPUT_LIMITS.resumeContext)
  })

  it("discloses truncation rather than silently dropping bullets", () => {
    const ctx = buildResumeContext({ workExperience: Array.from({ length: 10 }, (_, i) => job(i, 30)) }, "en")
    expect(ctx).toContain("more not shown")
  })

  it("omits work experience when the caller renders its own view of the jobs", () => {
    // tailor-cv builds a fuller, full-text list under the same ids and indices;
    // two texts for the same (id, index) let the model follow the wrong one.
    const ctx = buildResumeContext({ workExperience: [job(1, 3)] }, "en", { includeWorkExperience: false })
    expect(ctx).not.toContain("ID:w1")
    expect(bulletsShown(ctx)).toBe(0)
  })

  it("keeps the other sections when work experience is omitted", () => {
    const ctx = buildResumeContext(
      { summary: "iOS developer.", skills: [{ name: "Swift" }], workExperience: [job(1, 3)] },
      "en",
      { includeWorkExperience: false },
    )
    expect(ctx).toContain("iOS developer.")
    expect(ctx).toContain("Swift")
  })
})
