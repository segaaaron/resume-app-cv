import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/db", () => ({ db: {} }))

import { gateSummaryVersions } from "@/lib/services/ai/shared/summary-gate"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

const logger: ILogger = { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} } as ILogger

/** A client that replies with a scripted queue and counts its calls. */
function clientReturning(...queue: { versions?: unknown; tokens?: [number, number] }[]) {
  let calls = 0
  const client = {
    chat: async () => {
      const next = queue[Math.min(calls, queue.length - 1)]
      calls++
      return {
        choices: [{ message: { content: JSON.stringify({ versions: next.versions ?? [] }) } }],
        usage: { prompt_tokens: next.tokens?.[0] ?? 0, completion_tokens: next.tokens?.[1] ?? 0 },
      }
    },
  } as unknown as IAIClient
  return { client, calls: () => calls }
}

const SOURCE = "Staff Engineer at Acme. Cut deploy time from 40 minutes to under 6. Mentored 5 engineers. Built the checkout with React."
const METRICS = ["Cut deploy time from 40 minutes to under 6", "Mentored 5 engineers"]

const CLEAN = "Led the billing migration at Acme, cutting deploy time from 40 minutes to under 6. Mentored 5 engineers through onboarding and code review. Built the checkout on React with the design team."
const CLICHE = "Passionate about technology and a proven team player. Responsible for the billing service at Acme. Looking for new challenges."
const NO_METRIC = "Led the billing migration at Acme, significantly improving deployment efficiency. Guided the engineering team through onboarding and review. Shipped the checkout with React alongside design."

function input(over: Partial<Parameters<typeof gateSummaryVersions>[2]> = {}) {
  return {
    rawVersions: [CLEAN],
    source: SOURCE,
    metrics: METRICS,
    basePrompt: "base",
    langInstruction: "en",
    language: "en" as const,
    temperature: 0.7,
    maxTokens: 600,
    endpoint: "generate-summary" as const,
    ...over,
  }
}

describe("gateSummaryVersions", () => {
  it("returns clean versions without spending a retry", async () => {
    const { client, calls } = clientReturning({ versions: [CLEAN] })
    const r = await gateSummaryVersions(client, logger, input())
    expect(r.versions.map((v) => v.text)).toEqual([CLEAN])
    expect(calls()).toBe(0)
    expect(r.retryUsage).toBeNull()
  })

  // The gap this file exists for: the cliché detector was only ever used to
  // sort, so a cliché in the version the user reads survived. 1 in 5 shipped.
  it("retries when the best version carries a cliché", async () => {
    const { client, calls } = clientReturning({ versions: [CLEAN] })
    const r = await gateSummaryVersions(client, logger, input({ rawVersions: [CLICHE] }))
    expect(calls()).toBe(1)
    expect(r.versions[0].text).toBe(CLEAN)
  })

  it("retries when the profile states figures and no version carries one", async () => {
    const { client, calls } = clientReturning({ versions: [CLEAN] })
    const r = await gateSummaryVersions(client, logger, input({ rawVersions: [NO_METRIC] }))
    expect(calls()).toBe(1)
    expect(r.versions[0].text).toBe(CLEAN)
  })

  it("does not ask for figures the candidate never stated", async () => {
    const { client, calls } = clientReturning({ versions: [] })
    const r = await gateSummaryVersions(client, logger, input({ rawVersions: [NO_METRIC], metrics: [] }))
    expect(calls()).toBe(0)
    expect(r.versions.map((v) => v.text)).toEqual([NO_METRIC])
  })

  // Gating on both axes is the point: a retry that fixes the cliché by dropping
  // the figures trades one failure for the other.
  it("keeps the first result when the retry fixes the cliché but loses the figures", async () => {
    const { client } = clientReturning({ versions: [NO_METRIC] })
    const r = await gateSummaryVersions(client, logger, input({ rawVersions: [CLICHE] }))
    expect(r.versions[0].text).toBe(CLICHE)
  })

  it("keeps the first result when the retry brings back a cliché", async () => {
    const { client } = clientReturning({ versions: [CLICHE] })
    const r = await gateSummaryVersions(client, logger, input({ rawVersions: [NO_METRIC] }))
    expect(r.versions[0].text).toBe(NO_METRIC)
  })

  it("never lets a retry smuggle in a placeholder", async () => {
    const { client } = clientReturning({ versions: ["Led the migration at Acme, cutting deploy time by [X%] across [N] teams."] })
    const r = await gateSummaryVersions(client, logger, input({ rawVersions: [CLICHE] }))
    expect(r.versions[0].text).toBe(CLICHE)
    expect(r.versions.map((v) => v.text).join(" ")).not.toMatch(/\[/)
  })

  it("drops a version that invents a figure the source never stated", async () => {
    const r = await gateSummaryVersions(clientReturning({ versions: [CLEAN] }).client, logger,
      input({ rawVersions: [CLEAN, "Drove 300% revenue growth across 12 countries at Acme."] }))
    expect(r.versions.map((v) => v.text).join(" ")).not.toContain("300%")
  })

  it("reports empty rather than inventing when every version is dropped", async () => {
    const { client, calls } = clientReturning({ versions: [CLEAN] })
    const r = await gateSummaryVersions(client, logger, input({ rawVersions: ["Certified AWS Solutions Architect with a PhD in Robotics."] }))
    expect(r.versions).toEqual([])
    expect(calls()).toBe(0)
  })

  // The retry's tokens were charged whether or not its answer was used. The
  // first cut of this gate logged the FIRST call's usage on the retry path, so
  // they went unrecorded and cost-per-user read low.
  it("reports the retry's tokens when the retry is accepted", async () => {
    const { client } = clientReturning({ versions: [CLEAN], tokens: [900, 250] })
    const r = await gateSummaryVersions(client, logger, input({ rawVersions: [CLICHE] }))
    expect(r.versions[0].text).toBe(CLEAN)
    expect(r.retryUsage).toEqual({ promptTokens: 900, completionTokens: 250 })
  })

  it("reports the retry's tokens even when its answer is thrown away", async () => {
    const { client } = clientReturning({ versions: [CLICHE], tokens: [900, 250] })
    const r = await gateSummaryVersions(client, logger, input({ rawVersions: [NO_METRIC] }))
    expect(r.versions[0].text).toBe(NO_METRIC)
    expect(r.retryUsage).toEqual({ promptTokens: 900, completionTokens: 250 })
  })

  it("survives a retry that throws, keeping the first result", async () => {
    const client = { chat: async () => { throw new Error("upstream 500") } } as unknown as IAIClient
    const r = await gateSummaryVersions(client, logger, input({ rawVersions: [CLICHE] }))
    expect(r.versions[0].text).toBe(CLICHE)
    expect(r.retryUsage).toBeNull()
  })

  it("retries at most once", async () => {
    const { client, calls } = clientReturning({ versions: [CLICHE] })
    await gateSummaryVersions(client, logger, input({ rawVersions: [CLICHE] }))
    expect(calls()).toBe(1)
  })

  it("puts the cleanest version first — index 0 is what the user reads", async () => {
    const { client } = clientReturning({ versions: [CLEAN] })
    const r = await gateSummaryVersions(client, logger, input({ rawVersions: [CLICHE, CLEAN] }))
    expect(r.versions[0].text).toBe(CLEAN)
    expect(r.versions).toHaveLength(2)
  })

  // Ranking reorders the array the modal labels by position, so without this
  // the specialist version renders under the "Executive" heading. The label
  // has to travel with the text.
  it("keeps each version's positioning after ranking reorders them", async () => {
    const { client } = clientReturning({ versions: [CLEAN] })
    const r = await gateSummaryVersions(client, logger, input({ rawVersions: [CLICHE, CLEAN] }))
    expect(r.versions[0]).toEqual({ text: CLEAN, sourceIndex: 1 })
    expect(r.versions[1]).toEqual({ text: CLICHE, sourceIndex: 0 })
  })

  it("numbers a retry's versions from the retry's own answer", async () => {
    const { client } = clientReturning({ versions: [CLICHE, CLEAN] })
    const r = await gateSummaryVersions(client, logger, input({ rawVersions: [NO_METRIC] }))
    expect(r.versions[0]).toEqual({ text: CLEAN, sourceIndex: 1 })
  })

  it("does not let a dropped version shift the ones after it", async () => {
    const { client } = clientReturning({ versions: [CLEAN] })
    const r = await gateSummaryVersions(client, logger, input({
      rawVersions: ["Drove 300% revenue growth across 12 countries at Acme.", CLEAN],
    }))
    expect(r.versions).toEqual([{ text: CLEAN, sourceIndex: 1 }])
  })

  it("ignores junk in the versions array instead of throwing", async () => {
    const { client } = clientReturning({ versions: [CLEAN] })
    const r = await gateSummaryVersions(client, logger, input({ rawVersions: [null, 42, "", CLEAN, {}] }))
    expect(r.versions.map((v) => v.text)).toEqual([CLEAN])
  })

  it("treats a non-array from the model as no versions", async () => {
    const { client } = clientReturning({ versions: [CLEAN] })
    const r = await gateSummaryVersions(client, logger, input({ rawVersions: "not an array" }))
    expect(r.versions).toEqual([])
  })
})
