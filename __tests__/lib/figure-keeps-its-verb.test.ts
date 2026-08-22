import { describe, it, expect } from "vitest"
import { figureLosesItsVerb, losesStatedFigure } from "@/lib/services/ai/shared/ai-helpers"

/**
 * UNA CIFRA SIN SU VERBO NO ES UN DATO, ES RUIDO QUE PARECE UN DATO.
 *
 * Reportado con captura el 2026-08-21, sobre la reescritura que el panel ofrecía
 * aplicar. Ningún guard lo veía y cada uno tenía su razón: `losesStatedFigure`
 * compara DÍGITOS y el 15 y el 20 seguían ahí; `dropsContentWithoutGain` mide
 * si el texto se achicó y no se achicó.
 */
const ORIGINAL =
  "Implementar estrategias comerciales y promociones orientadas a la rotación de productos, logrando aumentar las ventas entre un 15% y 20%."

describe("el caso reportado", () => {
  const ROTO = "Ejecuté estrategias comerciales y promociones para rotación de productos, aplicando criterios de salida de ítems de baja rotación y logrando ventas de 15% a 20%."

  it("el guard de la cifra no lo veía, y hacía bien lo suyo", () => {
    expect(losesStatedFigure(ORIGINAL, ROTO)).toBe(false)
  })

  it("el guard nuevo sí", () => {
    expect(figureLosesItsVerb(ORIGINAL, ROTO)).toBe(true)
  })

  it("y deja pasar la reescritura que conserva el sentido", () => {
    const bien = "Ejecuté estrategias comerciales para rotación de productos, aumentando las ventas entre un 15% y 20%."
    expect(figureLosesItsVerb(ORIGINAL, bien)).toBe(false)
  })
})

describe("dónde NO opina", () => {
  /** Sin verbo de cambio no hay sentido que perder: la cifra se sostiene sola. */
  it("una cifra sin verbo de cambio", () => {
    expect(figureLosesItsVerb("Gestioné 40 cuentas clave.", "Gestión de 40 cuentas clave del segmento corporativo.")).toBe(false)
  })

  it("una línea sin cifras", () => {
    expect(figureLosesItsVerb("Atendí clientes en sala.", "Atención a clientes en sala de ventas.")).toBe(false)
  })

  /** Si además se llevó la cifra, eso ya lo dice `losesStatedFigure`. */
  it("cuando la cifra desapareció del todo, deja hablar al otro guard", () => {
    expect(figureLosesItsVerb(ORIGINAL, "Ejecuté estrategias comerciales de rotación.")).toBe(false)
    expect(losesStatedFigure(ORIGINAL, "Ejecuté estrategias comerciales de rotación.")).toBe(true)
  })
})

describe("las dos ramas de idioma, porque el prompt es bilingüe", () => {
  const EN = "Cut onboarding time by 30% across the retail network."

  it("inglés: pierde el verbo", () => {
    expect(figureLosesItsVerb(EN, "Onboarding time of 30% across the retail network.")).toBe(true)
  })

  it("inglés: lo conserva reconjugado", () => {
    expect(figureLosesItsVerb(EN, "Reduced onboarding time by 30% across the retail network.")).toBe(false)
  })

  /** Reconjugar no es perder: «aumentar» → «aumentando» es la misma afirmación. */
  it("español: reconjugado sigue valiendo", () => {
    expect(figureLosesItsVerb(ORIGINAL, "Aumenté las ventas entre un 15% y 20% con promociones de rotación.")).toBe(false)
  })
})
