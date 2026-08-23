import { describe, it, expect } from "vitest"
import { toFirstPersonOpener, opensInThirdPersonEs, opensInThirdPersonEn } from "@/lib/services/ai/shared/bullet-quality"

/**
 * LA TERCERA PERSONA SE CORRIGE, NO SE BORRA (CEO, 2026-08-22).
 *
 * Una reescritura de alto impacto no puede morir por un solo defecto de forma.
 * «Ejecutó suites con Selenium reduciendo el retrabajo» es una gran línea con un
 * único problema: el verbo. Antes tailor la descartaba entera; ahora arregla la
 * apertura a primera persona y la conserva. El CEO pidió las dos ramas igual de
 * sólidas.
 */
describe("español: -ó/-ió a primera persona", () => {
  const casos: Array<[string,string]> = [
    ["• Ejecutó las pruebas de regresión", "• Ejecuté las pruebas de regresión"],
    ["Coordinó el equipo de soporte", "Coordiné el equipo de soporte"],
    ["Definió el alcance del proyecto", "Definí el alcance del proyecto"],
    ["Escribió la documentación del módulo", "Escribí la documentación del módulo"],
    ["Dirigió la migración de datos", "Dirigí la migración de datos"],
    ["Creó el tablero comercial", "Creé el tablero comercial"],
  ]
  for (const [inp,out] of casos) {
    it(inp, () => expect(toFirstPersonOpener(inp, "es")).toBe(out))
  }
  it("no toca lo que ya está en primera persona", () => {
    expect(toFirstPersonOpener("Ejecuté el arqueo de caja", "es")).toBe("Ejecuté el arqueo de caja")
  })
  it("quita el pronombre singular y corrige el verbo", () => {
    expect(toFirstPersonOpener("Él coordinó el equipo de soporte", "es")).toBe("Coordiné el equipo de soporte")
    expect(toFirstPersonOpener("Ella dirigió la migración", "es")).toBe("Dirigí la migración")
  })
  it("NO toca el plural: «Ellos» habla de otras personas, cambiar el sentido sería peor", () => {
    expect(toFirstPersonOpener("Ellos construyeron el pipeline", "es")).toBe("Ellos construyeron el pipeline")
    expect(opensInThirdPersonEs("Ellos construyeron el pipeline")).toBe(false)
  })
})

describe("inglés: quita el pronombre de tercera persona", () => {
  const casos: Array<[string,string]> = [
    ["• He managed the mobile team", "• Managed the mobile team"],
    ["She led the migration to SwiftUI", "Led the migration to SwiftUI"],
  ]
  for (const [inp,out] of casos) {
    it(inp, () => expect(toFirstPersonOpener(inp, "en")).toBe(out))
  }
  it("no toca una línea que ya abre con verbo", () => {
    expect(toFirstPersonOpener("Managed the mobile team", "en")).toBe("Managed the mobile team")
  })
  it("NO toca «They»: es un equipo, no el candidato", () => {
    expect(toFirstPersonOpener("They built the CI pipeline", "en")).toBe("They built the CI pipeline")
    expect(opensInThirdPersonEn("They built the CI pipeline")).toBe(false)
  })
})

describe("los detectores siguen distinguiendo bien", () => {
  it("es reconoce tercera persona y no la primera", () => {
    expect(opensInThirdPersonEs("Ejecutó la tarea")).toBe(true)
    expect(opensInThirdPersonEs("Ejecuté la tarea")).toBe(false)
  })
  it("en reconoce el pronombre y no un verbo suelto", () => {
    expect(opensInThirdPersonEn("He managed the team")).toBe(true)
    expect(opensInThirdPersonEn("Managed the team")).toBe(false)
  })
  /**
   * El borde teórico, cerrado: una palabra terminada en -ó que NO es un pretérito
   * (un token suelto sin complemento, o una sigla en mayúsculas) no se marca como
   * tercera persona, así que `toFirstPersonOpener` no la toca.
   */
  it("no marca un token suelto ni una sigla que terminan en -ó", () => {
    expect(opensInThirdPersonEs("Coordinó")).toBe(false)          // sin complemento
    expect(opensInThirdPersonEs("TELCÓ ventas regionales")).toBe(false) // sigla
    expect(toFirstPersonOpener("Coordinó", "es")).toBe("Coordinó")
    expect(toFirstPersonOpener("TELCÓ ventas regionales", "es")).toBe("TELCÓ ventas regionales")
    // Y el pretérito real de 2+ palabras sigue cazándose y corrigiéndose.
    expect(opensInThirdPersonEs("Coordinó el equipo")).toBe(true)
  })
})
