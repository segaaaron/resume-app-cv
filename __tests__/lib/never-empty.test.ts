import { describe, it, expect, vi } from "vitest"
import { askUntilAnswered, retryNudge, OffTopicError } from "@/lib/services/ai/shared/never-empty"

/**
 * The rule: an AI feature does not hand the user nothing.
 *
 * Every button here costs a use and often a two-minute cooldown, so an empty
 * answer is not free — it costs the use, the wait, and the user's willingness to
 * press it again. Measured on fill-profile before this existed: the model
 * answered `{}` about once in ten, with no pattern the user could learn.
 */
describe("askUntilAnswered", () => {
  it("returns the first answer when there is one", async () => {
    const ask = vi.fn().mockResolvedValue(["a"])
    const out = await askUntilAnswered({
      ask, isAnswered: (r: string[]) => r.length > 0, fallback: () => null,
    })
    expect(out).toEqual(["a"])
    expect(ask).toHaveBeenCalledTimes(1) // no second call on a good answer
  })

  it("retries once when the answer is empty, and keeps the retry", async () => {
    const ask = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce(["b"])
    const onFilled = vi.fn()
    const out = await askUntilAnswered({
      ask, isAnswered: (r: string[]) => r.length > 0, fallback: () => null, onFilled,
    })
    expect(out).toEqual(["b"])
    expect(ask).toHaveBeenCalledTimes(2)
    expect(onFilled).toHaveBeenCalledWith("retry")
  })

  it("falls back rather than returning nothing", async () => {
    const ask = vi.fn().mockResolvedValue([])
    const onFilled = vi.fn()
    const out = await askUntilAnswered({
      ask, isAnswered: (r: string[]) => r.length > 0,
      fallback: () => ["from the fallback"], onFilled,
    })
    expect(out).toEqual(["from the fallback"])
    expect(onFilled).toHaveBeenCalledWith("fallback")
  })

  it("stops at two calls — a third would cost the user more than it is worth", async () => {
    const ask = vi.fn().mockResolvedValue([])
    await askUntilAnswered({ ask, isAnswered: (r: string[]) => r.length > 0, fallback: () => ["x"] })
    expect(ask).toHaveBeenCalledTimes(2)
  })

  /**
   * The one thing that is NOT swallowed. Someone who pastes a poem where a job
   * posting goes has to be told — answering nonsense with confident nonsense is
   * worse than an error, and a retry would pay to hear the same refusal twice.
   */
  it("surfaces a genuine off-topic without retrying", async () => {
    const ask = vi.fn().mockResolvedValue({ off_topic: true })
    await expect(askUntilAnswered({
      ask,
      isAnswered: () => false,
      isOffTopic: (r: { off_topic?: boolean }) => r.off_topic === true,
      fallback: () => null,
    })).rejects.toBeInstanceOf(OffTopicError)
    expect(ask).toHaveBeenCalledTimes(1)
  })

  it("returns null only when the fallback itself has nothing", async () => {
    const out = await askUntilAnswered({
      ask: async () => [], isAnswered: (r: string[]) => r.length > 0, fallback: () => null,
    })
    expect(out).toBeNull()
  })

  it("tells the retry it is a retry", async () => {
    const seen: number[] = []
    await askUntilAnswered({
      ask: async (attempt) => { seen.push(attempt); return [] },
      isAnswered: (r: string[]) => r.length > 0,
      fallback: () => ["x"],
    })
    expect(seen).toEqual([0, 1])
  })

  it("nudges in both languages, and asks for the same shape rather than new rules", () => {
    // A retry that adds rules contradicts the prompt it is retrying — OpenAI
    // documents that as making the model reconcile instead of obey.
    for (const lang of ["es", "en"]) {
      const nudge = retryNudge(lang)
      expect(nudge.toLowerCase()).toContain("json")
      expect(nudge.length).toBeGreaterThan(60)
    }
    expect(retryNudge("es")).not.toBe(retryNudge("en"))
  })
})
