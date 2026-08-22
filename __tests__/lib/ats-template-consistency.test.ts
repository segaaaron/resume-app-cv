import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { getTemplateAtsSafety, applyTemplatePenalty } from "@/lib/ats/template-ats-safety"
import { TEMPLATES } from "@/types/resume"

/**
 * "Uso una plantilla ATS y el panel igual me ofrece descargar una versión ATS."
 *
 * Reportado con captura. El bloque "tu diseño para las personas · tu versión ATS
 * para las máquinas" se pintaba SIEMPRE, incluso con una plantilla de una sola
 * columna que no recibe ninguna penalización. Se lee como "la plantilla que
 * elegiste no sirve para ATS" — lo contrario de lo que el catálogo le vendió y de
 * lo que el score calcula. El comentario del propio componente lo delata: fue
 * escrito para quien usa DOS columnas.
 *
 * Una herramienta que se contradice a sí misma no es confiable, y ésa era la
 * queja de fondo.
 */
const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8")
const PANEL = "components/editor/ATSScorePanel.tsx"

describe("el catálogo y el score no se contradicen", () => {
  /** Si vendemos una plantilla como ATS, no puede estar penalizada. */
  it("ninguna plantilla que se vende como ATS es de dos columnas", () => {
    const sold = TEMPLATES.filter(
      (t) => /ats/i.test(t.name) || /ats/i.test(t.description ?? ""),
    )
    expect(sold.length).toBeGreaterThan(0)
    const penalized = sold.filter((t) => getTemplateAtsSafety(t.id) === "caution")
    expect(penalized.map((t) => t.id)).toEqual([])
  })

  it("una plantilla segura no recibe descuento en el score", () => {
    expect(applyTemplatePenalty(90, "safe")).toBe(90)
    expect(applyTemplatePenalty(90, "caution")).toBeLessThan(90)
  })
})

describe("la copia en texto plano se ofrece sólo a quien la necesita", () => {
  it("depende de la plantilla, no se pinta siempre", () => {
    const src = read(PANEL)
    expect(src).toContain("getTemplateAtsSafety")
    expect(src).toMatch(/templateSafety === "caution"\s*\?\s*<AtsSafeDownload \/>/)
  })

  it("a quien ya tiene una plantilla limpia se le dice, en los dos idiomas", () => {
    expect(read(PANEL)).toContain('t("template_already_ats")')
    for (const loc of ["es", "en"]) {
      const m = JSON.parse(read(`messages/${loc}.json`)).editor.ats
      expect(m.template_already_ats, loc).toBeTruthy()
    }
  })
})
