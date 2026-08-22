import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * Ningún hallazgo sin salida.
 *
 * El panel podía nombrar un defecto y no ofrecer NADA para resolverlo:
 * `future_date`, `empty_lines` y `metric_saturation` se imprimían como reproche
 * y ahí moría la conversación. El CEO lo viene diciendo desde hace rondas: una
 * crítica sin botón no es una tarea, es ruido que el usuario aprende a ignorar.
 *
 * La regla: el ATS dice lo que falta y tailor lo resuelve. Cuando la solución no
 * la puede escribir nadie más que el candidato —una fecha, un título— la salida
 * es llevarlo al lugar exacto donde se arregla, que es lo máximo honesto.
 *
 * Este test enumera TODAS las claves que el motor puede emitir. Si mañana se
 * agrega una, falla hasta que tenga salida — que es el punto.
 */
const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8")
const BUILD = read("lib/ats/build-report.ts")
const ENGINE = read("lib/ats/credibility.ts")

/** Las claves que el motor de credibilidad puede reportar hoy. */
const KEYS = [...ENGINE.matchAll(/key: "([a-z_]+)"/g)].map((m) => m[1])

describe("cada hallazgo de credibilidad tiene salida", () => {
  it("el motor sigue emitiendo claves reconocibles", () => {
    expect(KEYS.length).toBeGreaterThanOrEqual(8)
  })

  /**
   * La regla se mudó del panel al informe, y se volvió más fuerte: antes había
   * que acordarse de escribirle una rama con botón a cada clave; ahora una clave
   * o la resuelve un chequeo con su propia sección, o el ensamblador la emite
   * como chequeo con acción. No hay tercera opción que compile y quede muda.
   */
  it.each(KEYS.map((k) => [k]))("%s ofrece una acción", (key) => {
    const ownedElsewhere = /OWNED_ELSEWHERE = new Set\(\[([\s\S]*?)\]\)/.exec(BUILD)?.[1]?.includes(`"${key}"`) ?? false
    /**
     * Las que no tienen otro dueño las emite el ensamblador como chequeo del
     * USUARIO: se le dice qué pasa y qué hacer. Ésa es la salida honesta cuando
     * la aplicación no puede resolverlo sola — visto en el navegador, un botón
     * que no ejecuta nada es peor, porque el usuario cree que lo resolvió.
     */
    const emitted = BUILD.includes("tips.credibility.${f.key}")
    expect(ownedElsewhere || emitted, `${key} no tiene salida`).toBe(true)
  })

  /** Y cada clave emitida tiene su texto en los dos idiomas. */
  it("los textos existen en los dos idiomas", () => {
    const owned = /OWNED_ELSEWHERE = new Set\(\[([\s\S]*?)\]\)/.exec(BUILD)?.[1] ?? ""
    const emitted = KEYS.filter((k) => !owned.includes(`"${k}"`))
    expect(emitted.length).toBeGreaterThan(0)
    for (const loc of ["es", "en"]) {
      const m = JSON.parse(read(`messages/${loc}.json`)).editor.ats
      for (const k of emitted) expect(m.check[`cred_${k}`], `${loc}: falta cred_${k}`).toBeTruthy()
    }
  })
})
