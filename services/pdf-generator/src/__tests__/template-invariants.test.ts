import fs from "fs"
import path from "path"

const TEMPLATES_DIR = path.resolve(__dirname, "../../../../components/resume/templates")
const DATA_PRINT_LAYOUT_RE = /data-print-layout=/

describe("Resume template invariants", () => {
  let templateFiles: string[]

  beforeAll(() => {
    if (!fs.existsSync(TEMPLATES_DIR)) {
      throw new Error(
        `Templates directory not found at ${TEMPLATES_DIR}. ` +
        `This test must run from within the monorepo.`
      )
    }
    templateFiles = fs
      .readdirSync(TEMPLATES_DIR)
      .filter((f) => f.endsWith(".tsx"))
  })

  it("finds at least one template file", () => {
    expect(templateFiles.length).toBeGreaterThan(0)
  })

  it("every template sets data-print-layout on its root div", () => {
    const missing = templateFiles.filter((file) => {
      const content = fs.readFileSync(path.join(TEMPLATES_DIR, file), "utf8")
      return !DATA_PRINT_LAYOUT_RE.test(content)
    })

    if (missing.length > 0) {
      throw new Error(
        `${missing.length} template(s) missing data-print-layout attribute.\n` +
        `PDF generation will time out for these templates because the selector\n` +
        `".resume-pages > div[data-print-layout]" (contracts.ts) never resolves.\n\n` +
        `Fix: add data-print-layout="single-column|sidebar-left|sidebar-right" to the\n` +
        `root <div> inside .resume-pages in each file below:\n\n` +
        missing.map((f) => `  - components/resume/templates/${f}`).join("\n")
      )
    }
  })
})
