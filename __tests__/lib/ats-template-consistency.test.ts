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
  /**
   * SE SIMPLIFICÓ AL BORRAR EL BLOQUE DE VERIFICACIÓN.
   *
   * Antes esto vivía dentro de aquel bloque y tenía dos mitades: la descarga para
   * quien usa dos columnas, y un mensaje verde —«tu plantilla ya parsea limpio»—
   * para el resto. Ese mensaje era ruido: le decía a la mayoría que todo estaba
   * bien en un panel cuyo trabajo es señalar lo que no lo está, y encima aparecía
   * junto a un aviso que decía lo contrario.
   *
   * Queda la mitad que ES una acción: la descarga, y sólo para quien la necesita.
   */
  it("sólo se pinta con una plantilla que penaliza", () => {
    const panel = read("components/editor/ATSScorePanel.tsx")
    expect(panel).toMatch(/templateSafety === "caution" &&[\s\S]{0,120}AtsSafeDownload/)
  })

  it("y no queda el mensaje que le decía a todos que todo estaba bien", () => {
    expect(read("components/editor/ATSScorePanel.tsx")).not.toContain("template_already_ats")
  })
})
