import { describe, it, expect } from "vitest"
import { computeATSMatch } from "@/lib/services/ai/shared/ats-matcher"

/**
 * EL GATE DE F2: ¿CUÁNTO PUEDE MOVER EL PUNTAJE EL SOLO HECHO DE ORDENAR?
 *
 * Ponderar por prioridad es correcto —el referente del mercado lo hace— pero el
 * usuario que abre su CV y ve 61 donde ayer tenía 78, sin haber tocado nada, no
 * lee «mejoramos el algoritmo»: lee que el producto se rompió.
 *
 * La medida honesta del riesgo es el VUELCO: el mismo CV, la misma vacante y la
 * misma lista de requisitos, ordenada al derecho y al revés. Esa diferencia es
 * todo lo que la ponderación puede mover por sí sola, y es exactamente lo que
 * pasaría si una extracción ordenara distinto que la anterior.
 *
 * ── EL RESULTADO, Y POR QUÉ ESTE TEST SIGUE ACÁ ────────────────────────────
 *
 * El primer intento tomaba la prioridad del ORDEN que devolvía el extractor, y
 * con el peso más conservador que distinguía algo el vuelco medido fue de 19
 * puntos: 81 contra 62 para el mismo CV. No entró.
 *
 * La ponderación que SÍ entró mide la prioridad sobre el texto del aviso
 * (`lib/ats/posting-priority.ts`), así que el orden de la lista no la toca —y
 * este test es justamente lo que lo comprueba, ejecutando el matcher con la
 * misma lista al derecho y al revés. Si alguien vuelve a colgar el peso del
 * orden, el vuelco reaparece y esto se pone en rojo.
 */
const secciones = { summary: true, work: true, skills: true, education: true }

const score = (pide: string[], cubre: string[]) => {
  const texto = cubre.join(" ")
  return computeATSMatch(
    { hardSkills: pide, softSkills: [], jobTitle: "", mustHaves: [] },
    texto, "", secciones, texto, undefined, undefined, undefined, undefined, null,
  ).score
}

describe("el vuelco que puede provocar el orden", () => {
  const PIDE = ["Swift", "SwiftUI", "XCTest", "Combine", "CoreData", "Fastlane", "Charles", "Lottie"]

  const casos: Array<[string, string[]]> = [
    ["cubre el núcleo", ["Swift", "SwiftUI", "XCTest", "Combine", "CoreData"]],
    ["cubre la cola", ["Fastlane", "Charles", "Lottie"]],
    ["cubre mitad y mitad", ["Swift", "SwiftUI", "Fastlane", "Charles"]],
    ["cubre todo", PIDE],
    ["no cubre nada", []],
  ]

  for (const [nombre, cubre] of casos) {
    it(`${nombre}: el orden no mueve más de 3 puntos`, () => {
      const alDerecho = score(PIDE, cubre)
      const alReves = score([...PIDE].reverse(), cubre)
      const vuelco = Math.abs(alDerecho - alReves)
      expect(vuelco, `${nombre}: ordenar al revés movió ${vuelco} puntos (${alDerecho} → ${alReves})`)
        .toBeLessThanOrEqual(3)
    })
  }
})
