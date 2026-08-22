import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { computeATSMatch } from "@/lib/services/ai/shared/ats-matcher"
import { normalizeTerm } from "@/lib/ats/vocabulary"

/**
 * «SI ARREGLO ALGO NO SUBE MI SOFT SKILL» (CEO, con captura, 2026-08-22).
 *
 * El panel escribe una viñeta para demostrar una blanda —se la pide al modelo POR
 * NOMBRE—, el usuario la acepta, y el porcentaje de blandas no se mueve.
 *
 * La causa no estaba en el puntaje: estaba en el FORMATO del crédito. El conjunto
 * de blandas demostradas se llena con `normalizeTerm(...)` y se consulta con
 * `has(normalizeTerm(k))`. Un término acreditado tal cual llegó —«Clear
 * communication»— no puede acertar nunca, y nadie ve un `has()` que devuelve
 * false: el defecto es invisible en las dos direcciones.
 *
 * Estos tests corren el matcher de verdad con las dos formas del mismo término.
 */
const KEYWORDS = {
  hardSkills: [],
  softSkills: ["Clear communication"],
  jobTitle: "iOS Developer",
  mustHaves: [],
}
const SECTIONS = { summary: true, work: true, skills: true, education: true }
const CV = "iOS Developer at Acme. Shipped features in Swift."

const softPct = (proven: Set<string>) =>
  computeATSMatch(KEYWORDS, CV, "iOS Developer", SECTIONS, CV, undefined, "iOS Developer", proven).subScores.softSkills

describe("el crédito local de una blanda tiene que hablar el idioma del matcher", () => {
  it("normalizado, la habilidad cuenta", () => {
    expect(softPct(new Set([normalizeTerm("Clear communication")]))).toBeGreaterThan(0)
  })

  it("sin normalizar, el crédito se pierde en silencio", () => {
    expect(softPct(new Set(["Clear Communication"]))).toBe(0)
  })

  it("y el panel acredita normalizado — el único punto por donde entra", () => {
    const src = readFileSync("components/editor/hooks/useATSScore.ts", "utf8")
    const fn = src.slice(src.indexOf("const creditSoftSkill"))
    expect(fn.slice(0, 200)).toContain("normalizeTerm(skill)")
  })
})
