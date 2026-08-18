import { describe, it, expect } from "vitest"
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { TEMPLATES } from "@/types/resume"

// A badge is a claim, and this one names a format recruiters know. It has to keep being
// true after somebody redesigns a template: the flag is metadata, the design is code, and
// nothing but a test stops the two drifting. So this READS the template component and
// re-derives the answer instead of trusting the flag.
//
// Harvard format, as the badge uses it: one column of content, no photo, no decorative
// graphics — hierarchy carried by type alone. Deliberately NOT a claim of endorsement by
// the university; the pill's tooltip says "Formato Harvard" for exactly that reason.

const DIR = join(process.cwd(), "components/resume/templates")
const PREVIEW = join(process.cwd(), "components/resume/ResumePreview.tsx")

/** id → component file, read from the one registry that decides what renders. */
function fileFor(id: string): string | null {
  const src = readFileSync(PREVIEW, "utf8")
  const m = src.match(new RegExp(`"?${id.replace(/[-]/g, "\\-")}"?:\\s*dynamic\\(\\(\\) => import\\("\\./templates/([A-Za-z0-9_-]+)"\\)`))
  return m ? m[1] : null
}

const harvard = TEMPLATES.filter((t) => t.harvard)

describe("Harvard-format badge tells the truth", () => {
  it("flags a meaningful number of templates (a silent zero would pass every other test)", () => {
    expect(harvard.length).toBeGreaterThanOrEqual(5)
  })

  it("every flagged template is single-column and photo-less", () => {
    const wrong = harvard.filter((t) => t.columns !== "single" || t.hasPhoto).map((t) => t.id)
    expect(wrong, `Flagged Harvard but two-column or with photo: ${wrong.join(", ")}`).toEqual([])
  })

  it("no flagged template flows its EXPERIENCE through a multi-column grid", () => {
    // The number of columns alone is not the test, and getting that wrong is easy: ATS
    // Cardinal lays its LANGUAGES out in three columns, which no recruiter would call a
    // magazine. What disqualifies a template is the work history itself running through
    // a multi-column grid — that is Editorial Serif ("Three-column body") and Plume, and
    // it is also what makes a parser read the columns interleaved.
    const offenders: string[] = []
    for (const t of harvard) {
      const f = fileFor(t.id)
      if (!f || !existsSync(join(DIR, `${f}.tsx`))) continue
      const src = readFileSync(join(DIR, `${f}.tsx`), "utf8")
      for (const m of src.matchAll(/gridTemplateColumns:\s*"([^"]+)"/g)) {
        if (m[1].trim().split(/\s+/).length < 2) continue
        // Whatever the grid renders FIRST is what the grid is for. ATS Cobalt opens a
        // "1fr 210px" for its header (name + contacts) and the work history appears far
        // below it, outside — a plain look-ahead reads that as body flow and is wrong.
        const after = src.slice(m.index ?? 0, (m.index ?? 0) + 2500)
        const body = after.search(/visible\("workExperience"\)|workExperience\.map|experience\.map/)
        const other = after.search(/firstName|contacts|languages|skillGroups|skillBars|d\.skills/)
        if (body >= 0 && (other < 0 || body < other)) {
          offenders.push(t.id)
          break
        }
      }
    }
    expect(offenders, `Flagged Harvard but the work history flows in columns: ${offenders.join(", ")}`).toEqual([])
  })

  it("no flagged template draws charts, bars or rings", () => {
    const offenders: string[] = []
    for (const t of harvard) {
      const f = fileFor(t.id)
      if (!f || !existsSync(join(DIR, `${f}.tsx`))) continue
      const src = readFileSync(join(DIR, `${f}.tsx`), "utf8")
      if (/<svg|LxRing|ABars|<circle|strokeDasharray/.test(src)) offenders.push(t.id)
    }
    expect(offenders, `Flagged Harvard but draws graphics: ${offenders.join(", ")}`).toEqual([])
  })

  it("every flagged id resolves to a component that still exists", () => {
    const ghosts = harvard.filter((t) => {
      const f = fileFor(t.id)
      return !f || !existsSync(join(DIR, `${f}.tsx`))
    }).map((t) => t.id)
    expect(ghosts, `Flagged Harvard but has no component: ${ghosts.join(", ")}`).toEqual([])
  })
})
