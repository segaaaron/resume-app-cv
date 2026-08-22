import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { cvValueBar, noHardCodedFactsRule, proseRules, alreadyGoodRule, keepCandidateFactsRule } from "@/lib/services/ai/shared/cv-writing-doctrine"
import { IMPACT_OPENERS_ES, IMPACT_OPENERS_EN, WEAK_OPENERS_ES, WEAK_OPENERS_EN } from "@/lib/services/ai/shared/bullet-quality"

/**
 * LAS DOS RAMAS DE IDIOMA RECIBEN EL MISMO PRODUCTO.
 *
 * ── POR QUÉ ESTO SE ESCAPA SIEMPRE ─────────────────────────────────────────
 *
 * Un prompt bilingüe son dos ramas de un `if` que NUNCA se leen juntas. Se toca
 * una, se prueba con un CV en ese idioma, funciona, y la otra queda atrás sin
 * que nada falle. No hay comportamiento que observar en una rama que nadie
 * ejecutó: por eso hace falta compararlas a propósito.
 *
 * Este proyecto ya lo pagó: diez mensajes `system` estaban SÓLO en español, y un
 * CV en inglés recibía el rol y las restricciones duras en un idioma y la tarea
 * en otro.
 *
 * ── LOS DOS DEFECTOS QUE ESTE GUARD ENCONTRÓ AL ESCRIBIRSE ─────────────────
 *
 *   1. Las listas de verbos de impacto no estaban emparejadas: a la española le
 *      faltaban «lancé» y un equivalente de «streamlined», a la inglesa le
 *      faltaba «served» —el verbo de los oficios de atención, que en este
 *      producto son muchos—. Un CV en inglés recibía 18 ejemplos y uno en
 *      español 16.
 *
 *   2. La HUELLA DEL CACHÉ se calculaba sólo con la doctrina española. Tocar el
 *      prompt inglés dejaba la huella igual: el caché seguía sirviendo el
 *      análisis viejo y el cambio no llegaba nunca a un CV en inglés. Es
 *      exactamente el defecto que la huella vino a cerrar, escondido en una rama.
 */
const PIEZAS = { cvValueBar, noHardCodedFactsRule, proseRules, alreadyGoodRule, keepCandidateFactsRule }

describe("cada pieza de la doctrina existe en los dos idiomas", () => {
  for (const [nombre, fn] of Object.entries(PIEZAS)) {
    it(nombre, () => {
      const es = fn("es")
      const en = fn("en")
      expect(es.length, `${nombre} es vacío`).toBeGreaterThan(100)
      expect(en.length, `${nombre} en vacío`).toBeGreaterThan(100)
      // Mismo número de reglas: un bullet de más en una rama es una regla que la
      // otra nunca recibe.
      const bullets = (t: string) => t.split("\n").filter((l) => l.trimStart().startsWith("- ")).length
      expect(bullets(en), `${nombre}: distinta cantidad de reglas`).toBe(bullets(es))
    })
  }

  /** Y ninguna rama puede colarse en la otra: el CV en inglés no lee español. */
  it("ninguna rama contiene texto de la otra", () => {
    for (const [nombre, fn] of Object.entries(PIEZAS)) {
      expect(fn("en"), `${nombre}: la rama inglesa trae español`).not.toMatch(/\b(nunca|siempre|candidato|viñeta)\b/i)
      expect(fn("es"), `${nombre}: la rama española trae inglés`).not.toMatch(/\b(never|always|candidate|bullet)\b/i)
    }
  })
})

describe("las listas están emparejadas", () => {
  it("los verbos de impacto, uno a uno", () => {
    expect(IMPACT_OPENERS_EN.length).toBe(IMPACT_OPENERS_ES.length)
  })

  it("y las aperturas débiles existen en las dos", () => {
    expect(WEAK_OPENERS_ES.length).toBeGreaterThan(5)
    expect(WEAK_OPENERS_EN.length).toBeGreaterThan(5)
  })

  /** Los oficios de atención son muchos en este producto: el verbo va en ambas. */
  it("el verbo de atención existe en las dos", () => {
    expect(IMPACT_OPENERS_ES).toContain("atendí")
    expect(IMPACT_OPENERS_EN).toContain("served")
  })
})

describe("cada módulo cita la doctrina el mismo número de veces por rama", () => {
  const dir = join(process.cwd(), "lib/services/ai/modules")
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
    const src = readFileSync(join(dir, f), "utf8")
    const en = (src.match(/\("en"\)/g) ?? []).length
    const es = (src.match(/\("es"\)/g) ?? []).length
    if (en + es === 0) continue
    it(f.replace(".ts", ""), () => {
      expect(en, `${f}: la doctrina se cita ${es}x en español y ${en}x en inglés`).toBe(es)
    })
  }
})

describe("la huella del caché cubre las dos ramas", () => {
  /**
   * Si sólo cubre una, tocar el prompt de la otra no invalida nada y el cambio
   * no llega. El proyecto ya perdió horas por una huella que no se bumpeaba.
   */
  it("el fingerprint incluye español e inglés", () => {
    const src = readFileSync(join(process.cwd(), "lib/services/ai/modules/AIReviewModule.ts"), "utf8")
    const bloque = src.slice(src.indexOf("DOCTRINE_FINGERPRINT"), src.indexOf("ANALYSIS_REVISION"))
    expect(bloque, "la huella no cubre el español").toContain('("es")')
    expect(bloque, "la huella no cubre el inglés").toContain('("en")')
  })
})

/**
 * LO QUE SE AGREGÓ A LOS PROMPTS ESTA SESIÓN, EN LAS DOS RAMAS.
 *
 * ── POR QUÉ SE VIGILA UNO POR UNO (CEO, 2026-08-22) ────────────────────────
 *
 *   «¿Todo esto aplica para los 2 idiomas?»
 *
 * El conteo de arriba compara cuántas veces cada módulo cita la doctrina por
 * rama, y eso NO alcanza para un bloque nuevo: un texto escrito sólo en inglés
 * no mueve ese contador. El defecto sería una rama que existe y otra que no —
 * una omisión, sin comportamiento que observar del lado que falta, y en
 * producción se ve como «a mí el asistente no me apunta al puesto» sólo para los
 * usuarios del otro idioma.
 */
describe("los bloques nuevos existen en español y en inglés", () => {
  const mod = (f: string) => readFileSync(join(process.cwd(), "lib/services/ai/modules", f), "utf8")

  const PARES: Array<[string, string, string, string]> = [
    ["AIReviewModule.ts", "los términos por los que puntúa la vacante",
      "TERMS THIS POSTING SCORES ON", "TÉRMINOS POR LOS QUE ESTA VACANTE PUNTÚA"],
    ["profile-modes.ts", "el puesto al que apunta el CV",
      "THE JOB THIS CV IS AIMED AT", "EL PUESTO AL QUE APUNTA ESTE CV"],
    ["profile-modes.ts", "y la mitad que impide inventar para agradarle a la vacante",
      "USE ONLY the terms their account genuinely backs", "USÁ SÓLO los términos que su relato respalde"],
    ["AISkillBulletModule.ts", "la acotación de la cifra",
      "NARROWING FOR THIS ONE BULLET", "ACOTACIÓN SÓLO PARA ESTE BULLET"],
  ]

  for (const [file, que, en, es] of PARES) {
    it(`${file}: ${que}`, () => {
      const src = mod(file)
      expect(src, `falta la rama inglesa: ${en}`).toContain(en)
      expect(src, `falta la rama española: ${es}`).toContain(es)
    })
  }
})
