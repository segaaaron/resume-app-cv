import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

/**
 * EL INFORME ES LA ÚNICA PUERTA.
 *
 * «El que manda es el ATS. No debería hacerse cosas a ciegas» (CEO, 2026-08-21).
 *
 * `ATSScorePanel.tsx` leía el resultado crudo del servidor 18 veces por su
 * cuenta. Todo lo que salía por esa puerta llegaba a pantalla sin haber pasado
 * por el informe, y por lo tanto sin verificarse contra el CV: de ahí salió el
 * segundo veredicto (`passRisk`) contradiciendo al puntaje, y el cartel que
 * contaba hallazgos que el panel ya no mostraba.
 *
 * ── POR QUÉ ESTE TEST LEE EL CÓDIGO, cuando la regla del proyecto es no hacerlo
 *
 * Porque comprueba una AUSENCIA. De un acceso que no existe no hay
 * comportamiento que ejecutar, y montar el panel entero para verificar de dónde
 * NO lee un dato sería un test más frágil y menos claro. Es el mismo criterio
 * que ya se aplica en `api-fetch-ownership` y `email-send-ownership`.
 *
 * La diferencia con los ~50 asserts que hay que retirar: aquéllos afirman que
 * una cadena ESTÁ presente, y pasan en verde con la funcionalidad rota. Éste
 * falla en cuanto alguien abre una puerta nueva.
 */

/**
 * Lo único que el panel puede leer del crudo, y por qué cada uno.
 *
 * Los dos son INSUMOS: entran antes de que el informe se arme, no después. Un
 * dato que el usuario VE no puede estar en esta lista.
 */
const ALLOWED = {
  // Alimenta `analyzeWriting`, que a su vez es una entrada de `buildPanelReport`.
  // Va río arriba del informe; no es algo que el panel pinte.
  mergePairs: "insumo de analyzeWriting → entra al informe",
  // Estado de la PETICIÓN, no un dato del CV: si el análisis no pudo correr, el
  // informe no existe y no hay nada que pueda decirlo desde adentro.
  analysisUnavailable: "estado de la petición, no un dato del CV",
} as const

describe("el panel no lee el resultado crudo del servidor", () => {
  const src = readFileSync("components/editor/ATSScorePanel.tsx", "utf8")
  const reads = [...src.matchAll(/atsResult\??\.([a-zA-Z]+)/g)].map((m) => m[1])

  it("sólo accede a los insumos declarados", () => {
    const unexpected = [...new Set(reads)].filter((f) => !(f in ALLOWED))
    expect(unexpected).toEqual([])
  })

  /**
   * Los datos que el usuario ve salen del informe, que es lo que se rehace
   * cuando el CV cambia y lo que verifica los hallazgos del modelo.
   */
  it("el puntaje, la vacante y el veredicto vienen del informe", () => {
    for (const field of ["score", "verdict", "posting", "terms"]) {
      expect(src).toMatch(new RegExp(`report\\??\\.${field}`))
    }
  })

  it("y ninguno de esos se sigue leyendo del crudo", () => {
    for (const field of ["score", "analysis", "extractedKeywords", "matchedKeywords", "passRisk"]) {
      expect(reads).not.toContain(field)
    }
  })
})

describe("el informe lleva lo que el panel necesita", () => {
  const report = readFileSync("lib/ats/report.ts", "utf8")

  it("declara la vacante y el veredicto", () => {
    expect(report).toMatch(/posting\?: ReportPosting/)
    expect(report).toMatch(/verdict\?: string/)
  })
})
