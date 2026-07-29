import { describe, it, expect } from "vitest"
import { isReasoningModel, isModelUnavailableError, normalizeParamsForModel } from "@/lib/services/ai/shared/model-params"
import type { ChatParams } from "@/lib/interfaces/IAIClient"

const base = (model: string): ChatParams =>
  ({
    model,
    max_tokens: 900,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: "hi" }],
  }) as ChatParams

describe("isReasoningModel", () => {
  it("flags the GPT-5 family and o-series", () => {
    expect(isReasoningModel("gpt-5.4-nano")).toBe(true)
    expect(isReasoningModel("gpt-5.4-mini")).toBe(true)
    expect(isReasoningModel("gpt-5-mini")).toBe(true)
    expect(isReasoningModel("o3-mini")).toBe(true)
  })
  it("does NOT flag the GPT-4 family", () => {
    expect(isReasoningModel("gpt-4.1-mini")).toBe(false)
    expect(isReasoningModel("gpt-4.1-nano")).toBe(false)
    expect(isReasoningModel("gpt-4o-mini")).toBe(false)
  })
})

describe("normalizeParamsForModel", () => {
  it("rewrites max_tokens → max_completion_tokens and drops temperature for GPT-5", () => {
    const out = normalizeParamsForModel(base("gpt-5.4-nano")) as ChatParams & {
      max_tokens?: number
      max_completion_tokens?: number
      temperature?: number
    }
    expect(out.max_completion_tokens).toBe(900)
    expect(out.max_tokens).toBeUndefined()
    expect(out.temperature).toBeUndefined()
    // Non-divergent params survive.
    expect(out.response_format).toEqual({ type: "json_object" })
    expect(out.messages).toHaveLength(1)
  })

  it("drops top_p / presence_penalty / frequency_penalty for GPT-5", () => {
    const params = {
      ...base("gpt-5.4-mini"),
      top_p: 0.5,
      presence_penalty: 0.2,
      frequency_penalty: 0.3,
    } as ChatParams
    const out = normalizeParamsForModel(params) as unknown as Record<string, unknown>
    expect(out.top_p).toBeUndefined()
    expect(out.presence_penalty).toBeUndefined()
    expect(out.frequency_penalty).toBeUndefined()
    expect(out.max_completion_tokens).toBe(900)
  })

  it("passes GPT-4 family through UNCHANGED (keeps max_tokens + temperature)", () => {
    const input = base("gpt-4.1-mini")
    const out = normalizeParamsForModel(input) as ChatParams & { max_tokens?: number; temperature?: number }
    expect(out).toBe(input) // same reference — no rewrite
    expect(out.max_tokens).toBe(900)
    expect(out.temperature).toBe(0.7)
    expect(out.max_completion_tokens).toBeUndefined()
  })

  it("does not invent a token cap when the caller set none", () => {
    const params = { model: "gpt-5.4-nano", messages: [{ role: "user", content: "x" }] } as ChatParams
    const out = normalizeParamsForModel(params) as unknown as Record<string, unknown>
    expect(out.max_completion_tokens).toBeUndefined()
  })

  it("OMITS reasoning_effort when configured 'none' — the API only accepts minimal|low|medium|high and 400s on any other literal", () => {
    // AI_REASONING_EFFORT is unset in the test env → REASONING_EFFORT defaults to "none",
    // meaning "use OpenAI's own default". Sending the literal "none" 400'd every reasoning
    // call (the tailor/review 500 bug), so the param must NOT be present.
    const out = normalizeParamsForModel(base("gpt-5.4-mini")) as unknown as Record<string, unknown>
    expect(out.reasoning_effort).toBeUndefined()
  })

  it("never sets reasoning_effort on GPT-4 models", () => {
    const out = normalizeParamsForModel(base("gpt-4.1-mini")) as unknown as Record<string, unknown>
    expect(out.reasoning_effort).toBeUndefined()
  })
})

describe("isModelUnavailableError", () => {
  it("flags an unknown/ungranted model id", () => {
    expect(isModelUnavailableError({ status: 404, error: { code: "model_not_found" } })).toBe(true)
    expect(isModelUnavailableError({ code: "model_not_found" })).toBe(true)
    expect(isModelUnavailableError({ status: 404 })).toBe(true)
  })

  it("flags a tier/org without access to the model", () => {
    expect(
      isModelUnavailableError({ status: 403, error: { message: "You do not have access to model gpt-5.4-nano" } }),
    ).toBe(true)
    expect(isModelUnavailableError({ message: "The model `gpt-5.4-nano` does not exist" })).toBe(true)
  })

  it("does NOT flag failures a different model would not fix", () => {
    expect(isModelUnavailableError({ status: 429, error: { code: "rate_limit_exceeded" } })).toBe(false)
    expect(isModelUnavailableError({ status: 400, error: { code: "invalid_request_error" } })).toBe(false)
    expect(isModelUnavailableError({ status: 500 })).toBe(false)
    expect(isModelUnavailableError(new Error("socket hang up"))).toBe(false)
    expect(isModelUnavailableError(null)).toBe(false)
    expect(isModelUnavailableError(undefined)).toBe(false)
  })
})
