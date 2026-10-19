import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"

const MODULES = join(process.cwd(), "lib/services/ai/modules")
const read = (f: string) => readFileSync(join(MODULES, f), "utf8")

// El `system` lleva el ROL y las restricciones más duras (no inventes cifras, no
// escribas corchetes). Estaba solo en español en 6 módulos: un CV en inglés recibía
// esas reglas en un idioma y la tarea en otro. Este guard LEE EL CÓDIGO porque el
// defecto es una omisión — no hay comportamiento que observar en la rama que falta.
describe("los mensajes system existen en los dos idiomas", () => {
  const CON_SYSTEM_BILINGUE = [
    "AIBulletModule.ts",
    "AICoverLetterModule.ts",
    "AIProfileModule.ts",
    "AISummaryModule.ts",
  ]

  it.each(CON_SYSTEM_BILINGUE)("%s no deja ningún system solo en español", (file) => {
    const src = read(file)
    const huerfanos: string[] = []
    // Se mira desde el `content:` que abre ESE mensaje hasta la frase en español, no
    // una ventana de N caracteres: la rama inglesa puede ser larga y una ventana fija
    // la deja fuera, dando un falso positivo (y, peor, un falso negativo si se agranda).
    for (const m of src.matchAll(/"(Eres (?:un|el|una)[^"]{0,120})"/g)) {
      const i = m.index ?? 0
      const abre = src.lastIndexOf("content:", i)
      const bloque = src.slice(abre === -1 ? 0 : abre, i)
      if (!/language === "en"/.test(bloque)) huerfanos.push(m[1].slice(0, 60))
    }
    expect(huerfanos, `system sin rama en inglés en ${file}: ${huerfanos.join(" | ")}`).toEqual([])
  })
})


// La oferta la escribe un desconocido y el usuario la pega. Un delimitador dice dónde
// empieza el texto, no que no haya que obedecerlo.
describe("todo prompt que lee la oferta se defiende de la inyección", () => {
  it.each(["AICoverLetterModule.ts"])(
    "%s trae el guard en las DOS ramas",
    (file) => {
      const src = read(file)
      expect(src).toContain("untrustedDataRule(true)")
      expect(src).toContain("untrustedDataRule(false)")
    },
  )
})
