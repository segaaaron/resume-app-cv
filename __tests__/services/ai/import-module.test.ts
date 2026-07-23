import { describe, it, expect, vi, beforeEach } from "vitest"

// ai-client imports the Prisma client at module load, which throws without
// DATABASE_URL. Stub the db so the module graph loads in a bare test env, and
// stub logAIUsage (a fire-and-forget DB write). AI_MODEL / AI_TEMPERATURE stay real.
vi.mock("@/lib/db", () => ({ db: {} }))
vi.mock("@/lib/ai-client", async (orig) => ({
  ...(await orig<typeof import("@/lib/ai-client")>()),
  logAIUsage: vi.fn(),
}))

import { AIImportModule } from "@/lib/services/ai/modules/AIImportModule"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

const logger: ILogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

function clientReturning(content: string): IAIClient {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chat: vi.fn().mockResolvedValue({
      choices: [{ message: { content } }],
      usage: { prompt_tokens: 10, completion_tokens: 10 },
    }) as any,
    embed: vi.fn(),
  }
}

const SOURCE = `Miguel Angel Saravia Belmonte
Backend Developer
miguel@example.com
EXPERIENCIA LABORAL
Acme Corp — Backend Developer 2020-2023
• Built REST APIs in Node`

describe("AIImportModule — grounded extraction", () => {
  beforeEach(() => vi.clearAllMocks())

  it("keeps grounded entities and drops invented ones", async () => {
    const payload = JSON.stringify({
      isResume: true,
      personalDetails: {
        firstName: "Miguel",
        lastName: "Angel Saravia Belmonte",
        jobTitle: "Backend Developer",
        email: "invented@nope.com", // NOT in source → must be cleared
      },
      workExperience: [
        { employer: "Acme Corp", jobTitle: "Backend Developer", description: "• Built REST APIs in Node" },
        { employer: "FakeCorp", jobTitle: "CTO", description: "• Led everything" }, // NOT in source → dropped
      ],
      skills: [{ name: "Kubernetes" }], // NOT in source → dropped
    })
    const mod = new AIImportModule(clientReturning(payload), logger)
    const result = await mod.extractResume("u1", { rawText: SOURCE, language: "es" }, "PRO")

    expect(result).not.toBeNull()
    expect(result!.personalDetails.firstName).toBe("Miguel")
    expect(result!.personalDetails.lastName).toBe("Angel Saravia Belmonte") // 2 apellidos juntos
    expect(result!.personalDetails.email).toBe("") // invented email stripped
    expect(result!.workExperience).toHaveLength(1) // FakeCorp dropped
    expect(result!.workExperience[0].employer).toBe("Acme Corp")
    expect(result!.workExperience[0].id).toBeTruthy()
    expect(result!.skills).toHaveLength(0) // Kubernetes not in source
  })

  it("returns null when the model says it is not a resume", async () => {
    const mod = new AIImportModule(clientReturning(JSON.stringify({ isResume: false })), logger)
    const result = await mod.extractResume("u1", { rawText: SOURCE, language: "es" }, "PRO")
    expect(result).toBeNull()
  })

  it("returns null when grounding strips everything real (→ triggers fallback)", async () => {
    const payload = JSON.stringify({
      isResume: true,
      personalDetails: { firstName: "", email: "ghost@nowhere.io" },
      workExperience: [{ employer: "PhantomInc", jobTitle: "Wizard" }],
    })
    const mod = new AIImportModule(clientReturning(payload), logger)
    const result = await mod.extractResume("u1", { rawText: SOURCE, language: "es" }, "PRO")
    expect(result).toBeNull()
  })

  it("returns null on a model error (route then falls back deterministically)", async () => {
    const client: IAIClient = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chat: vi.fn().mockRejectedValue(new Error("timeout")) as any,
      embed: vi.fn(),
    }
    const mod = new AIImportModule(client, logger)
    const result = await mod.extractResume("u1", { rawText: SOURCE, language: "es" }, "PRO")
    expect(result).toBeNull()
  })

  it("returns null for near-empty input without calling the model", async () => {
    const client = clientReturning("{}")
    const mod = new AIImportModule(client, logger)
    const result = await mod.extractResume("u1", { rawText: "  ", language: "es" }, "PRO")
    expect(result).toBeNull()
    expect(client.chat).not.toHaveBeenCalled()
  })
})
