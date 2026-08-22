import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { analyzeWriting } from "@/lib/ats/writing-checks"
import { bareYearEvidence } from "@/lib/ats/build-report"

/**
 * Dos sistemas nuestros contradiciéndose en la misma pantalla.
 *
 * Reportado con capturas: arriba "tu layout pierde 19 puntos al parsear" y "tu
 * email no apareció en lo que el ATS extrajo"; abajo, "Parsea limpio en 5 de 5
 * motores" con Workday, Taleo, iCIMS, Greenhouse y Lever en verde.
 *
 * No es un empate técnico: la simulación por motor corre sobre los datos
 * ESTRUCTURADOS y la verificación sobre el PDF REAL renderizado y extraído.
 * Cuando hay medición real, la medición gana — una estimación que la contradice
 * sólo puede hacer que el usuario deje de creerle a las dos.
 */
const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8")
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "")
const PANEL = "components/editor/ATSScorePanel.tsx"

describe("una sola verdad en pantalla", () => {
  /**
   * La simulación por motor se ELIMINÓ del panel (decisión del CEO, 2026-08-20):
   * "si hay dos peleándose, el que gana es el ATS; el otro quitalo".
   *
   * Corría sobre los datos estructurados y decía "parsea limpio en 5 de 5
   * motores" mientras la verificación —que corre sobre el PDF real renderizado y
   * extraído— informaba 19 puntos perdidos y el email fuera del texto. Dos
   * sistemas nuestros contradiciéndose en la misma pantalla.
   *
   * Sigue viva en la herramienta pública gratuita, que es su lugar: ahí no
   * compite contra una medición real.
   */
  it("el panel no muestra la simulación por motor", () => {
    const src = code(PANEL)
    expect(src).not.toContain("AtsEngineMatrix")
  })

  it("pero la herramienta pública la conserva", () => {
    expect(read("components/tools/ats-checker/AtsEngineChecker.tsx")).toContain("AtsEngineMatrix")
  })

  /** Una sola vista: se fue el modo doble y sus dos botones de ida y vuelta. */
  it("no queda el modo doble de vista", () => {
    const src = code(PANEL)
    expect(src).not.toContain('mode === "resume"')
    expect(src).not.toContain('mode === "application"')
    expect(src).not.toContain("setMode(")
    expect(src).not.toContain('t("apply_mode_see_all")')
    expect(src).not.toContain('t("apply_mode_back")')
  })
})

/**
 * "El formato de fecha no me dice nada, no sé dónde hacer el cambio."
 *
 * El aviso decía que había un problema y dejaba al usuario a buscarlo puesto por
 * puesto — la parte que una persona hace peor sobre su propio CV.
 */
describe("las fechas dicen en qué puesto", () => {
  const cv = {
    workExperience: [
      { id: "j1", jobTitle: "Cajero", employer: "Comercial Llanque", startDate: "2015", endDate: "2020", description: "• Arqueo." },
      { id: "j2", jobTitle: "Ejecutivo de Venta", employer: "Campero", startDate: "06/2021", endDate: "12/2022", description: "• Ventas." },
    ],
  }

  it("nombra el puesto que lleva el año pelado", () => {
    const out = analyzeWriting(cv)
    expect(out.dateInconsistency).not.toBeNull()
    const roles = out.dateInconsistency?.jobsMissingMonth ?? []
    expect(roles.map((r) => r.jobTitle)).toContain("Cajero")
    expect(roles.map((r) => r.jobTitle)).not.toContain("Ejecutivo de Venta")
    // Y CUÁL fecha. El cargo solo no dice nada: reportado con captura, el chip
    // decía «Marketing Digital / Community Manager» y se leía como un tema.
    expect(roles.find((r) => r.jobTitle === "Cajero")?.dates).toEqual(["2015", "2020"])
  })

  it("no inventa un aviso cuando todas las fechas tienen el mismo formato", () => {
    const ok = { workExperience: [{ id: "j1", jobTitle: "Cajero", startDate: "06/2015", endDate: "07/2020", description: "• Arqueo." }] }
    expect(analyzeWriting(ok).dateInconsistency).toBeNull()
  })

  /**
   * El aviso de fechas se mudó al riel, y nombrar los puestos dejó de depender de
   * una plantilla con `{jobs}`: el hallazgo lleva su `evidence`, que la fila pinta
   * como una lista. El dato viaja con el hallazgo en vez de interpolarse en una
   * frase — así ningún texto puede quedar sin él.
   */
  /**
   * ESTE TEST LEÍA EL CÓDIGO Y NO PROBABA NADA.
   *
   * Decía `expect(build).toContain("evidence: dates.jobsMissingMonth")` — una
   * cadena que sigue existiendo aunque la evidencia salga vacía, aunque nombre
   * el puesto equivocado, aunque el usuario no pueda entender el chip. Que es
   * exactamente lo que pasó: llegó a pantalla un chip con un cargo pelado y el
   * test estaba en verde. Ahora se ejecuta el informe y se lee lo que sale.
   */
  it("el hallazgo de fechas nombra el puesto Y la fecha que le falta el mes", () => {
    const roles = analyzeWriting(cv).dateInconsistency?.jobsMissingMonth ?? []
    expect(bareYearEvidence(roles)).toEqual(["Cajero · 2015 – 2020"])
  })

  it("un puesto sin fecha legible no queda con el separador colgando", () => {
    expect(bareYearEvidence([{ jobTitle: "Cajero", dates: [] }])).toEqual(["Cajero"])
  })
})
