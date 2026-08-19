import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { inferFieldCategories } from "@/lib/ats/job-field"
import { filterSkills } from "@/lib/ats/skill-catalog"
import { normalizeTerm } from "@/lib/ats/vocabulary"

describe("inferFieldCategories — field from job title", () => {
  it("maps healthcare/design/legal/education titles to their category", () => {
    expect(inferFieldCategories("Registered Nurse")).toContain("healthcare")
    expect(inferFieldCategories("Enfermera")).toContain("healthcare")
    expect(inferFieldCategories("Graphic Designer")).toContain("design")
    expect(inferFieldCategories("Corporate Lawyer")).toContain("legal")
    expect(inferFieldCategories("High School Teacher")).toContain("education")
    expect(inferFieldCategories("Accountant")).toContain("finance")
  })

  it("resolves specific tech roles before the generic engineer fallback", () => {
    expect(inferFieldCategories("iOS Developer")).toContain("mobile")
    expect(inferFieldCategories("Backend Developer")).toContain("backend")
    expect(inferFieldCategories("UX Designer")).toContain("design")
  })

  it("falls back to the dominant category of existing skills when the title is vague", () => {
    expect(inferFieldCategories("Consultant", ["design", "design", "marketing"])).toEqual(["design"])
  })

  it("returns [] when nothing is inferable", () => {
    expect(inferFieldCategories("", [])).toEqual([])
    expect(inferFieldCategories("Consultant", [])).toEqual([])
  })
})

describe("filterSkills — boost ranks the user's field first (never hides)", () => {
  it("floats boosted-category matches to the top within the same match tier", () => {
    // Query 'ca' matches skills across categories; boosting healthcare puts a
    // healthcare match ('care planning' / 'case management') ahead of others.
    const { matches } = filterSkills("care", 8, ["healthcare"])
    expect(matches.length).toBeGreaterThan(0)
    expect(matches[0].category).toBe("healthcare")
  })

  it("still returns non-boosted matches (nothing hidden)", () => {
    const withBoost = filterSkills("java", 8, ["healthcare"])
    // Java-family skills are not healthcare, yet they still appear.
    expect(withBoost.matches.some((m) => m.display.toLowerCase().startsWith("java"))).toBe(true)
  })
})

const all = (title: string) => inferFieldCategories(title)

describe("the two ways a keyword could never match", () => {
  /**
   * Keywords were compared with a plain `includes`, so the two-letter "ux" hit
   * a-UX-iliar and every "Auxiliar contable" in the product was filed under
   * graphic design.
   */
  it("does not match a keyword buried inside another word", () => {
    expect(all("Auxiliar contable")).not.toContain("design")
    expect(all("Auxiliar contable")).toContain("finance")
    expect(all("UX Designer")).toContain("design")
  })

  /**
   * The quieter one: `normalizeTerm` strips accents from the TITLE and the
   * keywords were compared raw, so every accented keyword was dead code —
   * "diseñ", "científico de datos" and "almacén" could never match anything.
   */
  it.each([
    ["Diseñador Gráfico", "design"],
    ["Científico de datos", "data"],
    ["Jefe de almacén", "operations"],
    ["Secretaria jurídica", "legal"],
  ])("matches %s despite the accents", (title, cat) => {
    expect(all(title)).toContain(cat)
  })

  it("resolves the same title with and without accents", () => {
    expect(all("Diseñador Gráfico")).toEqual(all("Disenador Grafico"))
  })

  /**
   * Reads the source, because the defect is an ABSENCE and there is no
   * behaviour to observe: the table is accent-free today, so a behavioural test
   * passes whether or not the normalization step still exists — and the next
   * person to write "diseñ", the natural spelling, would silently reintroduce a
   * keyword that can never fire.
   */
  it("has no keyword that the title normalization could never match", () => {
    const src = readFileSync(join(process.cwd(), "lib/ats/job-field.ts"), "utf8")
    // Only the array literal: the prose around it quotes accented examples on
    // purpose, and reading those would fail the guard for explaining itself.
    const start = src.indexOf("const TITLE_TO_CATEGORY")
    const table = src.slice(src.indexOf("= [", start) + 3, src.indexOf("\n]", start))
    const keywords = [...table.matchAll(/"([^"]+)"/g)].map((m) => m[1])
    expect(keywords.length).toBeGreaterThan(100)
    expect(keywords.filter((k) => normalizeTerm(k) !== k)).toEqual([])
  })
})

/**
 * Office and banking work — the largest slice of this product's market. Ten of
 * these titles returned no category at all, so a secretary and a bank teller got
 * skill suggestions ranked as if they had no field.
 */
describe("the roles that returned nothing", () => {
  it.each([
    ["secretaria", "operations"],
    ["recepcionista", "operations"],
    ["asistente administrativo", "operations"],
    ["jefe de administracion", "operations"],
    ["administrador de empresas", "operations"],
    ["cajero de banco", "finance"],
    ["gerente de sucursal", "finance"],
    ["analista de riesgo", "finance"],
    ["asesor de creditos", "finance"],
    ["oficial de creditos", "finance"],
  ])("%s → %s", (title, cat) => {
    expect(all(title)).toContain(cat)
  })

  it("reads a compound title as both of its fields", () => {
    // A real user's title, verbatim. Two fields is the honest answer.
    expect(all("Administrador de Empresas | Análisis de Riesgo")).toEqual(["operations", "finance"])
  })
})
