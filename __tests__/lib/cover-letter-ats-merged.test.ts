import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * El chequeo ATS dejó de ser una pestaña aparte.
 *
 * Corre en el navegador con `analyzeCoverLetterAts` y NO gasta un solo token, así
 * que tenerlo separado nunca ahorró nada: sólo obligaba a cambiar de pestaña para
 * ver la nota de la carta recién escrita. Y traía SU PROPIA caja de "pegá la
 * oferta", duplicando la del generador — el mismo pedido dos veces, en dos
 * pantallas, compartiendo estado sin que el usuario pudiera saberlo.
 *
 * EL RIESGO DE ESTA MUDANZA, y por eso existe este test: la nota ATS es PRO. Un
 * panel que cambia de lugar y pierde su gate regala una función de pago, y esa
 * clase de cambio se pregunta antes — nunca es una nota al pie.
 */
const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8")
const PANEL = "components/cover-letter/CoverLetterAtsPanel.tsx"
const EDITOR = "components/cover-letter/CoverLetterEditor.tsx"

describe("el gate PRO sobrevive a la mudanza", () => {
  it("el panel sigue decidiendo por sí mismo con isPro", () => {
    const src = read(PANEL)
    expect(src).toMatch(/if \(!isPro\)/)
  })

  it("el editor le sigue pasando isPro real, no un true fijo", () => {
    const src = read(EDITOR)
    expect(src).toMatch(/<CoverLetterAtsPanel[\s\S]{0,400}isPro=\{isPro\}/)
    expect(src).not.toMatch(/<CoverLetterAtsPanel[\s\S]{0,400}isPro=\{true\}/)
  })
})

describe("una sola caja para la oferta, una pestaña menos", () => {
  it("el panel ATS ya no pide la oferta por su cuenta", () => {
    const src = read(PANEL)
    expect(src).not.toContain("onJobDescriptionChange")
    expect(src).not.toContain("ats_jd_placeholder")
  })

  it("el panel sigue LEYENDO la oferta que se pegó arriba", () => {
    expect(read(PANEL)).toContain("jobDescription")
    expect(read(EDITOR)).toMatch(/<CoverLetterAtsPanel[\s\S]{0,400}jobDescription=\{jobDescription\}/)
  })

  it("la pestaña ATS ya no existe", () => {
    const src = read(EDITOR)
    expect(src).not.toContain('sidebarTab === "ats"')
    expect(src).not.toContain('t("tab_ats")')
    expect(src).toMatch(/useState<"content" \| "templates" \| "ai">/)
  })

  it("el panel vive dentro de la pestaña de IA", () => {
    const src = read(EDITOR)
    const ai = src.indexOf('{sidebarTab === "ai" && (')
    const panel = src.indexOf("<CoverLetterAtsPanel")
    expect(ai).toBeGreaterThan(-1)
    expect(panel).toBeGreaterThan(ai)
  })

  /** Claves muertas = texto que nadie muestra y que alguien mantiene igual. */
  it("no quedaron claves i18n huérfanas de la pestaña vieja", () => {
    for (const loc of ["es", "en"]) {
      const m = JSON.parse(read(`messages/${loc}.json`)).cover_letter_editor
      for (const k of ["tab_ats", "ats_jd_label", "ats_jd_placeholder", "ats_improve_with_job"]) {
        expect(m[k], `${loc}/${k}`).toBeUndefined()
      }
    }
  })
})
