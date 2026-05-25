const AI_NOUNS = "(asistente|ia|sistema|bot|chatgpt|gpt|modelo|llm|chatbot)"
const INJECTION_VERBS = "(asume|adopta|toma|tienes|tendrás)"

const INJECTION_PATTERNS = [
  // English patterns
  /ignore (previous|prior|above|all) instructions/i,
  /forget (previous|prior|above|all)/i,
  /system prompt/i,
  /jailbreak/i,
  /pretend you are/i,
  /act as (if )?you (are|were)/i,
  /disregard (your|all|previous)/i,

  // Spanish — require AI noun or injection verb context to avoid CV false positives
  /ignora (las )?(instrucciones|reglas|todo lo) (anterior(es)?|previas?|de arriba)/i,
  /olvida (las )?(instrucciones|reglas|todo lo) (anterior(es)?|previas?)/i,
  /actúa como (si fueras|que eres|si fuese)/i,
  /actua como (si fueras|que eres|si fuese)/i,
  // "ahora eres" only injection-relevant when followed by an AI noun
  new RegExp(`ahora eres (un |una )?${AI_NOUNS}`, "i"),
  // "nuevo rol/modo" only injection-relevant when preceded by an injection verb
  new RegExp(`${INJECTION_VERBS} (un )?nuevo (rol|modo|comportamiento|personaje)`, "i"),
  /prompt del sistema/i,
  /sal(te)? del (rol|personaje|modo)/i,
  /ignora (todo|las reglas) (lo )?(anterior|de arriba)/i,
  // "deja de ser" only when followed by an AI noun
  new RegExp(`deja de ser (un |una )?${AI_NOUNS}`, "i"),
  /cambia (tu|de) (rol|modo|instrucciones)/i,
  /finge (que eres|ser)/i,
  // "imagina que eres" only when followed by an AI noun or "sin restricciones"
  new RegExp(`imagina que eres (un |una )?(${AI_NOUNS}|sin restricciones)`, "i"),
  /desactiva (tus )?(restricciones|reglas|filtros)/i,
]

export function containsPromptInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(text))
}

export function validateAIInput(
  text: string,
  maxLength: number = 2000
): { valid: boolean; error?: string } {
  if (!text || text.trim().length === 0) return { valid: false, error: "empty_input" }
  if (text.length > maxLength) return { valid: false, error: "too_long" }
  if (containsPromptInjection(text)) return { valid: false, error: "injection_detected" }
  return { valid: true }
}
