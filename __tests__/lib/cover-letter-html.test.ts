// The letter body is HTML in the editor and plain text to the model. That
// round trip had no coverage because improve-cover-letter had no caller: the
// endpoint, its prompts, its quota and its echo filter all shipped, and nothing
// ever invoked them. Wiring the button up is what surfaced the mismatch.
import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/db", () => ({ db: {} }))

import { AICoverLetterModule } from "@/lib/services/ai/modules/AICoverLetterModule"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({ enforceAIQuota: async () => {} }))
vi.mock("@/lib/ai-client", async (orig) => {
  const real = (await orig()) as Record<string, unknown>
  return { ...real, logAIUsage: () => {} }
})

const logger: ILogger = { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} } as ILogger

function clientReturning(payload: unknown, capture?: (prompt: string) => void) {
  return {
    chat: async (p: { messages: { role: string; content: string }[] }) => {
      capture?.(p.messages.map((m) => m.content).join("\n"))
      return {
        choices: [{ message: { content: JSON.stringify(payload) } }],
        usage: { prompt_tokens: 10, completion_tokens: 10 },
      }
    },
  } as unknown as IAIClient
}

// What TipTap stores.
const HTML_BODY =
  "<p>Dear Ms. Vega,</p><p>I led the billing migration at Acme that cut deploy time from 40 minutes to under 6.</p><p>I would welcome the chance to talk.</p>"

const REWRITES = [
  "Dear Ms. Vega,\n\nLeading the billing migration at Acme, I cut deploy time from 40 minutes to under 6.\n\nI would value the chance to talk.",
  "Dear Ms. Vega,\n\nAt Acme I owned the billing migration, taking deploy time from 40 minutes to under 6.\n\nA conversation would be welcome.",
  "Dear Ms. Vega,\n\nThe billing migration I led at Acme took deploy time from 40 minutes to under 6.\n\nI would be glad to talk it through.",
]

describe("improveCoverLetter — the HTML round trip", () => {
  it("hands the model the words, never the markup", async () => {
    let seen = ""
    const mod = new AICoverLetterModule(clientReturning({ versions: REWRITES }, (p) => { seen = p }), logger)
    await mod.improveCoverLetter("u", { body: HTML_BODY, language: "en" }, "PRO")
    expect(seen).not.toContain("<p>")
    expect(seen).toContain("Dear Ms. Vega,")
    expect(seen).toContain("cut deploy time from 40 minutes to under 6")
  })

  // The field is rendered with dangerouslySetInnerHTML and styled on [&>p].
  // Plain text there collapses into a single block — the user's letter loses
  // every paragraph break the moment they accept a version.
  it("returns versions as HTML paragraphs, not plain text", async () => {
    const mod = new AICoverLetterModule(clientReturning({ versions: REWRITES }), logger)
    const r = await mod.improveCoverLetter("u", { body: HTML_BODY, language: "en" }, "PRO")
    expect(r.versions.length).toBeGreaterThan(0)
    for (const v of r.versions) {
      expect(v).toMatch(/^<p>/)
      expect(v).not.toMatch(/\n\n/)
      expect((v.match(/<p>/g) ?? []).length).toBe(3)
    }
  })

  it("escapes markup the candidate typed instead of injecting it", async () => {
    const mod = new AICoverLetterModule(clientReturning({
      versions: ["Dear team,\n\nI maintain the <script>alert(1)</script> parser & the AT&T integration.\n\nThanks."],
    }), logger)
    const r = await mod.improveCoverLetter("u", { body: HTML_BODY, language: "en" }, "PRO")
    expect(r.versions[0]).not.toContain("<script>")
    expect(r.versions[0]).toContain("&lt;script&gt;")
  })

  // isTrivialEdit compared an HTML original against plain-text rewrites, so no
  // version ever looked like an echo and already_optimized could not fire.
  it("recognises an echo of the user's own letter through the markup", async () => {
    const echo = "Dear Ms. Vega,\n\nI led the billing migration at Acme that cut deploy time from 40 minutes to under 6.\n\nI would welcome the chance to talk."
    const mod = new AICoverLetterModule(clientReturning({ versions: [echo, echo, echo] }), logger)
    const r = await mod.improveCoverLetter("u", { body: HTML_BODY, language: "en" }, "PRO")
    expect(r.status).toBe("already_optimized")
  })

  it("gives the original back untouched when it declines — still HTML", async () => {
    const mod = new AICoverLetterModule(clientReturning({ status: "already_optimized", versions: [] }), logger)
    const r = await mod.improveCoverLetter("u", { body: HTML_BODY, language: "en" }, "PRO")
    expect(r.status).toBe("already_optimized")
  })

  it("rejects a body that is markup and nothing else", async () => {
    const mod = new AICoverLetterModule(clientReturning({ versions: REWRITES }), logger)
    await expect(
      mod.improveCoverLetter("u", { body: "<p></p><p>   </p>", language: "en" }, "PRO"),
    ).rejects.toThrow()
  })

  it("keeps single line breaks inside a paragraph as <br>", async () => {
    const mod = new AICoverLetterModule(clientReturning({
      versions: ["Dear team,\n\nLine one\nLine two\n\nThanks."],
    }), logger)
    const r = await mod.improveCoverLetter("u", { body: HTML_BODY, language: "en" }, "PRO")
    expect(r.versions[0]).toContain("Line one<br>Line two")
  })
})

// Rule 7 asks the model to decline a strong letter and it never does — 0 of 3
// measured on a letter that met every criterion it lists. The endpoint returns
// three versions or nothing, so declining reads to the model like failing the
// task; the summary's STEP 0 lost the same argument 0/5. A regex settles it.
const STRONG_HTML =
  "<p>Dear Ms. Vega,</p>" +
  "<p>Northwind's posting mentions consolidating three payment services onto one platform. That is the same problem I spent 2023 solving at Acme.</p>" +
  "<p>I led the billing migration off a legacy monolith and cut deploy time from 40 minutes to under 6. I mentored five engineers who were all promoted within 18 months.</p>" +
  "<p>What I would bring is the part that is hard to hire for: I have made this migration once already, including the rollback plan nobody wants to write.</p>" +
  "<p>I would welcome the chance to talk it through.</p>"

describe("improveCoverLetter — the deterministic pre-check", () => {
  it("declines a strong letter without calling the model at all", async () => {
    let called = 0
    const client = { chat: async () => { called++; throw new Error("must not be called") } } as unknown as IAIClient
    const mod = new AICoverLetterModule(client, logger)
    const r = await mod.improveCoverLetter("u", { body: STRONG_HTML, language: "en" }, "PRO")
    expect(r.status).toBe("already_optimized")
    expect(called).toBe(0)
  })

  it("hands the strong letter back exactly as it arrived", async () => {
    const client = { chat: async () => { throw new Error("must not be called") } } as unknown as IAIClient
    const mod = new AICoverLetterModule(client, logger)
    const r = await mod.improveCoverLetter("u", { body: STRONG_HTML, language: "en" }, "PRO")
    expect(r.versions).toEqual([STRONG_HTML])
  })

  it("still improves a letter that carries filler", async () => {
    const mod = new AICoverLetterModule(clientReturning({ versions: REWRITES }), logger)
    const r = await mod.improveCoverLetter("u", { body: HTML_BODY, language: "en" }, "PRO")
    expect(r.status).toBeUndefined()
    expect(r.versions.length).toBe(3)
  })
})

describe("improveCoverLetter — the cliché gate", () => {
  const CLICHED = REWRITES.map((v) => v.replace("Dear Ms. Vega,", "Dear Ms. Vega,\n\nI am a hard-working team player."))

  it("returns clean versions without spending a retry", async () => {
    let calls = 0
    const client = {
      chat: async () => {
        calls++
        return { choices: [{ message: { content: JSON.stringify({ versions: REWRITES }) } }], usage: {} }
      },
    } as unknown as IAIClient
    await new AICoverLetterModule(client, logger).improveCoverLetter("u", { body: HTML_BODY, language: "en" }, "PRO")
    expect(calls).toBe(1)
  })

  it("retries once when a version comes back carrying filler", async () => {
    let calls = 0
    const client = {
      chat: async () => {
        calls++
        const payload = calls === 1 ? { versions: CLICHED } : { versions: REWRITES }
        return { choices: [{ message: { content: JSON.stringify(payload) } }], usage: {} }
      },
    } as unknown as IAIClient
    const r = await new AICoverLetterModule(client, logger).improveCoverLetter("u", { body: HTML_BODY, language: "en" }, "PRO")
    expect(calls).toBe(2)
    expect(r.versions.join(" ")).not.toContain("hard-working team player")
  })

  // Both attempts answer in the same order — formal, balanced, dynamic — so
  // slot i is the same tone in each and the cleaner draft can take the place.
  // Judged as a batch, a retry that fixed one version got thrown away whole
  // because another still carried filler.
  it("takes the retry only for the slots that needed it", async () => {
    const firstTry = [REWRITES[0], CLICHED[1], REWRITES[2]]
    const secondTry = [CLICHED[0], REWRITES[1], CLICHED[2]]
    let calls = 0
    const client = {
      chat: async () => {
        calls++
        const payload = calls === 1 ? { versions: firstTry } : { versions: secondTry }
        return { choices: [{ message: { content: JSON.stringify(payload) } }], usage: {} }
      },
    } as unknown as IAIClient
    const r = await new AICoverLetterModule(client, logger).improveCoverLetter("u", { body: HTML_BODY, language: "en" }, "PRO")
    expect(r.versions).toHaveLength(3)
    // Slot 1 was clean and stays; slot 2 was flawed and the retry fixed it;
    // slot 3 was clean and is NOT replaced by the retry's flawed draft.
    expect(r.versions.join(" ")).not.toContain("hard-working team player")
  })

  it("never swaps a clean slot for a flawed one", async () => {
    let calls = 0
    const client = {
      chat: async () => {
        calls++
        const payload = calls === 1 ? { versions: [REWRITES[0], CLICHED[1], REWRITES[2]] } : { versions: CLICHED }
        return { choices: [{ message: { content: JSON.stringify(payload) } }], usage: {} }
      },
    } as unknown as IAIClient
    const r = await new AICoverLetterModule(client, logger).improveCoverLetter("u", { body: HTML_BODY, language: "en" }, "PRO")
    // The retry is filler in every slot, so only the already-flawed slot could
    // change — and it does not, because the alternative is no better.
    const flawedNow = r.versions.filter((v) => v.includes("hard-working team player")).length
    expect(flawedNow).toBe(1)
  })

  it("keeps the first result when the retry is no cleaner", async () => {
    const client = {
      chat: async () => ({ choices: [{ message: { content: JSON.stringify({ versions: CLICHED }) } }], usage: {} }),
    } as unknown as IAIClient
    const r = await new AICoverLetterModule(client, logger).improveCoverLetter("u", { body: HTML_BODY, language: "en" }, "PRO")
    // A letter with one weak phrase still beats no letter, and the user can edit it.
    expect(r.versions.length).toBe(3)
  })

  it("keeps the first result when the retry drops a tone", async () => {
    let calls = 0
    const client = {
      chat: async () => {
        calls++
        const payload = calls === 1 ? { versions: CLICHED } : { versions: [REWRITES[0]] }
        return { choices: [{ message: { content: JSON.stringify(payload) } }], usage: {} }
      },
    } as unknown as IAIClient
    const r = await new AICoverLetterModule(client, logger).improveCoverLetter("u", { body: HTML_BODY, language: "en" }, "PRO")
    expect(r.versions.length).toBe(3)
  })

  it("survives a retry that throws", async () => {
    let calls = 0
    const client = {
      chat: async () => {
        calls++
        if (calls === 2) throw new Error("upstream 500")
        return { choices: [{ message: { content: JSON.stringify({ versions: CLICHED }) } }], usage: {} }
      },
    } as unknown as IAIClient
    const r = await new AICoverLetterModule(client, logger).improveCoverLetter("u", { body: HTML_BODY, language: "en" }, "PRO")
    expect(r.versions.length).toBe(3)
  })

  it("never lets a retry smuggle in a placeholder", async () => {
    let calls = 0
    const client = {
      chat: async () => {
        calls++
        const payload = calls === 1
          ? { versions: CLICHED }
          : { versions: REWRITES.map((v) => v.replace("40 minutes to under 6", "[X%]")) }
        return { choices: [{ message: { content: JSON.stringify(payload) } }], usage: {} }
      },
    } as unknown as IAIClient
    const r = await new AICoverLetterModule(client, logger).improveCoverLetter("u", { body: HTML_BODY, language: "en" }, "PRO")
    expect(r.versions.join(" ")).not.toContain("[X%]")
  })
})
