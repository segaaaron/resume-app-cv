import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { REPORT_SECTIONS, findDuplicateCheckIds, type AtsReport } from "@/lib/ats/report"

/**
 * "¿Ya nada se cruza?" — CEO, 2026-08-20.
 *
 * La respuesta era "los cruces que encontré, sí": el panel tenía siete bloques,
 * eso son 21 pares posibles, y cada choque se tapaba a mano cuando aparecía una
 * captura. Este archivo enumeraba esos pares uno por uno.
 *
 * YA NO HACE FALTA ENUMERARLOS. Los siete bloques se fueron al informe, donde
 * cada hallazgo declara UNA sección y UN dueño. El cruce dejó de arbitrarse
 * porque dejó de ser construible: no hay dos listas que puedan discrepar cuando
 * hay una sola. Lo que queda por vigilar es que eso siga siendo cierto.
 */
const read = (p: string) => readFileSync(p, "utf8")
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "")
const PANEL = "components/editor/ATSScorePanel.tsx"

describe("el panel ya no tiene bloques que puedan cruzarse", () => {
  it("no queda ningún bloque `ats-*` decidiendo por su cuenta", () => {
    expect(read(PANEL)).not.toMatch(/id="ats-[a-z]+"/)
  })

  /**
   * EL FLUJO, EN UNA SOLA FRASE (CEO, 2026-08-21): «el ATS muestra lo que falta,
   * tailor lo soluciona». El panel no diagnostica ni ofrece arreglos: pinta el
   * riel y abre el ejecutor.
   *
   * Se vigila por CLAVE i18n, no por comentario: un comentario se puede escribir
   * sin que exista el bloque, y un bloque puede volver sin comentario. La clave
   * sólo está si algo la renderiza.
   */
  it("el panel no vuelve a ofrecer arreglos por su cuenta", () => {
    const src = code(PANEL)
    for (const muerto of [
      "fix_all_button", // «arreglar todo lo que pueda» — el mismo trabajo dos veces
      "apply_mode_title",    // «esta postulación» — su propia lista de acciones
      "section_fixes",       // «② qué arreglar» — encabezado de una lista que ya no vive acá
      "parseable_badge",     // sello verde: un hallazgo en estado pasado ocupando pantalla
      "template_caution_title", // la plantilla ya es el chequeo `format.template`
    ]) {
      expect(src, `volvió un bloque viejo: ${muerto}`).not.toContain(muerto)
    }
    expect(src).toContain("<ReportRail")
    expect(src).toContain("<TailorModal")
  })
})

describe("la regla que reemplazó a la matriz", () => {
  it("un hallazgo declara una sola sección, y son seis", () => {
    expect(REPORT_SECTIONS).toHaveLength(6)
  })

  /**
   * El id es la clave con la que el ejecutor dice qué cerró. Repetido, una
   * reescritura cierra el hallazgo equivocado y el panel muestra resuelto algo
   * que nadie tocó: coherente consigo mismo, y falso.
   */
  it("y dos hallazgos no pueden compartir id", () => {
    const dup: AtsReport = {
      score: 50,
      sections: [
        { id: "hard", scoreCategory: "hardSkills", coveragePct: 0, checks: [
          { id: "x", section: "hard", state: "warn", weight: 0, titleKey: "k", owner: "auto", action: { kind: "manual" } },
        ] },
        { id: "tips", scoreCategory: null, coveragePct: null, checks: [
          { id: "x", section: "tips", state: "warn", weight: 0, titleKey: "k", owner: "auto", action: { kind: "manual" } },
        ] },
      ],
      terms: [], bullets: [], overOptimised: false, recoverable: 0, credibility: { score: 100, band: null },
    }
    expect(findDuplicateCheckIds(dup)).toEqual(["x"])
  })

  /** El ensamblador es el único que puede emitir un hallazgo. */
  it("el riel no fabrica hallazgos: sólo pinta los del informe", () => {
    const rail = code("components/editor/ats-report/ReportRail.tsx")
    expect(rail).not.toContain("analyzeWriting")
    expect(rail).not.toContain("computeCredibility")
    expect(rail).toContain("report.sections.map")
  })
})
