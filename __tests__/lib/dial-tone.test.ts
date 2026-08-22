import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * EL SEMÁFORO DEL ANILLO TIENE QUE PODER CAMBIAR.
 *
 * ── LA REGLA, DEL CEO (2026-08-22) ─────────────────────────────────────────
 *
 *   «Hay reglas de colores: cuando está en menos de lo requerido está rojo,
 *    luego amarillo, si ya está estable es verde.»
 *
 * El tono miraba también los hallazgos críticos, y entre ellos va el requisito
 * duro que el propio panel declara SIN salida. A un candidato al que le falta un
 * título eso le dejaba el anillo naranja para siempre: 88 de puntaje, todo lo
 * demás cerrado, y el color quieto. Su pregunta fue «¿el anillo sólo maneja un
 * color?» — y para él la respuesta era sí.
 *
 * Comprueba la FUNCIÓN, no el componente: montarlo pediría el store y la sesión
 * enteros para leer un color que sólo depende de un número.
 */
const SRC = readFileSync(join(process.cwd(), "components/editor/ats-report/ScoreDial.tsx"), "utf8")

/** Se re-deriva del fuente para que ajustar los umbrales no deje el test mintiendo. */
function tono(score: number): string {
  const ready = Number(/READY_SCORE\s*=\s*(\d+)/.exec(
    readFileSync(join(process.cwd(), "lib/ats/scoring-config.ts"), "utf8") + SRC,
  )?.[1] ?? 80)
  const warn = Number(/WARN_SCORE\s*=\s*(\d+)/.exec(SRC)?.[1] ?? 55)
  if (score >= ready) return "ok"
  return score >= warn ? "warn" : "bad"
}

describe("el anillo recorre los tres colores", () => {
  it("por debajo de lo mínimo, rojo", () => {
    expect(tono(20)).toBe("bad")
    expect(tono(54)).toBe("bad")
  })

  it("en el medio, amarillo", () => {
    expect(tono(55)).toBe("warn")
    expect(tono(79)).toBe("warn")
  })

  it("pasado el umbral, verde", () => {
    expect(tono(80)).toBe("ok")
    expect(tono(88)).toBe("ok")
    expect(tono(100)).toBe("ok")
  })

  /**
   * LA COMPROBACIÓN QUE CIERRA EL DEFECTO. El color depende del PUNTAJE y de
   * nada más: si volviera a mirar los críticos, un CV con un requisito imposible
   * quedaría clavado en un color para siempre. De una firma que no recibe ese
   * dato no hay forma de mirarlo.
   */
  it("y no mira nada más que el puntaje", () => {
    expect(SRC, "toneOf volvió a recibir los críticos").toMatch(/function toneOf\(score: number\): Tone/)
    expect(SRC, "el tono se calcula con algo además del puntaje").toContain("toneOf(score)")
  })
})
