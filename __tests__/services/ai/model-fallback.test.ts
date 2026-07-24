/**
 * The adapter must survive the configured model being unavailable to our API key
 * (unknown id, not rolled out to the org, tier without access) — that failure mode
 * would otherwise take down EVERY AI endpoint at once: fill-profile, import, ATS,
 * tailor, summaries, cover letters.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { ChatParams } from "@/lib/interfaces/IAIClient"

const create = vi.fn()

vi.mock("@/lib/ai-client", () => ({
  getOpenAI: () => ({ chat: { completions: { create } }, embeddings: { create: vi.fn() } }),
  AI_MODEL: "gpt-5.4-nano",
}))

/** Fresh module instance so the in-memory "unavailable models" cache starts empty. */
async function freshAdapter() {
  vi.resetModules()
  const mod = await import("@/lib/services/ai/OpenAIClientAdapter")
  return new mod.OpenAIClientAdapter()
}

const params = (model: string): ChatParams =>
  ({
    model,
    max_tokens: 900,
    temperature: 0.7,
    messages: [{ role: "user", content: "hi" }],
  }) as ChatParams

const modelGone = Object.assign(new Error("The model `gpt-5.4-nano` does not exist"), {
  status: 404,
  error: { code: "model_not_found" },
})

const ok = { choices: [{ message: { content: "{}" } }] }

beforeEach(() => {
  create.mockReset()
})

describe("OpenAIClientAdapter model fallback", () => {
  it("retries on the fallback model when the configured one is unavailable", async () => {
    create.mockRejectedValueOnce(modelGone).mockResolvedValueOnce(ok)
    const adapter = await freshAdapter()

    await expect(adapter.chat(params("gpt-5.4-nano"))).resolves.toBe(ok)

    expect(create).toHaveBeenCalledTimes(2)
    expect(create.mock.calls[0][0].model).toBe("gpt-5.4-nano")
    expect(create.mock.calls[1][0].model).toBe("gpt-4.1-mini")
  })

  it("re-normalizes params for the fallback family (temperature is restored)", async () => {
    create.mockRejectedValueOnce(modelGone).mockResolvedValueOnce(ok)
    const adapter = await freshAdapter()

    await adapter.chat(params("gpt-5.4-nano"))

    // GPT-5 pass strips temperature and renames the token cap...
    expect(create.mock.calls[0][0].temperature).toBeUndefined()
    expect(create.mock.calls[0][0].max_completion_tokens).toBe(900)
    // ...but the GPT-4 fallback must get the ORIGINAL shape back, not the stripped one.
    expect(create.mock.calls[1][0].temperature).toBe(0.7)
    expect(create.mock.calls[1][0].max_tokens).toBe(900)
    expect(create.mock.calls[1][0].reasoning_effort).toBeUndefined()
  })

  it("skips the doomed request on later calls once a model is known bad", async () => {
    create.mockRejectedValueOnce(modelGone).mockResolvedValue(ok)
    const adapter = await freshAdapter()

    await adapter.chat(params("gpt-5.4-nano")) // probes, fails, falls back
    create.mockClear()
    await adapter.chat(params("gpt-5.4-nano")) // must go straight to the fallback

    expect(create).toHaveBeenCalledTimes(1)
    expect(create.mock.calls[0][0].model).toBe("gpt-4.1-mini")
  })

  it("propagates errors a different model would NOT fix", async () => {
    const rateLimited = Object.assign(new Error("rate limit"), {
      status: 429,
      error: { code: "rate_limit_exceeded" },
    })
    create.mockRejectedValueOnce(rateLimited)
    const adapter = await freshAdapter()

    await expect(adapter.chat(params("gpt-5.4-nano"))).rejects.toThrow("rate limit")
    expect(create).toHaveBeenCalledTimes(1) // no retry
  })

  it("does not loop when the fallback model itself is unavailable", async () => {
    create.mockRejectedValue(modelGone)
    const adapter = await freshAdapter()

    await expect(adapter.chat(params("gpt-4.1-mini"))).rejects.toThrow()
    expect(create).toHaveBeenCalledTimes(1)
  })
})
