import { describe, it, expect } from "vitest"
import { textSignature, matchesApplied } from "@/lib/ats/action-plan"

/**
 * LA MEMORIA DE «YA APLICADO» NO PUEDE TAPAR UNA LÍNEA DISTINTA.
 *
 * ── EL DEFECTO MEDIDO (2026-08-22) ─────────────────────────────────────────
 *
 * Esta memoria existe para que el panel no le vuelva a ofrecer al usuario el
 * texto que él ya aceptó. Comparaba la PROPORCIÓN de palabras compartidas con un
 * corte en 0.80, y con eso suprimía viñetas que no tenían nada que ver:
 *
 *   «…en SwiftUI para el flujo de PAGOS»    vs  «…para el flujo de ONBOARDING»
 *   «pruebas unitarias sobre la capa de RED» vs  «…sobre la capa de DOMINIO»
 *
 * Las dos son líneas reales y distintas de un mismo puesto, y la segunda quedaba
 * SIN AYUDA para siempre. El usuario nunca ve una supresión: ve que el panel
 * dejó de hablarle de esa línea.
 *
 * Y las bandas se solapaban —la misma línea reescrita daba 0.80-0.833, dos
 * líneas distintas 0.667-0.833—, así que ningún umbral las separaba. Es la misma
 * lección que el proyecto ya pagó con los pares de fusión: cuando dos poblaciones
 * se solapan, la pregunta está mal hecha.
 *
 * ── LA PREGUNTA CORRECTA ───────────────────────────────────────────────────
 *
 * ¿SUSTITUYÓ o AMPLIÓ? Una reescritura de la misma línea conserva todo lo que
 * decía; dos líneas distintas se diferencian porque una cambia un término por
 * otro. Eso es binario y no depende de un umbral.
 */
const suprime = (aceptado: string, nuevo: string) => matchesApplied(nuevo, [textSignature(aceptado)])

describe("reconoce la MISMA línea que el usuario ya aceptó", () => {
  it("aunque vuelva reescrita", () => {
    expect(suprime(
      "Integré APIs RESTful para onboarding y pagos con Swift networking",
      "Integré APIs RESTful para los flujos de onboarding y pagos usando Swift networking",
    )).toBe(true)
  })

  it("aunque vuelva con otras comas y un punto final", () => {
    expect(suprime(
      "Coordiné con backend y QA para desbloquear el release mensual",
      "Coordiné con backend, y QA, para desbloquear el release mensual.",
    )).toBe(true)
  })

  it("y cuando sólo le agregaron un dato", () => {
    expect(suprime("Realicé arqueo de caja diario", "Realicé arqueo de caja diario y semanal")).toBe(true)
  })
})

describe("y NO tapa una línea distinta del mismo puesto", () => {
  it("cuando cambia el objeto del trabajo", () => {
    expect(suprime(
      "Desarrollé pantallas en SwiftUI para el flujo de pagos",
      "Desarrollé pantallas en SwiftUI para el flujo de onboarding",
    )).toBe(false)
  })

  /** El caso que el corte de longitud escondía: «red» tiene 3 letras. */
  it("aunque la palabra que las distingue sea corta", () => {
    expect(suprime(
      "Escribí pruebas unitarias sobre la capa de red",
      "Escribí pruebas unitarias sobre la capa de dominio",
    )).toBe(false)
  })

  it("ni una línea que no comparte casi nada", () => {
    expect(suprime(
      "Coordiné con backend y QA para desbloquear el release",
      "Ejecuté el arqueo de caja cuadrando efectivo y comprobantes",
    )).toBe(false)
  })
})
