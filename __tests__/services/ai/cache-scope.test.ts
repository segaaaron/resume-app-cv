import { describe, it, expect } from "vitest"
import { vi } from "vitest"
vi.mock("@/lib/db", () => ({ db: {} }))
import { readFileSync } from "node:fs"
import { answerHash } from "@/lib/services/ai/shared/answer-cache"

/**
 * LA CLAVE CUBRE TODO LO QUE LA RESPUESTA MIRA. Ni más, ni menos.
 *
 * ── LA HISTORIA COMPLETA, PORQUE ESTE ARCHIVO CAMBIÓ DE LADO ────────────────
 *
 * Primero: la extracción de la vacante RECIBÍA el CV, y la clave era la vacante
 * sola — el segundo usuario con la misma oferta era servido con la lectura del
 * currículum de un desconocido. Se metió el CV en la clave. Correcto entonces.
 *
 * Después apareció el costo real de esa forma, reportado dos veces:
 *
 *   «El mismo CV: 100 y después 70.»
 *   «Cuando lo hago correr de nuevo me salen otras opciones.»
 *
 * Con el CV en la clave, EDITAR el CV re-extraía la vacante; la extracción no es
 * determinista, así que volvía con otra lista de requisitos. El DENOMINADOR se
 * movía mientras el usuario trabajaba.
 *
 * La salida no fue elegir entre correcto y estable: fue sacar el CV del PROMPT.
 * Estaba marcado «contexto» y sólo podía sesgar qué requisitos elegía el modelo.
 * Sin CV no queda lectura personal que compartir, y compartir pasa a ser lo
 * correcto — no una concesión.
 *
 * Estos tests LEEN EL CÓDIGO además de ejercitar la función: la versión anterior
 * re-implementaba la clave acá adentro y daba verde dijera lo que dijera el
 * módulo. Un test que re-escribe la lógica no prueba nada.
 */
const SRC = readFileSync("lib/services/ai/modules/AIReviewModule.ts", "utf8")

/** El bloque exacto donde se arma la clave de la extracción. */
const keyBlock = (() => {
  const at = SRC.indexOf("const keywordsKey = answerHash(")
  expect(at).toBeGreaterThan(-1)
  // Hasta el cierre de la sentencia. Buscar el primer «)» fallaba: los propios
  // comentarios de dentro llevan paréntesis.
  return SRC.slice(at, SRC.indexOf("\n    )", at) + 6)
})()

describe("la extracción de la vacante no depende del CV", () => {
  it("la clave NO lleva el currículum", () => {
    expect(keyBlock).not.toContain("resumeText")
  })

  it("y sigue llevando idioma, modo y el texto de la vacante", () => {
    expect(keyBlock).toContain('en ? "en" : "es"')
    expect(keyBlock).toContain('useRole ? "role" : "jd"')
    expect(keyBlock).toContain("jobDescriptionTruncated")
  })

  /**
   * La mitad que hace legítimo compartir la respuesta. Si alguien vuelve a meter
   * el CV en el prompt sin tocarlo en la clave, el defecto viejo revive entero y
   * en silencio: la lista se ve plausible igual.
   */
  it("y el prompt de extracción tampoco recibe el currículum", () => {
    const from = SRC.indexOf("const jdPrompt = en")
    const to = SRC.indexOf("const prompt = useRole ? rolePrompt : jdPrompt")
    expect(from).toBeGreaterThan(-1)
    expect(to).toBeGreaterThan(from)
    const prompts = SRC.slice(from, to)
    expect(prompts).not.toContain("${resumeText}")
    expect(prompts).not.toContain("CANDIDATE RESUME")
    expect(prompts).not.toContain("CV DEL CANDIDATO")
  })
})

describe("lo que sí separa dos respuestas", () => {
  const key = (posting: string, lang: "en" | "es" = "es") =>
    answerHash("model-x", lang, "jd", "v2-posting-only", posting)

  it("dos vacantes distintas no comparten respuesta", () => {
    expect(key("Analista de nómina")).not.toBe(key("Jefa de contabilidad"))
  })

  it("la misma vacante siempre cae en la misma respuesta", () => {
    expect(key("Structural welder, 5 years")).toBe(key("Structural welder, 5 years"))
  })

  it("el idioma es parte de la pregunta: decide en qué idioma se escriben los requisitos", () => {
    expect(key("Registered nurse", "en")).not.toBe(key("Registered nurse", "es"))
  })
})
