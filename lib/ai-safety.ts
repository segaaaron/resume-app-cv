const INJECTION_PATTERNS = [
  /ignore (previous|prior|above|all) instructions/i,
  /forget (previous|prior|above|all)/i,
  /system prompt/i,
  /jailbreak/i,
  /pretend you are/i,
  /act as (if )?you (are|were)/i,
  /disregard (your|all|previous)/i,
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
