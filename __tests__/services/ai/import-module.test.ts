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
    }) as never,
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

  /**
   * Nine bullets deleted by the tenth.
   *
   * Reported from a real import: a CV with five jobs came back with four of them
   * carrying 7 to 12 bullets, and one carrying none at all. The anti-invention
   * check runs on the WHOLE description, so a single figure the model reformats
   * ("15 %" where the PDF says "15%") or one tool it spells differently condemns
   * every other line in that job — and it happens silently, so the person just
   * sees an empty role and assumes their PDF was unreadable.
   *
   * Bullets are independent claims. They are judged one at a time.
   */
  it("drops only the invented bullet, not the whole job", async () => {
    const source = `EXPERIENCIA
Xiobit — iOS Developer 2015-2016
• Construí pantallas con UIKit
• Corregí fallos reportados por soporte
• Publiqué versiones en App Store`
    const payload = JSON.stringify({
      personalDetails: {},
      workExperience: [{
        employer: "Xiobit", jobTitle: "iOS Developer", startDate: "2015", endDate: "2016",
        // The last line carries a figure that appears nowhere in the source.
        description: "• Construí pantallas con UIKit\n• Corregí fallos reportados por soporte\n• Publiqué versiones en App Store\n• Reduje los crashes en un 47%",
      }],
    })
    const mod = new AIImportModule(clientReturning(payload), logger)
    const out = await mod.extractResume("u1", { rawText: source, language: "es" }, "PRO")
    expect(out).not.toBeNull()
    const desc = (out!.workExperience as { description: string }[])[0].description
    const lines = desc.split("\n").filter(Boolean)

    expect(lines.length).toBe(3)
    expect(desc).toContain("UIKit")
    expect(desc).toContain("App Store")
    // The invented figure is the only thing gone.
    expect(desc).not.toContain("47%")
    // And it is not silent any more.
    expect(logger.warn).toHaveBeenCalledWith("[AIImport] hallucinated lines dropped", { count: 1 })
  })

  /**
   * A single flowing paragraph is ONE claim, so half of it is not safe to keep.
   * The all-or-nothing rule stays exactly where it was right.
   */
  it("still clears a hallucinated paragraph whole", async () => {
    const source = `EXPERIENCIA
Acme — Backend Developer 2020-2023
Mantuve servicios internos.`
    const payload = JSON.stringify({
      personalDetails: {},
      workExperience: [{
        employer: "Acme", jobTitle: "Backend Developer", startDate: "2020", endDate: "2023",
        description: "Mantuve servicios internos y reduje la latencia en un 63% para 2 millones de usuarios.",
      }],
    })
    const mod = new AIImportModule(clientReturning(payload), logger)
    const out = await mod.extractResume("u1", { rawText: source, language: "es" }, "PRO")
    expect(out).not.toBeNull()
    expect((out!.workExperience as { description: string }[])[0].description).toBe("")
  })

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
    // The invented address does not survive — but the answer is no longer an
    // empty field. The real address is read out of the document: a failed check
    // repairs the value, it does not delete the person's contact details.
    expect(result!.personalDetails.email).toBe("miguel@example.com")
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
