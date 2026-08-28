import { describe, it, expect } from "vitest"
import { findDuplicateSkill } from "@/lib/skills/skill-dedup"

describe("findDuplicateSkill", () => {
  const have = ["React", "Objective-C", "Node.js", "Project Management"]

  it("catches an exact duplicate (case/accent-insensitive)", () => {
    expect(findDuplicateSkill("react", have)).toBe("React")
    expect(findDuplicateSkill("REACT", have)).toBe("React")
  })

  it("catches a spacing/hyphen/dot variant", () => {
    expect(findDuplicateSkill("Node js", have)).toBe("Node.js")
    expect(findDuplicateSkill("nodejs", have)).toBe("Node.js")
  })

  it("catches an alias-equivalent skill via the ATS vocabulary", () => {
    // React ≡ React.js ≡ reactjs
    expect(findDuplicateSkill("React.js", have)).toBe("React")
  })

  it("catches a ~90% similar typo of an existing skill", () => {
    expect(findDuplicateSkill("Objetive-C", have)).toBe("Objective-C")
  })

  it("returns null for a genuinely new, distinct skill", () => {
    expect(findDuplicateSkill("Kubernetes", have)).toBeNull()
    // 'Java' must NOT be flagged as a duplicate of nothing here, nor of a partial.
    expect(findDuplicateSkill("Java", have)).toBeNull()
  })

  it("does not flag distinct-but-similar real skills", () => {
    expect(findDuplicateSkill("Vue", ["Vuex"])).toBeNull()
    expect(findDuplicateSkill("Java", ["JavaScript"])).toBeNull()
  })

  it("no-ops on empty input", () => {
    expect(findDuplicateSkill("", have)).toBeNull()
    expect(findDuplicateSkill("  ", have)).toBeNull()
  })
})
