import { describe, it, expect } from "vitest"
import { checkOf, sectionsOf, termsOfSpec, headlineOf } from "@/components/editor/ats3/view-model"
import type { Finding, JobSpec } from "@/lib/ats3/contracts"
import type { Score } from "@/lib/ats3/score"

/**
 * LA TRADUCCIÓN ENTRE EL MOTOR NUEVO Y LA PANTALLA DE SIEMPRE.
 *
 * Lo que se fija acá es que la pantalla no pueda decir algo que el motor no
 * midió: ni un porcentaje inventado, ni puntos que el puntaje no vaya a dar, ni
 * un hallazgo en dos secciones.
 */

const finding = (over: Partial<Finding>): Finding => ({
  id: "f1", type: "no_metric", component: "metric", remedy: "rewrite", merged: ["no_metric"], nodeId: "b_1",
  nodeText: "Atendí a los clientes", nodeHash: "h", gain: 4, detail: "", ...over,
})

const score = (over: Partial<Score> = {}): Score => ({
  total: 60,
  pillars: { parse: { points: 20, max: 20, ratio: 1 }, relevance: { points: 20, max: 45, ratio: 0.44 }, impact: { points: 20, max: 35, ratio: 0.57 } },
  components: [
    { key: "must", pillar: "relevance", numerator: 1, denominator: 2, ratio: 0.5, effectiveWeight: 0.27, points: 12, gainPerUnit: 6 },
    { key: "checks", pillar: "parse", numerator: 0, denominator: 0, ratio: 0, effectiveWeight: 0, points: 0, gainPerUnit: 0 },
    { key: "xyz", pillar: "impact", numerator: 1, denominator: 4, ratio: 0.25, effectiveWeight: 0.16, points: 4, gainPerUnit: 4 },
    { key: "metric", pillar: "impact", numerator: 0, denominator: 4, ratio: 0, effectiveWeight: 0.1, points: 0, gainPerUnit: 2 },
  ],
  ...over,
})

describe("el motor v3, dicho en la forma que la pantalla pinta", () => {
  it("un hallazgo cae en UNA sola sección", () => {
    const secciones = sectionsOf(score(), [finding({}), finding({ id: "f2", type: "missing_requirement", component: "must" })])
    const veces = secciones.flatMap((s) => s.checks.map((c) => c.id))
    expect(veces).toHaveLength(new Set(veces).size)
    expect(secciones.find((s) => s.id === "tips")?.checks.map((c) => c.id)).toEqual(["f1"])
    expect(secciones.find((s) => s.id === "hard")?.checks.map((c) => c.id)).toEqual(["f2"])
  })

  it("un componente sin denominador NO se pinta como 0%: no se pudo medir", () => {
    const secciones = sectionsOf(score(), [])
    // Un 0% se lee como "tu CV falla en esto". Castigar por algo que nadie pudo
    // mirar es fabricar un defecto.
    expect(secciones.find((s) => s.id === "format")?.coveragePct).toBeNull()
    expect(secciones.find((s) => s.id === "hard")?.coveragePct).toBe(50)
  })

  it("un requisito que falta TIENE puerta: la línea donde el motor lo ancló", () => {
    // Era un cartel sin botón. El motor ya eligió la viñeta donde ese término
    // encaja mejor: la puerta existía y estaba tapiada. Si el trabajo descrito
    // no lo sostiene, lo rechaza un guard y el usuario ve por qué — que es la
    // respuesta honesta, no un botón que promete lo que no puede cumplir.
    const req = checkOf(finding({ type: "missing_requirement", component: "must", nodeId: "b_7" }))
    expect(req.owner).toBe("tailor")
    expect(req.action?.targetId).toBe("b_7")
  })

  it("los puntos que promete la fila son los que midió el motor", () => {
    expect(checkOf(finding({ gain: 1.94 })).weight).toBe(1.9)
  })

  it("no promete más puntos de los que quedan por ganar", () => {
    // Un dial que ofrece +40 sobre un 90 es una promesa que el puntaje no puede
    // cumplir, y el usuario la cobra como mentira.
    const secciones = sectionsOf(score({ total: 90 }), [finding({ gain: 40 })])
    expect(headlineOf(score({ total: 90 }), secciones).recoverable).toBe(10)
  })

  it("las cuentas de la tabla se MIDEN sobre el aviso y el CV", () => {
    const spec = {
      mustHave: [{ skill: "Excel", raw: "Excel", years: null, category: null }],
      niceToHave: [], softSignals: ["trabajo en equipo"],
    } as unknown as JobSpec
    const filas = termsOfSpec(spec, [], "Buscamos Excel avanzado. Excel es clave.", "Manejo de Excel en planilla")
    const excel = filas.find((f) => f.term === "Excel")
    expect(excel?.jd).toBe(2)
    expect(excel?.cv).toBe(1)
    expect(excel?.proven).toBe(false)
    // Está escrito en el CV pero la auditoría no lo dio por demostrado.
    expect(excel?.listOnly).toBe(true)
    expect(filas.find((f) => f.section === "soft")?.term).toBe("trabajo en equipo")
  })

  it("una vacante a medias no tumba la pantalla con el análisis ya pagado", () => {
    expect(() => termsOfSpec({} as JobSpec, [], "aviso", "cv")).not.toThrow()
  })

  it("la cabecera dice QUÉ es lo crítico: los requisitos, no cada línea señalada", () => {
    const secciones = sectionsOf(score(), [
      finding({ id: "f1", gain: 9, nodeText: "Atendí a los clientes en la línea de cajas" }),
      finding({ id: "f2", type: "missing_requirement", component: "must", gain: 9, detail: "Excel avanzado" }),
    ])
    const cab = headlineOf(score(), secciones)
    expect(cab.criticalCount).toBe(2)
    // Los dos los puede cerrar el ejecutor: el requisito, escribiéndolo en la
    // línea donde el motor lo ancló.
    expect(cab.criticalSolvable).toBe(2)
    // Lo que tiene botón ya se explica en su tarjeta: repetirlo acá convierte la
    // cabecera en una lista de todo el panel.
    expect(cab.detail).toEqual(["Excel avanzado"])
    expect(cab.detail).not.toContain("Atendí a los clientes en la línea de cajas")
  })

  it("una sección con varios componentes muestra el % de su pilar, no el de uno", () => {
    // «Consejos» junta resultado, cifra, verbo y resumen: pintar el de uno solo
    // es un número que no habla de lo que la tarjeta lista debajo.
    const s = sectionsOf(score(), [])
    expect(s.find((x) => x.id === "tips")?.coveragePct).toBe(57)
    expect(s.find((x) => x.id === "soft")?.scored).toBe(false)
  })

  it("un término demostrado sin decirlo con esas palabras NO se cuenta como escrito", () => {
    // La tabla promete que sus números se comprueban leyendo: forzar la cuenta
    // a 1 porque la auditoría lo dio por probado era escribir un dato que el
    // usuario no puede verificar en su propio CV.
    const spec = { mustHave: [{ skill: "Atención al público", raw: "atención al público", years: null, category: null }], niceToHave: [], softSignals: [] } as unknown as JobSpec
    const [fila] = termsOfSpec(spec, ["Atención al público"], "Se requiere atención al público", "Recibí y orienté a los visitantes")
    expect(fila.cv).toBe(0)
    expect(fila.proven).toBe(true)
    expect(fila.listOnly).toBe(false)
  })

  it("una blanda se demuestra con un LOGRO, no con la palabra escrita", () => {
    // Contar apariciones es como se cumple una blanda en la lista de adjetivos
    // que todo reclutador saltea. El estado lo dicta la auditoría, con el id del
    // logro detrás.
    const spec = { mustHave: [], niceToHave: [], softSignals: ["Trabajo en equipo", "Liderazgo"] } as unknown as JobSpec
    const filas = termsOfSpec(spec, [], "Buscamos trabajo en equipo y liderazgo", "Trabajo en equipo · Liderazgo", [
      { signal: "Trabajo en equipo", status: "DEMONSTRATED" },
      { signal: "Liderazgo", status: "DECLARED_ONLY" },
    ])
    const equipo = filas.find((f) => f.term === "Trabajo en equipo")
    const liderazgo = filas.find((f) => f.term === "Liderazgo")
    expect(equipo?.proven).toBe(true)
    // Escrita en el CV, sí. Demostrada, no: eso es lo que el panel tiene que decir.
    expect(liderazgo?.proven).toBe(false)
    expect(liderazgo?.listOnly).toBe(true)
  })
})
