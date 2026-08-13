import { describe, it, expect } from "vitest"
import { fixAxis } from "@/lib/ats/fix-impact"

describe("fixAxis", () => {
  it("names the only action that moves the match score", () => {
    expect(fixAxis("add_skill")).toBe("match")
  })

  it("routes wording repairs to content, never to the match", () => {
    for (const k of ["rewrite_bullet", "rewrite_summary", "replace_text"]) {
      expect(fixAxis(k)).toBe("content")
    }
  })

  it("routes reasons-to-doubt to credibility", () => {
    expect(fixAxis("fix_dates")).toBe("trust")
    expect(fixAxis("remove_duplicates")).toBe("trust")
  })

  it("stays silent when it cannot promise movement", () => {
    expect(fixAxis("manual")).toBeNull()
    expect(fixAxis(undefined)).toBeNull()
    expect(fixAxis("something_we_added_later")).toBeNull()
  })
})
