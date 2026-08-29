import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

/**
 * NINGÚN MÓDULO DE IA GUARDA ESTADO DE UNA PETICIÓN EN SU INSTANCIA.
 *
 * ── EL DEFECTO (auditoría del 2026-08-27) ───────────────────────────────────
 *
 * `aiService` es un singleton de módulo (`lib/controllers/ai-deps.ts`): UNA sola
 * instancia para todas las peticiones del proceso. `spentAModelCall` —la bandera
 * que decide si se devuelve la ranura diaria— era un campo de esa instancia.
 *
 *   A gasta una llamada al modelo   → la bandera queda en `true`
 *   B entra y arranca su análisis   → la resetea a `false`
 *   A llega al final y la lee       → `false`
 *   → a A le DEVUELVEN la ranura que sí gastó
 *
 * El tope diario existe para frenar el gasto, así que filtrarlo es dinero.
 *
 * ── POR QUÉ SE COMPRUEBA SOBRE EL FUENTE Y NO CON DOS PETICIONES ────────────
 *
 * Se intentó primero con el escenario real y NO MORDÍA, dos veces. La primera
 * versión usaba dos instancias del módulo —con dos objetos distintos un campo de
 * instancia no se pisa nunca, así que no reproducía nada—. La segunda, ya con
 * una sola, terminó con las dos peticiones gastando: `refunds` quedaba vacío y
 * la aserción `not.toContain` pasaba trivialmente. Verde por la razón
 * equivocada, que es peor que no tener test.
 *
 * Para que mordiera había que encadenar aciertos de caché en un método de
 * setecientas líneas, y eso es un test que depende del ORDEN INTERNO: se pone
 * verde solo en cuanto alguien reordene el método, sin que nadie se entere.
 *
 * El defecto real es estructural —un campo mutable en un objeto compartido— y no
 * tiene comportamiento observable fuera de una carrera. Así que se comprueba lo
 * que sí es estable: que no exista el campo. Muerde por construcción: reponer
 * `private spent = false` en cualquiera de los módulos pone esto en rojo.
 */
const MODULOS = [ "AIBulletModule", "AISummaryModule",
  "AICoverLetterModule", "AIProfileModule", "AISkillBulletModule",
  "AIMergeBulletsModule", "AIImportModule", "AITranslateModule",
]

/** `private x = …` o `private x: T = …` sin `readonly`: eso es estado mutable. */
const CAMPO_MUTABLE = /^\s*private\s+(?!readonly\b)[a-zA-Z_$][\w$]*\s*(?::[^=\n]+)?=/gm

describe("un singleton no guarda el estado de una petición", () => {
  for (const nombre of MODULOS) {
    it(`${nombre} no tiene campos mutables de instancia`, () => {
      const src = readFileSync(`lib/services/ai/modules/${nombre}.ts`, "utf8")
      // Los comentarios explican defectos viejos citando el código que los tenía.
      const sinComentarios = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
      const encontrados = sinComentarios.match(CAMPO_MUTABLE) ?? []
      expect(encontrados.map((s) => s.trim()), `${nombre} guarda estado entre peticiones`).toEqual([])
    })
  }
})
