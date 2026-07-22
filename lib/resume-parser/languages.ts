/**
 * languages — Parser de idiomas. Soporta múltiples idiomas por línea
 * ("Spanish · NATIVE English · B2"), formato común en plantillas compactas.
 */
import { foldAccentsLower } from "@/lib/text/normalize"

// Output MUST be CEFR (a1|a2|b1|b2|c1|c2|native) — the values LanguageItemSchema
// accepts. Emitting LinkedIn-style levels ("professional", "full_professional")
// made every non-native language fall through the schema's `.catch("b1")`, so an
// imported "English · B2" silently became B1. Word-levels map to their nearest
// CEFR band.
export const LANG_LEVEL_MAP: Record<string, string> = {
  "nativo": "native", "native": "native", "materno": "native",
  "bilingüe": "native", "bilingue": "native", "bilingual": "native", "c2": "c2",
  "fluido": "c1", "fluent": "c1", "avanzado": "c1", "advanced": "c1", "c1": "c1",
  "profesional": "b2", "professional": "b2", "b2": "b2",
  "intermedio": "b1", "intermediate": "b1", "b1": "b1",
  "básico": "a2", "basico": "a2", "basic": "a2", "elemental": "a2", "elementary": "a2", "a2": "a2",
  "a1": "a1",
}

export const KNOWN_LANGUAGES = new Set([
  "español", "espanol", "spanish", "inglés", "ingles", "english",
  "francés", "frances", "french", "alemán", "aleman", "german",
  "italiano", "italian", "portugués", "portugues", "portuguese",
  "chino", "chinese", "mandarín", "mandarin", "japonés", "japones", "japanese",
  "coreano", "korean", "árabe", "arabe", "arabic", "ruso", "russian",
  "holandés", "holandes", "dutch", "sueco", "swedish", "noruego", "norwegian",
  "danés", "danish", "finlandés", "finnish", "polaco", "polish",
  "catalán", "catalan", "euskera", "basque", "gallego", "galician",
  "hindi", "bengali", "turco", "turkish", "griego", "greek",
  "hebreo", "hebrew", "tailandés", "thai", "vietnamita", "vietnamese",
])

const normalizeToken = (t: string): string => foldAccentsLower(t)

export interface ParsedLanguage {
  name: string
  level: string
}

/**
 * Extrae idiomas de las líneas de la sección. Tokeniza y escanea: cada token
 * que es un idioma conocido abre una entrada; los tokens siguientes que son
 * palabras de nivel (native, B2, fluido…) fijan su nivel.
 */
export function parseLanguageLines(lines: string[]): ParsedLanguage[] {
  const out: ParsedLanguage[] = []

  for (const line of lines) {
    if (line.length > 120) continue
    const tokens = line
      .split(/[\s·•|()\[\]:,\/\t–-]+/)
      .map(t => t.trim())
      .filter(Boolean)

    let current: ParsedLanguage | null = null
    for (const tok of tokens) {
      const norm = normalizeToken(tok)
      if (KNOWN_LANGUAGES.has(norm)) {
        current = { name: tok, level: "b1" }
        if (!out.find(l => normalizeToken(l.name) === norm)) out.push(current)
        continue
      }
      if (current && LANG_LEVEL_MAP[norm]) {
        current.level = LANG_LEVEL_MAP[norm]
        current = null // nivel asignado — siguiente token de nivel no lo sobreescribe
      }
    }
  }

  return out
}
