import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { scoreBand, READY_SCORE, WARN_SCORE } from "@/lib/ats/report"

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
 * demás cerrado, y el color quieto.
 *
 * ── Y AHORA EJECUTA LA FUNCIÓN (auditoría del 2026-08-27) ─────────────────
 *
 * Este archivo RE-IMPLEMENTABA la regla leyendo el fuente con dos regex y
 * comparando números — el antipatrón que la casa ya tenía escrito: un test que
 * re-implementa la lógica en vez de ejecutar la función exportada da verde con
 * el producto roto. Se sostenía porque el umbral vivía dentro del componente.
 * Ahora `scoreBand` es el dueño público de la regla y se le pregunta a él.
 */
const SRC = readFileSync(join(process.cwd(), "components/editor/ats-report/ScoreDial.tsx"), "utf8")

const tono = scoreBand

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
    // `scoreBand` recibe UN número: de una firma así no hay forma de mirar los
    // críticos. Lo que queda por comprobar es que el anillo le pase el puntaje
    // y nada más — eso sí vive en el componente.
    expect(SRC, "el tono se calcula con algo además del puntaje").toContain("toneOf(score)")
    expect(SRC, "el dial volvió a tener su propia copia del umbral").not.toMatch(/WARN_SCORE\s*=\s*\d+/)
  })

  /** Los umbrales son los de la regla, y salen del dueño. */
  it("usa exactamente los números que el CEO fijó", () => {
    expect([WARN_SCORE, READY_SCORE]).toEqual([55, 80])
  })
})
