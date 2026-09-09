import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { SKILLS_MAX } from "@/lib/ats3/ledger"

/**
 * EL TECHO DE HABILIDADES TIENE UN SOLO DUEÑO.
 *
 * ── EL DEFECTO QUE ESTO CIERRA (CEO, 2026-09-09) ─────────────────────────────
 * El corte estaba escrito A MANO y sólo en dos plantillas —`slice(0, 12)`—
 * mientras las otras catorce no cortaban nada. Con cien habilidades, catorce CVs
 * se desbordaban y dos escondían ochenta y ocho sin decirlo. Y el 12 contradecía
 * el 20 que el CEO fijó.
 *
 * Vive en `useAtsData`, que es donde las dieciséis reciben sus datos. Este caso
 * falla si alguien vuelve a escribir un número en una plantilla.
 */
describe("las plantillas ATS reciben las que caben, y el número vive en un solo lugar", () => {
  const dir = "components/resume/templates"

  it("ninguna plantilla corta las habilidades por su cuenta", () => {
    const culpables = readdirSync(dir)
      .filter((f) => f.endsWith(".tsx"))
      .filter((f) => /skills[^\n]*\.slice\(\s*0\s*,\s*\d/.test(readFileSync(`${dir}/${f}`, "utf8")))
    expect(culpables).toEqual([])
  })

  it("el constructor de las ATS aplica el techo, y lo lee de su dueño", () => {
    const src = readFileSync(`${dir}/ats/useAtsData.ts`, "utf8")
    expect(src).toContain('import { SKILLS_MAX } from "@/lib/ats3/ledger"')
    // Las dos salidas que pintan habilidades cortan igual: la lista y las barras.
    expect(src.match(/\.slice\(0, SKILLS_MAX\)/g) ?? []).toHaveLength(2)
    expect(SKILLS_MAX).toBe(20)
  })
})
