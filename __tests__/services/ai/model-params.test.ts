import { describe, it, expect } from "vitest"
import { isReasoningModel, normalizeParamsForModel } from "@/lib/services/ai/shared/model-params"
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

  it("pins a reasoning_effort for GPT-5 (not left to the API default)", () => {
    const out = normalizeParamsForModel(base("gpt-5.4-mini")) as unknown as Record<string, unknown>
    expect(out.reasoning_effort).toBeDefined()
  })

  it("never sets reasoning_effort on GPT-4 models", () => {
    const out = normalizeParamsForModel(base("gpt-4.1-mini")) as unknown as Record<string, unknown>
    expect(out.reasoning_effort).toBeUndefined()
  })
})
