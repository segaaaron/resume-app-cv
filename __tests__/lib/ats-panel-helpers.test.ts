import { describe, it, expect, vi, beforeEach } from "vitest"

// These three decisions used to be buried inside a 3.5k-line component, where nothing
// could reach them. Two of them are exactly the kind that shipped bugs before: a button
// drawn for a bullet with nothing to repair, and a "where is this?" label that pointed
// at a role that no longer exists.

vi.mock("@/lib/services/ai/shared/repairable-defects", () => ({ repairableDefects: vi.fn(() => [] as string[]) }))
vi.mock("@/components/editor/hooks/useOptimizedGuard", () => ({ isContentOptimized: vi.fn(() => false) }))

import { repairableDefects } from "@/lib/services/ai/shared/repairable-defects"
import { isContentOptimized } from "@/components/editor/hooks/useOptimizedGuard"
import { fixLocationLabel, bulletDefects, canAskAI, HEALTHY_METRIC_PCT, BULLETS_PAGE } from "@/components/editor/ats-panel/panel-helpers"
import type { WorkExperienceItem } from "@/types/resume"

const t = (k: string, v?: Record<string, string | number>) => (v ? `${k}:${JSON.stringify(v)}` : k)

const jobs = [
  { id: "job-1", jobTitle: "iOS Developer", employer: "Xiobit", description: "" },
  { id: "job-2", jobTitle: "", employer: "Acme", description: "" },
] as unknown as WorkExperienceItem[]

beforeEach(() => vi.clearAllMocks())

describe("fixLocationLabel — a finding has to be findable by hand", () => {
  it("names the role and the line number for a bullet fix", () => {
    expect(fixLocationLabel({ kind: "rewrite_bullet", targetId: "job-1", index: 2 }, jobs, t))
      .toBe('fix_where_bullet:{"job":"iOS Developer · Xiobit","n":3}')
  })

  it("falls back to the role alone when no index is given", () => {
    expect(fixLocationLabel({ kind: "rewrite_bullet", targetId: "job-1" }, jobs, t)).toBe("iOS Developer · Xiobit")
  })

  it("skips the empty half of a half-filled role instead of printing ' · '", () => {
    expect(fixLocationLabel({ kind: "rewrite_bullet", targetId: "job-2" }, jobs, t)).toBe("Acme")
  })

  it("says nothing when the role is gone — a wrong address is worse than none", () => {
    expect(fixLocationLabel({ kind: "rewrite_bullet", targetId: "deleted-job", index: 0 }, jobs, t)).toBeNull()
  })

  it("maps the section-level fixes", () => {
    expect(fixLocationLabel({ kind: "rewrite_summary" }, jobs, t)).toBe("fix_where_summary")
    expect(fixLocationLabel({ kind: "add_skill" }, jobs, t)).toBe("fix_where_skills")
    expect(fixLocationLabel({ kind: "fix_dates" }, jobs, t)).toBe("fix_where_dates")
  })

  it("returns null for no action and for a kind it does not know", () => {
    expect(fixLocationLabel(undefined, jobs, t)).toBeNull()
    expect(fixLocationLabel({ kind: "manual" }, jobs, t)).toBeNull()
  })
})

describe("bulletDefects — the shared rule decides, not the panel", () => {
  it("returns whatever the shared rule says", () => {
    vi.mocked(repairableDefects).mockReturnValue(["weak_verb"])
    expect(bulletDefects("Responsible for things")).toEqual(["weak_verb"])
    expect(repairableDefects).toHaveBeenCalledWith("Responsible for things")
  })
})

describe("canAskAI — never pay twice for the same answer", () => {
  it("no repairable defect → do not offer the rewrite", () => {
    vi.mocked(repairableDefects).mockReturnValue([])
    expect(canAskAI("job-1", "desc", "Shipped checkout, cutting refunds 20%")).toBe(false)
    expect(isContentOptimized).not.toHaveBeenCalled()
  })

  it("defect present and text untouched since the last AI pass → offer it", () => {
    vi.mocked(repairableDefects).mockReturnValue(["cliche"])
    vi.mocked(isContentOptimized).mockReturnValue(false)
    expect(canAskAI("job-1", "desc", "Team player")).toBe(true)
  })

  it("text is exactly what the AI just wrote → refuse, it would buy the same answer", () => {
    vi.mocked(repairableDefects).mockReturnValue(["cliche"])
    vi.mocked(isContentOptimized).mockReturnValue(true)
    expect(canAskAI("job-1", "desc", "Team player")).toBe(false)
    expect(isContentOptimized).toHaveBeenCalledWith("opt_bullet_job-1", "desc")
  })
})

describe("panel constants", () => {
  it("keeps the documented thresholds", () => {
    expect(HEALTHY_METRIC_PCT).toBe(50)
    expect(BULLETS_PAGE).toBe(6)
  })
})
