import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * EL EJEMPLO SE MUESTRA, EL ARREGLO SE APLICA. NUNCA AL REVÉS.
 *
 * El ejemplo desarrollado lleva cifras DE MUESTRA para que el candidato vea cómo
 * queda la línea terminada y ponga la suya. Si un botón pudiera aplicarlo, esas
 * cifras entrarían al CV como si fueran de él — el mismo daño que los corchetes
 * que ya llegaron a un PDF una vez, con otra cara.
 *
 * Se lee el fuente porque lo que se comprueba es una AUSENCIA: que no exista un
 * camino de aplicar que toque `exampleHint`. De un botón que no está no hay
 * comportamiento que ejecutar.
 */
const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8")

describe("el ejemplo no tiene camino hacia el CV", () => {
  it("la tarjeta lo pinta, y el botón sólo mira el arreglo", () => {
    const card = read("components/editor/ats-report/FixCard.tsx")
    expect(card, "la tarjeta dejó de mostrar el ejemplo").toContain("check.exampleHint")
    // El bloque del ejemplo no puede contener un onClick: es texto, no acción.
    const bloque = card.slice(card.indexOf("check.exampleHint") - 700, card.indexOf("check.exampleHint") + 300)
    expect(bloque, "el ejemplo ganó un botón: sus cifras son de muestra").not.toMatch(/onClick|onApply/)
  })

  it("el ensamblador los mantiene en campos distintos", () => {
    const build = read("lib/ats/build-report.ts")
    expect(build, "el ejemplo dejó de viajar").toContain("exampleHint: f.example")
    expect(build, "el arreglo dejó de viajar").toContain("fixHint: f.fix")
    expect(build, "el ejemplo se coló como texto aplicable").not.toContain("fixHint: f.example")
  })
})
