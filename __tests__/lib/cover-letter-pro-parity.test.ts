import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"
import { LTR_PRO_IDS, isProCoverLetterTemplate } from "@/lib/cover-letter/pro-templates"

// The picker in the editor and the gate on the server must answer "is this template
// premium" identically. They live in different files because one is a client component
// and the other runs in a route, so the only thing keeping them honest is this test:
// it READS the editor's own list instead of re-declaring it, which is what makes adding
// a template in one place and forgetting the other a red build rather than a free
// download. (Same reasoning as __tests__/lib/bullet-reader-ownership.test.ts.)

const EDITOR = join(process.cwd(), "components/cover-letter/CoverLetterEditor.tsx")

/** Ids the editor itself marks `pro: true`. */
function proIdsDeclaredInEditor(): string[] {
  const src = readFileSync(EDITOR, "utf8")
  const ids: string[] = []
  for (const line of src.split("\n")) {
    const m = line.match(/\{\s*id:\s*"([a-z0-9]+)"[^}]*pro:\s*true/i)
    if (m) ids.push(m[1])
  }
  return ids
}

describe("cover-letter premium templates: one answer, two surfaces", () => {
  it("finds the editor's list (the test is worthless if the regex stops matching)", () => {
    expect(proIdsDeclaredInEditor().length).toBeGreaterThan(40)
  })

  it("every template the editor locks is premium on the server too", () => {
    const missing = proIdsDeclaredInEditor().filter((id) => !LTR_PRO_IDS.includes(id))
    expect(missing, `premium in the editor but FREE to download: ${missing.join(", ")}`).toEqual([])
  })

  it("every template the server gates is locked in the editor too", () => {
    const declared = new Set(proIdsDeclaredInEditor())
    const extra = LTR_PRO_IDS.filter((id) => !declared.has(id))
    expect(extra, `gated on the server but shown unlocked in the picker: ${extra.join(", ")}`).toEqual([])
  })

  it("the free template stays free", () => {
    expect(isProCoverLetterTemplate("elegant")).toBe(false)
    expect(isProCoverLetterTemplate(null)).toBe(false)
    expect(isProCoverLetterTemplate(undefined)).toBe(false)
  })

  it("recognises a premium id", () => {
    expect(isProCoverLetterTemplate("ltrmeridian")).toBe(true)
    expect(isProCoverLetterTemplate("executive")).toBe(true)
  })
})
