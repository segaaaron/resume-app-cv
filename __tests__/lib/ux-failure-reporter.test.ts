// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { reportUxFailure } from "@/lib/client-error-reporter"

/**
 * THE HOLE THIS COVERS. A guard that refuses an action shows a toast and returns.
 * It never throws, so nothing was ever recorded: three production failures were
 * reported by screenshot while the server had not one row about any of them.
 */
describe("reportUxFailure — a refusal the user sees is a refusal we record", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true } as Response)))
  })

  const bodyOf = (call: number) =>
    JSON.parse((vi.mocked(fetch).mock.calls[call][1] as RequestInit).body as string)

  it("posts the refusal with its code and facts", () => {
    reportUxFailure("bullet_remove_not_located", { index: 4, bullets: 7, jobFound: true })
    expect(fetch).toHaveBeenCalledOnce()
    const body = bodyOf(0)
    expect(body.kind).toBe("ux")
    expect(body.message).toBe("ux: bullet_remove_not_located")
    expect(body.detail).toEqual({ index: 4, bullets: 7, jobFound: true })
  })

  it("does not repeat the same refusal on one page load", () => {
    reportUxFailure("bullet_write_not_located", { index: 1, bullets: 3 })
    reportUxFailure("bullet_write_not_located", { index: 1, bullets: 3 })
    expect(fetch).toHaveBeenCalledOnce()
  })

  it("reports the same guard again when the facts differ — that is a second failure", () => {
    reportUxFailure("bullet_fix_not_located", { index: 2, bullets: 9 })
    reportUxFailure("bullet_fix_not_located", { index: 5, bullets: 9 })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it("never carries résumé content — only scalars the caller passed", () => {
    reportUxFailure("bullet_remove_not_located", { index: 0, bullets: 6, textLen: 84 })
    const body = bodyOf(0)
    for (const value of Object.values(body.detail as Record<string, unknown>)) {
      expect(["number", "boolean", "string"]).toContain(typeof value)
      if (typeof value === "string") expect(value.length).toBeLessThanOrEqual(40)
    }
  })

  it("telemetry never breaks the page when the network is down", () => {
    vi.stubGlobal("fetch", vi.fn(() => { throw new Error("offline") }))
    expect(() => reportUxFailure("some_guard_offline", { index: 1 })).not.toThrow()
  })
})
