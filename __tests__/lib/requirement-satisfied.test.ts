import { describe, it, expect } from "vitest"
import { checkRequirement, refineMissingRequirements, requirementHaystack } from "@/lib/ats/requirement-satisfied"

/**
 * El panel decía "REQUISITO QUE NO CUMPLÍS: Licenciatura en Ingeniería Comercial…"
 * a un CV cuya sección de educación dice, textual, "Licenciatura en Ingeniería
 * Comercial — Universidad Mayor de San Simón".
 *
 * Dos fallas sumadas: el modelo entrega el requisito como la FRASE ENTERA de la
 * oferta —con sus alternativas— y el matcher preguntaba si esa frase aparecía
 * literal en el CV. Una frase con alternativas no aparece nunca, ni cumpliéndola:
 * un falso negativo que ningún candidato podía satisfacer, y que además le bajaba
 * el techo del score.
 *
 * Un requisito imposible de cumplir no es un requisito: es un aviso que le dice
 * al usuario que no aplique a un puesto para el que sí califica.
 */
const CV = {
  personalDetails: { jobTitle: "Ejecutivo Comercial" },
  education: [{ degree: "Licenciatura en Ingeniería Comercial", institution: "Universidad Mayor de San Simón (UMSS)" }],
  skills: [
    { name: "Gestión de ventas" }, { name: "Prospección de clientes" },
    { name: "Gestión de cartera de clientes" }, { name: "Cierre de ventas" },
    { name: "Técnicas de upselling y cross-selling" }, { name: "Negociación" },
    { name: "Comunicación efectiva" }, { name: "Orientación al cliente" },
  ],
  certifications: [{ name: "Especialista en Marketing Digital" }, { name: "Análisis de Datos con Python" }],
  workExperience: [{ jobTitle: "Ejecutivo Comercial", employer: "Banco Sol", description: "• Gestión de cartera y cierre de ventas." }],
}

describe("el caso reportado", () => {
  const hay = requirementHaystack(CV)

  it("un título que el CV declara NO es un requisito incumplido", () => {
    const r = "Licenciatura en Ingeniería Comercial, Administración de Empresas, Marketing o carreras afines"
    expect(checkRequirement(r, hay).satisfied).toBe(true)
  })

  it("basta UNA alternativa: la oferta ofrece opciones, no exige todas", () => {
    const r = "Ingeniería Comercial, Administración de Empresas o Marketing"
    expect(checkRequirement(r, hay).satisfied).toBe(true)
  })

  /** "Gestión de cartera" cumple "administración de cartera": el CV no es un espejo de la oferta. */
  it("reconoce el requisito aunque el CV lo diga con otras palabras", () => {
    const r = "Manejo comprobado de prospección, administración de cartera de clientes y técnicas de cierre de ventas"
    expect(checkRequirement(r, hay).satisfied).toBe(true)
  })
})

describe("lo que NO puede pasar: decirle que cumple cuando no", () => {
  const hay = requirementHaystack(CV)

  it.each([
    ["un título que no tiene", "Licenciatura en Medicina"],
    ["una certificación ajena", "Certificación PMP vigente"],
    ["una herramienta que no usa", "Manejo avanzado de Salesforce"],
    ["una licencia", "Licencia de conducir categoría C"],
  ])("sigue marcando %s", (_n, req) => {
    expect(checkRequirement(req, hay).satisfied).toBe(false)
  })

  it("un compuesto con una parte ausente no se da por cumplido", () => {
    const r = "Prospección de clientes y certificación Salesforce"
    const v = checkRequirement(r, hay)
    expect(v.satisfied).toBe(false)
  })
})

/**
 * Un párrafo entero como "requisito" es inaccionable. Si la vacante pide tres
 * cosas y el candidato tiene dos, lo útil es nombrar la tercera.
 */
describe("lo que se imprime es lo que falta, no el párrafo", () => {
  it("reduce un compuesto a su parte ausente", () => {
    const out = refineMissingRequirements(["Prospección de clientes y certificación Salesforce vigente"], CV)
    expect(out).toHaveLength(1)
    expect(out[0].toLowerCase()).toContain("salesforce")
    expect(out[0].toLowerCase()).not.toContain("prospección")
  })

  it("saca de la lista los que sí cumple", () => {
    const out = refineMissingRequirements([
      "Licenciatura en Ingeniería Comercial, Administración de Empresas, Marketing o carreras afines",
      "Certificación PMP vigente",
    ], CV)
    expect(out).toEqual(["Certificación PMP vigente"])
  })

  /** Sin CV no hay nada que comprobar: se devuelve tal cual, nunca se inventa que cumple. */
  it("con un CV vacío no da nada por cumplido", () => {
    const reqs = ["Licenciatura en Ingeniería Comercial"]
    expect(refineMissingRequirements(reqs, {})).toEqual(reqs)
  })
})

describe("el texto del CV que se consulta", () => {
  it("incluye educación y certificaciones — el dato que la comprobación nunca miraba", () => {
    const hay = requirementHaystack(CV).toLowerCase()
    expect(hay).toContain("licenciatura en ingeniería comercial")
    expect(hay).toContain("marketing digital")
    expect(hay).toContain("cierre de ventas")
  })
})

/**
 * EL SEGUNDO ACTO DEL MISMO BUG, reportado con captura.
 *
 * Arreglado el requisito compuesto, el modelo empezó a partir las alternativas
 * él mismo: la vacante pedía "Ingeniería Comercial, Administración de Empresas,
 * Marketing o afines" y devolvía TRES requisitos sueltos, uno por carrera. Al
 * llegar separados se pierde que son alternativas, y juzgados de a uno sólo
 * puede cumplirse uno: los otros figuran como incumplidos para cualquier
 * candidato del planeta.
 *
 * Nadie exige dos licenciaturas distintas.
 */
describe("títulos que compiten entre sí, en renglones distintos", () => {
  it("tener uno alcanza — el caso reportado", () => {
    const out = refineMissingRequirements([
      "Licenciatura en Ingeniería Comercial",
      "Licenciatura en Administración de Empresas",
      "Licenciatura en Marketing",
    ], CV)
    expect(out).toEqual([])
  })

  it("si no tiene NINGUNO, siguen listados todos", () => {
    const out = refineMissingRequirements([
      "Licenciatura en Medicina",
      "Licenciatura en Enfermería",
    ], CV)
    expect(out).toHaveLength(2)
  })

  /**
   * LO QUE NO PUEDE AGRUPAR. Dos herramientas distintas no son alternativas:
   * ahí sí hacen falta las dos, y decir que cumple una porque cumple la otra
   * sería mandarlo a la entrevista con una mentira.
   */
  it("no agrupa requisitos que no son credenciales", () => {
    const out = refineMissingRequirements([
      "Manejo avanzado de Salesforce",
      "Certificación PMP vigente",
    ], CV)
    expect(out).toHaveLength(2)
  })

  /**
   * EL MUTANTE QUE SE ME ESCAPÓ. Agrupar por la primera palabra —en vez de por
   * el tipo de credencial— haría que "Manejo de negociación" (que sí cumple)
   * tapara "Manejo avanzado de Salesforce" (que no). Dos herramientas distintas
   * no son alternativas, y decir que cumple una porque cumple la otra lo manda a
   * la entrevista con una mentira.
   */
  it("dos requisitos que empiezan igual pero NO son credenciales siguen separados", () => {
    const out = refineMissingRequirements([
      "Manejo de negociación",
      "Manejo avanzado de Salesforce",
    ], CV)
    expect(out).toEqual(["Manejo avanzado de Salesforce"])
  })

  it("un título cumplido no tapa un requisito de otra clase", () => {
    const out = refineMissingRequirements([
      "Licenciatura en Ingeniería Comercial",
      "Certificación PMP vigente",
    ], CV)
    expect(out).toEqual(["Certificación PMP vigente"])
  })
})
