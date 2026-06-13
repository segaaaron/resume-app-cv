/**
 * skills — Parser de habilidades.
 *
 * Prioridad de separadores:
 *  1. Tab (\t) — celdas posicionales de extract-pdf. Preserva tokens con "/"
 *     y "," internos (CI/CD, UX Design, "Teamwork and Communication").
 *  2. Coma / pipe / bullets — listas clásicas.
 *  3. Fallback camelCase para tokens largos concatenados sin separador
 *     (texto de pdf-parse plano o DOCX).
 */

import { clean } from "./patterns"

const NUMERIC_ONLY = /^\d+$/

function splitCamelConcat(s: string): string[] {
  return s
    .replace(/([a-záéíóúüñ])([A-ZÁÉÍÓÚÜÑ])/g, "$1 $2")
    .split(/\s{2,}/)
    .map(p => clean(p))
    .filter(p => p.length > 1 && p.length < 50)
}

/** Extrae nombres de skills de las líneas de la sección, en orden, sin duplicados. */
export function parseSkillLines(lines: string[], limit: number): string[] {
  const names = new Set<string>()
  const out: string[] = []

  const add = (raw: string) => {
    const s = clean(raw)
    if (!s || s.length < 2 || s.length >= 50 || NUMERIC_ONLY.test(s)) return
    const key = s.toLowerCase()
    if (names.has(key) || out.length >= limit) return
    names.add(key)
    out.push(s)
  }

  for (const line of lines) {
    const parts = line.includes("\t")
      ? line.split("\t")
      : line.split(/[,|•·]/)

    for (const part of parts) {
      const s = clean(part)
      if (!s) continue
      if (s.length > 25 && !s.includes(" ") && /[a-z][A-Z]/.test(s)) {
        // Token concatenado sin separador → dividir por límites de mayúsculas
        for (const sp of splitCamelConcat(s)) add(sp)
      } else if (s.length > 35 && !line.includes("\t") && /[a-z][A-Z]/.test(s)) {
        for (const sp of splitCamelConcat(s)) add(sp)
      } else {
        add(s)
      }
    }
  }

  return out
}
