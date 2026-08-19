// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest"
import { readDeclined, addDeclined, declinedStorageKey } from "@/components/editor/hooks/useDeclinedGaps"

/**
 * "No, that's all" has to still be true after a reload.
 *
 * Reported from a real session: the assistant showed "your CV is complete", and
 * a refresh — or leaving to the CV list and coming back — brought back "did you
 * work anywhere else?" and "add another bullet?". Those answers were useState,
 * so a remount forgot them, and `computeProfileGaps` cannot tell a finished CV
 * from an unfinished one: three roles with four bullets each is a complete CV
 * AND a CV that could hold a fourth. Only the person can say there is no fourth.
 *
 * Reading fresh from storage is exactly what a remount does, so these tests
 * exercise the reload rather than describing it.
 */
describe("declined questions survive a reload", () => {
  beforeEach(() => localStorage.clear())

  it("remembers 'no more experience' once it is read back", () => {
    expect(readDeclined("cv1").has("moreExperience")).toBe(false)
    addDeclined("cv1", "moreExperience")
    // The reload: nothing is carried over in memory.
    expect(readDeclined("cv1").has("moreExperience")).toBe(true)
  })

  it("keeps each role's bullets answer to itself", () => {
    addDeclined("cv1", "moreBullets:w1")
    const back = readDeclined("cv1")
    expect(back.has("moreBullets:w1")).toBe(true)
    // Saying one role is finished must not silence the question for another.
    expect(back.has("moreBullets:w2")).toBe(false)
  })

  it("accumulates answers instead of replacing the last one", () => {
    addDeclined("cv1", "moreBullets:w1")
    addDeclined("cv1", "moreBullets:w2")
    addDeclined("cv1", "moreExperience")
    expect([...readDeclined("cv1")].sort()).toEqual(["moreBullets:w1", "moreBullets:w2", "moreExperience"])
  })

  it("does not leak one CV's answers into another", () => {
    addDeclined("cv1", "moreExperience")
    expect(readDeclined("cv2").has("moreExperience")).toBe(false)
    expect(declinedStorageKey("cv1")).not.toBe(declinedStorageKey("cv2"))
  })

  it("survives junk in storage instead of blanking the assistant", () => {
    localStorage.setItem(declinedStorageKey("cv1"), "{not json")
    expect(readDeclined("cv1").size).toBe(0)
    // And still records new answers over the top of it.
    addDeclined("cv1", "moreExperience")
    expect(readDeclined("cv1").has("moreExperience")).toBe(true)
  })

  it("ignores a stored value of the wrong shape", () => {
    localStorage.setItem(declinedStorageKey("cv1"), JSON.stringify({ moreExperience: true }))
    expect(readDeclined("cv1").size).toBe(0)
  })
})
