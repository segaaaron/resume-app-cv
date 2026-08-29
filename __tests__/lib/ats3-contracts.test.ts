import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
  normalize,
  termKey,
  buildTermIndex,
  termsIn,
  termPresent,
  roleIdFor,
  bulletIdFor,
  nodeHash,
  findingId,
  FINDING_TYPES,
  JobSpecSchema,
  SuggestionSchema,
  TriageDecisionSchema,
  type TermVariants,
} from "@/lib/ats3/contracts"

/**
 * El vocabulario del motor v3.
 *
 * Lo que se prueba acá no es "que las funciones corran": es que NO cometan el
 * error caro. Decirle a alguien que cubre un requisito que no cubre es el único
 * error que un producto de CV no puede permitirse, porque manda a una persona a
 * una entrevista creyendo algo falso.
 */

const idx = (terms: TermVariants[]) => buildTermIndex(terms)

describe("normalización", () => {
  it("iguala mayúsculas, acentos y puntuación sin tocar las palabras", () => {
    expect(normalize("  Atención al   Cliente. ")).toBe("atencion al cliente")
  })

  it("conserva + y # porque distinguen términos reales", () => {
    expect(termKey("C++")).toBe("c++")
    expect(termKey("C#")).toBe("c#")
    expect(termKey("C")).toBe("c")
    // Si se colapsaran, un CV de C figuraría cubriendo C++.
    expect(new Set([termKey("C"), termKey("C++"), termKey("C#")]).size).toBe(3)
  })

  it("la llave de comparación colapsa separadores; la de lectura no", () => {
    expect(termKey("CI/CD")).toBe(termKey("ci-cd"))
    expect(termKey("CI/CD")).toBe(termKey("CI CD"))
    expect(normalize("CI/CD")).toBe("ci cd") // conserva el límite de palabra
  })

  it("NO quita plurales: un stemmer rompería el español", () => {
    expect(termKey("kubernetes")).not.toBe(termKey("kubernete"))
    expect(termKey("soldaduras")).not.toBe(termKey("soldadura"))
  })
})

describe("alias derivados, no curados", () => {
  /**
   * El PDF propone una tabla escrita a mano (k8s = kubernetes). Acá el alias
   * llega del propio aviso: P1 devuelve el canónico junto al texto crudo. Eso
   * funciona igual para "k8s" que para "arqueo de caja" o "soldadura MIG".
   */
  it("reconoce un término por como lo escribió la vacante", () => {
    // Se prueba con `termsIn`, que es la función que el motor USA de verdad.
    // `canonicalOf` hacía lo mismo, no lo llamaba nadie en producción y sólo
    // vivía acá: un test sobre una función que nadie usa no prueba el producto.
    const i = idx([{ canonical: "Kubernetes", variants: ["k8s"] }])
    expect(termsIn(i, "Migré los servicios a K8S")).toEqual(new Set(["Kubernetes"]))
    expect(termsIn(i, "Administré kubernetes en producción")).toEqual(new Set(["Kubernetes"]))
  })

  it("funciona en un oficio sin una sola palabra técnica", () => {
    const i = idx([
      { canonical: "Arqueo de caja", variants: ["cuadre de caja", "arqueos"] },
      { canonical: "Soldadura MIG", variants: ["MIG"] },
    ])
    expect(termsIn(i, "Realicé el cuadre de caja al cierre de cada turno")).toEqual(
      new Set(["Arqueo de caja"]),
    )
  })
})

describe("el error que este módulo existe para no cometer", () => {
  /**
   * Buscar "React" con límites de palabra ENCUENTRA "React Native": un CV que
   * sólo hizo móvil figuraría cubriendo un requisito de web. El PDF nombra el
   * problema y lo deja en el prompt; acá lo resuelve el código.
   */
  it("un término más largo se queda con la aparición", () => {
    const i = idx([
      { canonical: "React", variants: [] },
      { canonical: "React Native", variants: ["RN"] },
    ])
    const found = termsIn(i, "Desarrollé la app con React Native durante tres años")
    expect(found.has("React Native")).toBe(true)
    expect(found.has("React")).toBe(false)
  })

  it("pero React sí cuenta cuando el CV lo dice de verdad", () => {
    const i = idx([
      { canonical: "React", variants: [] },
      { canonical: "React Native", variants: [] },
    ])
    const found = termsIn(i, "Migré el panel interno a React y la app a React Native")
    expect(found.has("React")).toBe(true)
    expect(found.has("React Native")).toBe(true)
  })

  it("Java no implica JavaScript, ni al revés", () => {
    const i = idx([
      { canonical: "Java", variants: [] },
      { canonical: "JavaScript", variants: ["JS"] },
    ])
    expect(termsIn(i, "Servicios en Java con Spring Boot")).toEqual(new Set(["Java"]))
    expect(termsIn(i, "Interfaces en JavaScript")).toEqual(new Set(["JavaScript"]))
  })

  it("no marca presente un término que sólo vive dentro de otra palabra", () => {
    const i = idx([{ canonical: "Go", variants: [] }])
    expect(termPresent(i, "Go", "Gestioné el gobierno del dato")).toBe(false)
    expect(termPresent(i, "Go", "Escribí el servicio en Go")).toBe(true)
  })
})

describe("identidad de los nodos", () => {
  it("el id de una viñeta sale del texto, no de su posición", () => {
    const role = roleIdFor("Cajero", "Banco Sur", "2021-03")
    const a = bulletIdFor(role, "Realicé el arqueo diario", new Set())
    const b = bulletIdFor(role, "Realicé  el   ARQUEO diario ", new Set())
    // Reordenar el CV no puede cambiar el id, y un retoque cosmético tampoco.
    expect(a).toBe(b)
  })

  it("dos líneas idénticas en el mismo puesto NO comparten id", () => {
    const role = roleIdFor("Cajero", "Banco Sur", "2021-03")
    const seen = new Set<string>()
    const a = bulletIdFor(role, "Atendí clientes", seen)
    const b = bulletIdFor(role, "Atendí clientes", seen)
    // Con el mismo id, un arreglo se aplicaría a la línea equivocada.
    expect(a).not.toBe(b)
  })

  it("el hash del nodo ignora lo cosmético", () => {
    expect(nodeHash("Reduje las mermas un 20%")).toBe(nodeHash("reduje  las mermas un 20% "))
    expect(nodeHash("Reduje las mermas un 20%")).not.toBe(nodeHash("Reduje las mermas un 30%"))
  })

  it("el id de un hallazgo es el mismo dentro de tres semanas", () => {
    const one = findingId("b_abc123", "no_metric")
    const two = findingId("b_abc123", "no_metric")
    expect(one).toBe(two)
    expect(findingId("b_abc123", "no_result")).not.toBe(one)
  })
})

/**
 * EL CONTRATO NO PUEDE CONTRADECIR AL PROMPT.
 *
 * Los tres casos de abajo salieron de un 500 en producción (2026-08-29): el
 * prompt ordena "un campo sin dato va en null, NUNCA se omite", el modelo
 * obedeció con el cargo del aviso y el esquema tiró la vacante entera.
 */
describe("los esquemas del modelo aceptan lo que el prompt pide", () => {
  const spec = {
    roleTitleRaw: null,
    roleTitleCanonical: null,
  metricThatMatters: "",
    seniority: null,
    yearsRequired: null,
    domain: null,
    workMode: null,
    language: "es",
    mustHave: [{ skill: "Excel", raw: "Excel avanzado", years: null, category: null }],
    niceToHave: null,
    responsibilities: null,
    softSignals: null,
  }

  it("una vacante sin cargo nombrado NO tira la respuesta entera", () => {
    const r = JobSpecSchema.safeParse(spec)
    expect(r.success).toBe(true)
    expect(r.data?.roleTitleRaw).toBe("")
    expect(r.data?.mustHave).toHaveLength(1)
  })

  it("un requisito ilegible se cae solo; los buenos se entregan", () => {
    const r = JobSpecSchema.safeParse({
      ...spec,
      mustHave: [{ skill: null, raw: null, years: null, category: null }, spec.mustHave[0]],
    })
    expect(r.success).toBe(true)
    expect(r.data?.mustHave.map((m) => m.skill)).toEqual(["Excel"])
  })

  it("un hueco ilegible no borra la reescritura", () => {
    const r = SuggestionSchema.safeParse({
      bulletId: "b_1",
      changed: true,
      text: "Concilié la caja diaria",
      actionVerb: "Concilié",
      keywordsUsed: null,
      claim: null,
      metricType: null,
      placeholders: [{ token: null }, { token: "[n]", type: "SCALE", label: "cantidad", hint: "", evidenceNeeded: "" }],
    })
    expect(r.success).toBe(true)
    expect(r.data?.placeholders.map((p) => p.token)).toEqual(["[n]"])
  })
})

/**
 * EL CANDADO DE LA CLASE, NO DE LOS CASOS.
 *
 * Cinco veces en un día un esquema de este motor tiró una respuesta ENTERA —con
 * la llamada pagada y la pantalla vacía— porque un campo llegó en `null`, que es
 * exactamente lo que el prompt le ordena al modelo hacer con un dato que no
 * tiene. Arreglar los cinco campos no cierra nada: el sexto lo repite.
 *
 * Esto ejecuta cada esquema que valida una respuesta del modelo contra el peor
 * caso posible —TODOS sus campos en null— y exige que no muera. Que el
 * resultado sea útil lo deciden los guards; lo que acá se fija es que una
 * respuesta imperfecta no pueda costarle al usuario la corrida completa.
 */
describe("ningún esquema del motor muere por un null", () => {
  const casos: [string, { safeParse: (v: unknown) => { success: boolean } }, Record<string, unknown>][] = [
    ["la vacante (P1)", JobSpecSchema, {
      roleTitleRaw: null, roleTitleCanonical: null, seniority: null, yearsRequired: null,
      domain: null, workMode: null, language: "es",
      mustHave: null, niceToHave: null, responsibilities: null, softSignals: null,
    }],
    ["la reescritura (P4/P5)", SuggestionSchema, {
      bulletId: null, changed: null, text: null, actionVerb: null, keywordsUsed: null,
      claim: null, metricType: null, placeholders: null, variantWithoutMetric: null,
      measurableAspect: null, declineBasis: null,
    }],
    ["el triage (P3)", TriageDecisionSchema, {
      bulletId: null, verdict: "KEEP", reason: null, relevance: null,
      proposedTopic: null, needsUserConfirm: null,
    }],
  ]
  for (const [nombre, esquema, todoNulo] of casos) {
    it(nombre, () => {
      expect(esquema.safeParse(todoNulo).success, nombre).toBe(true)
    })
  }
})

describe("el vocabulario del motor no tiene piezas muertas", () => {
  it("no hay tipo de hallazgo que nadie emita", () => {
    // Un tipo declarado y sin emisor es vocabulario muerto: tiene clave i18n y
    // sección asignada, y promete una tarjeta que no puede existir. Se lee el
    // motor, porque el defecto es una AUSENCIA y no hay nada que ejecutar.
    const motor = readFileSync(join(process.cwd(), "lib/ats3/engine.ts"), "utf8")
    const huerfanos = FINDING_TYPES.filter((t) => !motor.includes(`"${t}"`))
    expect(huerfanos, `sin emisor: ${huerfanos.join(", ")}`).toEqual([])
  })
})
