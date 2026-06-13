/**
 * languages — Parser de idiomas. Soporta múltiples idiomas por línea
 * ("Spanish · NATIVE English · B2"), formato común en plantillas compactas.
 */

export const LANG_LEVEL_MAP: Record<string, string> = {
  "nativo": "native", "native": "native", "materno": "native",
  "bilingüe": "native", "bilingue": "native", "bilingual": "native",
  "fluido": "full_professional", "fluent": "full_professional",
  "avanzado": "full_professional", "advanced": "full_professional", "c1": "full_professional", "c2": "native",
  "profesional": "professional", "professional": "professional",
  "intermedio": "professional", "intermediate": "professional", "b2": "professional", "b1": "limited",
  "básico": "limited", "basico": "limited", "basic": "limited",
  "elemental": "elementary", "elementary": "elementary", "a1": "elementary", "a2": "elementary",
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

function normalizeToken(t: string): string {
  return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

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
        current = { name: tok, level: "professional" }
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
