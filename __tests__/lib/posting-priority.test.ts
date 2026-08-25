import { describe, it, expect } from "vitest"
import { measurePostingPriority, weightOf, BASE_WEIGHT, MIN_WEIGHT, MAX_WEIGHT } from "@/lib/ats/posting-priority"

/**
 * LA PRIORIDAD SE MIDE SOBRE EL AVISO, Y POR ESO ES REPRODUCIBLE.
 *
 * El primer intento de F2 colgaba el peso del ORDEN en que el modelo devolvía
 * las duras: el mismo CV y la misma vacante daban 81 o 62 según cómo llegara la
 * lista. Acá el peso sale del texto, así que la misma vacante da el mismo peso
 * siempre — que es lo único que permite prometer un puntaje reproducible.
 */
describe("la prioridad sale del texto del aviso", () => {
  it("el término del título pesa más que uno del cuerpo", () => {
    const w = measurePostingPriority(["Salesforce", "Excel"], {
      posting: "Administrador Salesforce. Se requiere Salesforce y Excel.",
      jobTitle: "Administrador Salesforce",
    })
    expect(w["salesforce"]).toBeGreaterThan(w["excel"])
  })

  it("el término que el aviso repite pesa más que el mencionado una vez", () => {
    const w = measurePostingPriority(["Python", "Ruby"], {
      posting: "Buscamos Python. Python a diario. Dominio de Python. También Ruby.",
      jobTitle: "Backend",
    })
    expect(w["python"]).toBeGreaterThan(w["ruby"])
  })

  it("el que vive SÓLO bajo «deseable» pesa menos: lo dijo el propio aviso", () => {
    const w = measurePostingPriority(["Java", "Scala"], {
      posting: "Se requiere Java.\nDeseable: Scala",
      jobTitle: "Backend",
    })
    expect(w["scala"]).toBeLessThan(w["java"])
  })

  it("un término exigido que ADEMÁS aparece en deseables no se castiga", () => {
    // "Kotlin" se pide en el cuerpo y reaparece dentro de "Kotlin Multiplatform"
    // bajo deseable. Castigarlo por eso sería leer al revés lo que el aviso dice.
    const w = measurePostingPriority(["Kotlin"], {
      posting: "Se requiere Kotlin todos los días.\nDeseable: Kotlin Multiplatform",
      jobTitle: "Android",
    })
    expect(w["kotlin"]).toBeGreaterThanOrEqual(BASE_WEIGHT)
  })

  it("EL ORDEN DE LA LISTA NO CAMBIA NINGÚN PESO", () => {
    const terminos = ["Swift", "SwiftUI", "Fastlane", "XCTest"]
    const aviso = { posting: "iOS con Swift y SwiftUI. Swift es central. XCTest.\nDeseable: Fastlane", jobTitle: "iOS Developer" }
    const a = measurePostingPriority(terminos, aviso)
    const b = measurePostingPriority([...terminos].reverse(), aviso)
    expect(a).toEqual(b)
  })

  it("todo peso queda dentro de la banda", () => {
    const w = measurePostingPriority(["Swift", "Fastlane", "Git"], {
      posting: "Swift Swift Swift Swift Swift.\nDeseable: Fastlane",
      jobTitle: "Swift Engineer",
    })
    for (const v of Object.values(w)) {
      expect(v).toBeGreaterThanOrEqual(MIN_WEIGHT)
      expect(v).toBeLessThanOrEqual(MAX_WEIGHT)
    }
  })

  /**
   * Los dos que encontró QA sobre este mismo módulo, antes de subirlo.
   */
  it("un encabezado se busca como PALABRA: «plusvalía» no abre la sección deseable", () => {
    // «plusvalía» contiene «plus». Con un indexOf a secas, un aviso de contador
    // abría la sección opcional en su primera línea y TODA su lista quedaba
    // descontada — el CV perdía puntaje por una palabra del rubro.
    const w = measurePostingPriority(["SAP", "Excel"], {
      posting: "Contador. Cálculo de plusvalía con SAP. Se requiere Excel avanzado y SAP.",
      jobTitle: "Contador",
    })
    expect(w["sap"]).toBeGreaterThanOrEqual(BASE_WEIGHT)
    expect(w["excel"]).toBeGreaterThanOrEqual(BASE_WEIGHT)
  })

  it("nombrado por un ALIAS también está nombrado, y se descuenta si es deseable", () => {
    // El aviso dice «integración continua»; el término extraído es «CI/CD». Son
    // lo mismo para el matcher, así que tienen que serlo también acá: contarlo
    // como cero dejaba sin descuento a un término que el aviso puso en deseables.
    const w = measurePostingPriority(["CI/CD", "Docker"], {
      posting: "Backend. Se requiere Docker.\nDeseable: integración continua",
      jobTitle: "Backend",
    })
    expect(w["ci/cd"]).toBeLessThan(w["docker"])
  })

  it("falla ABIERTO: sin aviso y sin mapa, todo vale lo mismo", () => {
    const w = measurePostingPriority(["Docker"], { posting: "", jobTitle: "" })
    expect(w["docker"]).toBe(BASE_WEIGHT)
    // Y un consumidor sin mapa —un re-cálculo viejo— no puede romperse.
    expect(weightOf("cualquier cosa", undefined)).toBe(BASE_WEIGHT)
    expect(weightOf("no medido", { otro: 1.5 })).toBe(BASE_WEIGHT)
  })
})
