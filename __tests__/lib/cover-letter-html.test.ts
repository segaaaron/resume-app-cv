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
