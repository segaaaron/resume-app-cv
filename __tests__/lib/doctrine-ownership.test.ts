import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cvValueBar, noHardCodedFactsRule, proseRules } from "@/lib/services/ai/shared/cv-writing-doctrine"

/**
 * UN SOLO CRITERIO DE «BUENO», PARA CUALQUIER OFICIO.
 *
 * ── EL DEFECTO QUE ESTE GUARD CIERRA ───────────────────────────────────────
 *
 * `AIBulletModule` —el que escribe las viñetas del CV— tenía su PROPIA copia de
 * las reglas, escrita a mano, sin citar la doctrina compartida. Y esa copia
 * llevaba la versión VIEJA de la regla de la cifra, la que el CEO mandó corregir
 * porque «se aplicó de más durante meses y dejaba viñetas peladas»:
 *
 *   la copia:    «cuando falta una métrica, mejorás la redacción SIN inventar
 *                 ni pedir un número»
 *   la doctrina: «SÍ podés proponer una cifra como RANGO que él confirma.
 *                 Nunca dejes la línea pelada cuando el tamaño es obvio»
 *
 * El prompt y la doctrina decían cosas opuestas, y el prompt ganaba: es el que
 * llega al modelo.
 *
 * ── Y EL ENCUADRE NO ERA GENÉRICO ──────────────────────────────────────────
 *
 * El rol decía «CVs ejecutivos para empresas Fortune 500 y startups de alto
 * crecimiento». Un cajero de banco, una peluquera o un soldador no son Fortune
 * 500 — ese encuadre empuja al modelo al vocabulario corporativo, que es
 * exactamente la contaminación entre oficios que este proyecto ya pagó.
 */
const MODULES = [
  "lib/services/ai/modules/AIBulletModule.ts",
  "lib/services/ai/modules/AITailorModule.ts",
  "lib/services/ai/modules/AIReviewModule.ts",
]

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8")

describe("todo prompt que escribe prosa del CV lee la doctrina", () => {
  for (const m of MODULES) {
    it(m.split("/").pop()!, () => {
      const src = read(m)
      expect(src, "no cita cvValueBar").toContain("cvValueBar")
      expect(src, "no cita noHardCodedFactsRule").toContain("noHardCodedFactsRule")
      expect(src, "no cita proseRules").toContain("proseRules")
    })
  }
})

describe("ninguno reescribe la regla de la cifra por su cuenta", () => {
  /**
   * La versión vieja, textual. Si reaparece en cualquier módulo, el prompt está
   * contradiciendo a la doctrina — y el prompt es el que llega al modelo.
   */
  const VIEJAS = [
    "NUNCA inventes un número y NUNCA le pidas uno al usuario",
    "NEVER invent a number and NEVER ask the user for one",
    "sin inventar ni pedir un número",
    "without inventing one or asking the user for it",
  ]
  for (const m of MODULES) {
    it(m.split("/").pop()!, () => {
      const src = read(m)
      for (const v of VIEJAS) expect(src, `revivió: "${v}"`).not.toContain(v)
    })
  }
})

describe("el criterio es genérico, no corporativo", () => {
  /**
   * El producto atiende cajeros, enfermeras, soldadores y agricultores. Un rol
   * anclado a un tipo de empresa le presta a todos el vocabulario de uno.
   */
  const SESGADOS = ["Fortune 500", "executive résumé", "CV ejecutivo", "CVs ejecutivos", "alto crecimiento"]
  for (const m of MODULES) {
    it(m.split("/").pop()!, () => {
      const src = read(m)
      for (const w of SESGADOS) expect(src, `encuadre sesgado: "${w}"`).not.toContain(w)
    })
  }
})

describe("la doctrina misma es genérica", () => {
  /**
   * Sus ejemplos van en PARES DE RUBROS OPUESTOS y diciendo que son del
   * principio, nunca de la redacción: con el ejemplo del cajero solo, una
   * peluquería cuadraba la caja «antes del cierre contable». Defecto medido.
   */
  for (const lang of ["es", "en"] as const) {
    it(`sin anclaje corporativo (${lang})`, () => {
      const todo = `${cvValueBar(lang)} ${noHardCodedFactsRule(lang)} ${proseRules(lang)}`
      for (const w of ["Fortune", "startup", "C-level", "ejecutivo de alto"]) {
        expect(todo, `la doctrina ${lang} nombra "${w}"`).not.toContain(w)
      }
    })
  }
})
