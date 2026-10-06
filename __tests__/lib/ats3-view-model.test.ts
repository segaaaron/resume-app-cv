import { describe, it, expect } from "vitest"
import { anclaDeRespuesta, destinoDeSkill, checkOf, sectionsOf, termsOfSpec, headlineOf } from "@/components/editor/ats3/view-model"
import type { Finding, JobSpec } from "@/lib/ats3/contracts"
import type { AuditFacts, Score } from "@/lib/ats3/score"
import { buildTree } from "@/lib/ats3/engine"

/** Un CV que dice exactamente ese texto. La tabla cuenta sobre el árbol del motor. */
const cvDe = (texto: string) => buildTree({ otherText: texto })

/**
 * LA TRADUCCIÓN ENTRE EL MOTOR Y LA PANTALLA.
 *
 * Lo que se fija acá es que la pantalla no pueda decir algo que el motor no
 * midió ni que el ATS no decidió: ni un porcentaje inventado, ni puntos que el
 * puntaje no vaya a dar, ni una tarjeta en dos secciones.
 */

const finding = (over: Partial<Finding>): Finding => ({
  id: "f1", type: "missing_skill", component: "must", remedy: "ask", nodeId: "b_1",
  nodeText: "Atendí a los clientes", nodeHash: "h", gain: 4, detail: "", ...over,
})

const score = (over: Partial<Score> = {}): Score => ({
  total: 60,
  pillars: { parse: { points: 20, max: 30, ratio: 0.67 }, relevance: { points: 20, max: 70, ratio: 0.29 } },
  components: [
    { key: "must", pillar: "relevance", numerator: 1, denominator: 2, ratio: 0.5, effectiveWeight: 0.27, points: 12, gainPerUnit: 6 },
    { key: "checks", pillar: "parse", numerator: 0, denominator: 0, ratio: 0, effectiveWeight: 0, points: 0, gainPerUnit: 0 },
  ],
  ...over,
})

const audit = (over: Partial<AuditFacts> = {}): AuditFacts => ({
  hard: [], soft: [], ...over,
})

describe("la decisión del ATS, dicha en la forma que la pantalla pinta", () => {
  it("una tarjeta cae en UNA sola sección", () => {
    const secciones = sectionsOf(score(), [finding({ component: "soft" }), finding({ id: "f2", type: "missing_skill", component: "must", remedy: "ask", subject: "Apigee" })])
    const veces = secciones.flatMap((s) => s.checks.map((c) => c.id))
    expect(veces).toHaveLength(new Set(veces).size)
    expect(secciones.find((s) => s.id === "soft")?.checks.map((c) => c.id)).toEqual(["f1"])
    expect(secciones.find((s) => s.id === "hard")?.checks.map((c) => c.id)).toEqual(["f2"])
  })

  it("un componente sin denominador NO se pinta como 0%: no se pudo medir", () => {
    const secciones = sectionsOf(score(), [])
    expect(secciones.find((s) => s.id === "format")?.coveragePct).toBeNull()
    expect(secciones.find((s) => s.id === "hard")?.coveragePct).toBe(50)
  })

  it("una skill sin rastro pregunta; una credencial no tiene botón de IA", () => {
    const ask = checkOf(finding({ type: "missing_skill", component: "must", remedy: "ask", subject: "Apigee", question: "¿Usaste Apigee?" }))
    expect(ask.params).toEqual({ term: "Apigee" })
    expect(ask.question).toBe("¿Usaste Apigee?")
    expect(ask.line).toBeUndefined()
    const cred = checkOf(finding({ type: "missing_skill", component: "must", remedy: "none", subject: "Licencia B" }))
    expect(cred.detailKey).toBe("type_missing_skill_credential_detail")
  })

  it("los puntos que promete la fila son los que midió el motor", () => {
    expect(checkOf(finding({ gain: 1.94 })).weight).toBe(1.9)
  })

  it("no promete más puntos de los que quedan por ganar", () => {
    const secciones = sectionsOf(score({ total: 90 }), [finding({ gain: 40 })])
    expect(headlineOf(score({ total: 90 }), secciones).recoverable).toBe(10)
  })

})

describe("la tabla de skills: el estado lo decide el ATS, las cuentas se miden", () => {
  it("las cuentas se MIDEN sobre el aviso y el CV; el estado sale del diagnóstico", () => {
    const spec = { mustHave: [{ skill: "Excel", raw: "Excel", years: null, category: null }], niceToHave: [], softSignals: ["trabajo en equipo"] } as unknown as JobSpec
    const diag = audit({ hard: [{ skill: "Excel", requirement: "MUST", status: "listed", evidenceNodeId: null, writeIn: null, question: null }] })
    const filas = termsOfSpec(spec, diag, "Buscamos Excel avanzado. Excel es clave.", cvDe("Manejo de Excel en planilla"))
    const excel = filas.find((f) => f.term === "Excel")
    expect(excel?.jd).toBe(2)
    expect(excel?.cv).toBe(1)
    expect(excel?.proven).toBe(false)
    expect(excel?.listOnly).toBe(true)
    expect(filas.find((f) => f.section === "soft")?.term).toBe("trabajo en equipo")
  })

  it("demostrada sin decirlo con esas palabras: la cuenta dice 0 y el estado dice probada", () => {
    const spec = { mustHave: [{ skill: "Atención al público", raw: "atención al público", years: null, category: null }], niceToHave: [], softSignals: [] } as unknown as JobSpec
    const diag = audit({ hard: [{ skill: "Atención al público", requirement: "MUST", status: "demonstrated", evidenceNodeId: "b1", writeIn: null, question: null }] })
    const [fila] = termsOfSpec(spec, diag, "Se requiere atención al público", cvDe("Recibí y orienté a los visitantes"))
    expect(fila.cv).toBe(0)
    expect(fila.proven).toBe(true)
  })

  it("una vacante a medias no tumba la pantalla con el análisis ya pagado", () => {
    expect(() => termsOfSpec({} as JobSpec, null, "aviso", cvDe("cv"))).not.toThrow()
  })
})

describe("la respuesta de la persona va a la línea del puesto donde ese trabajo ya vive", () => {
  it("la que más comparte con lo que contó; sin nada en común, la primera", () => {
    const b = [{ id: "a", text: "Construí el login" }, { id: "b", text: "Integré los servicios del backend a través del gateway" }]
    expect(anclaDeRespuesta(b, "enrutábamos los servicios del backend por Apigee como gateway")).toBe("b")
    expect(anclaDeRespuesta(b, "otra cosa")).toBe("a")
    expect(anclaDeRespuesta([], "x")).toBeNull()
  })
})

describe("dónde escribe la IA una skill que falta", () => {
  const seis = Array.from({ length: 6 }, (_, i) => ({ id: `b${i}`, text: i === 2 ? "Integré los servicios REST del backend" : `Tarea ${i} de la app` }))
  it("con lugar en el puesto, una viñeta nueva", () => {
    expect(destinoDeSkill({ id: "r1", bullets: seis.slice(0, 5) }, "SDK architecture", 6, "b4")).toEqual({ nodeId: "nuevo:r1", nueva: true })
  })
  it("lleno y con una línea de ese trabajo, dentro de ella", () => {
    expect(destinoDeSkill({ id: "r1", bullets: seis }, "servicios del backend", 6, "b5")).toEqual({ nodeId: "b2", nueva: false })
  })
  it("lleno y sin línea que encaje, en lugar de la que menos aporta", () => {
    expect(destinoDeSkill({ id: "r1", bullets: seis }, "Splunk", 6, "b5")).toEqual({ nodeId: "b5", nueva: true })
  })
})
