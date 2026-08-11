import { describe, it, expect } from "vitest"
import { findDuplicateSkill, containsSkill } from "@/lib/ats/skill-dedup"

const LISTED = ["Swift", "React.js", "Teamwork and communication", "Unit testing", "Objective-C", "Gestión de proyectos"]

/**
 * The rule the Skills section enforces in two places (the dropdown and the
 * manual field): a skill the CV already states, under ANY spelling, is not
 * offered and cannot be typed in twice.
 *
 * It takes two engines because neither covers the other:
 *   findDuplicateSkill  aliases, spacing, near-spellings ("React.js" ⊃ "React")
 *   containsSkill       a term inside a longer one ("Teamwork and
 *                       communication" already covers "communication")
 */
const isDuplicate = (name: string) =>
  !!findDuplicateSkill(name, LISTED) || LISTED.some((l) => containsSkill(name, l))

describe("skills the CV already has", () => {
  it.each(["React", "react.js", "REACT", "Swift", "unit testing", "Objetive-C", "project management"])(
    "blocks %s", (name) => expect(isDuplicate(name)).toBe(true),
  )

  it("blocks a term contained in a longer listed skill", () => {
    // The dedup engine alone returns null here — this is why both run.
    expect(findDuplicateSkill("communication", LISTED)).toBeNull()
    expect(isDuplicate("communication")).toBe(true)
    expect(isDuplicate("Teamwork")).toBe(true)
  })
})

describe("skills that only look similar", () => {
  it.each(["React Native", "Java", "Kubernetes", "Swift Package Manager", "Integration testing"])(
    "allows %s", (name) => expect(isDuplicate(name)).toBe(false),
  )

  it("allows JavaScript even with React.js listed", () => {
    // Measured regression: termPresent expands "js" as an alias of JavaScript
    // and found it inside "React.js", blocking a legitimate skill. containsSkill
    // compares whole normalized words with no alias expansion.
    expect(containsSkill("JavaScript", "React.js")).toBe(false)
    expect(isDuplicate("JavaScript")).toBe(false)
  })

  it("allows the head word of a compound skill the CV lists", () => {
    // Reported from a real iOS CV: with "Swift Package Manager" listed, typing
    // "Swift" cleared the field and the dropdown hid it, so the user concluded
    // the dictionary had no Swift. Both ARE separate dictionary entries.
    const ios = ["Swift Package Manager", "Crash Reporting", "SwiftUI"]
    expect(containsSkill("Swift", "Swift Package Manager")).toBe(false)
    expect(findDuplicateSkill("Swift", ios)).toBeNull()
    expect(containsSkill("React", "React Native")).toBe(false)
    expect(containsSkill("Data", "Core Data")).toBe(false)
    // Still on where it belongs: a phrase the user wrote is not a skill entry,
    // so what it enumerates still counts as already listed.
    expect(containsSkill("Communication", "Teamwork and communication")).toBe(true)
  })

  it("does not treat a longer skill as already covered by a shorter one", () => {
    // "communication" is listed inside a longer skill, but that does not make
    // "Communication skills training" a duplicate — containment is one-way.
    expect(isDuplicate("Communication skills training")).toBe(false)
  })
})

describe("accent-blind recognition", () => {
  it("knows a Spanish skill typed without accents", async () => {
    // The lookup used to key on the raw string, so the dictionary's own
    // "gestión de proyectos" was unknown when typed "gestion de proyectos" —
    // the spelling most people use.
    const { isKnownSkill } = await import("@/lib/ats/skills-dictionary")
    expect(isKnownSkill("gestion de proyectos")).toBe(true)
    expect(isKnownSkill("gestión de proyectos")).toBe(true)
    expect(isKnownSkill("comunicacion")).toBe(true)
    expect(isKnownSkill("Atención al Paciente")).toBe(true)
  })
})
