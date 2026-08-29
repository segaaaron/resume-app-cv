import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

/**
 * EL ATS ENTRA PRIMERO, Y TODO LO DEMÁS TRABAJA SOBRE ÉL.
 *
 * ── LA PREGUNTA DEL CEO, QUE ES LA REGLA DEL PROYECTO ──────────────────────
 *
 *   «El ATS manda. Todo lo que tenga el ATS debe consultar al ATS, y así con
 *    todos los componentes o IA que tengas. Todo se coordina con el ATS; no
 *    quiero que hagan cosas por separado.»
 *
 * Contestarla mirando el código una vez no sirve: el defecto vuelve el día que
 * alguien agrega un botón nuevo. Este guard ENUMERA cada llamada de IA que sale
 * del editor y exige que esté declarada acá con la forma en que consulta al ATS.
 * Una llamada nueva sin declarar rompe el test — que es la única manera de que
 * nadie pueda agregar un escritor que trabaje por su cuenta.
 *
 * ── POR QUÉ LEE EL CÓDIGO ──────────────────────────────────────────────────
 *
 * El defecto es una AUSENCIA: un `fetch` que no manda la vacante se comporta
 * exactamente igual que uno que sí la manda, sólo que escribe peor. No hay
 * comportamiento que ejecutar del lado que falta.
 */

/** Cómo consulta al ATS cada llamada. Una entrada por endpoint, con su razón. */
const COMO_CONSULTA_AL_ATS: Record<string, { modo: "termsInBody" | "esElATS" | "noEscribeEnElCV" | "previoAlAnalisis"; razon: string }> = {
  "ats3": { modo: "esElATS", razon: "ES el motor: analiza y reescribe por el mismo borde" },
  "ats-score": { modo: "esElATS", razon: "es el análisis" },
  "ats-rescore": { modo: "esElATS", razon: "rehace el puntaje sin modelo" },
  "review-cv": { modo: "esElATS", razon: "la lectura del reclutador, parte del análisis" },
  "tailor-cv": { modo: "termsInBody", razon: "recibe el trabajo que el informe le asignó y la vacante" },
  "improve-bullet": { modo: "termsInBody", razon: "reescribe una viñeta contra los términos del informe" },
  "merge-bullets": { modo: "termsInBody", razon: "fusiona dos líneas sin soltar un término de la vacante" },
  "skill-bullet": { modo: "termsInBody", razon: "la habilidad que escribe VIENE de la vacante: el término es el pedido" },
  "fill-profile": { modo: "previoAlAnalisis", razon: "el asistente llena el CV antes de que exista una vacante; cuando existe, la recibe" },
  "generate-summary": { modo: "previoAlAnalisis", razon: "mismo caso que fill-profile" },
}

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((e) => {
    const full = join(dir, e)
    if (statSync(full).isDirectory()) return archivos(full)
    return /\.tsx?$/.test(e) ? [full] : []
  })
}

const llamadas = new Map<string, string>()
for (const f of [...archivos("components/editor"), ...archivos("components/resume")]) {
  const src = readFileSync(f, "utf8")
  for (const m of src.matchAll(/["'`]\/api\/ai\/([a-z-]+)["'`]/g)) llamadas.set(m[1], f)
}

describe("toda llamada de IA del editor declara cómo consulta al ATS", () => {
  it("hay llamadas que revisar", () => {
    // No se ata un número: el número se movió al borrar el panel viejo y el
    // test se quejaría del número correcto. Lo que importa es que HAYA llamadas
    // que revisar — si no hubiera ninguna, el guard no estaría guardando nada.
    expect(llamadas.size).toBeGreaterThan(0)
  })

  it("ninguna llamada queda sin declarar", () => {
    const sinDeclarar = [...llamadas.keys()].filter((k) => !(k in COMO_CONSULTA_AL_ATS))
    expect(sinDeclarar, "endpoint nuevo: declará cómo consulta al ATS").toEqual([])
  })

  /**
   * ── SE BORRARON ACÁ 4 CASOS (2026-08-28) ─────────────────────────────────
   *
   * Comprobaban que cada endpoint «manda los términos de la vacante» buscando
   * `postingTerms|posting\b|skill[,:]` dentro de los 1.400 caracteres que siguen
   * al `fetch`. Demostrado que no servía: se quitaron los términos del cuerpo del
   * pedido —los 4 se pusieron en rojo, bien— y bastó agregar UNA LÍNEA DE
   * COMENTARIO que dijera «posting» para devolverlos a verde con cero términos
   * enviados. El regex barre comentarios igual que código.
   *
   * Lo que sí sigue vivo es el caso de arriba, que enumera los endpoints y exige
   * que cada uno declare CÓMO consulta al ATS: eso es una ausencia real —un
   * endpoint nuevo sin declarar— y no hay comportamiento que ejecutar para verla.
   */
})
