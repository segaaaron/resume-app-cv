import { describe, it, expect } from "vitest"
import { getImportQuota, AI_DAILY_CAP } from "@/lib/plans"

describe("AI_DAILY_CAP — translate is capped at 3/day (idempotent + anti-abuse)", () => {
  it("translate-cv daily cap is 3", () => {
    expect(AI_DAILY_CAP["translate-cv"]).toBe(3)
  })
})

const DAY = 24 * 60 * 60 * 1000
const WEEK = 7 * DAY

describe("getImportQuota — per-plan anti-abuse import limits", () => {
  it("PRO: 5 per day", () => {
    expect(getImportQuota("PRO")).toEqual({ limit: 5, windowMs: DAY })
  })
  it("LIMITED: 10 per day", () => {
    expect(getImportQuota("LIMITED")).toEqual({ limit: 10, windowMs: DAY })
  })
  it("SPRINT: 3 per week", () => {
    expect(getImportQuota("SPRINT")).toEqual({ limit: 3, windowMs: WEEK })
  })
  it("BASIC: 3 per day", () => {
    expect(getImportQuota("BASIC")).toEqual({ limit: 3, windowMs: DAY })
  })
  it("UNSUBSCRIBED (free): import blocked — no AI of any kind (limit 0)", () => {
    expect(getImportQuota("UNSUBSCRIBED")).toEqual({ limit: 0, windowMs: DAY })
  })
  it("unknown plan falls back to the free tier (blocked, 0)", () => {
    expect(getImportQuota("whatever")).toEqual({ limit: 0, windowMs: DAY })
  })
})
