import { describe, it, expect } from "vitest"
import { cvValueBar, noHardCodedFactsRule, proseRules, alreadyGoodRule } from "@/lib/services/ai/shared/cv-writing-doctrine"
import {
  IMPACT_OPENERS_ES, IMPACT_OPENERS_EN,
  WEAK_OPENERS_ES, WEAK_OPENERS_EN,
} from "@/lib/services/ai/shared/bullet-quality"

/**
 * NINGÚN PROMPT PUEDE DAR Y QUITAR LA MISMA COSA.
 *
 * ── POR QUÉ ESTO ES UN GUARD Y NO UNA REVISIÓN A OJO ───────────────────────
 *
 * OpenAI documenta que ante reglas en conflicto el modelo gasta razonamiento
 * intentando reconciliarlas en vez de elegir una. El síntoma no es un error
 * visible: es una salida tibia, que es lo peor porque parece que el modelo
 * simplemente no da más.
 *
 * Este proyecto lo pagó dos veces en el mismo prompt:
 *
 *   1. `proseRules` daba «Reduje, Incrementé, Mejoré» como ejemplos del registro
 *      correcto y `neverInventRule` prohibía «reduje errores, mejoré la
 *      eficiencia, aumenté las ventas». La regla estaba mal escrita: prohibía el
 *      VERBO en vez del hecho no declarado.
 *
 *   2. «Lideré» / «led» figuraban entre los verbos recomendados, y tres líneas
 *      más abajo: «nada de "lideré", "gestioné" ni "supervisé" si no lo dijo».
 *      Mandar no es un verbo de estilo, es un HECHO sobre la persona.
 *
 * Las dos se veían leyendo el prompt entero — y nadie lo lee entero, porque se
 * arma con cuatro funciones que viven en archivos distintos.
 */
const DOCTRINA = (lang: "es" | "en") =>
  [cvValueBar(lang), noHardCodedFactsRule(lang), proseRules(lang), alreadyGoodRule(lang)].join("\n")

describe("los verbos que el prompt recomienda no están prohibidos en el mismo prompt", () => {
  for (const lang of ["es", "en"] as const) {
    /**
     * Los verbos de JERARQUÍA son el caso: afirman una posición en el
     * organigrama, no describen el trabajo. Sólo los escribe quien la declaró,
     * así que un ejemplo general nunca puede sugerirlos.
     */
    it(`ningún verbo de mando entre los recomendados (${lang})`, () => {
      const recomendados = lang === "es" ? IMPACT_OPENERS_ES : IMPACT_OPENERS_EN
      const mando = lang === "es"
        ? ["lideré", "lidere", "supervisé", "supervise", "dirigí", "dirigi", "jefe"]
        : ["led", "supervised", "managed", "headed", "directed"]
      expect(recomendados.filter((v) => mando.includes(v.toLowerCase()))).toEqual([])
    })

    it(`ninguna apertura débil figura como recomendada (${lang})`, () => {
      const recomendados = (lang === "es" ? IMPACT_OPENERS_ES : IMPACT_OPENERS_EN).map((v) => v.toLowerCase())
      const debiles = (lang === "es" ? WEAK_OPENERS_ES : WEAK_OPENERS_EN).map((w) => w.split(" ")[0].toLowerCase())
      expect(recomendados.filter((v) => debiles.includes(v))).toEqual([])
    })

    /**
     * La regla de la cifra permite el rango confirmable. Si al mismo tiempo lo
     * prohibiera sin condición, el modelo tendría que elegir cuál obedecer.
     */
    it(`la regla de la cifra permite el rango sin prohibirlo después (${lang})`, () => {
      const d = DOCTRINA(lang)
      expect(d, "no permite el rango").toMatch(lang === "es" ? /RANGO/ : /RANGE/)
      // Si aparece una prohibición de cifra, tiene que venir con su condición.
      const prohibicionSuelta = lang === "es"
        ? /nunca (una )?cifra(?![^.\n]*(rango|exacta|quemada|elegida))/i
        : /never a (number|figure)(?![^.\n]*(range|precise|hard-code))/i
      expect(d, "prohíbe la cifra sin condición").not.toMatch(prohibicionSuelta)
    })

    /**
     * Y el resultado: la regla debe decir explícitamente que el que el candidato
     * SÍ contó se escribe. Sin esa frase vuelve a leerse como prohibición total.
     */
    it(`el resultado que el candidato contó se escribe (${lang})`, () => {
      expect(noHardCodedFactsRule(lang)).toMatch(
        lang === "es" ? /Cuando SÍ contó el resultado/ : /When they DID describe the outcome/,
      )
    })
  }
})

describe("la doctrina no contiene su propia negación", () => {
  /**
   * Un barrido tosco pero útil: cualquier término que la doctrina OFREZCA como
   * ejemplo positivo no puede aparecer en una línea de prohibición SIN una
   * condición que la acote. La condición es lo que separa una regla usable de
   * una orden contradictoria.
   */
  for (const lang of ["es", "en"] as const) {
    it(lang, () => {
      const lineas = DOCTRINA(lang).split("\n")
      const recomendados = lang === "es" ? IMPACT_OPENERS_ES : IMPACT_OPENERS_EN
      const marcaProhibicion = lang === "es" ? /\b(nunca|prohibid|no afirmes|jamás)\b/i : /\b(never|forbidden|do not|don't)\b/i
      const marcaCondicion = lang === "es" ? /\b(sólo cuando|si no lo dijo|salvo|a menos que|cuando sí)\b/i : /\b(only when|unless|if they did not|when they did)\b/i

      const conflictivas: string[] = []
      for (const l of lineas) {
        // SÓLO los bullets de la lista de prohibidos. Una línea explicativa
        // puede decir "nunca" de paso —`cvValueBar` lo hace al describir el
        // ejemplo del cajero— y contarla daba un falso positivo que habría
        // enterrado el conflicto real entre dieciocho ruidos.
        if (!l.trimStart().startsWith("- ")) continue
        if (!marcaProhibicion.test(l) || marcaCondicion.test(l)) continue
        // La línea que OFRECE los verbos también dice "nunca" (sobre las
        // aperturas de tarea): se reconoce porque enumera los recomendados.
        const ofrece = recomendados.filter((v) => l.toLowerCase().includes(v.toLowerCase())).length >= 3
        if (ofrece) continue
        const choque = recomendados.filter((v) => new RegExp(`\\b${v}\\b`, "i").test(l))
        if (choque.length) conflictivas.push(`"${choque.join(", ")}" en: ${l.trim().slice(0, 90)}`)
      }
      expect(conflictivas).toEqual([])
    })
  }
})
