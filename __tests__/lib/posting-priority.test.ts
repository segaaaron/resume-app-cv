import { describe, it, expect } from "vitest"
import { measurePostingPriority, weightOf, topHardSkills, BASE_WEIGHT, MIN_WEIGHT, MAX_WEIGHT } from "@/lib/ats/posting-priority"

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

/**
 * CUANDO EL AVISO TRAE MÁS DE LAS QUE ENTRAN, SOBREVIVEN LAS QUE EXIGE.
 *
 * ── LA ORDEN (CEO, 2026-08-27) ──────────────────────────────────────────────
 *
 *   «Quiero que entren 20, y las principales deberían ser los skills que
 *    solicita el puesto.»
 *
 * El prompt ya pedía ese orden, pero el orden lo devuelve un modelo y puede
 * cambiar entre dos lecturas del mismo aviso — por eso el peso se mide sobre el
 * TEXTO. El corte usaba el orden del modelo, o sea su opinión justo en el
 * momento en que más importa: cuando hay que descartar.
 *
 * Se comprueba la regla de ordenamiento, que es lo que decide qué sobrevive.
 */
describe("el corte se queda con lo que la vacante exige", () => {
  const AVISO = `iOS Developer (Swift)
Requisitos: Swift, UIKit, Core Data. Trabajamos con Swift todos los días y Swift
es excluyente para el puesto.
Deseable: Kotlin, Flutter, Jenkins`
  const CONTEXTO = { posting: AVISO, jobTitle: "iOS Developer (Swift)" }

  it("una deseable nunca desplaza a una exigida, aunque el modelo la escriba antes", () => {
    // El modelo devolvió las deseables PRIMERO — un orden perfectamente posible,
    // y por eso el corte no puede confiar en él.
    const comoLasDevolvióElModelo = ["Kotlin", "Flutter", "Jenkins", "Swift", "UIKit", "Core Data"]
    expect(topHardSkills(comoLasDevolvióElModelo, 3, CONTEXTO)).toEqual(["Swift", "UIKit", "Core Data"])
  })

  it("el empate lo decide el orden en que llegaron, que es la única señal que queda", () => {
    expect(topHardSkills(["UIKit", "Core Data"], 2, CONTEXTO)).toEqual(["UIKit", "Core Data"])
    expect(topHardSkills(["Core Data", "UIKit"], 2, CONTEXTO)).toEqual(["Core Data", "UIKit"])
  })

  it("si no sobra ninguna, no se reordena nada", () => {
    const tal_cual = ["Kotlin", "Swift"]
    expect(topHardSkills(tal_cual, 5, CONTEXTO)).toEqual(tal_cual)
  })

  it("falla ABIERTO: sin aviso que medir, se conserva el orden del modelo", () => {
    const orden = ["Kotlin", "Flutter", "Swift"]
    expect(topHardSkills(orden, 2, { posting: "", jobTitle: "" })).toEqual(["Kotlin", "Flutter"])
  })
})
