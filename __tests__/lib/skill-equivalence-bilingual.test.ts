import { describe, it, expect } from "vitest"
import { findDuplicateSkill } from "@/lib/skills/skill-dedup"
import { partitionByPresence } from "@/lib/ats/core/matching"
import { normalizeTerm } from "@/lib/ats/vocabulary"

// Reported from a real Spanish CV screened against an English posting: the
// report demanded skills the candidate already had, spelled in Spanish, and
// offered to add the English spelling next to them.
describe("bilingual skill equivalence", () => {
  const pairs: [string, string][] = [
    ["code review", "Revisión de código"],
    ["memory management", "Gestión de memoria"],
    ["debugging", "Depuración"],
    ["unit testing", "Pruebas unitarias"],
    ["performance optimization", "Optimización del rendimiento"],
    ["design patterns", "Patrones de diseño"],
    ["technical debt", "Deuda técnica"],
    ["mobile development", "Desarrollo móvil"],
  ]

  it.each(pairs)("treats %s as already covered by %s", (english, spanish) => {
    expect(findDuplicateSkill(english, [spanish])).toBe(spanish)
  })

  it("still tells genuinely different skills apart", () => {
    expect(findDuplicateSkill("Kubernetes", ["Revisión de código", "Swift"])).toBeNull()
    expect(findDuplicateSkill("code review", ["Swift", "Core Data"])).toBeNull()
  })
})

describe("the matcher sees the Spanish spelling of an English requirement", () => {
  it.each([
    ["code review", "Realicé revisión de código en cada sprint."],
    ["memory management", "Optimicé la gestión de memoria en Swift."],
    ["unit testing", "Escribí pruebas unitarias exhaustivas."],
  ])("finds %s in the CV text", (needle, haystack) => {
    const { matched } = partitionByPresence([needle], normalizeTerm(haystack))
    expect(matched).toEqual([needle])
  })
})
