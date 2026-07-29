import { describe, it, expect, vi, beforeEach } from "vitest"

// Isolate from quota/db and cost logging. buildResumeContext is stubbed to ""
// so grounding for detectHallucination comes from the indexed jobs + the skill.
vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({ enforceAIQuota: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/ai-client", () => ({
  AI_MODEL_PROSE: "gpt-prose",
  AI_TEMPERATURE_STRUCTURED: 0.3,
  buildResumeContext: () => "",
  logAIUsage: vi.fn(),
}))

import { AISkillBulletModule } from "@/lib/services/ai/modules/AISkillBulletModule"

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

function reply(obj: unknown) {
  return {
    choices: [{ message: { content: JSON.stringify(obj) } }],
    usage: { prompt_tokens: 10, completion_tokens: 10 },
  }
}

const sectionData = () => ({
  skills: [{ id: "s1", name: "GraphQL", level: "advanced" }],
  workExperience: [
    { id: "w1", jobTitle: "Backend Developer", employer: "Acme", description: "• Maintained the billing service\n• Reviewed pull requests" },
    { id: "w2", jobTitle: "Barista", employer: "Cafe", description: "• Served coffee" },
  ],
})

function moduleWith(chat: (a: { messages: Array<{ role: string; content: string }> }) => Promise<unknown>) {
  return new AISkillBulletModule({ chat: vi.fn(chat) } as never, logger as never)
}

describe("AISkillBulletModule.weaveSkillBullet", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns the written bullet for the chosen job", async () => {
    const mod = moduleWith(async () =>
      reply({ targetId: "w1", text: "• Built the internal API layer with GraphQL for the mobile team" }),
    )
    const res = await mod.weaveSkillBullet("u1", { skill: "GraphQL", sectionData: sectionData(), language: "en" }, "PRO")
    expect(res.status).toBe("written")
    if (res.status === "written") {
      expect(res.targetId).toBe("w1")
      expect(res.jobTitle).toBe("Backend Developer")
      expect(res.text.toLowerCase()).toContain("graphql")
    }
  })

  it("no_fit when the model declines with a null targetId", async () => {
    const mod = moduleWith(async () => reply({ targetId: null, text: null }))
    const res = await mod.weaveSkillBullet("u1", { skill: "GraphQL", sectionData: sectionData(), language: "en" }, "PRO")
    expect(res.status).toBe("no_fit")
  })

  it("drops a bullet that invents a metric not in the CV", async () => {
    const mod = moduleWith(async () =>
      reply({ targetId: "w1", text: "• Built a GraphQL gateway that cut latency by 40%" }),
    )
    const res = await mod.weaveSkillBullet("u1", { skill: "GraphQL", sectionData: sectionData(), language: "en" }, "PRO")
    expect(res.status).toBe("no_fit")
  })

  it("drops a bullet that does not actually contain the skill", async () => {
    const mod = moduleWith(async () =>
      reply({ targetId: "w1", text: "• Improved the billing service reliability" }),
    )
    const res = await mod.weaveSkillBullet("u1", { skill: "GraphQL", sectionData: sectionData(), language: "en" }, "PRO")
    expect(res.status).toBe("no_fit")
  })

  it("no_fit when the model targets a job that isn't in the list", async () => {
    const mod = moduleWith(async () => reply({ targetId: "w999", text: "• Used GraphQL somewhere" }))
    const res = await mod.weaveSkillBullet("u1", { skill: "GraphQL", sectionData: sectionData(), language: "en" }, "PRO")
    expect(res.status).toBe("no_fit")
  })

  it("no_fit with no LLM call when there is no work experience", async () => {
    const chat = vi.fn(async () => reply({ targetId: "w1", text: "• x" }))
    const mod = new AISkillBulletModule({ chat } as never, logger as never)
    const res = await mod.weaveSkillBullet("u1", { skill: "GraphQL", sectionData: { workExperience: [] }, language: "en" }, "PRO")
    expect(res.status).toBe("no_fit")
    expect(chat).not.toHaveBeenCalled()
  })

  it("no_fit when the job already showcases the skill", async () => {
    const sd = {
      workExperience: [{ id: "w1", jobTitle: "Dev", employer: "Acme", description: "• Shipped a GraphQL API for partners" }],
    }
    const mod = moduleWith(async () => reply({ targetId: "w1", text: "• Added another GraphQL endpoint" }))
    const res = await mod.weaveSkillBullet("u1", { skill: "GraphQL", sectionData: sd, language: "en" }, "PRO")
    expect(res.status).toBe("no_fit")
  })
})
