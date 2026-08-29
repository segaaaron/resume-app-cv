import { describe, it, expect } from "vitest"
import {
  normalize,
  termKey,
  buildTermIndex,
  canonicalOf,
  termsIn,
  termPresent,
  roleIdFor,
  bulletIdFor,
  nodeHash,
  findingId,
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
    const i = idx([{ canonical: "Kubernetes", variants: ["k8s"] }])
    expect(canonicalOf(i, "K8S")).toBe("Kubernetes")
    expect(canonicalOf(i, "kubernetes")).toBe("Kubernetes")
  })

  it("funciona en un oficio sin una sola palabra técnica", () => {
    const i = idx([
      { canonical: "Arqueo de caja", variants: ["cuadre de caja", "arqueos"] },
      { canonical: "Soldadura MIG", variants: ["MIG"] },
    ])
    expect(canonicalOf(i, "Cuadre de Caja")).toBe("Arqueo de caja")
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
