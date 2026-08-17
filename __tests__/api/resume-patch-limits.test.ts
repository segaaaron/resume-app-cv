import { describe, it, expect, vi } from "vitest"

// Imports the REAL schema, not a copy of it. `__tests__/api/schemas.test.ts` re-declares
// its own `resumePatchSchema` inline, so it keeps passing no matter what the service
// actually accepts — the exact failure mode that once left 39 green tests over a broken
// product. These assertions are worth having only because they run the shipped object.
vi.mock("@/lib/db", () => ({ db: {} }))
vi.mock("@/lib/auth", () => ({ purgeUserCache: vi.fn() }))

import { resumePatchSchema, snapshotSchema } from "@/lib/services/resume/ResumeService"

const section = (id: string) => ({ id, type: "custom", label: "X", column: "main", visible: true, data: {} })

describe("resume PATCH: the body is bounded", () => {
  it("accepts a normal résumé layout", () => {
    const res = resumePatchSchema.safeParse({ sections: Array.from({ length: 14 }, (_, i) => section(`s${i}`)) })
    expect(res.success).toBe(true)
  })

  it("refuses an absurd number of sections", () => {
    const res = resumePatchSchema.safeParse({ sections: Array.from({ length: 500 }, (_, i) => section(`s${i}`)) })
    expect(res.success).toBe(false)
  })

  it("refuses a payload that is small in COUNT but huge in bytes", () => {
    // The count cap alone would let this through: one section carrying 2 MB of label.
    const res = resumePatchSchema.safeParse({ sections: [{ ...section("s0"), label: "x".repeat(2_000_000) }] })
    expect(res.success).toBe(false)
  })

  it("still caps sectionData", () => {
    const res = resumePatchSchema.safeParse({ sectionData: { blob: "x".repeat(600_000) } })
    expect(res.success).toBe(false)
  })

  it("applies the same bound to the version snapshot", () => {
    const res = snapshotSchema.safeParse({ sections: [{ ...section("s0"), label: "x".repeat(2_000_000) }] })
    expect(res.success).toBe(false)
  })
})
