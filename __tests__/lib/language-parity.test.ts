import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { cvValueBar, noHardCodedFactsRule, proseRules, keepCandidateFactsRule } from "@/lib/services/ai/shared/cv-writing-doctrine"

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
const PIEZAS = { cvValueBar, noHardCodedFactsRule, proseRules, keepCandidateFactsRule }

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
