import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { SCORED_COMPONENTS } from "@/lib/ats3/score"

/**
 * TODO LO QUE EL PUNTAJE COBRA TIENE QUIÉN LO REPORTE.
 *
 * ── EL DEFECTO QUE ESTO CIERRA (CEO, 2026-09-09) ─────────────────────────────
 * `title` descontaba 0,14 de la relevancia y `verbs` 0,10 del impacto, y NINGÚN
 * hallazgo declaraba esos componentes: el usuario podía cerrar las cuarenta y
 * ocho tarjetas del panel y quedarse con casi un cuarto del peso perdido sin que
 * nadie le dijera por qué. Un puntaje que cobra algo que no enseña a arreglar no
 * es un puntaje, es un reproche con decimales.
 *
 * Se lee el CÓDIGO del motor y se enumeran los componentes que sus emisores
 * declaran, en vez de mantener una lista a mano que envejece. Si mañana alguien
 * agrega un componente al puntaje y se olvida de cablear su hallazgo, esto se
 * pone rojo antes de que un usuario pague por una pantalla que no explica su
 * número.
 */
describe("el puntaje no cobra nada que el panel no reporte", () => {
  const engine = readFileSync("lib/ats3/engine.ts", "utf8")

  /** Los componentes que algún emisor declara, leídos del motor. */
  const reportados = new Set<string>([
    ...[...engine.matchAll(/push\(\s*"[a-z_]+",\s*"([a-z]+)"/g)].map((m) => m[1]),
    ...[...engine.matchAll(/component:\s*"([a-z]+)"/g)].map((m) => m[1]),
    // `missing_requirement` lo emite con la clave del requisito: MUST o NICE.
    ...(engine.includes('push("missing_requirement", key') ? ["must", "nice"] : []),
  ])

  it("cada componente medido tiene al menos un hallazgo que lo declare", () => {
    const mudos = SCORED_COMPONENTS.filter((c) => !reportados.has(c))
    expect(mudos).toEqual([])
  })

  it("y ningún emisor declara un componente que el puntaje no mida", () => {
    const inventados = [...reportados].filter((c) => !(SCORED_COMPONENTS as string[]).includes(c))
    expect(inventados).toEqual([])
  })
})
