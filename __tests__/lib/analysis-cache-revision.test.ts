import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createHash } from "node:crypto"
import { cvValueBar, noHardCodedFactsRule, proseRules } from "@/lib/services/ai/shared/cv-writing-doctrine"

/**
 * Un cambio de prompt que el usuario nunca ve.
 *
 * El analisis se guarda en cache con una clave que incluye una REVISION, y el
 * comentario del codigo lo decia: "bump on any change to what we ask". El
 * 2026-08-20 se cambio la regla de las cifras en la doctrina y esa constante
 * quedo igual, asi que el panel siguio sirviendo la respuesta escrita bajo la
 * regla ANTERIOR. El CEO paso el dia viendo la misma pantalla y concluyendo, con
 * toda razon, que nada de lo que se tocaba servia.
 *
 * El arreglo no es acordarse: es que no haya nada que recordar. La revision
 * incluye una huella de la doctrina, asi que cambiarla invalida el cache sola.
 */
const MOD = readFileSync(join(process.cwd(), "lib/services/ai/modules/AIReviewModule.ts"), "utf8")

describe("la revision del analisis sigue a la doctrina", () => {
  it("la clave se deriva de la doctrina, no de una constante a mano", () => {
    expect(MOD).toContain("const DOCTRINE_FINGERPRINT = createHash")
    /**
     * La FORMA, no el número. Este assert clavaba «v3» y por eso rompía cada vez
     * que alguien bumpeaba la revisión por una razón legítima —un cambio de
     * prompt que la huella de la doctrina no cubre—, que es justamente lo que
     * este archivo quiere que la gente HAGA. Un guard que castiga la conducta
     * correcta enseña a editarlo en vez de a pensarlo.
     *
     * Lo que sí se vigila sigue intacto: que la revisión SE DERIVE de la huella y
     * no sea una constante escrita a mano.
     */
    expect(MOD).toMatch(/const ANALYSIS_REVISION = `v\d+-\$\{DOCTRINE_FINGERPRINT\}`/)
  })

  it("la huella cubre las tres piezas que el prompt inyecta", () => {
    expect(MOD).toMatch(/cvValueBar\("es"\)/)
    expect(MOD).toMatch(/noHardCodedFactsRule\("es"\)/)
    expect(MOD).toMatch(/proseRules\("es"\)/)
  })

  /** Si la doctrina cambia, la huella cambia. Sin esto el arreglo es decorativo. */
  it("una doctrina distinta produce una huella distinta", () => {
    const fp = (extra: string) =>
      createHash("sha256")
        .update(cvValueBar("es") + extra + noHardCodedFactsRule("es") + proseRules("es"))
        .digest("hex")
        .slice(0, 8)
    expect(fp("")).not.toBe(fp(" regla nueva"))
  })

  /** Y la doctrina vigente es la corregida, no la que prohibia toda cifra. */
  it("la doctrina vigente autoriza el rango confirmable", () => {
    expect(noHardCodedFactsRule("es")).toMatch(/RANGO/)
    expect(noHardCodedFactsRule("es")).not.toMatch(/escribi la linea sin numero/i)
  })
})
