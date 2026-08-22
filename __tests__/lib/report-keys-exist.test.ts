import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * TODA CLAVE QUE EL INFORME EMITE TIENE TEXTO, EN LOS DOS IDIOMAS.
 *
 * ── EL HUECO QUE ESTO CIERRA (barrido, 2026-08-22) ─────────────────────────
 *
 * El ensamblador emite `titleKey` y `detailKey` como cadenas literales, y nada
 * comprobaba que existieran en `messages`. Una clave mal escrita o sin traducir
 * no rompe el build, no rompe ningún test, y llega a la pantalla del usuario tal
 * cual: «check.cut_irrelevant». Un panel que muestra el nombre interno de su
 * propia variable es lo más parecido a un producto roto que puede verse.
 *
 * Y el error es invisible del lado que falta: si sólo se olvidó el inglés, la
 * mitad hispana del equipo nunca lo ve. Ocho claves nuevas entraron hoy — este
 * guard es la única razón por la que puedo afirmar que las ocho están completas
 * sin haberlas mirado una por una.
 *
 * Lee el código fuente a propósito: el defecto es una AUSENCIA, y de una clave
 * que nadie emite no hay comportamiento que ejecutar.
 */
const src = readFileSync(join(process.cwd(), "lib/ats/build-report.ts"), "utf8")

/**
 * TODA cadena `"check.…"` del archivo, no sólo `titleKey: "…"`.
 *
 * La primera versión sólo miraba la forma `titleKey: "x"` y NO mordía: las
 * claves que se eligen con un ternario —`titleKey: cond ? "check.a" : "check.b"`,
 * que es como se emiten las tres más nuevas— quedaban fuera del barrido. Lo
 * comprobé borrando una traducción a propósito y el guard siguió en verde.
 *
 * Un guard que no muerde es peor que ninguno: da confianza falsa, que es
 * exactamente lo que vino a evitar.
 */
const literales = [...src.matchAll(/"((?:check|section)\.[a-z_.]+)"/g)].map((m) => m[1])
/** Las que se arman con una variable: se comprueba su familia completa. */
const dinamicas = [...src.matchAll(/(?:titleKey|detailKey):\s*`([a-z_.]+)\$\{/g)].map((m) => m[1])

const msgs = (loc: string) => JSON.parse(readFileSync(join(process.cwd(), `messages/${loc}.json`), "utf8")).editor.ats

/** `check.foo` vive en `editor.ats.check.foo`. */
function existe(loc: string, clave: string): boolean {
  const m = msgs(loc)
  const partes = clave.split(".")
  let cur: unknown = m
  for (const p of partes) {
    if (typeof cur !== "object" || cur === null || !(p in (cur as Record<string, unknown>))) return false
    cur = (cur as Record<string, unknown>)[p]
  }
  return typeof cur === "string" && cur.length > 0
}

describe("las claves del informe existen en messages", () => {
  it("hay claves que revisar (si esto falla, el guard dejó de mirar)", () => {
    expect(literales.length).toBeGreaterThan(15)
  })

  for (const loc of ["es", "en"]) {
    it(`${loc}: ninguna clave literal queda sin texto`, () => {
      const faltan = [...new Set(literales)].filter((k) => !existe(loc, k))
      expect(faltan, `sin texto en ${loc}`).toEqual([])
    })
  }

  /**
   * Las dinámicas no se pueden resolver leyendo: se comprueba que su PREFIJO
   * tenga al menos una entrada, que es lo que detecta una familia entera
   * olvidada — el caso caro. Las variantes sueltas las cubren sus propios tests.
   */
  for (const loc of ["es", "en"]) {
    it(`${loc}: las familias dinámicas tienen entradas`, () => {
      const huerfanas = [...new Set(dinamicas)].filter((pref) => {
        const base = pref.replace(/\.$/, "").split(".")
        let cur: unknown = msgs(loc)
        for (const p of base.slice(0, -1)) {
          if (typeof cur !== "object" || cur === null) return true
          cur = (cur as Record<string, unknown>)[p]
        }
        if (typeof cur !== "object" || cur === null) return true
        const ultimo = base[base.length - 1]
        return !Object.keys(cur as Record<string, unknown>).some((k) => k.startsWith(ultimo))
      })
      expect(huerfanas, `familia sin texto en ${loc}`).toEqual([])
    })
  }
})
